-- =====================================================
-- 029_migrate_add_archived_at.sql
-- 프로젝트 테이블에 archived_at 컬럼 추가 마이그레이션
-- 
-- 실행 방법:
--   psql "postgresql://postgres.xyqpggpilgcdsawuvpzn:ZNDqDunnaydr0aFQ@aws-0-ap-northeast-2.pooler.supabase.com:5432/postgres" -f docs/sql/029_migrate_add_archived_at.sql
-- =====================================================

DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'mmcheck' AND table_name = 'tbl_project' AND column_name = 'archived_at') THEN
        ALTER TABLE mmcheck.tbl_project ADD COLUMN archived_at timestamptz;
        COMMENT ON COLUMN mmcheck.tbl_project.archived_at IS '아카이브 처리 시간 (NULL이면 활성 상태)';
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_tbl_project_archived_at ON mmcheck.tbl_project(archived_at) WHERE archived_at IS NULL;
