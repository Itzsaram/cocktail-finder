-- ========================================================================
-- 칵테일 레시피 추가 데이터 v3 (20종)
-- 사이드카, 사제락, 에스프레소 마티니, 마이타이, 좀비,
-- 섹스 온 더 비치, 위스키 사워, 아마레또 사워, 짐렛,
-- 미도리 사워, 코스모폴리탄, 쿠바 리브레, 스크루드라이버,
-- 테킬라 선라이즈, 롱 아일랜드 아이스티, 블랙 러시안,
-- 아이리시 커피, 블러디 메리, 미모사, 벨리니
-- ========================================================================

-- ── 신규 재료 추가 ──────────────────────────────────────────────

INSERT INTO Ingredient (ingredient_name, ingredient_category_id, unit, description) VALUES

-- 주류
('압생트',
 (SELECT ingredient_category_id FROM Ingredient_Category WHERE category_name = '주류'),
 'ml', '허브를 침출한 높은 도수의 아니스 향 증류주. 사제락 린싱 및 플로팅용'),

-- 시럽
('오르쟈 시럽 / 아몬드 시럽',
 (SELECT ingredient_category_id FROM Ingredient_Category WHERE category_name = '시럽'),
 'ml', '아몬드와 오렌지 꽃 향의 달콤한 시럽. 마이타이 등 트로피컬 칵테일 핵심 재료'),

-- 기타
('에스프레소 / 진한 커피',
 (SELECT ingredient_category_id FROM Ingredient_Category WHERE category_name = '기타'),
 'ml', '갓 추출한 에스프레소 또는 진하게 내린 커피. 에스프레소 마티니·아이리시 커피용')

ON CONFLICT (ingredient_name) DO NOTHING;

UPDATE Ingredient SET user_id = 'admin'
WHERE ingredient_name IN ('압생트', '오르쟈 시럽 / 아몬드 시럽', '에스프레소 / 진한 커피')
  AND user_id IS NULL;


-- ========================================================================
-- 칵테일 INSERT
-- ========================================================================

INSERT INTO Cocktail (cocktail_name, category_id, user_id, recipe) VALUES

-- ── 클래식 ─────────────────────────────────────────────────────

('사이드카',
 (SELECT category_id FROM Cocktail_Category WHERE category_name = '클래식'), 'admin',
 '1. 잔 가장자리에 설탕으로 리밍한다.
2. 쉐이커에 얼음을 채운다.
3. 코냑, 트리플 섹, 레몬즙을 넣고 세차게 쉐이킹한다.
4. 칠드된 쿠페 글라스에 스트레인하고 레몬 필로 장식한다.'),

('사제락',
 (SELECT category_id FROM Cocktail_Category WHERE category_name = '클래식'), 'admin',
 '1. 올드 패션드 글라스에 압생트를 소량 붓고 잔 내벽을 코팅한 뒤 여분은 버린다.
2. 믹싱 글라스에 설탕, 비터스를 넣고 약간의 물과 머들링한다.
3. 버번 위스키와 얼음을 넣어 30회 저어 차갑게 만든다.
4. 압생트로 코팅된 잔에 얼음 없이 스트레인하고 레몬 필로 장식한다.'),

('에스프레소 마티니',
 (SELECT category_id FROM Cocktail_Category WHERE category_name = '클래식'), 'admin',
 '1. 에스프레소를 추출하고 잠깐 식힌다.
2. 쉐이커에 얼음을 채운다.
3. 보드카, 커피 리큐르, 에스프레소, 심플 시럽을 넣는다.
4. 크리미한 거품이 생기도록 힘차게 20초간 쉐이킹한다.
5. 칠드된 쿠페 글라스에 스트레인하고 커피 원두 3알로 장식한다.'),

('블랙 러시안',
 (SELECT category_id FROM Cocktail_Category WHERE category_name = '클래식'), 'admin',
 '1. 올드 패션드 글라스에 큐브 얼음을 넣는다.
2. 보드카를 붓는다.
3. 커피 리큐르를 추가하고 바 스푼으로 가볍게 젓는다.
4. 별도의 가니시 없이 서빙한다.'),

-- ── 트로피컬 ────────────────────────────────────────────────────

('마이타이',
 (SELECT category_id FROM Cocktail_Category WHERE category_name = '트로피컬'), 'admin',
 '1. 쉐이커에 얼음을 채운다.
2. 화이트 럼, 다크 럼, 트리플 섹, 라임즙, 오르쟈 시럽을 넣는다.
3. 힘차게 쉐이킹한다.
4. 크러시드 아이스를 채운 로우볼 글라스에 스트레인하고 민트 가지와 라임 웨지로 장식한다.'),

('좀비',
 (SELECT category_id FROM Cocktail_Category WHERE category_name = '트로피컬'), 'admin',
 '1. 블렌더 또는 쉐이커에 얼음을 넣는다.
2. 화이트 럼, 다크 럼, 파인애플 주스, 라임즙, 그레나딘 시럽을 넣고 믹스한다.
3. 크러시드 아이스를 채운 허리케인 글라스에 붓는다.
4. 오버프루프 럼을 위에 플로팅하고 체리와 파인애플 조각으로 장식한다.'),

('섹스 온 더 비치',
 (SELECT category_id FROM Cocktail_Category WHERE category_name = '트로피컬'), 'admin',
 '1. 하이볼 글라스에 큐브 얼음을 채운다.
2. 보드카와 피치 슈냅스를 붓는다.
3. 오렌지 주스와 크랜베리 주스를 넣고 가볍게 젓는다.
4. 오렌지 슬라이스와 체리로 장식한다.'),

('미모사',
 (SELECT category_id FROM Cocktail_Category WHERE category_name = '트로피컬'), 'admin',
 '1. 샴페인 플루트 글라스를 냉장고에서 차갑게 준비한다.
2. 오렌지 주스를 먼저 절반까지 채운다.
3. 스파클링 와인을 조심스럽게 위에서 채운다.
4. 젓지 않고 오렌지 슬라이스로 장식한다.'),

('벨리니',
 (SELECT category_id FROM Cocktail_Category WHERE category_name = '트로피컬'), 'admin',
 '1. 샴페인 플루트 글라스를 냉장고에서 차갑게 준비한다.
2. 피치 슈냅스를 먼저 넣는다.
3. 차가운 스파클링 와인을 조심스럽게 위에서 채운다.
4. 가볍게 한 번 젓고 서빙한다.'),

-- ── 사워 ────────────────────────────────────────────────────────

('위스키 사워',
 (SELECT category_id FROM Cocktail_Category WHERE category_name = '사워'), 'admin',
 '1. 쉐이커에 달걀 흰자를 넣고 얼음 없이 드라이 쉐이킹을 15초간 한다.
2. 얼음을 추가하고 버번, 레몬즙, 심플 시럽을 넣어 다시 힘차게 쉐이킹한다.
3. 큐브 얼음이 담긴 올드 패션드 글라스에 스트레인한다.
4. 앙고스투라 비터스를 거품 위에 몇 방울 뿌리고 체리로 장식한다.'),

('아마레또 사워',
 (SELECT category_id FROM Cocktail_Category WHERE category_name = '사워'), 'admin',
 '1. 쉐이커에 달걀 흰자를 넣고 얼음 없이 드라이 쉐이킹을 15초간 한다.
2. 얼음을 추가하고 아마레또, 레몬즙, 심플 시럽을 넣어 다시 힘차게 쉐이킹한다.
3. 큐브 얼음이 담긴 올드 패션드 글라스에 스트레인한다.
4. 거품 위에 칵테일 체리를 올리고 레몬 슬라이스로 장식한다.'),

('김렛',
 (SELECT category_id FROM Cocktail_Category WHERE category_name = '사워'), 'admin',
 '1. 쉐이커에 얼음을 채운다.
2. 드라이 진, 라임즙, 심플 시럽을 넣는다.
3. 힘차게 쉐이킹한다.
4. 칠드된 쿠페 글라스에 스트레인하고 라임 웨지로 장식한다.'),

('미도리 사워',
 (SELECT category_id FROM Cocktail_Category WHERE category_name = '사워'), 'admin',
 '1. 쉐이커에 얼음을 채운다.
2. 멜론 리큐르, 레몬즙, 심플 시럽을 넣고 쉐이킹한다.
3. 큐브 얼음이 담긴 올드 패션드 글라스에 스트레인한다.
4. 클럽 소다를 조금 붓고 레몬 슬라이스로 장식한다.'),

('코스모폴리탄',
 (SELECT category_id FROM Cocktail_Category WHERE category_name = '사워'), 'admin',
 '1. 쉐이커에 얼음을 채운다.
2. 보드카, 트리플 섹, 크랜베리 주스, 라임즙을 넣는다.
3. 힘차게 쉐이킹한다.
4. 칠드된 마티니 글라스에 스트레인하고 오렌지 필로 장식한다.'),

-- ── 하이볼 ─────────────────────────────────────────────────────

('쿠바 리브레',
 (SELECT category_id FROM Cocktail_Category WHERE category_name = '하이볼'), 'admin',
 '1. 하이볼 글라스에 큐브 얼음을 가득 채운다.
2. 라임즙을 넣는다.
3. 화이트 럼을 붓는다.
4. 차가운 콜라로 채우고 가볍게 젓는다. 라임 웨지로 장식한다.'),

('스크루드라이버',
 (SELECT category_id FROM Cocktail_Category WHERE category_name = '하이볼'), 'admin',
 '1. 하이볼 글라스에 큐브 얼음을 채운다.
2. 보드카를 붓는다.
3. 오렌지 주스로 가득 채우고 가볍게 젓는다.
4. 오렌지 슬라이스로 장식한다.'),

('테킬라 선라이즈',
 (SELECT category_id FROM Cocktail_Category WHERE category_name = '하이볼'), 'admin',
 '1. 하이볼 글라스에 큐브 얼음을 채운다.
2. 블랑코 데킬라와 오렌지 주스를 붓고 가볍게 젓는다.
3. 그레나딘 시럽을 잔 바닥에 천천히 흘려 선라이즈 효과를 만든다. 젓지 않는다.
4. 오렌지 슬라이스와 칵테일 체리로 장식한다.'),

('롱 아일랜드 아이스티',
 (SELECT category_id FROM Cocktail_Category WHERE category_name = '하이볼'), 'admin',
 '1. 쉐이커에 얼음을 채운다.
2. 보드카, 드라이 진, 화이트 럼, 블랑코 데킬라, 트리플 섹, 레몬즙, 심플 시럽을 모두 넣는다.
3. 가볍게 쉐이킹한 뒤 큐브 얼음을 채운 하이볼 글라스에 스트레인한다.
4. 콜라를 조금 넣어 홍차 색을 내고 레몬 슬라이스로 장식한다.'),

('블러디 메리',
 (SELECT category_id FROM Cocktail_Category WHERE category_name = '하이볼'), 'admin',
 '1. 하이볼 글라스 가장자리에 소금과 레몬으로 리밍한다.
2. 큐브 얼음을 채운다.
3. 보드카, 토마토 주스, 레몬즙을 붓고 비터스를 넣는다.
4. 바 스푼으로 위아래로 부드럽게 젓고, 레몬 슬라이스로 장식한다.'),

-- ── 크림 ────────────────────────────────────────────────────────

('아이리시 커피',
 (SELECT category_id FROM Cocktail_Category WHERE category_name = '크림'), 'admin',
 '1. 아이리시 커피 잔(또는 내열 글라스)을 뜨거운 물로 예열한다.
2. 꿀 시럽을 넣고 뜨겁게 내린 에스프레소를 붓는다.
3. 아이리시 위스키를 넣고 잘 녹도록 젓는다.
4. 차가운 헤비 크림을 바 스푼 뒷면으로 천천히 플로팅한다. 크림을 휘젓지 않고 크림 위로 마신다.')

ON CONFLICT DO NOTHING;


-- ========================================================================
-- Cocktail_Ingredient 연결
-- ========================================================================

INSERT INTO Cocktail_Ingredient (cocktail_id, ingredient_id, amount) VALUES

-- ── 사이드카 ─────────────────────────────────────────────────
((SELECT cocktail_id FROM Cocktail WHERE cocktail_name = '사이드카'),
 (SELECT ingredient_id FROM Ingredient WHERE ingredient_name = '코냑 / 브랜디'), '45'),
((SELECT cocktail_id FROM Cocktail WHERE cocktail_name = '사이드카'),
 (SELECT ingredient_id FROM Ingredient WHERE ingredient_name = '트리플 섹'), '22'),
((SELECT cocktail_id FROM Cocktail WHERE cocktail_name = '사이드카'),
 (SELECT ingredient_id FROM Ingredient WHERE ingredient_name = '신선한 레몬즙 / 주스'), '22'),
((SELECT cocktail_id FROM Cocktail WHERE cocktail_name = '사이드카'),
 (SELECT ingredient_id FROM Ingredient WHERE ingredient_name = '레몬 필 / 슬라이스'), '1'),

-- ── 사제락 ──────────────────────────────────────────────────
((SELECT cocktail_id FROM Cocktail WHERE cocktail_name = '사제락'),
 (SELECT ingredient_id FROM Ingredient WHERE ingredient_name = '버번 위스키'), '60'),
((SELECT cocktail_id FROM Cocktail WHERE cocktail_name = '사제락'),
 (SELECT ingredient_id FROM Ingredient WHERE ingredient_name = '압생트'), '5'),
((SELECT cocktail_id FROM Cocktail WHERE cocktail_name = '사제락'),
 (SELECT ingredient_id FROM Ingredient WHERE ingredient_name = '앙고스투라 비터스'), '2'),
((SELECT cocktail_id FROM Cocktail WHERE cocktail_name = '사제락'),
 (SELECT ingredient_id FROM Ingredient WHERE ingredient_name = '백설탕 / 황설탕'), '1'),
((SELECT cocktail_id FROM Cocktail WHERE cocktail_name = '사제락'),
 (SELECT ingredient_id FROM Ingredient WHERE ingredient_name = '레몬 필 / 슬라이스'), '1'),

-- ── 에스프레소 마티니 ────────────────────────────────────────
((SELECT cocktail_id FROM Cocktail WHERE cocktail_name = '에스프레소 마티니'),
 (SELECT ingredient_id FROM Ingredient WHERE ingredient_name = '보드카'), '45'),
((SELECT cocktail_id FROM Cocktail WHERE cocktail_name = '에스프레소 마티니'),
 (SELECT ingredient_id FROM Ingredient WHERE ingredient_name = '커피 리큐르'), '15'),
((SELECT cocktail_id FROM Cocktail WHERE cocktail_name = '에스프레소 마티니'),
 (SELECT ingredient_id FROM Ingredient WHERE ingredient_name = '에스프레소 / 진한 커피'), '30'),
((SELECT cocktail_id FROM Cocktail WHERE cocktail_name = '에스프레소 마티니'),
 (SELECT ingredient_id FROM Ingredient WHERE ingredient_name = '심플 시럽'), '10'),

-- ── 블랙 러시안 ─────────────────────────────────────────────
((SELECT cocktail_id FROM Cocktail WHERE cocktail_name = '블랙 러시안'),
 (SELECT ingredient_id FROM Ingredient WHERE ingredient_name = '보드카'), '50'),
((SELECT cocktail_id FROM Cocktail WHERE cocktail_name = '블랙 러시안'),
 (SELECT ingredient_id FROM Ingredient WHERE ingredient_name = '커피 리큐르'), '20'),

-- ── 마이타이 ────────────────────────────────────────────────
((SELECT cocktail_id FROM Cocktail WHERE cocktail_name = '마이타이'),
 (SELECT ingredient_id FROM Ingredient WHERE ingredient_name = '화이트 럼'), '30'),
((SELECT cocktail_id FROM Cocktail WHERE cocktail_name = '마이타이'),
 (SELECT ingredient_id FROM Ingredient WHERE ingredient_name = '다크 럼'), '30'),
((SELECT cocktail_id FROM Cocktail WHERE cocktail_name = '마이타이'),
 (SELECT ingredient_id FROM Ingredient WHERE ingredient_name = '트리플 섹'), '15'),
((SELECT cocktail_id FROM Cocktail WHERE cocktail_name = '마이타이'),
 (SELECT ingredient_id FROM Ingredient WHERE ingredient_name = '신선한 라임즙 / 주스'), '30'),
((SELECT cocktail_id FROM Cocktail WHERE cocktail_name = '마이타이'),
 (SELECT ingredient_id FROM Ingredient WHERE ingredient_name = '오르쟈 시럽 / 아몬드 시럽'), '15'),
((SELECT cocktail_id FROM Cocktail WHERE cocktail_name = '마이타이'),
 (SELECT ingredient_id FROM Ingredient WHERE ingredient_name = '칵테일 체리'), '1'),
((SELECT cocktail_id FROM Cocktail WHERE cocktail_name = '마이타이'),
 (SELECT ingredient_id FROM Ingredient WHERE ingredient_name = '애플민트 잎'), '2'),

-- ── 좀비 ────────────────────────────────────────────────────
((SELECT cocktail_id FROM Cocktail WHERE cocktail_name = '좀비'),
 (SELECT ingredient_id FROM Ingredient WHERE ingredient_name = '화이트 럼'), '30'),
((SELECT cocktail_id FROM Cocktail WHERE cocktail_name = '좀비'),
 (SELECT ingredient_id FROM Ingredient WHERE ingredient_name = '다크 럼'), '30'),
((SELECT cocktail_id FROM Cocktail WHERE cocktail_name = '좀비'),
 (SELECT ingredient_id FROM Ingredient WHERE ingredient_name = '오버프루프 럼'), '15'),
((SELECT cocktail_id FROM Cocktail WHERE cocktail_name = '좀비'),
 (SELECT ingredient_id FROM Ingredient WHERE ingredient_name = '파인애플 주스'), '45'),
((SELECT cocktail_id FROM Cocktail WHERE cocktail_name = '좀비'),
 (SELECT ingredient_id FROM Ingredient WHERE ingredient_name = '신선한 라임즙 / 주스'), '15'),
((SELECT cocktail_id FROM Cocktail WHERE cocktail_name = '좀비'),
 (SELECT ingredient_id FROM Ingredient WHERE ingredient_name = '그레나딘 시럽'), '15'),
((SELECT cocktail_id FROM Cocktail WHERE cocktail_name = '좀비'),
 (SELECT ingredient_id FROM Ingredient WHERE ingredient_name = '칵테일 체리'), '1'),
((SELECT cocktail_id FROM Cocktail WHERE cocktail_name = '좀비'),
 (SELECT ingredient_id FROM Ingredient WHERE ingredient_name = '파인애플 슬라이스 / 웨지'), '1'),

-- ── 섹스 온 더 비치 ──────────────────────────────────────────
((SELECT cocktail_id FROM Cocktail WHERE cocktail_name = '섹스 온 더 비치'),
 (SELECT ingredient_id FROM Ingredient WHERE ingredient_name = '보드카'), '45'),
((SELECT cocktail_id FROM Cocktail WHERE cocktail_name = '섹스 온 더 비치'),
 (SELECT ingredient_id FROM Ingredient WHERE ingredient_name = '피치 슈냅스 / 리큐르'), '30'),
((SELECT cocktail_id FROM Cocktail WHERE cocktail_name = '섹스 온 더 비치'),
 (SELECT ingredient_id FROM Ingredient WHERE ingredient_name = '오렌지 주스'), '60'),
((SELECT cocktail_id FROM Cocktail WHERE cocktail_name = '섹스 온 더 비치'),
 (SELECT ingredient_id FROM Ingredient WHERE ingredient_name = '크랜베리 주스'), '60'),
((SELECT cocktail_id FROM Cocktail WHERE cocktail_name = '섹스 온 더 비치'),
 (SELECT ingredient_id FROM Ingredient WHERE ingredient_name = '오렌지 슬라이스 / 필'), '1'),
((SELECT cocktail_id FROM Cocktail WHERE cocktail_name = '섹스 온 더 비치'),
 (SELECT ingredient_id FROM Ingredient WHERE ingredient_name = '칵테일 체리'), '1'),

-- ── 미모사 ──────────────────────────────────────────────────
((SELECT cocktail_id FROM Cocktail WHERE cocktail_name = '미모사'),
 (SELECT ingredient_id FROM Ingredient WHERE ingredient_name = '드라이 스파클링 와인 / 샴페인'), '90'),
((SELECT cocktail_id FROM Cocktail WHERE cocktail_name = '미모사'),
 (SELECT ingredient_id FROM Ingredient WHERE ingredient_name = '오렌지 주스'), '90'),
((SELECT cocktail_id FROM Cocktail WHERE cocktail_name = '미모사'),
 (SELECT ingredient_id FROM Ingredient WHERE ingredient_name = '오렌지 슬라이스 / 필'), '1'),

-- ── 벨리니 ──────────────────────────────────────────────────
((SELECT cocktail_id FROM Cocktail WHERE cocktail_name = '벨리니'),
 (SELECT ingredient_id FROM Ingredient WHERE ingredient_name = '드라이 스파클링 와인 / 샴페인'), '90'),
((SELECT cocktail_id FROM Cocktail WHERE cocktail_name = '벨리니'),
 (SELECT ingredient_id FROM Ingredient WHERE ingredient_name = '피치 슈냅스 / 리큐르'), '30'),

-- ── 위스키 사워 ─────────────────────────────────────────────
((SELECT cocktail_id FROM Cocktail WHERE cocktail_name = '위스키 사워'),
 (SELECT ingredient_id FROM Ingredient WHERE ingredient_name = '버번 위스키'), '60'),
((SELECT cocktail_id FROM Cocktail WHERE cocktail_name = '위스키 사워'),
 (SELECT ingredient_id FROM Ingredient WHERE ingredient_name = '신선한 레몬즙 / 주스'), '30'),
((SELECT cocktail_id FROM Cocktail WHERE cocktail_name = '위스키 사워'),
 (SELECT ingredient_id FROM Ingredient WHERE ingredient_name = '심플 시럽'), '15'),
((SELECT cocktail_id FROM Cocktail WHERE cocktail_name = '위스키 사워'),
 (SELECT ingredient_id FROM Ingredient WHERE ingredient_name = '달걀 흰자'), '1'),
((SELECT cocktail_id FROM Cocktail WHERE cocktail_name = '위스키 사워'),
 (SELECT ingredient_id FROM Ingredient WHERE ingredient_name = '앙고스투라 비터스'), '1'),
((SELECT cocktail_id FROM Cocktail WHERE cocktail_name = '위스키 사워'),
 (SELECT ingredient_id FROM Ingredient WHERE ingredient_name = '칵테일 체리'), '1'),

-- ── 아마레또 사워 ────────────────────────────────────────────
((SELECT cocktail_id FROM Cocktail WHERE cocktail_name = '아마레또 사워'),
 (SELECT ingredient_id FROM Ingredient WHERE ingredient_name = '아마레또'), '45'),
((SELECT cocktail_id FROM Cocktail WHERE cocktail_name = '아마레또 사워'),
 (SELECT ingredient_id FROM Ingredient WHERE ingredient_name = '신선한 레몬즙 / 주스'), '30'),
((SELECT cocktail_id FROM Cocktail WHERE cocktail_name = '아마레또 사워'),
 (SELECT ingredient_id FROM Ingredient WHERE ingredient_name = '심플 시럽'), '15'),
((SELECT cocktail_id FROM Cocktail WHERE cocktail_name = '아마레또 사워'),
 (SELECT ingredient_id FROM Ingredient WHERE ingredient_name = '달걀 흰자'), '1'),
((SELECT cocktail_id FROM Cocktail WHERE cocktail_name = '아마레또 사워'),
 (SELECT ingredient_id FROM Ingredient WHERE ingredient_name = '칵테일 체리'), '1'),

-- ── 짐렛 ────────────────────────────────────────────────────
((SELECT cocktail_id FROM Cocktail WHERE cocktail_name = '김렛'),
 (SELECT ingredient_id FROM Ingredient WHERE ingredient_name = '드라이 진'), '60'),
((SELECT cocktail_id FROM Cocktail WHERE cocktail_name = '김렛'),
 (SELECT ingredient_id FROM Ingredient WHERE ingredient_name = '신선한 라임즙 / 주스'), '22'),
((SELECT cocktail_id FROM Cocktail WHERE cocktail_name = '김렛'),
 (SELECT ingredient_id FROM Ingredient WHERE ingredient_name = '심플 시럽'), '15'),
((SELECT cocktail_id FROM Cocktail WHERE cocktail_name = '김렛'),
 (SELECT ingredient_id FROM Ingredient WHERE ingredient_name = '라임 웨지 / 슬라이스'), '1'),

-- ── 미도리 사워 ─────────────────────────────────────────────
((SELECT cocktail_id FROM Cocktail WHERE cocktail_name = '미도리 사워'),
 (SELECT ingredient_id FROM Ingredient WHERE ingredient_name = '멜론 리큐르'), '30'),
((SELECT cocktail_id FROM Cocktail WHERE cocktail_name = '미도리 사워'),
 (SELECT ingredient_id FROM Ingredient WHERE ingredient_name = '신선한 레몬즙 / 주스'), '30'),
((SELECT cocktail_id FROM Cocktail WHERE cocktail_name = '미도리 사워'),
 (SELECT ingredient_id FROM Ingredient WHERE ingredient_name = '심플 시럽'), '15'),
((SELECT cocktail_id FROM Cocktail WHERE cocktail_name = '미도리 사워'),
 (SELECT ingredient_id FROM Ingredient WHERE ingredient_name = '클럽 소다 / 탄산수'), '30'),
((SELECT cocktail_id FROM Cocktail WHERE cocktail_name = '미도리 사워'),
 (SELECT ingredient_id FROM Ingredient WHERE ingredient_name = '레몬 필 / 슬라이스'), '1'),

-- ── 코스모폴리탄 ────────────────────────────────────────────
((SELECT cocktail_id FROM Cocktail WHERE cocktail_name = '코스모폴리탄'),
 (SELECT ingredient_id FROM Ingredient WHERE ingredient_name = '보드카'), '40'),
((SELECT cocktail_id FROM Cocktail WHERE cocktail_name = '코스모폴리탄'),
 (SELECT ingredient_id FROM Ingredient WHERE ingredient_name = '트리플 섹'), '15'),
((SELECT cocktail_id FROM Cocktail WHERE cocktail_name = '코스모폴리탄'),
 (SELECT ingredient_id FROM Ingredient WHERE ingredient_name = '크랜베리 주스'), '30'),
((SELECT cocktail_id FROM Cocktail WHERE cocktail_name = '코스모폴리탄'),
 (SELECT ingredient_id FROM Ingredient WHERE ingredient_name = '신선한 라임즙 / 주스'), '10'),
((SELECT cocktail_id FROM Cocktail WHERE cocktail_name = '코스모폴리탄'),
 (SELECT ingredient_id FROM Ingredient WHERE ingredient_name = '오렌지 슬라이스 / 필'), '1'),

-- ── 쿠바 리브레 ─────────────────────────────────────────────
((SELECT cocktail_id FROM Cocktail WHERE cocktail_name = '쿠바 리브레'),
 (SELECT ingredient_id FROM Ingredient WHERE ingredient_name = '화이트 럼'), '45'),
((SELECT cocktail_id FROM Cocktail WHERE cocktail_name = '쿠바 리브레'),
 (SELECT ingredient_id FROM Ingredient WHERE ingredient_name = '콜라'), '150'),
((SELECT cocktail_id FROM Cocktail WHERE cocktail_name = '쿠바 리브레'),
 (SELECT ingredient_id FROM Ingredient WHERE ingredient_name = '신선한 라임즙 / 주스'), '15'),
((SELECT cocktail_id FROM Cocktail WHERE cocktail_name = '쿠바 리브레'),
 (SELECT ingredient_id FROM Ingredient WHERE ingredient_name = '라임 웨지 / 슬라이스'), '1'),

-- ── 스크루드라이버 ──────────────────────────────────────────
((SELECT cocktail_id FROM Cocktail WHERE cocktail_name = '스크루드라이버'),
 (SELECT ingredient_id FROM Ingredient WHERE ingredient_name = '보드카'), '45'),
((SELECT cocktail_id FROM Cocktail WHERE cocktail_name = '스크루드라이버'),
 (SELECT ingredient_id FROM Ingredient WHERE ingredient_name = '오렌지 주스'), '150'),
((SELECT cocktail_id FROM Cocktail WHERE cocktail_name = '스크루드라이버'),
 (SELECT ingredient_id FROM Ingredient WHERE ingredient_name = '오렌지 슬라이스 / 필'), '1'),

-- ── 테킬라 선라이즈 ─────────────────────────────────────────
((SELECT cocktail_id FROM Cocktail WHERE cocktail_name = '테킬라 선라이즈'),
 (SELECT ingredient_id FROM Ingredient WHERE ingredient_name = '블랑코 데킬라'), '45'),
((SELECT cocktail_id FROM Cocktail WHERE cocktail_name = '테킬라 선라이즈'),
 (SELECT ingredient_id FROM Ingredient WHERE ingredient_name = '오렌지 주스'), '90'),
((SELECT cocktail_id FROM Cocktail WHERE cocktail_name = '테킬라 선라이즈'),
 (SELECT ingredient_id FROM Ingredient WHERE ingredient_name = '그레나딘 시럽'), '15'),
((SELECT cocktail_id FROM Cocktail WHERE cocktail_name = '테킬라 선라이즈'),
 (SELECT ingredient_id FROM Ingredient WHERE ingredient_name = '오렌지 슬라이스 / 필'), '1'),
((SELECT cocktail_id FROM Cocktail WHERE cocktail_name = '테킬라 선라이즈'),
 (SELECT ingredient_id FROM Ingredient WHERE ingredient_name = '칵테일 체리'), '1'),

-- ── 롱 아일랜드 아이스티 ────────────────────────────────────
((SELECT cocktail_id FROM Cocktail WHERE cocktail_name = '롱 아일랜드 아이스티'),
 (SELECT ingredient_id FROM Ingredient WHERE ingredient_name = '보드카'), '15'),
((SELECT cocktail_id FROM Cocktail WHERE cocktail_name = '롱 아일랜드 아이스티'),
 (SELECT ingredient_id FROM Ingredient WHERE ingredient_name = '드라이 진'), '15'),
((SELECT cocktail_id FROM Cocktail WHERE cocktail_name = '롱 아일랜드 아이스티'),
 (SELECT ingredient_id FROM Ingredient WHERE ingredient_name = '화이트 럼'), '15'),
((SELECT cocktail_id FROM Cocktail WHERE cocktail_name = '롱 아일랜드 아이스티'),
 (SELECT ingredient_id FROM Ingredient WHERE ingredient_name = '블랑코 데킬라'), '15'),
((SELECT cocktail_id FROM Cocktail WHERE cocktail_name = '롱 아일랜드 아이스티'),
 (SELECT ingredient_id FROM Ingredient WHERE ingredient_name = '트리플 섹'), '15'),
((SELECT cocktail_id FROM Cocktail WHERE cocktail_name = '롱 아일랜드 아이스티'),
 (SELECT ingredient_id FROM Ingredient WHERE ingredient_name = '신선한 레몬즙 / 주스'), '30'),
((SELECT cocktail_id FROM Cocktail WHERE cocktail_name = '롱 아일랜드 아이스티'),
 (SELECT ingredient_id FROM Ingredient WHERE ingredient_name = '심플 시럽'), '15'),
((SELECT cocktail_id FROM Cocktail WHERE cocktail_name = '롱 아일랜드 아이스티'),
 (SELECT ingredient_id FROM Ingredient WHERE ingredient_name = '콜라'), '60'),
((SELECT cocktail_id FROM Cocktail WHERE cocktail_name = '롱 아일랜드 아이스티'),
 (SELECT ingredient_id FROM Ingredient WHERE ingredient_name = '레몬 필 / 슬라이스'), '1'),

-- ── 블러디 메리 ─────────────────────────────────────────────
((SELECT cocktail_id FROM Cocktail WHERE cocktail_name = '블러디 메리'),
 (SELECT ingredient_id FROM Ingredient WHERE ingredient_name = '보드카'), '45'),
((SELECT cocktail_id FROM Cocktail WHERE cocktail_name = '블러디 메리'),
 (SELECT ingredient_id FROM Ingredient WHERE ingredient_name = '토마토 주스 / 믹서'), '120'),
((SELECT cocktail_id FROM Cocktail WHERE cocktail_name = '블러디 메리'),
 (SELECT ingredient_id FROM Ingredient WHERE ingredient_name = '신선한 레몬즙 / 주스'), '15'),
((SELECT cocktail_id FROM Cocktail WHERE cocktail_name = '블러디 메리'),
 (SELECT ingredient_id FROM Ingredient WHERE ingredient_name = '앙고스투라 비터스'), '2'),
((SELECT cocktail_id FROM Cocktail WHERE cocktail_name = '블러디 메리'),
 (SELECT ingredient_id FROM Ingredient WHERE ingredient_name = '정제 소금'), '1'),
((SELECT cocktail_id FROM Cocktail WHERE cocktail_name = '블러디 메리'),
 (SELECT ingredient_id FROM Ingredient WHERE ingredient_name = '레몬 필 / 슬라이스'), '1'),

-- ── 아이리시 커피 ────────────────────────────────────────────
((SELECT cocktail_id FROM Cocktail WHERE cocktail_name = '아이리시 커피'),
 (SELECT ingredient_id FROM Ingredient WHERE ingredient_name = '아이리시 위스키'), '40'),
((SELECT cocktail_id FROM Cocktail WHERE cocktail_name = '아이리시 커피'),
 (SELECT ingredient_id FROM Ingredient WHERE ingredient_name = '에스프레소 / 진한 커피'), '90'),
((SELECT cocktail_id FROM Cocktail WHERE cocktail_name = '아이리시 커피'),
 (SELECT ingredient_id FROM Ingredient WHERE ingredient_name = '벌꿀 / 꿀 시럽'), '15'),
((SELECT cocktail_id FROM Cocktail WHERE cocktail_name = '아이리시 커피'),
 (SELECT ingredient_id FROM Ingredient WHERE ingredient_name = '헤비 크림 / 생크림'), '30')

ON CONFLICT DO NOTHING;
