# 코딩 기본 요구사항

## 데이터베이스

- 트랜잭션 격리 수준은 Read Committed로 고정한다
- DB 쓰기 작업은 반드시 try/except/finally 구조를 사용한다
  - except: conn.rollback()
  - finally: conn.close()
- 정규화 수준은 제3정규형을 유지한다

## CSS

- 모든 페이지는 base.css를 먼저 로드한 후 페이지 전용 CSS를 로드한다
- 공통으로 사용하는 스타일(변수, 리셋, 헤더, 폼, 아코디언, 푸터 등)은 base.css에서 관리한다
- 페이지 전용 CSS는 해당 페이지에서만 사용하는 스타일만 포함한다

## JavaScript

- 로그인이 필요한 페이지의 JS 초기화는 cabinet.js의 initCabinet() 패턴을 따른다
  1. /user/profile 호출로 로그인 확인
  2. 비로그인 시 /login으로 리다이렉트
  3. 이후 데이터 로드
- 공통으로 사용하는 함수나 디자인 형식은 통합하여 사용한다

## 보안

- 로그인이 필요한 페이지는 서버(app.py redirect)와 클라이언트(JS) 양쪽에서 모두 보호한다
