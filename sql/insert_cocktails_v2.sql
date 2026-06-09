-- ========================================================================
-- 칵테일 레시피 추가 데이터 v2 (11종)
-- 블루 하와이, 잉크, 말리부 선셋, 화이트 러시안(중복 무시),
-- 갓 파더, 브라운 더비, 솔티 독, 블루 레이디,
-- 블루 사파이어, 블루 일렉트릭 레모네이드, 블루 라군
-- ========================================================================

-- ── 신규 재료 추가 (파인애플 슬라이스 가니시) ───────────────────
INSERT INTO Ingredient (ingredient_name, ingredient_category_id, unit, description) VALUES
('파인애플 슬라이스 / 웨지',
 (SELECT ingredient_category_id FROM Ingredient_Category WHERE category_name = '신선한 재료'),
 '개', '블루 하와이, 피냐 콜라다 등 트로피컬 칵테일의 가니시용 파인애플 조각')
ON CONFLICT (ingredient_name) DO NOTHING;

UPDATE Ingredient SET user_id = 'admin'
WHERE ingredient_name = '파인애플 슬라이스 / 웨지' AND user_id IS NULL;


-- ========================================================================
-- 칵테일 INSERT
-- ========================================================================

INSERT INTO Cocktail (cocktail_name, category_id, user_id, recipe) VALUES

-- 트로피컬
('블루 하와이',
 (SELECT category_id FROM Cocktail_Category WHERE category_name = '트로피컬'), 'admin',
 '1. 쉐이커에 얼음을 채운다.
2. 화이트 럼, 블루 큐라소, 파인애플 주스, 레몬즙을 넣는다.
3. 힘차게 쉐이킹한다.
4. 큐브 얼음이 담긴 하이볼 글라스에 스트레인하고, 파인애플 조각과 체리로 장식한다.'),

('말리부 선셋',
 (SELECT category_id FROM Cocktail_Category WHERE category_name = '트로피컬'), 'admin',
 '1. 큐브 얼음을 가득 채운 하이볼 글라스에 코코넛 럼 리큐르를 붓는다.
2. 오렌지 주스와 파인애플 주스를 붓고 가볍게 젓는다.
3. 그레나딘 시럽을 잔 가장자리에 천천히 흘려 선셋 레이어를 만든다.
4. 파인애플 조각과 체리로 장식한다.'),

('블루 라군',
 (SELECT category_id FROM Cocktail_Category WHERE category_name = '트로피컬'), 'admin',
 '1. 쉐이커에 얼음을 채운다.
2. 보드카, 블루 큐라소, 레몬즙, 심플 시럽을 넣고 쉐이킹한다.
3. 큐브 얼음이 담긴 하이볼 글라스에 스트레인한다.
4. 클럽 소다로 채우고 레몬 슬라이스로 장식한다.'),

-- 클래식
('갓 파더',
 (SELECT category_id FROM Cocktail_Category WHERE category_name = '클래식'), 'admin',
 '1. 올드 패션드 글라스에 큰 얼음 한 조각을 넣는다.
2. 블렌디드 스카치 위스키를 붓는다.
3. 아마레또를 추가한 후 바 스푼으로 부드럽게 젓는다.
4. 별도의 가니시 없이 서빙한다.'),

-- 사워
('잉크',
 (SELECT category_id FROM Cocktail_Category WHERE category_name = '사워'), 'admin',
 '1. 쉐이커에 얼음을 채운다.
2. 보드카, 블루 큐라소, 크랜베리 주스, 레몬즙을 넣는다.
3. 힘차게 쉐이킹한다.
4. 칠드된 쿠페 글라스에 스트레인한다. 블루와 레드가 섞여 짙은 보라빛(잉크색)이 완성된다.'),

('브라운 더비',
 (SELECT category_id FROM Cocktail_Category WHERE category_name = '사워'), 'admin',
 '1. 쉐이커에 얼음을 채운다.
2. 버번 위스키, 자몽 주스, 꿀 시럽을 넣는다.
3. 힘차게 쉐이킹한다.
4. 칠드된 쿠페 글라스에 스트레인하고 자몽 슬라이스로 장식한다.'),

('블루 레이디',
 (SELECT category_id FROM Cocktail_Category WHERE category_name = '사워'), 'admin',
 '1. 쉐이커에 얼음을 채운다.
2. 드라이 진, 블루 큐라소, 레몬즙을 넣는다.
3. 힘차게 쉐이킹한다.
4. 칠드된 쿠페 글라스에 스트레인하고 레몬 슬라이스로 장식한다.'),

-- 하이볼
('솔티 독',
 (SELECT category_id FROM Cocktail_Category WHERE category_name = '하이볼'), 'admin',
 '1. 하이볼 글라스 가장자리에 소금으로 리밍한다.
2. 큐브 얼음을 채운다.
3. 보드카를 붓는다.
4. 자몽 주스로 가득 채우고 가볍게 젓는다.'),

('블루 사파이어',
 (SELECT category_id FROM Cocktail_Category WHERE category_name = '하이볼'), 'admin',
 '1. 쉐이커에 얼음을 채운다.
2. 드라이 진, 블루 큐라소, 레몬즙, 심플 시럽을 넣고 쉐이킹한다.
3. 큐브 얼음이 담긴 하이볼 글라스에 스트레인한다.
4. 토닉 워터로 채우고 레몬 슬라이스로 장식한다.'),

('블루 일렉트릭 레모네이드',
 (SELECT category_id FROM Cocktail_Category WHERE category_name = '하이볼'), 'admin',
 '1. 쉐이커에 얼음을 채운다.
2. 보드카, 블루 큐라소, 트리플 섹, 레몬즙, 심플 시럽을 넣고 쉐이킹한다.
3. 큐브 얼음이 담긴 하이볼 글라스에 스트레인한다.
4. 클럽 소다로 채우고 레몬 슬라이스로 장식한다.'),

-- 크림 (화이트 러시안은 이미 존재 — ON CONFLICT DO NOTHING 처리)
('화이트 러시안',
 (SELECT category_id FROM Cocktail_Category WHERE category_name = '크림'), 'admin',
 '1. 올드 패션드 글라스에 큐브 얼음을 넣는다.
2. 보드카와 커피 리큐르를 붓고 가볍게 섞는다.
3. 헤비 크림을 바 스푼 뒷면을 이용해 천천히 플로팅한다.')

ON CONFLICT DO NOTHING;


-- ========================================================================
-- Cocktail_Ingredient 연결
-- ========================================================================

INSERT INTO Cocktail_Ingredient (cocktail_id, ingredient_id, amount) VALUES

-- 블루 하와이
((SELECT cocktail_id FROM Cocktail WHERE cocktail_name = '블루 하와이'),
 (SELECT ingredient_id FROM Ingredient WHERE ingredient_name = '화이트 럼'), '30'),
((SELECT cocktail_id FROM Cocktail WHERE cocktail_name = '블루 하와이'),
 (SELECT ingredient_id FROM Ingredient WHERE ingredient_name = '블루 큐라소'), '15'),
((SELECT cocktail_id FROM Cocktail WHERE cocktail_name = '블루 하와이'),
 (SELECT ingredient_id FROM Ingredient WHERE ingredient_name = '파인애플 주스'), '90'),
((SELECT cocktail_id FROM Cocktail WHERE cocktail_name = '블루 하와이'),
 (SELECT ingredient_id FROM Ingredient WHERE ingredient_name = '신선한 레몬즙 / 주스'), '15'),
((SELECT cocktail_id FROM Cocktail WHERE cocktail_name = '블루 하와이'),
 (SELECT ingredient_id FROM Ingredient WHERE ingredient_name = '파인애플 슬라이스 / 웨지'), '1'),
((SELECT cocktail_id FROM Cocktail WHERE cocktail_name = '블루 하와이'),
 (SELECT ingredient_id FROM Ingredient WHERE ingredient_name = '칵테일 체리'), '1'),

-- 말리부 선셋
((SELECT cocktail_id FROM Cocktail WHERE cocktail_name = '말리부 선셋'),
 (SELECT ingredient_id FROM Ingredient WHERE ingredient_name = '코코넛 럼 리큐르'), '45'),
((SELECT cocktail_id FROM Cocktail WHERE cocktail_name = '말리부 선셋'),
 (SELECT ingredient_id FROM Ingredient WHERE ingredient_name = '파인애플 주스'), '90'),
((SELECT cocktail_id FROM Cocktail WHERE cocktail_name = '말리부 선셋'),
 (SELECT ingredient_id FROM Ingredient WHERE ingredient_name = '오렌지 주스'), '30'),
((SELECT cocktail_id FROM Cocktail WHERE cocktail_name = '말리부 선셋'),
 (SELECT ingredient_id FROM Ingredient WHERE ingredient_name = '그레나딘 시럽'), '15'),
((SELECT cocktail_id FROM Cocktail WHERE cocktail_name = '말리부 선셋'),
 (SELECT ingredient_id FROM Ingredient WHERE ingredient_name = '파인애플 슬라이스 / 웨지'), '1'),
((SELECT cocktail_id FROM Cocktail WHERE cocktail_name = '말리부 선셋'),
 (SELECT ingredient_id FROM Ingredient WHERE ingredient_name = '칵테일 체리'), '1'),

-- 블루 라군
((SELECT cocktail_id FROM Cocktail WHERE cocktail_name = '블루 라군'),
 (SELECT ingredient_id FROM Ingredient WHERE ingredient_name = '보드카'), '45'),
((SELECT cocktail_id FROM Cocktail WHERE cocktail_name = '블루 라군'),
 (SELECT ingredient_id FROM Ingredient WHERE ingredient_name = '블루 큐라소'), '45'),
((SELECT cocktail_id FROM Cocktail WHERE cocktail_name = '블루 라군'),
 (SELECT ingredient_id FROM Ingredient WHERE ingredient_name = '신선한 레몬즙 / 주스'), '15'),
((SELECT cocktail_id FROM Cocktail WHERE cocktail_name = '블루 라군'),
 (SELECT ingredient_id FROM Ingredient WHERE ingredient_name = '심플 시럽'), '10'),
((SELECT cocktail_id FROM Cocktail WHERE cocktail_name = '블루 라군'),
 (SELECT ingredient_id FROM Ingredient WHERE ingredient_name = '클럽 소다 / 탄산수'), '60'),
((SELECT cocktail_id FROM Cocktail WHERE cocktail_name = '블루 라군'),
 (SELECT ingredient_id FROM Ingredient WHERE ingredient_name = '레몬 필 / 슬라이스'), '1'),

-- 갓 파더
((SELECT cocktail_id FROM Cocktail WHERE cocktail_name = '갓 파더'),
 (SELECT ingredient_id FROM Ingredient WHERE ingredient_name = '블렌디드 스카치 위스키'), '45'),
((SELECT cocktail_id FROM Cocktail WHERE cocktail_name = '갓 파더'),
 (SELECT ingredient_id FROM Ingredient WHERE ingredient_name = '아마레또'), '15'),

-- 잉크
((SELECT cocktail_id FROM Cocktail WHERE cocktail_name = '잉크'),
 (SELECT ingredient_id FROM Ingredient WHERE ingredient_name = '보드카'), '30'),
((SELECT cocktail_id FROM Cocktail WHERE cocktail_name = '잉크'),
 (SELECT ingredient_id FROM Ingredient WHERE ingredient_name = '블루 큐라소'), '30'),
((SELECT cocktail_id FROM Cocktail WHERE cocktail_name = '잉크'),
 (SELECT ingredient_id FROM Ingredient WHERE ingredient_name = '크랜베리 주스'), '30'),
((SELECT cocktail_id FROM Cocktail WHERE cocktail_name = '잉크'),
 (SELECT ingredient_id FROM Ingredient WHERE ingredient_name = '신선한 레몬즙 / 주스'), '10'),

-- 브라운 더비
((SELECT cocktail_id FROM Cocktail WHERE cocktail_name = '브라운 더비'),
 (SELECT ingredient_id FROM Ingredient WHERE ingredient_name = '버번 위스키'), '45'),
((SELECT cocktail_id FROM Cocktail WHERE cocktail_name = '브라운 더비'),
 (SELECT ingredient_id FROM Ingredient WHERE ingredient_name = '자몽 주스'), '22'),
((SELECT cocktail_id FROM Cocktail WHERE cocktail_name = '브라운 더비'),
 (SELECT ingredient_id FROM Ingredient WHERE ingredient_name = '벌꿀 / 꿀 시럽'), '15'),

-- 블루 레이디
((SELECT cocktail_id FROM Cocktail WHERE cocktail_name = '블루 레이디'),
 (SELECT ingredient_id FROM Ingredient WHERE ingredient_name = '드라이 진'), '30'),
((SELECT cocktail_id FROM Cocktail WHERE cocktail_name = '블루 레이디'),
 (SELECT ingredient_id FROM Ingredient WHERE ingredient_name = '블루 큐라소'), '15'),
((SELECT cocktail_id FROM Cocktail WHERE cocktail_name = '블루 레이디'),
 (SELECT ingredient_id FROM Ingredient WHERE ingredient_name = '신선한 레몬즙 / 주스'), '15'),
((SELECT cocktail_id FROM Cocktail WHERE cocktail_name = '블루 레이디'),
 (SELECT ingredient_id FROM Ingredient WHERE ingredient_name = '레몬 필 / 슬라이스'), '1'),

-- 솔티 독
((SELECT cocktail_id FROM Cocktail WHERE cocktail_name = '솔티 독'),
 (SELECT ingredient_id FROM Ingredient WHERE ingredient_name = '보드카'), '45'),
((SELECT cocktail_id FROM Cocktail WHERE cocktail_name = '솔티 독'),
 (SELECT ingredient_id FROM Ingredient WHERE ingredient_name = '자몽 주스'), '150'),
((SELECT cocktail_id FROM Cocktail WHERE cocktail_name = '솔티 독'),
 (SELECT ingredient_id FROM Ingredient WHERE ingredient_name = '정제 소금'), '1'),

-- 블루 사파이어
((SELECT cocktail_id FROM Cocktail WHERE cocktail_name = '블루 사파이어'),
 (SELECT ingredient_id FROM Ingredient WHERE ingredient_name = '드라이 진'), '45'),
((SELECT cocktail_id FROM Cocktail WHERE cocktail_name = '블루 사파이어'),
 (SELECT ingredient_id FROM Ingredient WHERE ingredient_name = '블루 큐라소'), '20'),
((SELECT cocktail_id FROM Cocktail WHERE cocktail_name = '블루 사파이어'),
 (SELECT ingredient_id FROM Ingredient WHERE ingredient_name = '신선한 레몬즙 / 주스'), '15'),
((SELECT cocktail_id FROM Cocktail WHERE cocktail_name = '블루 사파이어'),
 (SELECT ingredient_id FROM Ingredient WHERE ingredient_name = '심플 시럽'), '10'),
((SELECT cocktail_id FROM Cocktail WHERE cocktail_name = '블루 사파이어'),
 (SELECT ingredient_id FROM Ingredient WHERE ingredient_name = '토닉 워터'), '90'),
((SELECT cocktail_id FROM Cocktail WHERE cocktail_name = '블루 사파이어'),
 (SELECT ingredient_id FROM Ingredient WHERE ingredient_name = '레몬 필 / 슬라이스'), '1'),

-- 블루 일렉트릭 레모네이드
((SELECT cocktail_id FROM Cocktail WHERE cocktail_name = '블루 일렉트릭 레모네이드'),
 (SELECT ingredient_id FROM Ingredient WHERE ingredient_name = '보드카'), '30'),
((SELECT cocktail_id FROM Cocktail WHERE cocktail_name = '블루 일렉트릭 레모네이드'),
 (SELECT ingredient_id FROM Ingredient WHERE ingredient_name = '블루 큐라소'), '30'),
((SELECT cocktail_id FROM Cocktail WHERE cocktail_name = '블루 일렉트릭 레모네이드'),
 (SELECT ingredient_id FROM Ingredient WHERE ingredient_name = '트리플 섹'), '15'),
((SELECT cocktail_id FROM Cocktail WHERE cocktail_name = '블루 일렉트릭 레모네이드'),
 (SELECT ingredient_id FROM Ingredient WHERE ingredient_name = '신선한 레몬즙 / 주스'), '30'),
((SELECT cocktail_id FROM Cocktail WHERE cocktail_name = '블루 일렉트릭 레모네이드'),
 (SELECT ingredient_id FROM Ingredient WHERE ingredient_name = '심플 시럽'), '15'),
((SELECT cocktail_id FROM Cocktail WHERE cocktail_name = '블루 일렉트릭 레모네이드'),
 (SELECT ingredient_id FROM Ingredient WHERE ingredient_name = '클럽 소다 / 탄산수'), '90'),
((SELECT cocktail_id FROM Cocktail WHERE cocktail_name = '블루 일렉트릭 레모네이드'),
 (SELECT ingredient_id FROM Ingredient WHERE ingredient_name = '레몬 필 / 슬라이스'), '1'),

-- 화이트 러시안 (이미 존재할 경우 Cocktail_Ingredient도 ON CONFLICT로 무시됨)
((SELECT cocktail_id FROM Cocktail WHERE cocktail_name = '화이트 러시안'),
 (SELECT ingredient_id FROM Ingredient WHERE ingredient_name = '보드카'), '45'),
((SELECT cocktail_id FROM Cocktail WHERE cocktail_name = '화이트 러시안'),
 (SELECT ingredient_id FROM Ingredient WHERE ingredient_name = '커피 리큐르'), '30'),
((SELECT cocktail_id FROM Cocktail WHERE cocktail_name = '화이트 러시안'),
 (SELECT ingredient_id FROM Ingredient WHERE ingredient_name = '헤비 크림 / 생크림'), '30')

ON CONFLICT DO NOTHING;
