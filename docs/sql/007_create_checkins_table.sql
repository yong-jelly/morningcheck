-- =====================================================
-- 007_create_checkins_table.sql
-- 프로젝트 체크인 기록 테이블
-- 
-- 실행 방법:
--   psql "postgresql://postgres.xyqpggpilgcdsawuvpzn:ZNDqDunnaydr0aFQ@aws-0-ap-northeast-2.pooler.supabase.com:5432/postgres" -f docs/sql/007_create_checkins_table.sql
-- =====================================================

-- 1. 체크인 테이블 생성
CREATE TABLE IF NOT EXISTS mmcheck.tbl_project_check_ins (
    id uuid PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
    project_id uuid REFERENCES mmcheck.tbl_project(id) ON DELETE CASCADE,
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    check_in_date date DEFAULT (now() AT TIME ZONE 'Asia/Seoul')::date NOT NULL,
    condition integer NOT NULL CHECK (condition >= 1 AND condition <= 10),
    note text,
    created_at timestamptz DEFAULT now() NOT NULL,
    
    -- 하루에 한 번만 체크인 가능하도록 제약 조건 추가 (프로젝트별 사용자별 날짜별)
    UNIQUE(project_id, user_id, check_in_date)
);

-- 2. 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_check_ins_project_id ON mmcheck.tbl_project_check_ins(project_id);
CREATE INDEX IF NOT EXISTS idx_check_ins_user_id ON mmcheck.tbl_project_check_ins(user_id);
CREATE INDEX IF NOT EXISTS idx_check_ins_date ON mmcheck.tbl_project_check_ins(check_in_date);

-- 3. RLS 설정
ALTER TABLE mmcheck.tbl_project_check_ins ENABLE ROW LEVEL SECURITY;

-- [SELECT] 멤버만 조회 가능 (공개 프로젝트인 경우 비멤버도 조회 가능하게 설정할 수 있음)
DROP POLICY IF EXISTS "Enable read for members or public projects" ON mmcheck.tbl_project_check_ins;
CREATE POLICY "Enable read for members or public projects" ON mmcheck.tbl_project_check_ins
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM mmcheck.tbl_project_members 
            WHERE project_id = tbl_project_check_ins.project_id AND user_id = auth.uid()
        ) OR EXISTS (
            SELECT 1 FROM mmcheck.tbl_project
            WHERE id = tbl_project_check_ins.project_id AND visibility_type = 'public'
        )
    );

-- [INSERT] 멤버만 작성 가능
DROP POLICY IF EXISTS "Enable insert for members" ON mmcheck.tbl_project_check_ins;
CREATE POLICY "Enable insert for members" ON mmcheck.tbl_project_check_ins
    FOR INSERT TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM mmcheck.tbl_project_members 
            WHERE project_id = tbl_project_check_ins.project_id AND user_id = auth.uid()
        )
    );

-- 4. 권한 부여
GRANT ALL ON mmcheck.tbl_project_check_ins TO authenticated;
