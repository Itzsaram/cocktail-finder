"""
실행하면 insert_user.sql 파일을 생성합니다.
사용법: python generate_insert_user.py
"""
import bcrypt
import os

USER_ID   = 'admin'
USER_NAME = '관리자'
EMAIL     = 'null@naver.com'
PASSWORD  = '1234567'
GRADE     = 'admin'

hashed = bcrypt.hashpw(PASSWORD.encode(), bcrypt.gensalt(12)).decode()

sql = f"""-- 유저 삽입 (비밀번호: bcrypt 해시)
INSERT INTO User_Info (user_id, user_name, email, password, grade_id)
VALUES (
    '{USER_ID}',
    '{USER_NAME}',
    '{EMAIL}',
    '{hashed}',
    (SELECT grade_id FROM User_Grade WHERE grade_name = '{GRADE}')
)
ON CONFLICT (user_id) DO NOTHING;
"""

out_path = os.path.join(os.path.dirname(__file__), 'insert_user.sql')
with open(out_path, 'w', encoding='utf-8') as f:
    f.write(sql)

print(f"생성 완료: {out_path}")
print(f"해시: {hashed}")
