-- ========================================
-- 칵테일 데이터베이스 스키마 (PostgreSQL 호환 버전)
-- 전체 테이블 삭제 및 생성 스크립트
-- ========================================

-- 기존 테이블 삭제 (외래키 제약 때문에 역순으로 삭제)
DROP TABLE IF EXISTS Report_Resolution;
DROP TABLE IF EXISTS Report;
DROP TABLE IF EXISTS Cocktail_Comment;
DROP TABLE IF EXISTS User_Cabinet;
DROP TABLE IF EXISTS User_Saved_Cocktail;
DROP TABLE IF EXISTS Cocktail_Ingredient;
DROP TABLE IF EXISTS Cocktail;
DROP TABLE IF EXISTS Ingredient;
DROP TABLE IF EXISTS User_Info;
DROP TABLE IF EXISTS Cocktail_Category;
DROP TABLE IF EXISTS Ingredient_Category;
DROP TABLE IF EXISTS User_Grade;

-- ========================================
-- 1. 마스터 테이블 (Master Tables)
-- ========================================

-- 1-1. 사용자 등급 관리 테이블
CREATE TABLE User_Grade (
    grade_id   SERIAL PRIMARY KEY,
    grade_name VARCHAR(50)  NOT NULL UNIQUE,
    description VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 1-2. 칵테일 카테고리 마스터 테이블
CREATE TABLE Cocktail_Category (
    category_id   SERIAL PRIMARY KEY,
    category_name VARCHAR(100) NOT NULL UNIQUE,
    description   VARCHAR(255),
    created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 1-3. 재료 카테고리 마스터 테이블
CREATE TABLE Ingredient_Category (
    ingredient_category_id SERIAL PRIMARY KEY,
    category_name          VARCHAR(100) NOT NULL UNIQUE,
    description            VARCHAR(255),
    created_at             TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ========================================
-- 2. 기본 엔티티 테이블 (Entity Tables)
-- ========================================

-- 2-1. 사용자 정보 테이블
CREATE TABLE User_Info (
    user_id        VARCHAR(50)  PRIMARY KEY,
    user_name      VARCHAR(100) NOT NULL,
    email          VARCHAR(100) NOT NULL UNIQUE,
    password       VARCHAR(255) NOT NULL,
    grade_id       INT          NOT NULL,
    profile_image  VARCHAR(255),                   -- 프로필 사진 경로 (NULL = 기본 아바타)
    is_sanctioned  BOOLEAN      NOT NULL DEFAULT FALSE,  -- 관리자 제재 여부
    created_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_user_grade FOREIGN KEY (grade_id) REFERENCES User_Grade(grade_id)
);

-- 2-2. 재료 정보 테이블
CREATE TABLE Ingredient (
    ingredient_id          SERIAL PRIMARY KEY,
    ingredient_name        VARCHAR(100) NOT NULL UNIQUE,
    ingredient_category_id INT          NOT NULL,
    unit                   VARCHAR(20)  NOT NULL DEFAULT 'ml',
    description            VARCHAR(255),
    user_id                VARCHAR(50),           -- 등록한 사용자 (NULL = 시스템 기본 재료)
    created_at             TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_ingredient_category FOREIGN KEY (ingredient_category_id) REFERENCES Ingredient_Category(ingredient_category_id),
    CONSTRAINT fk_ingredient_user     FOREIGN KEY (user_id)                REFERENCES User_Info(user_id) ON DELETE SET NULL
);

-- 2-3. 칵테일 정보 테이블
CREATE TABLE Cocktail (
    cocktail_id   SERIAL PRIMARY KEY,
    cocktail_name VARCHAR(100) NOT NULL UNIQUE,
    category_id   INT          NOT NULL,
    user_id       VARCHAR(50),
    image_path    VARCHAR(255),
    recipe        TEXT,
    view_count    INT DEFAULT 0,
    created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_cocktail_category FOREIGN KEY (category_id) REFERENCES Cocktail_Category(category_id),
    CONSTRAINT fk_cocktail_user     FOREIGN KEY (user_id)     REFERENCES User_Info(user_id) ON DELETE SET NULL
);

-- ========================================
-- 3. 관계 테이블 (Relationship Tables)
-- ========================================

-- 3-1. 칵테일과 재료의 N:M 관계 (교차 테이블)
CREATE TABLE Cocktail_Ingredient (
    cocktail_id   INT         NOT NULL,
    ingredient_id INT         NOT NULL,
    amount        VARCHAR(50) NOT NULL,
    PRIMARY KEY (cocktail_id, ingredient_id),
    CONSTRAINT fk_ci_cocktail    FOREIGN KEY (cocktail_id)   REFERENCES Cocktail(cocktail_id)   ON DELETE CASCADE,
    CONSTRAINT fk_ci_ingredient  FOREIGN KEY (ingredient_id) REFERENCES Ingredient(ingredient_id) ON DELETE CASCADE
);

-- ========================================
-- 4. 기능 테이블 (Feature Tables)
-- ========================================

-- 4-1. 사용자 재료 보관함 테이블 (소지 중인 재료 목록)
CREATE TABLE User_Cabinet (
    user_id       VARCHAR(50) NOT NULL,
    ingredient_id INT         NOT NULL,
    added_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, ingredient_id),
    CONSTRAINT fk_cabinet_user       FOREIGN KEY (user_id)       REFERENCES User_Info(user_id)   ON DELETE CASCADE,
    CONSTRAINT fk_cabinet_ingredient FOREIGN KEY (ingredient_id) REFERENCES Ingredient(ingredient_id) ON DELETE CASCADE
);

-- 4-2. 사용자 칵테일 즐겨찾기 테이블
CREATE TABLE User_Saved_Cocktail (
    user_id     VARCHAR(50) NOT NULL,
    cocktail_id INT         NOT NULL,
    saved_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, cocktail_id),
    CONSTRAINT fk_saved_user     FOREIGN KEY (user_id)     REFERENCES User_Info(user_id)   ON DELETE CASCADE,
    CONSTRAINT fk_saved_cocktail FOREIGN KEY (cocktail_id) REFERENCES Cocktail(cocktail_id) ON DELETE CASCADE
);

-- 4-3. 칵테일 댓글 테이블
--   3NF 검증:
--     기본키: comment_id (단일 속성 → 부분 함수 종속 없음)
--     비키 속성(cocktail_id, user_id, content, created_at)은 모두 comment_id에만 종속
--     이행 종속 없음 → 3NF 만족
CREATE TABLE Cocktail_Comment (
    comment_id  SERIAL       PRIMARY KEY,
    cocktail_id INT          NOT NULL,
    user_id     VARCHAR(50)  NOT NULL,
    content     TEXT         NOT NULL,
    created_at  TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_comment_cocktail FOREIGN KEY (cocktail_id) REFERENCES Cocktail(cocktail_id)  ON DELETE CASCADE,
    CONSTRAINT fk_comment_user     FOREIGN KEY (user_id)     REFERENCES User_Info(user_id)      ON DELETE CASCADE
);

-- ========================================
-- 5. 신고 시스템 테이블 (Report Tables)
-- ========================================

-- 5-1. 신고 원본 테이블 (삭제 불가 설계)
--   3NF 검증:
--     기본키: report_id (단일 속성)
--     비키 속성(reporter_id, target_type, target_id, reason, created_at)은 모두 report_id에만 종속
--     이행 종속 없음 → 3NF 만족
CREATE TABLE Report (
    report_id    SERIAL       PRIMARY KEY,
    reporter_id  VARCHAR(50)  NOT NULL,
    target_type  VARCHAR(20)  NOT NULL CHECK (target_type IN ('cocktail','ingredient','comment','user')),
    target_id    VARCHAR(50)  NOT NULL,   -- 정수형 ID는 문자열로 저장 (user_id 수용)
    reason       VARCHAR(30)  NOT NULL CHECK (reason IN ('spam','inappropriate','copyright','hate_speech','false_info')),
    created_at   TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_report_reporter FOREIGN KEY (reporter_id) REFERENCES User_Info(user_id) ON DELETE CASCADE,
    CONSTRAINT uq_report_once     UNIQUE (reporter_id, target_type, target_id)  -- 동일 대상 중복 신고 방지
);

-- 5-2. 신고 처리 테이블 (처리된 신고 — 삭제 불가 설계)
--   3NF 검증:
--     기본키: report_id (Report 테이블의 FK이자 PK — 1:1 관계)
--     비키 속성(resolver_id, action_taken, resolved_at)은 모두 report_id에만 종속
--     이행 종속 없음 → 3NF 만족
CREATE TABLE Report_Resolution (
    report_id    INT          PRIMARY KEY,
    resolver_id  VARCHAR(50)  NOT NULL,
    action_taken VARCHAR(30)  NOT NULL CHECK (action_taken IN ('dismissed','content_deleted','user_sanctioned','content_modified')),
    resolved_at  TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_resolution_report   FOREIGN KEY (report_id)   REFERENCES Report(report_id),
    CONSTRAINT fk_resolution_resolver FOREIGN KEY (resolver_id) REFERENCES User_Info(user_id)
);

-- ========================================
-- 인덱스 생성 (쿼리 성능 최적화)
-- ========================================

-- 칵테일 조회 성능 최적화
CREATE INDEX idx_cocktail_category   ON Cocktail(category_id);
CREATE INDEX idx_cocktail_user       ON Cocktail(user_id);
CREATE INDEX idx_cocktail_view_count ON Cocktail(view_count DESC);

-- 재료 조회 성능 최적화
CREATE INDEX idx_ingredient_category ON Ingredient(ingredient_category_id);
CREATE INDEX idx_ingredient_user     ON Ingredient(user_id);

-- 사용자 정보 조회 성능 최적화
CREATE INDEX idx_user_grade ON User_Info(grade_id);
CREATE INDEX idx_user_email ON User_Info(email);

-- 사용자 보관함 조회 성능 최적화
CREATE INDEX idx_cabinet_user       ON User_Cabinet(user_id);
CREATE INDEX idx_cabinet_ingredient ON User_Cabinet(ingredient_id);

-- 사용자 즐겨찾기 조회 성능 최적화
CREATE INDEX idx_saved_cocktail_user     ON User_Saved_Cocktail(user_id);
CREATE INDEX idx_saved_cocktail_cocktail ON User_Saved_Cocktail(cocktail_id);

-- 댓글 조회 성능 최적화
CREATE INDEX idx_comment_cocktail ON Cocktail_Comment(cocktail_id);
CREATE INDEX idx_comment_user     ON Cocktail_Comment(user_id);

-- 신고 조회 성능 최적화
CREATE INDEX idx_report_reporter ON Report(reporter_id);
CREATE INDEX idx_report_target   ON Report(target_type, target_id);
CREATE INDEX idx_report_created  ON Report(created_at DESC);
