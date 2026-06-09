-- 일반 사용자 삽입 (비밀번호: bcrypt 해시)
INSERT INTO User_Info (user_id, user_name, email, password, grade_id)
VALUES (
    'user',
    '일반사용자',
    'user@naver.com',
    '$2b$12$1M5oERRr4Q0fpctq79ianOGE8BpM2fyOoFUNiEsFSDR3UtJHurMSC',
    (SELECT grade_id FROM User_Grade WHERE grade_name = 'bronze')
)
ON CONFLICT (user_id) DO NOTHING;
