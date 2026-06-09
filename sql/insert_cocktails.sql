-- ========================================================================
-- 칵테일 레시피 초기 데이터 (12종)
-- user_id = 'admin' (admin) : 시스템 기본 데이터
-- amount 단위는 각 재료의 Ingredient.unit 컬럼을 따름
-- ========================================================================

INSERT INTO Cocktail (cocktail_name, category_id, user_id, recipe) VALUES

-- 클래식
('올드 패션드',
 (SELECT category_id FROM Cocktail_Category WHERE category_name = '클래식'), 'admin',
 '1. 올드 패션드 글라스에 설탕을 넣고 비터스를 적신다.
2. 머들러로 살짝 으깬 뒤 큰 얼음 한 조각을 넣는다.
3. 버번을 붓고 바 스푼으로 15~20회 저어준다.
4. 오렌지 필로 잔 가장자리를 닦고 장식한다.'),

('드라이 마티니',
 (SELECT category_id FROM Cocktail_Category WHERE category_name = '클래식'), 'admin',
 '1. 믹싱 글라스에 얼음을 채운다.
2. 드라이 진과 드라이 베르무트를 넣는다.
3. 바 스푼으로 30회 부드럽게 저어 차갑게 만든다.
4. 칠드된 마티니 글라스에 스트레인하고 올리브로 장식한다.'),

('네그로니',
 (SELECT category_id FROM Cocktail_Category WHERE category_name = '클래식'), 'admin',
 '1. 올드 패션드 글라스에 큰 얼음을 넣는다.
2. 진, 캄파리, 스위트 베르무트를 동량으로 붓는다.
3. 바 스푼으로 부드럽게 저어준다.
4. 오렌지 슬라이스로 장식한다.'),

('맨해튼',
 (SELECT category_id FROM Cocktail_Category WHERE category_name = '클래식'), 'admin',
 '1. 믹싱 글라스에 얼음을 채운다.
2. 버번, 스위트 베르무트, 앙고스투라 비터스를 넣는다.
3. 바 스푼으로 30회 저어준다.
4. 칠드된 쿠페 글라스에 스트레인하고 칵테일 체리로 장식한다.'),

-- 트로피컬
('모히토',
 (SELECT category_id FROM Cocktail_Category WHERE category_name = '트로피컬'), 'admin',
 '1. 하이볼 글라스에 민트 잎과 심플 시럽을 넣고 머들링한다.
2. 라임즙을 넣고 크러시드 아이스를 채운다.
3. 화이트 럼을 붓고 부드럽게 섞는다.
4. 클럽 소다로 채우고 민트 가지로 장식한다.'),

('피냐 콜라다',
 (SELECT category_id FROM Cocktail_Category WHERE category_name = '트로피컬'), 'admin',
 '1. 블렌더에 화이트 럼, 파인애플 주스, 코코넛 크림, 크러시드 아이스를 넣는다.
2. 부드럽게 블렌딩한다.
3. 허리케인 글라스에 붓고 파인애플 슬라이스로 장식한다.'),

-- 사워
('클래식 마가리타',
 (SELECT category_id FROM Cocktail_Category WHERE category_name = '사워'), 'admin',
 '1. 잔 가장자리에 소금으로 리밍한다.
2. 쉐이커에 얼음, 블랑코 데킬라, 트리플 섹, 라임즙을 넣는다.
3. 세차게 쉐이킹한다.
4. 잔에 스트레인하고 라임 웨지로 장식한다.'),

('다이키리',
 (SELECT category_id FROM Cocktail_Category WHERE category_name = '사워'), 'admin',
 '1. 쉐이커에 얼음을 채운다.
2. 화이트 럼, 라임즙, 심플 시럽을 넣는다.
3. 힘차게 쉐이킹한다.
4. 칠드된 쿠페 글라스에 스트레인한다.'),

-- 하이볼
('진 토닉',
 (SELECT category_id FROM Cocktail_Category WHERE category_name = '하이볼'), 'admin',
 '1. 하이볼 글라스에 큐브 얼음을 가득 채운다.
2. 드라이 진을 붓는다.
3. 차가운 토닉 워터로 채운다.
4. 라임 웨지를 잔에 끼워 장식한다.'),

('모스코 뮬',
 (SELECT category_id FROM Cocktail_Category WHERE category_name = '하이볼'), 'admin',
 '1. 구리 머그에 큐브 얼음을 채운다.
2. 보드카와 라임즙을 붓는다.
3. 차가운 진저 비어로 채운다.
4. 라임 웨지로 장식한다.'),

('아페롤 스프리츠',
 (SELECT category_id FROM Cocktail_Category WHERE category_name = '하이볼'), 'admin',
 '1. 와인 글라스에 큐브 얼음을 넣는다.
2. 아페롤을 붓는다.
3. 스파클링 와인, 클럽 소다 순으로 채운다.
4. 오렌지 슬라이스로 장식한다.'),

-- 크림
('화이트 러시안',
 (SELECT category_id FROM Cocktail_Category WHERE category_name = '크림'), 'admin',
 '1. 올드 패션드 글라스에 큐브 얼음을 넣는다.
2. 보드카와 커피 리큐르를 붓고 가볍게 섞는다.
3. 헤비 크림을 바 스푼 뒷면을 이용해 천천히 플로팅한다.')

ON CONFLICT DO NOTHING;


-- ========================================================================
-- 칵테일-재료 연결 (Cocktail_Ingredient)
-- ========================================================================

INSERT INTO Cocktail_Ingredient (cocktail_id, ingredient_id, amount) VALUES

-- 올드 패션드
((SELECT cocktail_id FROM Cocktail WHERE cocktail_name = '올드 패션드'),
 (SELECT ingredient_id FROM Ingredient WHERE ingredient_name = '버번 위스키'), '60'),
((SELECT cocktail_id FROM Cocktail WHERE cocktail_name = '올드 패션드'),
 (SELECT ingredient_id FROM Ingredient WHERE ingredient_name = '앙고스투라 비터스'), '2'),
((SELECT cocktail_id FROM Cocktail WHERE cocktail_name = '올드 패션드'),
 (SELECT ingredient_id FROM Ingredient WHERE ingredient_name = '백설탕 / 황설탕'), '1'),
((SELECT cocktail_id FROM Cocktail WHERE cocktail_name = '올드 패션드'),
 (SELECT ingredient_id FROM Ingredient WHERE ingredient_name = '오렌지 슬라이스 / 필'), '1'),

-- 드라이 마티니
((SELECT cocktail_id FROM Cocktail WHERE cocktail_name = '드라이 마티니'),
 (SELECT ingredient_id FROM Ingredient WHERE ingredient_name = '드라이 진'), '60'),
((SELECT cocktail_id FROM Cocktail WHERE cocktail_name = '드라이 마티니'),
 (SELECT ingredient_id FROM Ingredient WHERE ingredient_name = '드라이 베르무트'), '10'),
((SELECT cocktail_id FROM Cocktail WHERE cocktail_name = '드라이 마티니'),
 (SELECT ingredient_id FROM Ingredient WHERE ingredient_name = '그린 올리브'), '1'),

-- 네그로니
((SELECT cocktail_id FROM Cocktail WHERE cocktail_name = '네그로니'),
 (SELECT ingredient_id FROM Ingredient WHERE ingredient_name = '드라이 진'), '30'),
((SELECT cocktail_id FROM Cocktail WHERE cocktail_name = '네그로니'),
 (SELECT ingredient_id FROM Ingredient WHERE ingredient_name = '캄파리 / 비터 리큐르'), '30'),
((SELECT cocktail_id FROM Cocktail WHERE cocktail_name = '네그로니'),
 (SELECT ingredient_id FROM Ingredient WHERE ingredient_name = '스위트 베르무트'), '30'),
((SELECT cocktail_id FROM Cocktail WHERE cocktail_name = '네그로니'),
 (SELECT ingredient_id FROM Ingredient WHERE ingredient_name = '오렌지 슬라이스 / 필'), '1'),

-- 맨해튼
((SELECT cocktail_id FROM Cocktail WHERE cocktail_name = '맨해튼'),
 (SELECT ingredient_id FROM Ingredient WHERE ingredient_name = '버번 위스키'), '60'),
((SELECT cocktail_id FROM Cocktail WHERE cocktail_name = '맨해튼'),
 (SELECT ingredient_id FROM Ingredient WHERE ingredient_name = '스위트 베르무트'), '30'),
((SELECT cocktail_id FROM Cocktail WHERE cocktail_name = '맨해튼'),
 (SELECT ingredient_id FROM Ingredient WHERE ingredient_name = '앙고스투라 비터스'), '2'),
((SELECT cocktail_id FROM Cocktail WHERE cocktail_name = '맨해튼'),
 (SELECT ingredient_id FROM Ingredient WHERE ingredient_name = '칵테일 체리'), '1'),

-- 모히토
((SELECT cocktail_id FROM Cocktail WHERE cocktail_name = '모히토'),
 (SELECT ingredient_id FROM Ingredient WHERE ingredient_name = '화이트 럼'), '45'),
((SELECT cocktail_id FROM Cocktail WHERE cocktail_name = '모히토'),
 (SELECT ingredient_id FROM Ingredient WHERE ingredient_name = '신선한 라임즙 / 주스'), '30'),
((SELECT cocktail_id FROM Cocktail WHERE cocktail_name = '모히토'),
 (SELECT ingredient_id FROM Ingredient WHERE ingredient_name = '심플 시럽'), '15'),
((SELECT cocktail_id FROM Cocktail WHERE cocktail_name = '모히토'),
 (SELECT ingredient_id FROM Ingredient WHERE ingredient_name = '애플민트 잎'), '10'),
((SELECT cocktail_id FROM Cocktail WHERE cocktail_name = '모히토'),
 (SELECT ingredient_id FROM Ingredient WHERE ingredient_name = '클럽 소다 / 탄산수'), '60'),
((SELECT cocktail_id FROM Cocktail WHERE cocktail_name = '모히토'),
 (SELECT ingredient_id FROM Ingredient WHERE ingredient_name = '크러시드 아이스'), '200'),

-- 피냐 콜라다
((SELECT cocktail_id FROM Cocktail WHERE cocktail_name = '피냐 콜라다'),
 (SELECT ingredient_id FROM Ingredient WHERE ingredient_name = '화이트 럼'), '45'),
((SELECT cocktail_id FROM Cocktail WHERE cocktail_name = '피냐 콜라다'),
 (SELECT ingredient_id FROM Ingredient WHERE ingredient_name = '파인애플 주스'), '90'),
((SELECT cocktail_id FROM Cocktail WHERE cocktail_name = '피냐 콜라다'),
 (SELECT ingredient_id FROM Ingredient WHERE ingredient_name = '코코넛 크림 / 시럽'), '30'),
((SELECT cocktail_id FROM Cocktail WHERE cocktail_name = '피냐 콜라다'),
 (SELECT ingredient_id FROM Ingredient WHERE ingredient_name = '크러시드 아이스'), '200'),

-- 클래식 마가리타
((SELECT cocktail_id FROM Cocktail WHERE cocktail_name = '클래식 마가리타'),
 (SELECT ingredient_id FROM Ingredient WHERE ingredient_name = '블랑코 데킬라'), '45'),
((SELECT cocktail_id FROM Cocktail WHERE cocktail_name = '클래식 마가리타'),
 (SELECT ingredient_id FROM Ingredient WHERE ingredient_name = '트리플 섹'), '15'),
((SELECT cocktail_id FROM Cocktail WHERE cocktail_name = '클래식 마가리타'),
 (SELECT ingredient_id FROM Ingredient WHERE ingredient_name = '신선한 라임즙 / 주스'), '30'),
((SELECT cocktail_id FROM Cocktail WHERE cocktail_name = '클래식 마가리타'),
 (SELECT ingredient_id FROM Ingredient WHERE ingredient_name = '정제 소금'), '1'),

-- 다이키리
((SELECT cocktail_id FROM Cocktail WHERE cocktail_name = '다이키리'),
 (SELECT ingredient_id FROM Ingredient WHERE ingredient_name = '화이트 럼'), '60'),
((SELECT cocktail_id FROM Cocktail WHERE cocktail_name = '다이키리'),
 (SELECT ingredient_id FROM Ingredient WHERE ingredient_name = '신선한 라임즙 / 주스'), '30'),
((SELECT cocktail_id FROM Cocktail WHERE cocktail_name = '다이키리'),
 (SELECT ingredient_id FROM Ingredient WHERE ingredient_name = '심플 시럽'), '15'),

-- 진 토닉
((SELECT cocktail_id FROM Cocktail WHERE cocktail_name = '진 토닉'),
 (SELECT ingredient_id FROM Ingredient WHERE ingredient_name = '드라이 진'), '45'),
((SELECT cocktail_id FROM Cocktail WHERE cocktail_name = '진 토닉'),
 (SELECT ingredient_id FROM Ingredient WHERE ingredient_name = '토닉 워터'), '150'),
((SELECT cocktail_id FROM Cocktail WHERE cocktail_name = '진 토닉'),
 (SELECT ingredient_id FROM Ingredient WHERE ingredient_name = '라임 웨지 / 슬라이스'), '1'),

-- 모스코 뮬
((SELECT cocktail_id FROM Cocktail WHERE cocktail_name = '모스코 뮬'),
 (SELECT ingredient_id FROM Ingredient WHERE ingredient_name = '보드카'), '45'),
((SELECT cocktail_id FROM Cocktail WHERE cocktail_name = '모스코 뮬'),
 (SELECT ingredient_id FROM Ingredient WHERE ingredient_name = '진저 비어'), '150'),
((SELECT cocktail_id FROM Cocktail WHERE cocktail_name = '모스코 뮬'),
 (SELECT ingredient_id FROM Ingredient WHERE ingredient_name = '신선한 라임즙 / 주스'), '15'),
((SELECT cocktail_id FROM Cocktail WHERE cocktail_name = '모스코 뮬'),
 (SELECT ingredient_id FROM Ingredient WHERE ingredient_name = '라임 웨지 / 슬라이스'), '1'),

-- 아페롤 스프리츠
((SELECT cocktail_id FROM Cocktail WHERE cocktail_name = '아페롤 스프리츠'),
 (SELECT ingredient_id FROM Ingredient WHERE ingredient_name = '아페롤'), '60'),
((SELECT cocktail_id FROM Cocktail WHERE cocktail_name = '아페롤 스프리츠'),
 (SELECT ingredient_id FROM Ingredient WHERE ingredient_name = '드라이 스파클링 와인 / 샴페인'), '90'),
((SELECT cocktail_id FROM Cocktail WHERE cocktail_name = '아페롤 스프리츠'),
 (SELECT ingredient_id FROM Ingredient WHERE ingredient_name = '클럽 소다 / 탄산수'), '30'),
((SELECT cocktail_id FROM Cocktail WHERE cocktail_name = '아페롤 스프리츠'),
 (SELECT ingredient_id FROM Ingredient WHERE ingredient_name = '오렌지 슬라이스 / 필'), '1'),

-- 화이트 러시안
((SELECT cocktail_id FROM Cocktail WHERE cocktail_name = '화이트 러시안'),
 (SELECT ingredient_id FROM Ingredient WHERE ingredient_name = '보드카'), '45'),
((SELECT cocktail_id FROM Cocktail WHERE cocktail_name = '화이트 러시안'),
 (SELECT ingredient_id FROM Ingredient WHERE ingredient_name = '커피 리큐르'), '30'),
((SELECT cocktail_id FROM Cocktail WHERE cocktail_name = '화이트 러시안'),
 (SELECT ingredient_id FROM Ingredient WHERE ingredient_name = '헤비 크림 / 생크림'), '30')

ON CONFLICT DO NOTHING;
