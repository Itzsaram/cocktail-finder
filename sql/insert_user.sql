-- 유저 삽입 (비밀번호: bcrypt 해시)
INSERT INTO User_Info (user_id, user_name, email, password, grade_id)
VALUES (
    'admin',
    '관리자',
    'null@naver.com',
    '$2b$12$FOEZNzX5zjDu3jJCF7Oc9u5uTZ0O0UC04tNAIwq/zAOXZ9m68d1OS',
    (SELECT grade_id FROM User_Grade WHERE grade_name = 'admin')
)
ON CONFLICT (user_id) DO NOTHING;
