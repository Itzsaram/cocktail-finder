-- ========================================
-- 사용자 등급 데이터 삽입 스크립트
-- ========================================

-- 기존 데이터 삭제 (선택사항)
-- TRUNCATE TABLE User_Grade CASCADE;

-- 사용자 등급 데이터 추가
INSERT INTO User_Grade (grade_name, description) VALUES 
('bronze', '브론즈 등급 - 기본 사용자'),
('silver', '실버 등급 - 활동적인 사용자'),
('gold', '골드 등급 - 헌신적인 사용자'),
('platinum', '플래티넘 등급 - 매우 활동적인 사용자'),
('diamond', '다이아몬드 등급 - VIP 사용자'),
('admin','운영자')
ON CONFLICT DO NOTHING;

-- 삽입 결과 확인
SELECT * FROM User_Grade ORDER BY grade_id;
