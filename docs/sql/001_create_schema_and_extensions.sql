-- =====================================================
-- 001_create_schema_and_extensions.sql
-- mmcheck 스키마 및 확장 프로그램 설정
-- 
-- 실행 방법:
--   psql "postgresql://postgres.xyqpggpilgcdsawuvpzn:ZNDqDunnaydr0aFQ@aws-0-ap-northeast-2.pooler.supabase.com:5432/postgres" -f docs/sql/001_create_schema_and_extensions.sql
-- =====================================================

-- 1. 스키마 생성
CREATE SCHEMA IF NOT EXISTS mmcheck;

-- 2. 확장 프로그램 활성화
-- Supabase에서는 기본적으로 'extensions' 스키마에 설치됩니다.
CREATE EXTENSION IF NOT EXISTS "uuid-ossp" SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS "pgcrypto" SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS "pg_cron";

-- 3. 권한 설정
-- 스키마 사용 권한 부여
GRANT USAGE ON SCHEMA mmcheck TO anon;
GRANT USAGE ON SCHEMA mmcheck TO authenticated;
GRANT USAGE ON SCHEMA mmcheck TO service_role;

-- 기본 권한 설정 (새로 생성되는 테이블/함수에 대한 권한)
ALTER DEFAULT PRIVILEGES IN SCHEMA mmcheck GRANT ALL ON TABLES TO postgres;
ALTER DEFAULT PRIVILEGES IN SCHEMA mmcheck GRANT ALL ON FUNCTIONS TO postgres;
ALTER DEFAULT PRIVILEGES IN SCHEMA mmcheck GRANT ALL ON SEQUENCES TO postgres;

ALTER DEFAULT PRIVILEGES IN SCHEMA mmcheck GRANT SELECT ON TABLES TO anon;
ALTER DEFAULT PRIVILEGES IN SCHEMA mmcheck GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA mmcheck GRANT ALL ON TABLES TO service_role;

-- 4. 코멘트 추가
COMMENT ON SCHEMA mmcheck IS 'MorningCheck 서비스의 핵심 데이터를 관리하는 스키마';
