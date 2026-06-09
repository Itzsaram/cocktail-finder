from flask import Flask, render_template, request, jsonify, session, redirect, url_for
import psycopg2
from psycopg2.extras import RealDictCursor
import os
from dotenv import load_dotenv
load_dotenv()
import json
import re
from datetime import datetime, timedelta
import bcrypt
import uuid
from flask_wtf.csrf import CSRFProtect

app = Flask(__name__, template_folder='app/templates', static_folder='app/static')
app.secret_key = os.environ.get('SECRET_KEY', 'dev-only-insecure-key-change-in-production')
csrf = CSRFProtect(app)

# 이미지 업로드 설정
UPLOAD_FOLDER    = os.path.join(os.path.dirname(__file__), 'app', 'static', 'uploads')
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'webp'}
MAX_IMAGE_SIZE   = 10 * 1024 * 1024   # 10 MB
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def check_image_size(file):
    """파일 크기가 10MB 이하인지 확인. 초과 시 False 반환."""
    file.seek(0, 2)           # 파일 끝으로 이동
    size = file.tell()
    file.seek(0)              # 포인터 초기화
    return size <= MAX_IMAGE_SIZE

def save_image(file):
    """이미지 저장 후 상대 경로 반환. 실패 시 None 반환."""
    if not (file and file.filename and allowed_file(file.filename)):
        return None
    if not check_image_size(file):
        return 'TOO_LARGE'
    ext      = file.filename.rsplit('.', 1)[1].lower()
    filename = f"{uuid.uuid4().hex}.{ext}"
    file.save(os.path.join(UPLOAD_FOLDER, filename))
    return f"uploads/{filename}"

# PostgreSQL 연결 설정
DATABASE_URL = os.environ.get('DATABASE_URL')

DB_CONFIG = {
    'host':     os.environ.get('DB_HOST', 'localhost'),
    'port':     int(os.environ.get('DB_PORT', 5432)),
    'user':     os.environ.get('DB_USER', ''),
    'password': os.environ.get('DB_PASSWORD', ''),
    'database': os.environ.get('DB_NAME', ''),
}

def get_db_connection():
    """데이터베이스 연결 (격리 수준: Read Committed 고정)"""
    if DATABASE_URL:
        conn = psycopg2.connect(DATABASE_URL, sslmode='require')
    else:
        conn = psycopg2.connect(**DB_CONFIG)
    conn.set_isolation_level(psycopg2.extensions.ISOLATION_LEVEL_READ_COMMITTED)
    return conn


def _page_params(default_limit=20):
    """요청 쿼리에서 page/limit 파싱. limit 상한 50."""
    try:
        limit = min(max(int(request.args.get('limit', default_limit)), 1), 50)
        page  = max(int(request.args.get('page', 1)), 1)
    except (ValueError, TypeError):
        limit, page = default_limit, 1
    return limit, page, (page - 1) * limit

def hash_password(password):
    """비밀번호 해싱"""
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()

# ──────────────────────────────────────────────────────────────
# 템플릿 전역 컨텍스트
# ──────────────────────────────────────────────────────────────

@app.context_processor
def inject_current_user():
    """모든 Jinja2 템플릿에 current_user 주입 (헤더 서버사이드 렌더링용)"""
    if 'user_id' in session:
        return {'current_user': {
            'user_id':    session['user_id'],
            'user_name':  session['user_name'],
            'email':      session.get('email', ''),
            'is_admin':   session.get('grade_name') == 'admin',
        }}
    return {'current_user': None}

def check_admin():
    """관리자 권한 확인 헬퍼"""
    return 'user_id' in session and session.get('grade_name') == 'admin'

def check_owner_or_admin(owner_user_id):
    """리소스 소유자 또는 관리자인지 확인 헬퍼"""
    if 'user_id' not in session:
        return False
    return check_admin() or session['user_id'] == owner_user_id

def get_resource_owner(table, pk_col, pk_val):
    """DB에서 리소스의 user_id를 조회해 반환. 없으면 None. 실패 시 예외 발생.
    finally로 커넥션 누수를 방지한다."""
    conn = None
    try:
        conn = get_db_connection()
        cur  = conn.cursor(cursor_factory=RealDictCursor)
        cur.execute(f'SELECT user_id FROM {table} WHERE {pk_col}=%s', (pk_val,))
        row  = cur.fetchone()
        return row['user_id'] if row else None
    finally:
        if conn: conn.close()

def sanitize_text(text):
    """HTML 태그 및 null byte 제거 (XSS 방지 — 저장 전 처리)"""
    if not text:
        return text
    text = re.sub(r'<[^>]+>', '', text)   # HTML 태그 제거
    text = text.replace('\x00', '')        # null byte 제거
    return text.strip()

# ──────────────────────────────────────────────────────────────
# 신고 시스템 상수
# ──────────────────────────────────────────────────────────────

REPORT_REASONS = ['spam', 'inappropriate', 'copyright', 'hate_speech', 'false_info']
REPORT_REASON_LABELS = {
    'spam':          '스팸',
    'inappropriate': '부적절한 내용',
    'copyright':     '저작권 침해',
    'hate_speech':   '욕설/혐오 표현',
    'false_info':    '허위 정보',
}
REPORT_ACTIONS = ['dismissed', 'content_deleted', 'user_sanctioned', 'content_modified']
REPORT_ACTION_LABELS = {
    'dismissed':        '허위 신고 처리',
    'content_deleted':  '콘텐츠 삭제',
    'user_sanctioned':  '사용자 제재',
    'content_modified': '콘텐츠 수정',
}

# ──────────────────────────────────────────────────────────────
# 페이지 라우트
# ──────────────────────────────────────────────────────────────

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/cabinet')
def cabinet():
    if 'user_id' not in session:
        return redirect(url_for('login'))
    return render_template('cabinet.html')

@app.route('/upload-ingredient')
def upload_ingredient():
    if 'user_id' not in session:
        return redirect(url_for('login'))
    return render_template('upload_ingredient.html')

@app.route('/cocktail/<int:cocktail_id>')
def cocktail_detail(cocktail_id):
    return render_template('cocktail_detail.html', cocktail_id=cocktail_id)

@app.route('/ingredient/<int:ingredient_id>')
def ingredient_detail(ingredient_id):
    return render_template('ingredient_detail.html', ingredient_id=ingredient_id)

@app.route('/cocktail-finder')
def cocktail_finder():
    if 'user_id' not in session:
        return redirect(url_for('login'))
    return render_template('cocktail_finder.html')

@app.route('/cabinet-search')
def cabinet_search_page():
    if 'user_id' not in session:
        return redirect(url_for('login'))
    return render_template('cabinet_search.html')

@app.route('/upload-cocktail')
def upload_cocktail():
    if 'user_id' not in session:
        return redirect(url_for('login'))
    return render_template('upload_cocktail.html')

@app.route('/profile')
def profile():
    if 'user_id' not in session:
        return redirect(url_for('login'))
    return render_template('profile.html')

@app.route('/logout')
def logout():
    session.clear()
    return redirect(url_for('index'))

# ──────────────────────────────────────────────────────────────
# 인증
# ──────────────────────────────────────────────────────────────

@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'GET':
        if 'user_id' in session:          # 이미 로그인 상태 → 홈으로
            return redirect(url_for('index'))
        return render_template('login.html')

    data = request.get_json()
    user_id = data.get('userId', '').strip()
    password = data.get('password', '').strip()

    if not user_id or not password:
        return jsonify({'success': False, 'message': '모든 필드를 입력해주세요.'}), 400

    conn = None
    try:
        conn = get_db_connection()
        cur = conn.cursor(cursor_factory=RealDictCursor)
        cur.execute('''
            SELECT ui.user_id, ui.user_name, ui.email, ui.password, ui.grade_id,
                   ug.grade_name, ui.is_sanctioned
            FROM User_Info ui
            JOIN User_Grade ug ON ui.grade_id = ug.grade_id
            WHERE ui.user_id = %s
        ''', (user_id,))
        user = cur.fetchone()

        if not user or not bcrypt.checkpw(password.encode(), user['password'].encode()):
            return jsonify({'success': False, 'message': '사용자 ID 또는 비밀번호가 일치하지 않습니다.'}), 401

        if user['is_sanctioned']:
            return jsonify({'success': False, 'message': '계정이 제재되어 로그인할 수 없습니다. 관리자에게 문의하세요.'}), 403

        session['user_id']    = user['user_id']
        session['user_name']  = user['user_name']
        session['email']      = user['email']
        session['grade_id']   = user['grade_id']
        session['grade_name'] = user['grade_name']
        session.permanent    = True
        app.permanent_session_lifetime = timedelta(days=7)

        return jsonify({
            'success': True,
            'message': '로그인 성공',
            'user': {
                'userId':   user['user_id'],
                'userName': user['user_name'],
                'email':    user['email']
            }
        }), 200

    except Exception as e:
        return jsonify({'success': False, 'message': f'서버 오류: {str(e)}'}), 500
    finally:
        if conn:
            conn.close()

@app.route('/signup', methods=['GET', 'POST'])
def signup():
    if request.method == 'GET':
        if 'user_id' in session:          # 이미 로그인 상태 → 홈으로
            return redirect(url_for('index'))
        return render_template('signup.html')

    data = request.get_json()
    user_id   = data.get('userId', '').strip()
    user_name = sanitize_text(data.get('userName', '').strip())
    email     = data.get('email', '').strip()
    password  = data.get('password', '').strip()

    if not user_id or not user_name or not email or not password:
        return jsonify({'success': False, 'message': '모든 필드를 입력해주세요.'}), 400
    if len(password) < 6:
        return jsonify({'success': False, 'message': '비밀번호는 최소 6자 이상이어야 합니다.'}), 400

    conn = None
    try:
        conn = get_db_connection()
        cur = conn.cursor()

        cur.execute(
            'SELECT user_id FROM User_Info WHERE user_id = %s OR email = %s',
            (user_id, email)
        )
        if cur.fetchone():
            return jsonify({'success': False, 'message': '이미 존재하는 사용자 ID 또는 이메일입니다.'}), 409

        cur.execute("SELECT grade_id FROM User_Grade WHERE grade_name = 'bronze'")
        bronze = cur.fetchone()
        if not bronze:
            return jsonify({'success': False, 'message': '서버 설정 오류: 기본 등급이 없습니다.'}), 500

        cur.execute(
            'INSERT INTO User_Info (user_id, user_name, email, password, grade_id) VALUES (%s, %s, %s, %s, %s)',
            (user_id, user_name, email, hash_password(password), bronze[0])
        )
        conn.commit()

        return jsonify({'success': True, 'message': '회원가입 성공. 로그인 페이지로 이동합니다.'}), 201

    except Exception as e:
        if conn:
            conn.rollback()
        return jsonify({'success': False, 'message': f'서버 오류: {str(e)}'}), 500
    finally:
        if conn:
            conn.close()

# ──────────────────────────────────────────────────────────────
# 사용자
# ──────────────────────────────────────────────────────────────

@app.route('/user/profile')
def user_profile():
    if 'user_id' not in session:
        return jsonify({'success': False, 'message': '로그인이 필요합니다.'}), 401
    return jsonify({
        'success': True,
        'user': {
            'userId':   session.get('user_id'),
            'userName': session.get('user_name'),
            'email':    session.get('email')
        }
    }), 200

@app.route('/api/user/me')
def user_me():
    """프로필 페이지용 상세 정보 (등급명 포함)"""
    if 'user_id' not in session:
        return jsonify({'success': False, 'message': '로그인이 필요합니다.'}), 401

    conn = None
    try:
        conn = get_db_connection()
        cur = conn.cursor(cursor_factory=RealDictCursor)
        cur.execute('''
            SELECT u.user_id, u.user_name, u.email, u.created_at,
                   u.profile_image,
                   g.grade_name, g.description AS grade_description
            FROM User_Info u
            JOIN User_Grade g ON u.grade_id = g.grade_id
            WHERE u.user_id = %s
        ''', (session['user_id'],))
        row = cur.fetchone()
        if not row:
            return jsonify({'success': False, 'message': '사용자를 찾을 수 없습니다.'}), 404
        return jsonify({'success': True, 'user': dict(row)}), 200

    except Exception as e:
        return jsonify({'success': False, 'message': f'서버 오류: {str(e)}'}), 500
    finally:
        if conn: conn.close()

@app.route('/api/user/name', methods=['PUT'])
def update_user_name():
    """닉네임 변경"""
    if 'user_id' not in session:
        return jsonify({'success': False, 'message': '로그인이 필요합니다.'}), 401

    data = request.get_json()
    new_name = sanitize_text(data.get('user_name', '').strip()) if data else ''
    if not new_name:
        return jsonify({'success': False, 'message': '닉네임을 입력해주세요.'}), 400
    if len(new_name) > 20:
        return jsonify({'success': False, 'message': '닉네임은 20자 이하여야 합니다.'}), 400

    conn = None
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        cur.execute(
            'UPDATE User_Info SET user_name = %s WHERE user_id = %s',
            (new_name, session['user_id'])
        )
        conn.commit()
        session['user_name'] = new_name   # 세션도 즉시 갱신
        return jsonify({'success': True, 'message': '닉네임이 변경되었습니다.'}), 200

    except Exception as e:
        if conn: conn.rollback()
        return jsonify({'success': False, 'message': f'서버 오류: {str(e)}'}), 500
    finally:
        if conn: conn.close()

@app.route('/api/user/profile-image', methods=['POST'])
def upload_profile_image():
    """프로필 사진 업로드"""
    if 'user_id' not in session:
        return jsonify({'success': False, 'message': '로그인이 필요합니다.'}), 401

    if 'image' not in request.files:
        return jsonify({'success': False, 'message': '이미지 파일이 없습니다.'}), 400

    result = save_image(request.files['image'])
    if result is None:
        return jsonify({'success': False, 'message': '지원하지 않는 파일 형식입니다.'}), 400
    if result == 'TOO_LARGE':
        return jsonify({'success': False, 'message': '이미지 크기는 10MB 이하여야 합니다.'}), 400

    conn = None
    try:
        conn = get_db_connection()
        cur  = conn.cursor()
        cur.execute(
            'UPDATE User_Info SET profile_image = %s WHERE user_id = %s',
            (result, session['user_id'])
        )
        conn.commit()
        return jsonify({'success': True, 'profile_image': result}), 200
    except Exception as e:
        if conn: conn.rollback()
        return jsonify({'success': False, 'message': f'서버 오류: {str(e)}'}), 500
    finally:
        if conn: conn.close()


@app.route('/api/saved-cocktails/details')
def get_saved_cocktails_details():
    """관심등록 칵테일 전체 정보"""
    if 'user_id' not in session:
        return jsonify({'success': False, 'message': '로그인이 필요합니다.'}), 401

    limit, page, offset = _page_params(20)
    conn = None
    try:
        conn = get_db_connection()
        cur = conn.cursor(cursor_factory=RealDictCursor)
        cur.execute('''
            SELECT c.cocktail_id, c.cocktail_name, c.image_path,
                   cc.category_name,
                   COALESCE(string_agg(i.ingredient_name, ', ' ORDER BY i.ingredient_name), '') AS ingredients
            FROM User_Saved_Cocktail usc
            JOIN Cocktail c ON usc.cocktail_id = c.cocktail_id
            JOIN Cocktail_Category cc ON c.category_id = cc.category_id
            LEFT JOIN Cocktail_Ingredient ci ON c.cocktail_id = ci.cocktail_id
            LEFT JOIN Ingredient i ON ci.ingredient_id = i.ingredient_id
            WHERE usc.user_id = %s
            GROUP BY c.cocktail_id, c.cocktail_name, c.image_path, cc.category_name
            ORDER BY c.cocktail_name
            LIMIT %s OFFSET %s
        ''', (session['user_id'], limit + 1, offset))
        rows     = cur.fetchall()
        has_more = len(rows) > limit
        return jsonify({'success': True, 'cocktails': list(rows[:limit]),
                        'has_more': has_more, 'page': page}), 200

    except Exception as e:
        return jsonify({'success': False, 'message': f'서버 오류: {str(e)}'}), 500
    finally:
        if conn: conn.close()

# ──────────────────────────────────────────────────────────────
# 재료
# ──────────────────────────────────────────────────────────────

@app.route('/api/ingredient-categories')
def get_ingredient_categories():
    if 'user_id' not in session:
        return jsonify({'success': False, 'message': '로그인이 필요합니다.'}), 401

    conn = None
    try:
        conn = get_db_connection()
        cur = conn.cursor(cursor_factory=RealDictCursor)
        cur.execute(
            'SELECT ingredient_category_id, category_name FROM Ingredient_Category ORDER BY ingredient_category_id'
        )
        rows = cur.fetchall()
        return jsonify({'success': True, 'categories': list(rows)}), 200

    except Exception as e:
        return jsonify({'success': False, 'message': f'서버 오류: {str(e)}'}), 500
    finally:
        if conn:
            conn.close()

@app.route('/api/ingredients', methods=['GET'])
def get_ingredients():
    if 'user_id' not in session:
        return jsonify({'success': False, 'message': '로그인이 필요합니다.'}), 401

    conn = None
    try:
        conn = get_db_connection()
        cur = conn.cursor(cursor_factory=RealDictCursor)
        cur.execute('''
            SELECT
                ic.ingredient_category_id,
                ic.category_name,
                i.ingredient_id,
                i.ingredient_name,
                i.unit,
                i.description
            FROM Ingredient_Category ic
            JOIN Ingredient i ON ic.ingredient_category_id = i.ingredient_category_id
            ORDER BY ic.ingredient_category_id, i.ingredient_name
        ''')
        rows = cur.fetchall()

        categories = {}
        for row in rows:
            cat_id = row['ingredient_category_id']
            if cat_id not in categories:
                categories[cat_id] = {
                    'category_id':   cat_id,
                    'category_name': row['category_name'],
                    'ingredients':   []
                }
            categories[cat_id]['ingredients'].append({
                'ingredient_id':   row['ingredient_id'],
                'ingredient_name': row['ingredient_name'],
                'unit':            row['unit'],
                'description':     row['description']
            })

        return jsonify({'success': True, 'categories': list(categories.values())}), 200

    except Exception as e:
        return jsonify({'success': False, 'message': f'서버 오류: {str(e)}'}), 500
    finally:
        if conn:
            conn.close()

@app.route('/api/ingredients', methods=['POST'])
def add_ingredient():
    if 'user_id' not in session:
        return jsonify({'success': False, 'message': '로그인이 필요합니다.'}), 401

    data = request.get_json()
    name        = sanitize_text(data.get('ingredient_name', '').strip())
    category_id = data.get('ingredient_category_id')
    unit        = data.get('unit', 'ml').strip()
    description = sanitize_text(data.get('description', '').strip())

    if not name or not category_id or not unit:
        return jsonify({'success': False, 'message': '재료명, 카테고리, 단위는 필수입니다.'}), 400

    conn = None
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        cur.execute(
            'INSERT INTO Ingredient (ingredient_name, ingredient_category_id, unit, description, user_id) VALUES (%s, %s, %s, %s, %s)',
            (name, category_id, unit, description or None, session['user_id'])
        )
        conn.commit()
        return jsonify({'success': True, 'message': f'"{name}" 재료가 추가되었습니다.'}), 201

    except Exception as e:
        if conn:
            conn.rollback()
        if 'unique' in str(e).lower():
            return jsonify({'success': False, 'message': '이미 존재하는 재료명입니다.'}), 409
        return jsonify({'success': False, 'message': f'서버 오류: {str(e)}'}), 500
    finally:
        if conn:
            conn.close()

@app.route('/api/ingredients/search')
def search_ingredients():
    q = request.args.get('q', '').strip()
    limit, page, offset = _page_params(20)

    conn = None
    try:
        conn = get_db_connection()
        cur  = conn.cursor(cursor_factory=RealDictCursor)
        if q:
            cur.execute('''
                SELECT i.ingredient_id, i.ingredient_name, i.unit, i.description,
                       ic.category_name
                FROM Ingredient i
                JOIN Ingredient_Category ic ON i.ingredient_category_id = ic.ingredient_category_id
                WHERE i.ingredient_name ILIKE %s
                ORDER BY i.ingredient_name
                LIMIT %s OFFSET %s
            ''', (f'%{q}%', limit + 1, offset))
            rows     = cur.fetchall()
            has_more = len(rows) > limit
            return jsonify({'success': True, 'ingredients': list(rows[:limit]),
                            'has_more': has_more, 'page': page, 'random': False}), 200
        else:
            cur.execute('''
                SELECT i.ingredient_id, i.ingredient_name, i.unit, i.description,
                       ic.category_name
                FROM Ingredient i
                JOIN Ingredient_Category ic ON i.ingredient_category_id = ic.ingredient_category_id
                ORDER BY RANDOM()
                LIMIT 15
            ''')
            rows = cur.fetchall()
            return jsonify({'success': True, 'ingredients': list(rows),
                            'has_more': False, 'page': 1, 'random': True}), 200
    except Exception as e:
        return jsonify({'success': False, 'message': f'서버 오류: {str(e)}'}), 500
    finally:
        if conn: conn.close()


@app.route('/api/ingredients/<int:ingredient_id>', methods=['GET'])
def get_ingredient_detail(ingredient_id):
    conn = None
    try:
        conn = get_db_connection()
        cur  = conn.cursor(cursor_factory=RealDictCursor)

        # 재료 기본 정보
        cur.execute('''
            SELECT i.ingredient_id, i.ingredient_name, i.unit, i.description,
                   i.ingredient_category_id, i.user_id,
                   ic.category_name,
                   u.user_name AS author
            FROM Ingredient i
            JOIN Ingredient_Category ic ON i.ingredient_category_id = ic.ingredient_category_id
            LEFT JOIN User_Info u ON i.user_id = u.user_id
            WHERE i.ingredient_id = %s
        ''', (ingredient_id,))
        row = cur.fetchone()
        if not row:
            return jsonify({'success': False, 'message': '재료를 찾을 수 없습니다.'}), 404

        ingredient = dict(row)

        # 이 재료를 사용하는 칵테일 목록
        cur.execute('''
            SELECT c.cocktail_id, c.cocktail_name, c.image_path,
                   cc.category_name, ci.amount
            FROM Cocktail_Ingredient ci
            JOIN Cocktail c ON ci.cocktail_id = c.cocktail_id
            JOIN Cocktail_Category cc ON c.category_id = cc.category_id
            WHERE ci.ingredient_id = %s
            ORDER BY c.cocktail_name
        ''', (ingredient_id,))
        ingredient['cocktails'] = list(cur.fetchall())

        return jsonify({'success': True, 'ingredient': ingredient}), 200
    except Exception as e:
        return jsonify({'success': False, 'message': f'서버 오류: {str(e)}'}), 500
    finally:
        if conn: conn.close()


@app.route('/api/ingredients/<int:ingredient_id>', methods=['PUT'])
def update_ingredient(ingredient_id):
    if 'user_id' not in session:
        return jsonify({'success': False, 'message': '로그인이 필요합니다.'}), 401
    try:
        owner_id = get_resource_owner('Ingredient', 'ingredient_id', ingredient_id)
    except Exception as e:
        return jsonify({'success': False, 'message': f'서버 오류: {str(e)}'}), 500
    if owner_id is None:
        return jsonify({'success': False, 'message': '재료를 찾을 수 없습니다.'}), 404
    if not check_owner_or_admin(owner_id):
        return jsonify({'success': False, 'message': '수정 권한이 없습니다.'}), 403

    data        = request.get_json()
    name        = sanitize_text(data.get('ingredient_name', '').strip())
    category_id = data.get('ingredient_category_id')
    unit        = data.get('unit', '').strip()
    description = sanitize_text(data.get('description', '').strip())

    if not name or not category_id or not unit:
        return jsonify({'success': False, 'message': '재료명, 카테고리, 단위는 필수입니다.'}), 400

    conn = None
    try:
        conn = get_db_connection()
        cur  = conn.cursor()
        cur.execute('''
            UPDATE Ingredient
            SET ingredient_name=%s, ingredient_category_id=%s, unit=%s, description=%s
            WHERE ingredient_id=%s
        ''', (name, int(category_id), unit, description or None, ingredient_id))
        conn.commit()
        return jsonify({'success': True, 'message': '재료가 수정되었습니다.'}), 200
    except Exception as e:
        if conn: conn.rollback()
        if 'unique' in str(e).lower():
            return jsonify({'success': False, 'message': '이미 존재하는 재료명입니다.'}), 409
        return jsonify({'success': False, 'message': f'서버 오류: {str(e)}'}), 500
    finally:
        if conn: conn.close()


@app.route('/api/ingredients/<int:ingredient_id>', methods=['DELETE'])
def delete_ingredient(ingredient_id):
    if 'user_id' not in session:
        return jsonify({'success': False, 'message': '로그인이 필요합니다.'}), 401
    try:
        owner_id = get_resource_owner('Ingredient', 'ingredient_id', ingredient_id)
    except Exception as e:
        return jsonify({'success': False, 'message': f'서버 오류: {str(e)}'}), 500
    if owner_id is None:
        return jsonify({'success': False, 'message': '재료를 찾을 수 없습니다.'}), 404
    if not check_owner_or_admin(owner_id):
        return jsonify({'success': False, 'message': '삭제 권한이 없습니다.'}), 403

    conn = None
    try:
        conn = get_db_connection()
        cur  = conn.cursor()
        cur.execute('DELETE FROM Ingredient WHERE ingredient_id=%s', (ingredient_id,))
        conn.commit()
        return jsonify({'success': True, 'message': '재료가 삭제되었습니다.'}), 200
    except Exception as e:
        if conn: conn.rollback()
        return jsonify({'success': False, 'message': f'서버 오류: {str(e)}'}), 500
    finally:
        if conn: conn.close()


# ──────────────────────────────────────────────────────────────
# 보관함
# ──────────────────────────────────────────────────────────────

@app.route('/api/cabinet', methods=['GET'])
def get_cabinet():
    if 'user_id' not in session:
        return jsonify({'success': False, 'message': '로그인이 필요합니다.'}), 401

    conn = None
    try:
        conn = get_db_connection()
        cur = conn.cursor(cursor_factory=RealDictCursor)
        cur.execute(
            'SELECT ingredient_id FROM User_Cabinet WHERE user_id = %s',
            (session['user_id'],)
        )
        rows = cur.fetchall()
        return jsonify({'success': True, 'ingredient_ids': [r['ingredient_id'] for r in rows]}), 200

    except Exception as e:
        return jsonify({'success': False, 'message': f'서버 오류: {str(e)}'}), 500
    finally:
        if conn:
            conn.close()

@app.route('/api/cabinet/<int:ingredient_id>', methods=['POST'])
def add_to_cabinet(ingredient_id):
    if 'user_id' not in session:
        return jsonify({'success': False, 'message': '로그인이 필요합니다.'}), 401

    conn = None
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        cur.execute(
            'INSERT INTO User_Cabinet (user_id, ingredient_id) VALUES (%s, %s) ON CONFLICT DO NOTHING',
            (session['user_id'], ingredient_id)
        )
        conn.commit()
        return jsonify({'success': True}), 200

    except Exception as e:
        if conn:
            conn.rollback()
        return jsonify({'success': False, 'message': f'서버 오류: {str(e)}'}), 500
    finally:
        if conn:
            conn.close()

@app.route('/api/cabinet/<int:ingredient_id>', methods=['DELETE'])
def remove_from_cabinet(ingredient_id):
    if 'user_id' not in session:
        return jsonify({'success': False, 'message': '로그인이 필요합니다.'}), 401

    conn = None
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        cur.execute(
            'DELETE FROM User_Cabinet WHERE user_id = %s AND ingredient_id = %s',
            (session['user_id'], ingredient_id)
        )
        conn.commit()
        return jsonify({'success': True}), 200

    except Exception as e:
        if conn:
            conn.rollback()
        return jsonify({'success': False, 'message': f'서버 오류: {str(e)}'}), 500
    finally:
        if conn:
            conn.close()


# ──────────────────────────────────────────────────────────────
# 칵테일
# ──────────────────────────────────────────────────────────────

@app.route('/api/cocktails/<int:cocktail_id>')
def get_cocktail_detail(cocktail_id):
    conn = None
    try:
        conn = get_db_connection()
        cur = conn.cursor(cursor_factory=RealDictCursor)
        cur.execute('''
            SELECT
                c.cocktail_id,
                c.cocktail_name,
                c.category_id,
                c.user_id,
                c.image_path,
                c.recipe,
                c.created_at,
                cc.category_name,
                ui.user_name AS author,
                COALESCE(
                    json_agg(
                        json_build_object(
                            'ingredient_id',   i.ingredient_id,
                            'ingredient_name', i.ingredient_name,
                            'amount', ci.amount,
                            'unit', i.unit
                        ) ORDER BY i.ingredient_name
                    ) FILTER (WHERE i.ingredient_id IS NOT NULL),
                    '[]'
                ) AS ingredients
            FROM Cocktail c
            JOIN Cocktail_Category cc ON c.category_id = cc.category_id
            LEFT JOIN User_Info ui ON c.user_id = ui.user_id
            LEFT JOIN Cocktail_Ingredient ci ON c.cocktail_id = ci.cocktail_id
            LEFT JOIN Ingredient i ON ci.ingredient_id = i.ingredient_id
            WHERE c.cocktail_id = %s
            GROUP BY c.cocktail_id, c.cocktail_name, c.category_id, c.image_path,
                     c.recipe, c.created_at, cc.category_name, ui.user_name
        ''', (cocktail_id,))
        row = cur.fetchone()
        if not row:
            return jsonify({'success': False, 'message': '칵테일을 찾을 수 없습니다.'}), 404
        return jsonify({'success': True, 'cocktail': dict(row)}), 200

    except Exception as e:
        return jsonify({'success': False, 'message': f'서버 오류: {str(e)}'}), 500
    finally:
        if conn:
            conn.close()

@app.route('/api/saved-cocktails')
def get_saved_cocktails():
    if 'user_id' not in session:
        return jsonify({'success': False, 'message': '로그인이 필요합니다.'}), 401

    conn = None
    try:
        conn = get_db_connection()
        cur = conn.cursor(cursor_factory=RealDictCursor)
        cur.execute(
            'SELECT cocktail_id FROM User_Saved_Cocktail WHERE user_id = %s',
            (session['user_id'],)
        )
        rows = cur.fetchall()
        return jsonify({'success': True, 'cocktail_ids': [r['cocktail_id'] for r in rows]}), 200

    except Exception as e:
        return jsonify({'success': False, 'message': f'서버 오류: {str(e)}'}), 500
    finally:
        if conn:
            conn.close()

@app.route('/api/saved-cocktails/<int:cocktail_id>', methods=['POST'])
def save_cocktail(cocktail_id):
    if 'user_id' not in session:
        return jsonify({'success': False, 'message': '로그인이 필요합니다.'}), 401

    conn = None
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        cur.execute(
            'INSERT INTO User_Saved_Cocktail (user_id, cocktail_id) VALUES (%s, %s) ON CONFLICT DO NOTHING',
            (session['user_id'], cocktail_id)
        )
        conn.commit()
        return jsonify({'success': True}), 200

    except Exception as e:
        if conn: conn.rollback()
        return jsonify({'success': False, 'message': f'서버 오류: {str(e)}'}), 500
    finally:
        if conn: conn.close()

@app.route('/api/saved-cocktails/<int:cocktail_id>', methods=['DELETE'])
def unsave_cocktail(cocktail_id):
    if 'user_id' not in session:
        return jsonify({'success': False, 'message': '로그인이 필요합니다.'}), 401

    conn = None
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        cur.execute(
            'DELETE FROM User_Saved_Cocktail WHERE user_id = %s AND cocktail_id = %s',
            (session['user_id'], cocktail_id)
        )
        conn.commit()
        return jsonify({'success': True}), 200

    except Exception as e:
        if conn: conn.rollback()
        return jsonify({'success': False, 'message': f'서버 오류: {str(e)}'}), 500
    finally:
        if conn: conn.close()

@app.route('/api/cocktails/popular')
def get_popular_cocktails():
    """댓글 수 기준 상위 3개 칵테일"""
    conn = None
    try:
        conn = get_db_connection()
        cur  = conn.cursor(cursor_factory=RealDictCursor)
        cur.execute('''
            SELECT c.cocktail_id, c.cocktail_name, c.image_path,
                   cc.category_name,
                   COUNT(DISTINCT cm.comment_id) AS comment_count,
                   COALESCE(
                       STRING_AGG(DISTINCT i.ingredient_name, ', ' ORDER BY i.ingredient_name)
                       FILTER (WHERE i.ingredient_id IS NOT NULL),
                       ''
                   ) AS ingredients
            FROM Cocktail c
            JOIN Cocktail_Category cc ON c.category_id = cc.category_id
            LEFT JOIN Cocktail_Comment cm ON c.cocktail_id = cm.cocktail_id
            LEFT JOIN Cocktail_Ingredient ci ON c.cocktail_id = ci.cocktail_id
            LEFT JOIN Ingredient i ON ci.ingredient_id = i.ingredient_id
            GROUP BY c.cocktail_id, c.cocktail_name, c.image_path, cc.category_name
            ORDER BY comment_count DESC, c.cocktail_name
            LIMIT 3
        ''')
        rows = cur.fetchall()
        return jsonify({'success': True, 'cocktails': list(rows)}), 200
    except Exception as e:
        return jsonify({'success': False, 'message': f'서버 오류: {str(e)}'}), 500
    finally:
        if conn: conn.close()


@app.route('/api/cocktails/cabinet-search')
def cabinet_search():
    """캐비닛 재료로 만들 수 있는 칵테일 + 1개 부족한 칵테일 반환.
    extra_id: 이중검색 — 해당 재료가 레시피에 반드시 포함된 칵테일만 필터링."""
    if 'user_id' not in session:
        return jsonify({'success': False, 'message': '로그인이 필요합니다.'}), 401

    extra_id = request.args.get('extra_id', type=int)
    try:
        m_limit = min(max(int(request.args.get('makeable_limit', 20)), 1), 50)
        m_page  = max(int(request.args.get('makeable_page', 1)), 1)
        a_limit = min(max(int(request.args.get('almost_limit', 20)), 1), 50)
        a_page  = max(int(request.args.get('almost_page', 1)), 1)
    except (ValueError, TypeError):
        m_limit = a_limit = 20
        m_page  = a_page  = 1
    m_offset = (m_page - 1) * m_limit
    a_offset = (a_page - 1) * a_limit

    conn = None
    try:
        conn = get_db_connection()
        cur  = conn.cursor(cursor_factory=RealDictCursor)

        # 캐비닛 재료 조회 (이름 포함)
        cur.execute('''
            SELECT uc.ingredient_id, i.ingredient_name
            FROM User_Cabinet uc
            JOIN Ingredient i ON uc.ingredient_id = i.ingredient_id
            WHERE uc.user_id = %s
            ORDER BY i.ingredient_name
        ''', (session['user_id'],))
        cabinet_rows = cur.fetchall()

        if not cabinet_rows:
            return jsonify({'success': True, 'makeable': [], 'almost': [],
                            'cabinet_ingredients': [], 'cabinet_count': 0}), 200

        cabinet_ingredients = list(cabinet_rows)
        cabinet_ids = [r['ingredient_id'] for r in cabinet_rows]

        # 이중검색 조건: extra_id 재료가 레시피에 반드시 포함
        extra_filter     = 'AND EXISTS (SELECT 1 FROM Cocktail_Ingredient ei WHERE ei.cocktail_id = c.cocktail_id AND ei.ingredient_id = %s)'
        extra_filter_off = ''

        # ── 제작 가능 (부족 재료 0개) ─────────────────────────────
        base_q = '''
            SELECT c.cocktail_id, c.cocktail_name, c.image_path,
                   cc.category_name,
                   COALESCE(
                       STRING_AGG(DISTINCT i.ingredient_name, ', '
                                  ORDER BY i.ingredient_name)
                       FILTER (WHERE i.ingredient_id IS NOT NULL), ''
                   ) AS ingredients
            FROM Cocktail c
            JOIN Cocktail_Category cc ON c.category_id = cc.category_id
            LEFT JOIN Cocktail_Ingredient ci ON c.cocktail_id = ci.cocktail_id
            LEFT JOIN Ingredient i ON ci.ingredient_id = i.ingredient_id
            WHERE EXISTS (SELECT 1 FROM Cocktail_Ingredient WHERE cocktail_id = c.cocktail_id)
            AND 0 = (
                SELECT COUNT(*) FROM Cocktail_Ingredient ci2
                WHERE ci2.cocktail_id = c.cocktail_id
                AND ci2.ingredient_id != ALL(%s)
            )
            {extra}
            GROUP BY c.cocktail_id, c.cocktail_name, c.image_path, cc.category_name
            ORDER BY c.cocktail_name
            LIMIT %s OFFSET %s
        '''

        if extra_id:
            cur.execute(base_q.format(extra=extra_filter), (cabinet_ids, extra_id, m_limit + 1, m_offset))
        else:
            cur.execute(base_q.format(extra=extra_filter_off), (cabinet_ids, m_limit + 1, m_offset))
        m_rows        = cur.fetchall()
        makeable_more = len(m_rows) > m_limit
        makeable      = m_rows[:m_limit]

        # ── 1개 부족 ──────────────────────────────────────────────
        almost_q = '''
            SELECT c.cocktail_id, c.cocktail_name, c.image_path,
                   cc.category_name,
                   COALESCE(
                       STRING_AGG(DISTINCT i.ingredient_name, ', '
                                  ORDER BY i.ingredient_name)
                       FILTER (WHERE i.ingredient_id IS NOT NULL), ''
                   ) AS ingredients,
                   (
                       SELECT i2.ingredient_name
                       FROM Cocktail_Ingredient ci2
                       JOIN Ingredient i2 ON ci2.ingredient_id = i2.ingredient_id
                       WHERE ci2.cocktail_id = c.cocktail_id
                       AND ci2.ingredient_id != ALL(%s)
                       LIMIT 1
                   ) AS missing_ingredient
            FROM Cocktail c
            JOIN Cocktail_Category cc ON c.category_id = cc.category_id
            LEFT JOIN Cocktail_Ingredient ci ON c.cocktail_id = ci.cocktail_id
            LEFT JOIN Ingredient i ON ci.ingredient_id = i.ingredient_id
            WHERE EXISTS (SELECT 1 FROM Cocktail_Ingredient WHERE cocktail_id = c.cocktail_id)
            AND 1 = (
                SELECT COUNT(*) FROM Cocktail_Ingredient ci2
                WHERE ci2.cocktail_id = c.cocktail_id
                AND ci2.ingredient_id != ALL(%s)
            )
            {extra}
            GROUP BY c.cocktail_id, c.cocktail_name, c.image_path, cc.category_name
            ORDER BY c.cocktail_name
            LIMIT %s OFFSET %s
        '''

        if extra_id:
            cur.execute(almost_q.format(extra=extra_filter), (cabinet_ids, cabinet_ids, extra_id, a_limit + 1, a_offset))
        else:
            cur.execute(almost_q.format(extra=extra_filter_off), (cabinet_ids, cabinet_ids, a_limit + 1, a_offset))
        a_rows      = cur.fetchall()
        almost_more = len(a_rows) > a_limit
        almost      = a_rows[:a_limit]

        return jsonify({
            'success':             True,
            'makeable':            makeable,
            'makeable_more':       makeable_more,
            'makeable_page':       m_page,
            'almost':              almost,
            'almost_more':         almost_more,
            'almost_page':         a_page,
            'cabinet_ingredients': cabinet_ingredients,
            'cabinet_count':       len(cabinet_ids),
            'extra_id':            extra_id
        }), 200

    except Exception as e:
        return jsonify({'success': False, 'message': f'서버 오류: {str(e)}'}), 500
    finally:
        if conn: conn.close()


@app.route('/api/cocktails/suggestions')
def cocktail_suggestions():
    q = request.args.get('q', '').strip()
    if not q:
        return jsonify({'success': True, 'suggestions': []}), 200

    conn = None
    try:
        conn = get_db_connection()
        cur = conn.cursor(cursor_factory=RealDictCursor)
        cur.execute('''
            SELECT cocktail_id, cocktail_name
            FROM Cocktail
            WHERE cocktail_name ILIKE %s
            ORDER BY cocktail_name
            LIMIT 8
        ''', (f'%{q}%',))
        rows = cur.fetchall()
        return jsonify({'success': True, 'suggestions': list(rows)}), 200

    except Exception as e:
        return jsonify({'success': False, 'message': f'서버 오류: {str(e)}'}), 500
    finally:
        if conn:
            conn.close()

@app.route('/api/ingredients/suggestions')
def ingredient_suggestions():
    q = request.args.get('q', '').strip()
    if not q:
        return jsonify({'success': True, 'suggestions': []}), 200

    conn = None
    try:
        conn = get_db_connection()
        cur = conn.cursor(cursor_factory=RealDictCursor)
        cur.execute('''
            SELECT i.ingredient_id, i.ingredient_name, ic.category_name
            FROM Ingredient i
            JOIN Ingredient_Category ic ON i.ingredient_category_id = ic.ingredient_category_id
            WHERE i.ingredient_name ILIKE %s
            ORDER BY i.ingredient_name
            LIMIT 8
        ''', (f'%{q}%',))
        rows = cur.fetchall()
        return jsonify({'success': True, 'suggestions': list(rows)}), 200

    except Exception as e:
        return jsonify({'success': False, 'message': f'서버 오류: {str(e)}'}), 500
    finally:
        if conn:
            conn.close()

@app.route('/api/cocktails/search')
def search_cocktails():
    q = request.args.get('q', '').strip()
    limit, page, offset = _page_params(20)

    conn = None
    try:
        conn = get_db_connection()
        cur = conn.cursor(cursor_factory=RealDictCursor)
        if q:
            cur.execute('''
                SELECT
                    c.cocktail_id,
                    c.cocktail_name,
                    c.image_path,
                    cc.category_name,
                    COALESCE(
                        string_agg(
                            i.ingredient_name || ' ' || ci.amount || i.unit,
                            ', ' ORDER BY i.ingredient_name
                        ), ''
                    ) AS ingredients
                FROM Cocktail c
                JOIN Cocktail_Category cc ON c.category_id = cc.category_id
                LEFT JOIN Cocktail_Ingredient ci ON c.cocktail_id = ci.cocktail_id
                LEFT JOIN Ingredient i ON ci.ingredient_id = i.ingredient_id
                WHERE c.cocktail_name ILIKE %s
                GROUP BY c.cocktail_id, c.cocktail_name, c.image_path, cc.category_name
                ORDER BY c.cocktail_name
                LIMIT %s OFFSET %s
            ''', (f'%{q}%', limit + 1, offset))
            rows     = cur.fetchall()
            has_more = len(rows) > limit
            return jsonify({'success': True, 'cocktails': list(rows[:limit]),
                            'has_more': has_more, 'page': page, 'random': False}), 200
        else:
            cur.execute('''
                SELECT
                    c.cocktail_id,
                    c.cocktail_name,
                    c.image_path,
                    cc.category_name,
                    COALESCE(
                        string_agg(
                            i.ingredient_name || ' ' || ci.amount || i.unit,
                            ', ' ORDER BY i.ingredient_name
                        ), ''
                    ) AS ingredients
                FROM Cocktail c
                JOIN Cocktail_Category cc ON c.category_id = cc.category_id
                LEFT JOIN Cocktail_Ingredient ci ON c.cocktail_id = ci.cocktail_id
                LEFT JOIN Ingredient i ON ci.ingredient_id = i.ingredient_id
                GROUP BY c.cocktail_id, c.cocktail_name, c.image_path, cc.category_name
                ORDER BY RANDOM()
                LIMIT 5
            ''')
            rows = cur.fetchall()
            return jsonify({'success': True, 'cocktails': list(rows),
                            'has_more': False, 'page': 1, 'random': True}), 200

    except Exception as e:
        return jsonify({'success': False, 'message': f'서버 오류: {str(e)}'}), 500
    finally:
        if conn:
            conn.close()

@app.route('/api/cocktails/finder')
def finder_search():
    if 'user_id' not in session:
        return jsonify({'success': False, 'message': '로그인이 필요합니다.'}), 401

    ids_raw = request.args.get('ingredient_ids', '').strip()
    offset  = int(request.args.get('offset', 0))
    limit   = int(request.args.get('limit', 10))

    if not ids_raw:
        return jsonify({'success': False, 'message': '재료를 선택해주세요.'}), 400

    try:
        ingredient_ids = [int(i) for i in ids_raw.split(',') if i.strip()]
    except ValueError:
        return jsonify({'success': False, 'message': '잘못된 재료 ID입니다.'}), 400

    conn = None
    try:
        conn = get_db_connection()
        cur = conn.cursor(cursor_factory=RealDictCursor)
        cur.execute('''
            WITH matched AS (
                SELECT cocktail_id
                FROM Cocktail_Ingredient
                WHERE ingredient_id = ANY(%s)
                GROUP BY cocktail_id
                HAVING COUNT(DISTINCT ingredient_id) = %s
            )
            SELECT
                c.cocktail_id,
                c.cocktail_name,
                c.image_path,
                cc.category_name,
                COALESCE(
                    string_agg(
                        i.ingredient_name || ' ' || ci.amount || i.unit,
                        ', ' ORDER BY i.ingredient_name
                    ), ''
                ) AS ingredients,
                COUNT(*) OVER() AS total_count
            FROM Cocktail c
            JOIN matched m ON c.cocktail_id = m.cocktail_id
            JOIN Cocktail_Category cc ON c.category_id = cc.category_id
            LEFT JOIN Cocktail_Ingredient ci ON c.cocktail_id = ci.cocktail_id
            LEFT JOIN Ingredient i ON ci.ingredient_id = i.ingredient_id
            GROUP BY c.cocktail_id, c.cocktail_name, c.image_path, cc.category_name
            ORDER BY c.cocktail_name
            LIMIT %s OFFSET %s
        ''', (ingredient_ids, len(ingredient_ids), limit, offset))
        rows = cur.fetchall()
        total = rows[0]['total_count'] if rows else 0
        return jsonify({
            'success': True,
            'cocktails': list(rows),
            'total': total,
            'offset': offset,
            'limit': limit
        }), 200

    except Exception as e:
        return jsonify({'success': False, 'message': f'서버 오류: {str(e)}'}), 500
    finally:
        if conn:
            conn.close()

@app.route('/api/cocktail-categories')
def get_cocktail_categories():
    if 'user_id' not in session:
        return jsonify({'success': False, 'message': '로그인이 필요합니다.'}), 401

    conn = None
    try:
        conn = get_db_connection()
        cur = conn.cursor(cursor_factory=RealDictCursor)
        cur.execute(
            'SELECT category_id, category_name FROM Cocktail_Category ORDER BY category_id'
        )
        rows = cur.fetchall()
        return jsonify({'success': True, 'categories': list(rows)}), 200

    except Exception as e:
        return jsonify({'success': False, 'message': f'서버 오류: {str(e)}'}), 500
    finally:
        if conn:
            conn.close()

@app.route('/api/cocktails', methods=['POST'])
def add_cocktail():
    if 'user_id' not in session:
        return jsonify({'success': False, 'message': '로그인이 필요합니다.'}), 401

    # multipart/form-data 파싱
    name        = sanitize_text(request.form.get('cocktail_name', '').strip())
    category_id = request.form.get('category_id', '').strip()
    recipe      = sanitize_text(request.form.get('recipe', '').strip())
    ingredients_raw = request.form.get('ingredients', '[]')

    if not name or not category_id:
        return jsonify({'success': False, 'message': '칵테일 이름과 카테고리는 필수입니다.'}), 400

    try:
        ingredients = json.loads(ingredients_raw)
    except Exception:
        return jsonify({'success': False, 'message': '재료 데이터 형식이 올바르지 않습니다.'}), 400

    if not ingredients:
        return jsonify({'success': False, 'message': '재료를 최소 1개 이상 선택해주세요.'}), 400

    # 이미지 저장
    image_path = None
    if 'image' in request.files:
        result = save_image(request.files['image'])
        if result == 'TOO_LARGE':
            return jsonify({'success': False, 'message': '이미지 크기는 10MB 이하여야 합니다.'}), 400
        image_path = result

    conn = None
    try:
        conn = get_db_connection()
        cur = conn.cursor()

        # 칵테일 삽입
        cur.execute(
            '''INSERT INTO Cocktail (cocktail_name, category_id, user_id, image_path, recipe)
               VALUES (%s, %s, %s, %s, %s) RETURNING cocktail_id''',
            (name, int(category_id), session['user_id'], image_path, recipe or None)
        )
        cocktail_id = cur.fetchone()[0]

        # 재료 삽입
        for ing in ingredients:
            cur.execute(
                'INSERT INTO Cocktail_Ingredient (cocktail_id, ingredient_id, amount) VALUES (%s, %s, %s)',
                (cocktail_id, int(ing['ingredient_id']), ing['amount'])
            )

        conn.commit()
        return jsonify({'success': True, 'message': f'"{name}" 칵테일이 등록되었습니다.', 'cocktail_id': cocktail_id}), 201

    except Exception as e:
        if conn:
            conn.rollback()
        if 'unique' in str(e).lower():
            return jsonify({'success': False, 'message': '이미 존재하는 칵테일 이름입니다.'}), 409
        return jsonify({'success': False, 'message': f'서버 오류: {str(e)}'}), 500
    finally:
        if conn:
            conn.close()


# ──────────────────────────────────────────────────────────────
# 내 콘텐츠 (소유자 전용 조회)
# ──────────────────────────────────────────────────────────────

@app.route('/api/my/cocktails')
def get_my_cocktails():
    """로그인 사용자가 업로드한 칵테일 목록"""
    if 'user_id' not in session:
        return jsonify({'success': False, 'message': '로그인이 필요합니다.'}), 401
    limit, page, offset = _page_params(20)
    conn = None
    try:
        conn = get_db_connection()
        cur  = conn.cursor(cursor_factory=RealDictCursor)
        cur.execute('''
            SELECT c.cocktail_id, c.cocktail_name, c.image_path, c.created_at,
                   cc.category_name,
                   COALESCE(
                       STRING_AGG(i.ingredient_name, ', ' ORDER BY i.ingredient_name)
                       FILTER (WHERE i.ingredient_id IS NOT NULL),
                       ''
                   ) AS ingredients
            FROM Cocktail c
            JOIN Cocktail_Category cc ON c.category_id = cc.category_id
            LEFT JOIN Cocktail_Ingredient ci ON c.cocktail_id = ci.cocktail_id
            LEFT JOIN Ingredient i ON ci.ingredient_id = i.ingredient_id
            WHERE c.user_id = %s
            GROUP BY c.cocktail_id, c.cocktail_name, c.image_path, c.created_at, cc.category_name
            ORDER BY c.created_at DESC
            LIMIT %s OFFSET %s
        ''', (session['user_id'], limit + 1, offset))
        rows     = cur.fetchall()
        has_more = len(rows) > limit
        return jsonify({'success': True, 'cocktails': list(rows[:limit]),
                        'has_more': has_more, 'page': page}), 200
    except Exception as e:
        return jsonify({'success': False, 'message': f'서버 오류: {str(e)}'}), 500
    finally:
        if conn: conn.close()


@app.route('/api/my/comments')
def get_my_comments():
    """로그인 사용자가 작성한 댓글 목록"""
    if 'user_id' not in session:
        return jsonify({'success': False, 'message': '로그인이 필요합니다.'}), 401
    limit, page, offset = _page_params(20)
    conn = None
    try:
        conn = get_db_connection()
        cur  = conn.cursor(cursor_factory=RealDictCursor)
        cur.execute('''
            SELECT cc.comment_id, cc.content,
                   TO_CHAR(cc.created_at, 'YYYY-MM-DD HH24:MI') AS created_at,
                   c.cocktail_id, c.cocktail_name
            FROM Cocktail_Comment cc
            JOIN Cocktail c ON cc.cocktail_id = c.cocktail_id
            WHERE cc.user_id = %s
            ORDER BY cc.created_at DESC
            LIMIT %s OFFSET %s
        ''', (session['user_id'], limit + 1, offset))
        rows     = cur.fetchall()
        has_more = len(rows) > limit
        return jsonify({'success': True, 'comments': list(rows[:limit]),
                        'has_more': has_more, 'page': page}), 200
    except Exception as e:
        return jsonify({'success': False, 'message': f'서버 오류: {str(e)}'}), 500
    finally:
        if conn: conn.close()


@app.route('/api/my/ingredients')
def get_my_ingredients():
    """로그인 사용자가 등록한 재료 목록"""
    if 'user_id' not in session:
        return jsonify({'success': False, 'message': '로그인이 필요합니다.'}), 401
    limit, page, offset = _page_params(20)
    conn = None
    try:
        conn = get_db_connection()
        cur  = conn.cursor(cursor_factory=RealDictCursor)
        cur.execute('''
            SELECT i.ingredient_id, i.ingredient_name, i.unit, i.description, i.created_at,
                   ic.category_name
            FROM Ingredient i
            JOIN Ingredient_Category ic ON i.ingredient_category_id = ic.ingredient_category_id
            WHERE i.user_id = %s
            ORDER BY i.created_at DESC
            LIMIT %s OFFSET %s
        ''', (session['user_id'], limit + 1, offset))
        rows     = cur.fetchall()
        has_more = len(rows) > limit
        return jsonify({'success': True, 'ingredients': list(rows[:limit]),
                        'has_more': has_more, 'page': page}), 200
    except Exception as e:
        return jsonify({'success': False, 'message': f'서버 오류: {str(e)}'}), 500
    finally:
        if conn: conn.close()


# ──────────────────────────────────────────────────────────────
# 칵테일 수정 / 삭제 (소유자 또는 관리자)
# ──────────────────────────────────────────────────────────────

@app.route('/api/cocktails/<int:cocktail_id>', methods=['PUT'])
def update_cocktail(cocktail_id):
    if 'user_id' not in session:
        return jsonify({'success': False, 'message': '로그인이 필요합니다.'}), 401
    try:
        owner_id = get_resource_owner('Cocktail', 'cocktail_id', cocktail_id)
    except Exception as e:
        return jsonify({'success': False, 'message': f'서버 오류: {str(e)}'}), 500
    if owner_id is None:
        return jsonify({'success': False, 'message': '칵테일을 찾을 수 없습니다.'}), 404
    if not check_owner_or_admin(owner_id):
        return jsonify({'success': False, 'message': '수정 권한이 없습니다.'}), 403

    name        = sanitize_text(request.form.get('cocktail_name', '').strip())
    category_id = request.form.get('category_id', '').strip()
    recipe      = sanitize_text(request.form.get('recipe', '').strip())
    ingredients_json = request.form.get('ingredients', '[]')

    if not name or not category_id:
        return jsonify({'success': False, 'message': '칵테일 이름과 카테고리는 필수입니다.'}), 400

    try:
        ingredients = json.loads(ingredients_json)
    except Exception:
        return jsonify({'success': False, 'message': '재료 데이터 형식 오류'}), 400

    if not ingredients:
        return jsonify({'success': False, 'message': '재료를 최소 1개 이상 선택해주세요.'}), 400

    # 이미지 처리 (선택)
    image_path = None
    if 'image' in request.files:
        result = save_image(request.files['image'])
        if result == 'TOO_LARGE':
            return jsonify({'success': False, 'message': '이미지 크기는 10MB 이하여야 합니다.'}), 400
        image_path = result

    conn = None
    try:
        conn = get_db_connection()
        cur  = conn.cursor()

        if image_path:
            cur.execute(
                '''UPDATE Cocktail
                   SET cocktail_name=%s, category_id=%s, recipe=%s, image_path=%s
                   WHERE cocktail_id=%s''',
                (name, int(category_id), recipe or None, image_path, cocktail_id)
            )
        else:
            cur.execute(
                '''UPDATE Cocktail
                   SET cocktail_name=%s, category_id=%s, recipe=%s
                   WHERE cocktail_id=%s''',
                (name, int(category_id), recipe or None, cocktail_id)
            )

        # 재료 전체 교체
        cur.execute('DELETE FROM Cocktail_Ingredient WHERE cocktail_id=%s', (cocktail_id,))
        for ing in ingredients:
            cur.execute(
                'INSERT INTO Cocktail_Ingredient (cocktail_id, ingredient_id, amount) VALUES (%s, %s, %s)',
                (cocktail_id, int(ing['ingredient_id']), ing['amount'])
            )

        conn.commit()
        return jsonify({'success': True, 'message': '칵테일이 수정되었습니다.'}), 200

    except Exception as e:
        if conn: conn.rollback()
        if 'unique' in str(e).lower():
            return jsonify({'success': False, 'message': '이미 존재하는 칵테일 이름입니다.'}), 409
        return jsonify({'success': False, 'message': f'서버 오류: {str(e)}'}), 500
    finally:
        if conn: conn.close()


@app.route('/api/cocktails/<int:cocktail_id>', methods=['DELETE'])
def delete_cocktail(cocktail_id):
    if 'user_id' not in session:
        return jsonify({'success': False, 'message': '로그인이 필요합니다.'}), 401
    try:
        owner_id = get_resource_owner('Cocktail', 'cocktail_id', cocktail_id)
    except Exception as e:
        return jsonify({'success': False, 'message': f'서버 오류: {str(e)}'}), 500
    if owner_id is None:
        return jsonify({'success': False, 'message': '칵테일을 찾을 수 없습니다.'}), 404
    if not check_owner_or_admin(owner_id):
        return jsonify({'success': False, 'message': '삭제 권한이 없습니다.'}), 403

    conn = None
    try:
        conn = get_db_connection()
        cur  = conn.cursor()
        # ON DELETE CASCADE로 Cocktail_Ingredient, User_Saved_Cocktail 자동 삭제
        cur.execute('DELETE FROM Cocktail WHERE cocktail_id=%s', (cocktail_id,))
        conn.commit()
        return jsonify({'success': True, 'message': '칵테일이 삭제되었습니다.'}), 200

    except Exception as e:
        if conn: conn.rollback()
        return jsonify({'success': False, 'message': f'서버 오류: {str(e)}'}), 500
    finally:
        if conn: conn.close()


# ──────────────────────────────────────────────────────────────
# 댓글
# ──────────────────────────────────────────────────────────────

@app.route('/api/cocktails/<int:cocktail_id>/comments', methods=['GET'])
def get_comments(cocktail_id):
    conn = None
    try:
        conn = get_db_connection()
        cur  = conn.cursor(cursor_factory=RealDictCursor)
        cur.execute('''
            SELECT cc.comment_id, cc.user_id, cc.content,
                   TO_CHAR(cc.created_at, 'YYYY-MM-DD HH24:MI') AS created_at,
                   ui.user_name, ui.profile_image
            FROM Cocktail_Comment cc
            JOIN User_Info ui ON cc.user_id = ui.user_id
            WHERE cc.cocktail_id = %s
            ORDER BY cc.created_at ASC
        ''', (cocktail_id,))
        rows = cur.fetchall()
        return jsonify({'success': True, 'comments': list(rows)}), 200
    except Exception as e:
        return jsonify({'success': False, 'message': f'서버 오류: {str(e)}'}), 500
    finally:
        if conn: conn.close()


@app.route('/api/cocktails/<int:cocktail_id>/comments', methods=['POST'])
def add_comment(cocktail_id):
    if 'user_id' not in session:
        return jsonify({'success': False, 'message': '로그인이 필요합니다.'}), 401

    data    = request.get_json()
    content = sanitize_text(data.get('content', '').strip()) if data else ''
    if not content:
        return jsonify({'success': False, 'message': '댓글 내용을 입력해주세요.'}), 400
    if len(content) > 500:
        return jsonify({'success': False, 'message': '댓글은 500자 이내로 입력해주세요.'}), 400

    conn = None
    try:
        conn = get_db_connection()
        cur  = conn.cursor(cursor_factory=RealDictCursor)
        cur.execute('''
            INSERT INTO Cocktail_Comment (cocktail_id, user_id, content)
            VALUES (%s, %s, %s)
            RETURNING comment_id,
                      TO_CHAR(created_at, 'YYYY-MM-DD HH24:MI') AS created_at
        ''', (cocktail_id, session['user_id'], content))
        row = cur.fetchone()

        # 프로필 사진 조회
        cur.execute('SELECT profile_image FROM User_Info WHERE user_id = %s', (session['user_id'],))
        user_row = cur.fetchone()

        conn.commit()
        return jsonify({
            'success':       True,
            'comment_id':    row['comment_id'],
            'created_at':    row['created_at'],
            'user_name':     session['user_name'],
            'user_id':       session['user_id'],
            'content':       content,
            'profile_image': user_row['profile_image'] if user_row else None
        }), 201
    except Exception as e:
        if conn: conn.rollback()
        return jsonify({'success': False, 'message': f'서버 오류: {str(e)}'}), 500
    finally:
        if conn: conn.close()


@app.route('/api/cocktails/<int:cocktail_id>/comments/<int:comment_id>', methods=['DELETE'])
def delete_comment(cocktail_id, comment_id):
    if 'user_id' not in session:
        return jsonify({'success': False, 'message': '로그인이 필요합니다.'}), 401

    conn = None
    try:
        conn = get_db_connection()
        cur  = conn.cursor(cursor_factory=RealDictCursor)
        cur.execute(
            'SELECT user_id FROM Cocktail_Comment WHERE comment_id=%s AND cocktail_id=%s',
            (comment_id, cocktail_id)
        )
        row = cur.fetchone()
        if not row:
            return jsonify({'success': False, 'message': '댓글을 찾을 수 없습니다.'}), 404
        if not check_owner_or_admin(row['user_id']):
            return jsonify({'success': False, 'message': '삭제 권한이 없습니다.'}), 403

        cur.execute('DELETE FROM Cocktail_Comment WHERE comment_id=%s', (comment_id,))
        conn.commit()
        return jsonify({'success': True}), 200
    except Exception as e:
        if conn: conn.rollback()
        return jsonify({'success': False, 'message': f'서버 오류: {str(e)}'}), 500
    finally:
        if conn: conn.close()


# ──────────────────────────────────────────────────────────────
# 공개 사용자 프로필
# ──────────────────────────────────────────────────────────────

@app.route('/user/<user_id>')
def user_profile_page(user_id):
    """공개 프로필 페이지 (비로그인 접근 가능)"""
    return render_template('user_profile.html', target_user_id=user_id)


@app.route('/api/users/<user_id>/public', methods=['GET'])
def get_user_public_info(user_id):
    """공개 사용자 정보: 이름·등급·프로필사진·콘텐츠 수"""
    conn = None
    try:
        conn = get_db_connection()
        cur  = conn.cursor(cursor_factory=RealDictCursor)

        cur.execute('''
            SELECT u.user_id, u.user_name, u.profile_image,
                   ug.grade_name,
                   (SELECT COUNT(*) FROM Cocktail   WHERE user_id = u.user_id) AS cocktail_count,
                   (SELECT COUNT(*) FROM Ingredient WHERE user_id = u.user_id) AS ingredient_count
            FROM User_Info u
            JOIN User_Grade ug ON u.grade_id = ug.grade_id
            WHERE u.user_id = %s
        ''', (user_id,))
        row = cur.fetchone()
        if not row:
            return jsonify({'success': False, 'message': '사용자를 찾을 수 없습니다.'}), 404

        return jsonify({'success': True, 'user': dict(row)}), 200
    except Exception as e:
        return jsonify({'success': False, 'message': f'서버 오류: {str(e)}'}), 500
    finally:
        if conn: conn.close()


@app.route('/api/users/<user_id>/cocktails', methods=['GET'])
def get_user_public_cocktails(user_id):
    """사용자가 업로드한 칵테일 목록 (공개)"""
    limit, page, offset = _page_params(20)
    conn = None
    try:
        conn = get_db_connection()
        cur  = conn.cursor(cursor_factory=RealDictCursor)
        cur.execute('''
            SELECT c.cocktail_id, c.cocktail_name, c.image_path, c.created_at,
                   cc.category_name,
                   COALESCE(
                       STRING_AGG(i.ingredient_name, ', ' ORDER BY i.ingredient_name)
                       FILTER (WHERE i.ingredient_id IS NOT NULL),
                       ''
                   ) AS ingredients
            FROM Cocktail c
            JOIN Cocktail_Category cc ON c.category_id = cc.category_id
            LEFT JOIN Cocktail_Ingredient ci ON c.cocktail_id = ci.cocktail_id
            LEFT JOIN Ingredient i ON ci.ingredient_id = i.ingredient_id
            WHERE c.user_id = %s
            GROUP BY c.cocktail_id, c.cocktail_name, c.image_path, c.created_at, cc.category_name
            ORDER BY c.created_at DESC
            LIMIT %s OFFSET %s
        ''', (user_id, limit + 1, offset))
        rows     = cur.fetchall()
        has_more = len(rows) > limit
        return jsonify({'success': True, 'cocktails': list(rows[:limit]),
                        'has_more': has_more, 'page': page}), 200
    except Exception as e:
        return jsonify({'success': False, 'message': f'서버 오류: {str(e)}'}), 500
    finally:
        if conn: conn.close()


@app.route('/api/users/<user_id>/ingredients', methods=['GET'])
def get_user_public_ingredients(user_id):
    """사용자가 등록한 재료 목록 (공개)"""
    limit, page, offset = _page_params(20)
    conn = None
    try:
        conn = get_db_connection()
        cur  = conn.cursor(cursor_factory=RealDictCursor)
        cur.execute('''
            SELECT i.ingredient_id, i.ingredient_name, i.unit, i.description, i.created_at,
                   ic.category_name
            FROM Ingredient i
            JOIN Ingredient_Category ic ON i.ingredient_category_id = ic.ingredient_category_id
            WHERE i.user_id = %s
            ORDER BY i.created_at DESC
            LIMIT %s OFFSET %s
        ''', (user_id, limit + 1, offset))
        rows     = cur.fetchall()
        has_more = len(rows) > limit
        return jsonify({'success': True, 'ingredients': list(rows[:limit]),
                        'has_more': has_more, 'page': page}), 200
    except Exception as e:
        return jsonify({'success': False, 'message': f'서버 오류: {str(e)}'}), 500
    finally:
        if conn: conn.close()


# ──────────────────────────────────────────────────────────────
# 신고 시스템
# ──────────────────────────────────────────────────────────────

@app.route('/admin/reports')
def admin_reports_page():
    """관리자 신고 관리 페이지"""
    if not check_admin():
        return redirect(url_for('index'))
    return render_template('admin_reports.html')


@app.route('/api/reports', methods=['POST'])
def submit_report():
    """신고 접수 (로그인 필요)"""
    if 'user_id' not in session:
        return jsonify({'success': False, 'message': '로그인이 필요합니다.'}), 401

    data        = request.get_json()
    target_type = data.get('target_type', '').strip()
    target_id   = str(data.get('target_id', '')).strip()
    reason      = data.get('reason', '').strip()
    reporter_id = session['user_id']

    if target_type not in ['cocktail', 'ingredient', 'comment', 'user']:
        return jsonify({'success': False, 'message': '잘못된 신고 대상입니다.'}), 400
    if reason not in REPORT_REASONS:
        return jsonify({'success': False, 'message': '잘못된 신고 사유입니다.'}), 400
    if not target_id:
        return jsonify({'success': False, 'message': '신고 대상 ID가 없습니다.'}), 400
    if target_type == 'user' and target_id == reporter_id:
        return jsonify({'success': False, 'message': '자신을 신고할 수 없습니다.'}), 400

    conn = None
    try:
        conn = get_db_connection()
        cur  = conn.cursor(cursor_factory=RealDictCursor)

        # 중복 신고 확인
        cur.execute(
            'SELECT report_id FROM Report WHERE reporter_id=%s AND target_type=%s AND target_id=%s',
            (reporter_id, target_type, target_id)
        )
        if cur.fetchone():
            return jsonify({'success': False, 'message': '이미 신고한 항목입니다.'}), 409

        cur.execute(
            'INSERT INTO Report (reporter_id, target_type, target_id, reason) VALUES (%s, %s, %s, %s)',
            (reporter_id, target_type, target_id, reason)
        )
        conn.commit()
        return jsonify({'success': True, 'message': '신고가 접수되었습니다.'}), 201

    except Exception as e:
        if conn: conn.rollback()
        return jsonify({'success': False, 'message': f'서버 오류: {str(e)}'}), 500
    finally:
        if conn: conn.close()


@app.route('/api/reports/my', methods=['GET'])
def get_my_reports():
    """현재 유저가 신고한 목록 (target_type, target_id) 반환"""
    if 'user_id' not in session:
        return jsonify({'success': True, 'reports': []})
    conn = None
    try:
        conn = get_db_connection()
        cur  = conn.cursor(cursor_factory=RealDictCursor)
        cur.execute(
            'SELECT target_type, target_id FROM Report WHERE reporter_id = %s',
            (session['user_id'],)
        )
        reports = [{'target_type': r['target_type'], 'target_id': r['target_id']}
                   for r in cur.fetchall()]
        return jsonify({'success': True, 'reports': reports})
    except Exception as e:
        return jsonify({'success': False, 'reports': []}), 500
    finally:
        if conn: conn.close()


@app.route('/api/admin/reports', methods=['GET'])
def get_pending_reports():
    """미처리 신고 목록 (관리자 전용)"""
    if not check_admin():
        return jsonify({'success': False, 'message': '관리자 권한이 필요합니다.'}), 403

    limit, page, offset = _page_params(default_limit=30)
    conn = None
    try:
        conn = get_db_connection()
        cur  = conn.cursor(cursor_factory=RealDictCursor)
        cur.execute('''
            SELECT r.report_id, r.reporter_id, r.target_type, r.target_id,
                   r.reason, r.created_at,
                   ui.user_name AS reporter_name
            FROM Report r
            JOIN User_Info ui ON r.reporter_id = ui.user_id
            WHERE NOT EXISTS (
                SELECT 1 FROM Report_Resolution rr WHERE rr.report_id = r.report_id
            )
            ORDER BY r.created_at ASC
            LIMIT %s OFFSET %s
        ''', (limit + 1, offset))
        rows     = cur.fetchall()
        has_more = len(rows) > limit
        reports  = []
        for row in rows[:limit]:
            r = dict(row)
            r['reason_label']    = REPORT_REASON_LABELS.get(r['reason'], r['reason'])
            r['created_at']      = r['created_at'].strftime('%Y-%m-%d %H:%M') if r['created_at'] else ''
            reports.append(r)
        return jsonify({'success': True, 'reports': reports, 'has_more': has_more, 'page': page}), 200
    except Exception as e:
        return jsonify({'success': False, 'message': f'서버 오류: {str(e)}'}), 500
    finally:
        if conn: conn.close()


@app.route('/api/admin/reports/resolved', methods=['GET'])
def get_resolved_reports():
    """처리된 신고 목록 (관리자 전용)"""
    if not check_admin():
        return jsonify({'success': False, 'message': '관리자 권한이 필요합니다.'}), 403

    limit, page, offset = _page_params(default_limit=30)
    conn = None
    try:
        conn = get_db_connection()
        cur  = conn.cursor(cursor_factory=RealDictCursor)
        cur.execute('''
            SELECT r.report_id, r.reporter_id, r.target_type, r.target_id,
                   r.reason, r.created_at,
                   ui.user_name AS reporter_name,
                   rr.action_taken, rr.resolved_at,
                   resolver.user_name AS resolver_name
            FROM Report r
            JOIN User_Info ui ON r.reporter_id = ui.user_id
            JOIN Report_Resolution rr ON r.report_id = rr.report_id
            JOIN User_Info resolver ON rr.resolver_id = resolver.user_id
            ORDER BY rr.resolved_at DESC
            LIMIT %s OFFSET %s
        ''', (limit + 1, offset))
        rows     = cur.fetchall()
        has_more = len(rows) > limit
        reports  = []
        for row in rows[:limit]:
            r = dict(row)
            r['reason_label']      = REPORT_REASON_LABELS.get(r['reason'], r['reason'])
            r['action_label']      = REPORT_ACTION_LABELS.get(r['action_taken'], r['action_taken'])
            r['created_at']        = r['created_at'].strftime('%Y-%m-%d %H:%M') if r['created_at'] else ''
            r['resolved_at']       = r['resolved_at'].strftime('%Y-%m-%d %H:%M') if r['resolved_at'] else ''
            reports.append(r)
        return jsonify({'success': True, 'reports': reports, 'has_more': has_more, 'page': page}), 200
    except Exception as e:
        return jsonify({'success': False, 'message': f'서버 오류: {str(e)}'}), 500
    finally:
        if conn: conn.close()


@app.route('/api/admin/reports/<int:report_id>/resolve', methods=['POST'])
def resolve_report(report_id):
    """신고 처리 (관리자 전용)"""
    if not check_admin():
        return jsonify({'success': False, 'message': '관리자 권한이 필요합니다.'}), 403

    data         = request.get_json()
    action_taken = data.get('action_taken', '').strip()
    resolver_id  = session['user_id']

    if action_taken not in REPORT_ACTIONS:
        return jsonify({'success': False, 'message': '잘못된 처리 방식입니다.'}), 400

    conn = None
    try:
        conn = get_db_connection()
        cur  = conn.cursor(cursor_factory=RealDictCursor)

        # 신고 존재 확인
        cur.execute('SELECT * FROM Report WHERE report_id=%s', (report_id,))
        report = cur.fetchone()
        if not report:
            return jsonify({'success': False, 'message': '존재하지 않는 신고입니다.'}), 404

        # 이미 처리된 신고 확인
        cur.execute('SELECT 1 FROM Report_Resolution WHERE report_id=%s', (report_id,))
        if cur.fetchone():
            return jsonify({'success': False, 'message': '이미 처리된 신고입니다.'}), 409

        target_type = report['target_type']
        target_id   = report['target_id']

        # 콘텐츠 삭제
        if action_taken == 'content_deleted':
            if target_type == 'cocktail':
                cur.execute('DELETE FROM Cocktail WHERE cocktail_id=%s', (int(target_id),))
            elif target_type == 'ingredient':
                cur.execute('DELETE FROM Ingredient WHERE ingredient_id=%s', (int(target_id),))
            elif target_type == 'comment':
                cur.execute('DELETE FROM Cocktail_Comment WHERE comment_id=%s', (int(target_id),))
            # user 타입은 content_deleted 적용 불가 → 무시

        # 사용자 제재
        elif action_taken == 'user_sanctioned':
            if target_type == 'user':
                sanctioned_user_id = target_id
            else:
                # 콘텐츠 신고인 경우 콘텐츠 소유자를 제재
                table_map = {
                    'cocktail':   ('Cocktail', 'cocktail_id'),
                    'ingredient': ('Ingredient', 'ingredient_id'),
                    'comment':    ('Cocktail_Comment', 'comment_id'),
                }
                table, pk_col = table_map[target_type]
                cur.execute(f'SELECT user_id FROM {table} WHERE {pk_col}=%s', (int(target_id),))
                owner = cur.fetchone()
                sanctioned_user_id = owner['user_id'] if owner else None

            if sanctioned_user_id:
                cur.execute(
                    'UPDATE User_Info SET is_sanctioned=TRUE WHERE user_id=%s',
                    (sanctioned_user_id,)
                )

        # 처리 기록 삽입
        cur.execute(
            'INSERT INTO Report_Resolution (report_id, resolver_id, action_taken) VALUES (%s, %s, %s)',
            (report_id, resolver_id, action_taken)
        )
        conn.commit()
        return jsonify({
            'success': True,
            'message': f'신고가 처리되었습니다. ({REPORT_ACTION_LABELS[action_taken]})'
        }), 200

    except Exception as e:
        if conn: conn.rollback()
        return jsonify({'success': False, 'message': f'서버 오류: {str(e)}'}), 500
    finally:
        if conn: conn.close()


if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)
