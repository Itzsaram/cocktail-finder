-- ========================================
-- 재료 카테고리 데이터 삽입 스크립트
-- ========================================

-- 기존 데이터 삭제 (선택사항)
-- TRUNCATE TABLE Ingredient_Category CASCADE;

-- 재료 카테고리 데이터 추가
INSERT INTO Ingredient_Category (category_name, description) VALUES 
('주류', '럼, 진, 보드카, 테킬라 등 주류'),
('과일 및 주스', '라임, 레몬, 오렌지, 파인애플 등 과일 및 과일 주스'),
('시럽', '심플 시럽, 코코넛 시럽, 초콜릿 시럽 등'),
('스파이스 및 향신료', '시나몬, 생강, 육두구, 소금 등'),
('음료 및 믹서', '소다수, 토닉워터, 콜라, 진저에일 등'),
('신선한 재료', '민트, 바질, 로즈마리 등 신선한 허브'),
('기타', '계란, 우유, 크림, 초콜릿 등 기타 재료')
ON CONFLICT DO NOTHING;

-- 삽입 결과 확인
SELECT * FROM Ingredient_Category ORDER BY ingredient_category_id;
