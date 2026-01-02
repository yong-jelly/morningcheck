-- =====================================================
-- 005_create_projects_table.sql
-- 프로젝트 테이블 생성
-- 
-- 실행 방법:
--   psql "postgresql://postgres.xyqpggpilgcdsawuvpzn:ZNDqDunnaydr0aFQ@aws-0-ap-northeast-2.pooler.supabase.com:5432/postgres" -f docs/sql/005_create_projects_table.sql
-- =====================================================
-- drop table if exists mmcheck.tbl_project;
-- 1. 프로젝트 테이블 생성
CREATE TABLE IF NOT EXISTS mmcheck.tbl_project (
    id uuid PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
    name text NOT NULL,
    description text,
    icon text,
    icon_type text NOT NULL CHECK (icon_type IN ('emoji', 'image')),
    invite_code text UNIQUE NOT NULL,
    visibility_type text NOT NULL DEFAULT 'invite' CHECK (visibility_type IN ('public', 'request', 'invite')),
    created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at timestamptz DEFAULT now() NOT NULL,
    updated_at timestamptz DEFAULT now() NOT NULL,
    deleted_at timestamptz, -- 소프트 삭제를 위한 컬럼
    archived_at timestamptz, -- 아카이브 상태를 위한 컬럼
    
    -- 검색 및 성능을 위한 인덱스
    CONSTRAINT name_length CHECK (char_length(name) >= 1)
);

-- 2. 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_tbl_project_invite_code ON mmcheck.tbl_project(invite_code);
CREATE INDEX IF NOT EXISTS idx_tbl_project_created_by ON mmcheck.tbl_project(created_by);
CREATE INDEX IF NOT EXISTS idx_tbl_project_deleted_at ON mmcheck.tbl_project(deleted_at) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_tbl_project_archived_at ON mmcheck.tbl_project(archived_at) WHERE archived_at IS NULL;

-- 3. updated_at 자동 갱신 트리거
CREATE OR REPLACE FUNCTION mmcheck.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_tbl_project_updated_at ON mmcheck.tbl_project;
CREATE TRIGGER update_tbl_project_updated_at
    BEFORE UPDATE ON mmcheck.tbl_project
    FOR EACH ROW
    EXECUTE FUNCTION mmcheck.update_updated_at_column();

-- 4. RLS (Row Level Security) 설정
ALTER TABLE mmcheck.tbl_project ENABLE ROW LEVEL SECURITY;

-- [SELECT] 누구나 삭제되지 않은 프로젝트를 조회할 수 있음 (또는 정책에 따라 멤버만 가능하게 변경 가능)
DROP POLICY IF EXISTS "Enable read access for all users" ON mmcheck.tbl_project;
CREATE POLICY "Enable read access for all users" ON mmcheck.tbl_project
    FOR SELECT USING (deleted_at IS NULL);

-- [INSERT] 인증된 사용자는 프로젝트를 생성할 수 있음
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON mmcheck.tbl_project;
CREATE POLICY "Enable insert for authenticated users only" ON mmcheck.tbl_project
    FOR INSERT TO authenticated WITH CHECK (auth.uid() = created_by);

-- [UPDATE] 생성자만 프로젝트 정보를 수정하거나 삭제할 수 있음
DROP POLICY IF EXISTS "Enable update for owners" ON mmcheck.tbl_project;
CREATE POLICY "Enable update for owners" ON mmcheck.tbl_project
    FOR UPDATE TO authenticated USING (auth.uid() = created_by);

-- 5. 권한 부여
GRANT ALL ON mmcheck.tbl_project TO postgres;
GRANT SELECT ON mmcheck.tbl_project TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON mmcheck.tbl_project TO authenticated;
GRANT ALL ON mmcheck.tbl_project TO service_role;

-- 6. 코멘트 추가
COMMENT ON TABLE mmcheck.tbl_project IS '프로젝트 정보를 저장하는 테이블';
COMMENT ON COLUMN mmcheck.tbl_project.deleted_at IS '소프트 삭제 시간 (NULL이면 활성 상태)';
COMMENT ON COLUMN mmcheck.tbl_project.archived_at IS '아카이브 처리 시간 (NULL이면 활성 상태)';