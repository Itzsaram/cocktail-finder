-- ========================================================================
-- 대분류 기준 범용 Ingredient(재료) 데이터 삽입 스크립트
-- ========================================================================

INSERT INTO Ingredient (ingredient_name, ingredient_category_id, unit, description) VALUES

-- [1. 주류 카테고리] ─────────────────────────────────────────────────────
('드라이 진',               (SELECT ingredient_category_id FROM Ingredient_Category WHERE category_name = '주류'), 'ml', '런던 드라이 진 스타일의 표준 기주'),
('화이트 럼',               (SELECT ingredient_category_id FROM Ingredient_Category WHERE category_name = '주류'), 'ml', '색이 투명하고 가벼운 스타일의 럼 (모히토, 다이키리 베이스)'),
('골드 럼',                 (SELECT ingredient_category_id FROM Ingredient_Category WHERE category_name = '주류'), 'ml', '오크통 숙성을 거쳐 황금빛을 띠는 부드러운 럼'),
('다크 럼',                 (SELECT ingredient_category_id FROM Ingredient_Category WHERE category_name = '주류'), 'ml', '풍미가 짙고 어두운 색상의 숙성 럼 (마이타이 등 트로피컬 칵테일용)'),
('오버프루프 럼',            (SELECT ingredient_category_id FROM Ingredient_Category WHERE category_name = '주류'), 'ml', '70도 이상의 고도수 럼 (불타는 칵테일 혹은 레이어링용)'),
('보드카',                  (SELECT ingredient_category_id FROM Ingredient_Category WHERE category_name = '주류'), 'ml', '무색, 무취, 무향의 표준 증류주'),
('블렌디드 스카치 위스키',   (SELECT ingredient_category_id FROM Ingredient_Category WHERE category_name = '주류'), 'ml', '균형 잡힌 풍미의 스코틀랜드 블렌디드 위스키'),
('버번 위스키',              (SELECT ingredient_category_id FROM Ingredient_Category WHERE category_name = '주류'), 'ml', '옥수수를 주원료로 한 달콤하고 타격감 있는 미국 위스키 (올드 패션드용)'),
('아이리시 위스키',          (SELECT ingredient_category_id FROM Ingredient_Category WHERE category_name = '주류'), 'ml', '피트 향이 없고 목넘김이 부드러운 아일랜드 위스키 (아이리시 커피용)'),
('싱글몰트 위스키',          (SELECT ingredient_category_id FROM Ingredient_Category WHERE category_name = '주류'), 'ml', '단일 증류소에서 맥아만을 이용해 만든 개성 강한 위스키'),
('코냑 / 브랜디',            (SELECT ingredient_category_id FROM Ingredient_Category WHERE category_name = '주류'), 'ml', '포도를 증류 및 숙성하여 만든 고급 과일 증류주'),
('애플 브랜디 / 칼바도스',   (SELECT ingredient_category_id FROM Ingredient_Category WHERE category_name = '주류'), 'ml', '사과를 원료로 한 증류 브랜디'),
('블랑코 데킬라',            (SELECT ingredient_category_id FROM Ingredient_Category WHERE category_name = '주류'), 'ml', '숙성하지 않은 투명하고 청량한 데킬라 (마가리타 베이스)'),
('레포사도 데킬라',          (SELECT ingredient_category_id FROM Ingredient_Category WHERE category_name = '주류'), 'ml', '최대 1년 미만 숙성하여 부드러운 맛을 내는 골드 빛 데킬라'),
('메스칼',                  (SELECT ingredient_category_id FROM Ingredient_Category WHERE category_name = '주류'), 'ml', '특유의 강렬한 스모키(훈연) 향을 가진 멕시코 전통 아가베 증류주'),
('트리플 섹',               (SELECT ingredient_category_id FROM Ingredient_Category WHERE category_name = '주류'), 'ml', '칵테일에 가장 널리 쓰이는 표준 오렌지 리큐르'),
('블루 큐라소',              (SELECT ingredient_category_id FROM Ingredient_Category WHERE category_name = '주류'), 'ml', '푸른 색감을 내기 위해 파란색을 입힌 오렌지 향 리큐르'),
('멜론 리큐르',              (SELECT ingredient_category_id FROM Ingredient_Category WHERE category_name = '주류'), 'ml', '달콤하고 선명한 초록빛의 멜론 가향 혼성주 (미도리 사워용)'),
('피치 슈냅스 / 리큐르',     (SELECT ingredient_category_id FROM Ingredient_Category WHERE category_name = '주류'), 'ml', '복숭아 향이 진한 투명한 리큐르 (피치 크러시, 우우용)'),
('코코넛 럼 리큐르',         (SELECT ingredient_category_id FROM Ingredient_Category WHERE category_name = '주류'), 'ml', '코코넛 향이 가미된 달콤한 화이트 럼 기반 리큐르 (말리부 스타일)'),
('커피 리큐르',              (SELECT ingredient_category_id FROM Ingredient_Category WHERE category_name = '주류'), 'ml', '진한 에스프레소 향과 당분이 포함된 커피 혼성주 (깔루아 밀크용)'),
('아마레또',                (SELECT ingredient_category_id FROM Ingredient_Category WHERE category_name = '주류'), 'ml', '살구씨에서 추출한 고소한 아몬드 향 리큐르 (갓파더, 아마레또 사워용)'),
('아이리시 크림',            (SELECT ingredient_category_id FROM Ingredient_Category WHERE category_name = '주류'), 'ml', '위스키와 크림, 초콜릿이 섞인 부드러운 리큐르 (베일리스 스타일)'),
('캄파리 / 비터 리큐르',     (SELECT ingredient_category_id FROM Ingredient_Category WHERE category_name = '주류'), 'ml', '쌉싸름한 약재 맛과 허브 향이 특징인 이탈리아 적색 식전주'),
('아페롤',                  (SELECT ingredient_category_id FROM Ingredient_Category WHERE category_name = '주류'), 'ml', '캄파리보다 알코올 도수가 낮고 오렌지 풍미가 강한 식전주'),
('드람뷔',                  (SELECT ingredient_category_id FROM Ingredient_Category WHERE category_name = '주류'), 'ml', '스카치 위스키에 허브와 꿀을 가미한 고급 달콤한 리큐르'),
('예거마이스터 / 허브 리큐르',(SELECT ingredient_category_id FROM Ingredient_Category WHERE category_name = '주류'), 'ml', '수십 가지 허브를 침출하여 만든 짙은 갈색의 허브 주류'),
('드라이 베르무트',          (SELECT ingredient_category_id FROM Ingredient_Category WHERE category_name = '주류'), 'ml', '달지 않고 상큼한 화이트 가향 와인 (드라이 마티니 필수재료)'),
('스위트 베르무트',          (SELECT ingredient_category_id FROM Ingredient_Category WHERE category_name = '주류'), 'ml', '달콤하고 한약재 향이 감도는 레드 가향 와인 (맨해튼, 네그로니용)'),
('셰리 와인',               (SELECT ingredient_category_id FROM Ingredient_Category WHERE category_name = '주류'), 'ml', '스페인산 주정강화 와인'),
('포트 와인',               (SELECT ingredient_category_id FROM Ingredient_Category WHERE category_name = '주류'), 'ml', '포르투갈산 달콤하고 도수 높은 주정강화 와인'),
('드라이 스파클링 와인 / 샴페인',(SELECT ingredient_category_id FROM Ingredient_Category WHERE category_name = '주류'), 'ml', '탄산이 포함된 화이트 포도주 (미모사, 스프리츠 베이스)'),
('일반 하우스 와인 (레드/화이트)',(SELECT ingredient_category_id FROM Ingredient_Category WHERE category_name = '주류'), 'ml', '상리아나 뱅쇼, 간단한 와인 스프리처용 스틸 와인'),
('라거 맥주',               (SELECT ingredient_category_id FROM Ingredient_Category WHERE category_name = '주류'), 'ml', '청량감이 좋은 표준 황금빛 맥주'),
('흑맥주 / 스타우트',        (SELECT ingredient_category_id FROM Ingredient_Category WHERE category_name = '주류'), 'ml', '볶은 맥아 향이 나는 진한 맥주 (아이리시 카밤용)'),
('사케 / 청주',              (SELECT ingredient_category_id FROM Ingredient_Category WHERE category_name = '주류'), 'ml', '쌀을 발효하여 여과한 맑은 아시아 전통주'),
('증류식 소주 / 전통주',     (SELECT ingredient_category_id FROM Ingredient_Category WHERE category_name = '주류'), 'ml', '한국 전통 쌀 기반 고도수 증류주'),
('고량주 / 백주',            (SELECT ingredient_category_id FROM Ingredient_Category WHERE category_name = '주류'), 'ml', '수수를 원료로 하여 파인애플 향이 강한 중국 증류주'),

-- [2. 과일 및 주스 카테고리] ─────────────────────────────────────────────
('신선한 라임즙 / 주스',     (SELECT ingredient_category_id FROM Ingredient_Category WHERE category_name = '과일 및 주스'), 'ml', '사워 및 새콤한 맛을 내는 클래식 칵테일 핵심 재료'),
('신선한 레몬즙 / 주스',     (SELECT ingredient_category_id FROM Ingredient_Category WHERE category_name = '과일 및 주스'), 'ml', '시트러스 풍미와 산미를 더하는 필수 과즙'),
('오렌지 주스',              (SELECT ingredient_category_id FROM Ingredient_Category WHERE category_name = '과일 및 주스'), 'ml', '100% 가공 또는 생 오렌지 주스'),
('파인애플 주스',            (SELECT ingredient_category_id FROM Ingredient_Category WHERE category_name = '과일 및 주스'), 'ml', '트로피컬 칵테일용 걸쭉하고 달콤한 주스'),
('크랜베리 주스',            (SELECT ingredient_category_id FROM Ingredient_Category WHERE category_name = '과일 및 주스'), 'ml', '붉은 색감과 새콤한 맛을 내는 주스'),
('자몽 주스',               (SELECT ingredient_category_id FROM Ingredient_Category WHERE category_name = '과일 및 주스'), 'ml', '쌉싸름하고 상큼한 맛을 내는 주스'),
('사과 주스 / 애플주스',     (SELECT ingredient_category_id FROM Ingredient_Category WHERE category_name = '과일 및 주스'), 'ml', '투명하거나 탁한 사과 과즙'),

-- [3. 시럽 카테고리] ─────────────────────────────────────────────────────
('심플 시럽',               (SELECT ingredient_category_id FROM Ingredient_Category WHERE category_name = '시럽'), 'ml', '설탕과 물을 1:1로 섞은 가장 베이직한 단맛 시럽'),
('그레나딘 시럽',            (SELECT ingredient_category_id FROM Ingredient_Category WHERE category_name = '시럽'), 'ml', '석류 향이 가미된 붉은색 레이어링용 시럽'),
('코코넛 크림 / 시럽',       (SELECT ingredient_category_id FROM Ingredient_Category WHERE category_name = '시럽'), 'ml', '피냐콜라다 등에 들어가는 고소하고 꾸덕한 코코넛 시럽'),
('아가베 시럽',              (SELECT ingredient_category_id FROM Ingredient_Category WHERE category_name = '시럽'), 'ml', '선인장 아가베 추출 선명한 시럽 (데킬라와 찰떡궁합)'),
('벌꿀 / 꿀 시럽',           (SELECT ingredient_category_id FROM Ingredient_Category WHERE category_name = '시럽'), 'ml', '천연 벌꿀 또는 물에 개어낸 꿀 믹서'),

-- [4. 스파이스 및 향신료 카테고리] ──────────────────────────────────────
('정제 소금',               (SELECT ingredient_category_id FROM Ingredient_Category WHERE category_name = '스파이스 및 향신료'), '꼬집', '마가리타 림 글라스 코팅(리밍)용 소금'),
('백설탕 / 황설탕',          (SELECT ingredient_category_id FROM Ingredient_Category WHERE category_name = '스파이스 및 향신료'), 'tsp',  '모히토 민트 크러싱 또는 올드패션드 조제용 설탕 각설탕 가루'),
('시나몬 파우더 / 스틱',     (SELECT ingredient_category_id FROM Ingredient_Category WHERE category_name = '스파이스 및 향신료'), '꼬집', '계피 가루 및 통계피 나무 스틱 (가니시 및 스모킹용)'),
('육두구 가루',              (SELECT ingredient_category_id FROM Ingredient_Category WHERE category_name = '스파이스 및 향신료'), '꼬집', '트로피컬, 크림 칵테일 위에 뿌려 잡내를 잡는 너트멕 가루'),

-- [5. 음료 및 믹서 카테고리] ─────────────────────────────────────────────
('클럽 소다 / 탄산수',       (SELECT ingredient_category_id FROM Ingredient_Category WHERE category_name = '음료 및 믹서'), 'ml', '단맛과 향이 전혀 없는 정제 탄산수'),
('토닉 워터',               (SELECT ingredient_category_id FROM Ingredient_Category WHERE category_name = '음료 및 믹서'), 'ml', '퀴닌 향과 단맛이 포함된 탄산음료 (진토닉 필수재료)'),
('콜라',                    (SELECT ingredient_category_id FROM Ingredient_Category WHERE category_name = '음료 및 믹서'), 'ml', '청량감과 달콤함을 더하는 콜라 믹서'),
('진저 에일',               (SELECT ingredient_category_id FROM Ingredient_Category WHERE category_name = '음료 및 믹서'), 'ml', '은은한 생강 향이 나는 대중적인 탄산음료'),
('진저 비어',               (SELECT ingredient_category_id FROM Ingredient_Category WHERE category_name = '음료 및 믹서'), 'ml', '생강 발효 맛이 매우 알싸하고 강한 음료 (모스크 뮤울 필수재료)'),
('토마토 주스 / 믹서',       (SELECT ingredient_category_id FROM Ingredient_Category WHERE category_name = '음료 및 믹서'), 'ml', '블러디 메리 등에 사용되는 가향 토마토 음료'),

-- [6. 신선한 재료 카테고리] ──────────────────────────────────────────────
('애플민트 잎',              (SELECT ingredient_category_id FROM Ingredient_Category WHERE category_name = '신선한 재료'), '잎',  '모히토나 뮬 칵테일에 짓이겨 넣는 신선한 허브'),
('생바질 잎',               (SELECT ingredient_category_id FROM Ingredient_Category WHERE category_name = '신선한 재료'), '잎',  '진 바질 스매시 등에 사용되는 허브'),
('라임 웨지 / 슬라이스',     (SELECT ingredient_category_id FROM Ingredient_Category WHERE category_name = '신선한 재료'), '개',  '가니시용으로 조각낸 신선한 라임'),
('레몬 필 / 슬라이스',       (SELECT ingredient_category_id FROM Ingredient_Category WHERE category_name = '신선한 재료'), '개',  '오일 향 즙을 짜내거나 잔에 가니시하는 레몬 껍질 조각'),
('오렌지 슬라이스 / 필',     (SELECT ingredient_category_id FROM Ingredient_Category WHERE category_name = '신선한 재료'), '개',  '올드 패션드 등에 곁들이는 오렌지 조각'),
('그린 올리브',              (SELECT ingredient_category_id FROM Ingredient_Category WHERE category_name = '신선한 재료'), '개',  '드라이 마티니에 핀으로 꽂아 넣는 짭짤한 올리브'),
('칵테일 체리',              (SELECT ingredient_category_id FROM Ingredient_Category WHERE category_name = '신선한 재료'), '개',  '마라스키노 시럽에 절여진 장식용 빨간 체리'),

-- [7. 기타 카테고리] ─────────────────────────────────────────────────────
('앙고스투라 비터스',        (SELECT ingredient_category_id FROM Ingredient_Category WHERE category_name = '기타'), 'dash', '클래식 칵테일에 대시(Dash) 단위로 풍미를 더하는 고농축 비터스'),
('오렌지 비터스',            (SELECT ingredient_category_id FROM Ingredient_Category WHERE category_name = '기타'), 'dash', '고농축 오렌지 오일 성분의 칵테일 가향제'),
('달걀 흰자',               (SELECT ingredient_category_id FROM Ingredient_Category WHERE category_name = '기타'), '개',  '사워류 칵테일 쉐이킹 시 촘촘하고 부드러운 거품 층을 만드는 재료'),
('우유',                    (SELECT ingredient_category_id FROM Ingredient_Category WHERE category_name = '기타'), 'ml', '깔루아 밀크 등에 사용되는 유제품'),
('헤비 크림 / 생크림',       (SELECT ingredient_category_id FROM Ingredient_Category WHERE category_name = '기타'), 'ml', '화이트 러시안, 알렉산더 등에 쓰이는 유지방 크림'),
('큐브 얼음',               (SELECT ingredient_category_id FROM Ingredient_Category WHERE category_name = '기타'), '개',  '글라스 칠링 및 빌드, 쉐이킹용 사각 얼음'),
('크러시드 아이스',          (SELECT ingredient_category_id FROM Ingredient_Category WHERE category_name = '기타'), 'g',   '잘게 부순 얼음 (모히토, 쥴렙 칵테일용)')

ON CONFLICT (ingredient_name) DO NOTHING;

-- 시스템 기본 재료 소유자를 admin으로 설정
UPDATE Ingredient SET user_id = 'admin' WHERE user_id IS NULL;

SELECT
    ic.category_name AS "카테고리",
    COUNT(i.ingredient_id) AS "재료 수"
FROM Ingredient_Category ic
LEFT JOIN Ingredient i ON ic.ingredient_category_id = i.ingredient_category_id
GROUP BY ic.ingredient_category_id, ic.category_name
ORDER BY ic.ingredient_category_id;
