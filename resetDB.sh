#!/bin/bash
# ========================================
# resetDB.sh - DB 초기화 스크립트
# Docker 컨테이너는 유지하고 DB 데이터만 초기화합니다.
# ========================================

# DB 접속 설정
DB_HOST="localhost"
DB_PORT="5432"
DB_USER="itzsaram"
DB_NAME="itzsaram_db"
export PGPASSWORD="5643"

# 스크립트 위치 기준으로 경로 설정
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SQL_DIR="$SCRIPT_DIR/sql"
UPLOADS_DIR="$SCRIPT_DIR/app/static/uploads"

# SQL 실행 순서 (외래키 의존 관계 기준)
SQL_FILES=(
    "init_database.sql"                  # 1. 테이블 DROP & CREATE
    "insert_user_grades.sql"             # 2. User_Grade (User_Info FK 대상)
    "insert_user.sql"                    # 3. 초기 관리자 데이터 (Ingredient/Cocktail user_id FK 대상)
    "insert_testuser.sql"               # 4. 초기 일반 사용자 데이터
    "insert_ingredient_categories.sql"   # 5. Ingredient_Category (Ingredient FK 대상)
    "insert_ingredients.sql"             # 6. Ingredient (user_id → admin)
    "insert_cocktail_categories.sql"     # 7. Cocktail_Category (Cocktail FK 대상)
    "insert_cocktails.sql"               # 8. Cocktail + Cocktail_Ingredient (user_id → admin)
    "insert_cocktails_v2.sql"            # 9. 칵테일 추가 v2 (11종)
    "insert_cocktails_v3.sql"            # 10. 칵테일 추가 v3 (20종)
)

# ----------------------------------------
# 유틸리티 함수
# ----------------------------------------
log_info()  { echo "[INFO]  $1"; }
log_ok()    { echo "[OK]    $1"; }
log_error() { echo "[ERROR] $1"; }

run_sql() {
    local file="$SQL_DIR/$1"

    if [ ! -f "$file" ]; then
        log_error "파일을 찾을 수 없습니다: $file"
        return 1
    fi

    psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -f "$file" \
        --set ON_ERROR_STOP=1 -q 2>&1

    if [ $? -ne 0 ]; then
        log_error "$1 실행 실패"
        return 1
    fi

    log_ok "$1 완료"
    return 0
}

# ----------------------------------------
# 메인 로직
# ----------------------------------------
echo "========================================"
echo "  DB 초기화 시작: $DB_NAME"
echo "========================================"

# 업로드 이미지 초기화
log_info "업로드 이미지 초기화 중..."
if [ -d "$UPLOADS_DIR" ]; then
    count=$(find "$UPLOADS_DIR" -maxdepth 1 -type f | wc -l)
    rm -f "$UPLOADS_DIR"/*
    log_ok "이미지 $count 개 삭제 완료 ($UPLOADS_DIR)"
else
    mkdir -p "$UPLOADS_DIR"
    log_ok "uploads 디렉토리 생성 ($UPLOADS_DIR)"
fi
echo "----------------------------------------"

# DB 연결 확인
log_info "DB 연결 확인 중..."
psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c "SELECT 1;" -q > /dev/null 2>&1
if [ $? -ne 0 ]; then
    log_error "DB에 연결할 수 없습니다. PostgreSQL이 실행 중인지 확인하세요."
    log_error "  Host: $DB_HOST  Port: $DB_PORT  User: $DB_USER  DB: $DB_NAME"
    unset PGPASSWORD
    exit 1
fi
log_ok "DB 연결 성공"

# SQL 파일 순서대로 실행
echo "----------------------------------------"
for sql_file in "${SQL_FILES[@]}"; do
    log_info "$sql_file 실행 중..."
    run_sql "$sql_file"
    if [ $? -ne 0 ]; then
        log_error "초기화 중단. 위 오류를 확인하세요."
        unset PGPASSWORD
        exit 1
    fi
done

echo "----------------------------------------"
echo "[완료] DB 초기화가 성공적으로 완료되었습니다."
echo "========================================"

unset PGPASSWORD
