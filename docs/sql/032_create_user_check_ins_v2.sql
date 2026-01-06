-- =====================================================
-- 032_create_user_check_ins_v2.sql
-- 사용자 통합 데일리 체크인 테이블 생성
-- 
-- 실행 방법:
--   psql "postgresql://postgres.xyqpggpilgcdsawuvpzn:ZNDqDunnaydr0aFQ@aws-0-ap-northeast-2.pooler.supabase.com:5432/postgres" -f docs/sql/032_create_user_check_ins_v2.sql
-- =====================================================

-- 1. 통합 체크인 테이블 생성 (V2)
CREATE TABLE IF NOT EXISTS mmcheck.tbl_user_check_ins_v2 (
    id uuid PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    check_in_date date DEFAULT (now() AT TIME ZONE 'Asia/Seoul')::date NOT NULL,
    condition integer NOT NULL CHECK (condition >= 0 AND condition <= 10),
    note text,
    created_at timestamptz DEFAULT now() NOT NULL,
    
    -- 하루에 한 번만 체크인 가능하도록 제약 조건 (사용자별 날짜별)
    UNIQUE(user_id, check_in_date)
);

-- 2. 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_user_check_ins_v2_user_id ON mmcheck.tbl_user_check_ins_v2(user_id);
CREATE INDEX IF NOT EXISTS idx_user_check_ins_v2_date ON mmcheck.tbl_user_check_ins_v2(check_in_date);

-- 3. RLS 설정
ALTER TABLE mmcheck.tbl_user_check_ins_v2 ENABLE ROW LEVEL SECURITY;

-- [SELECT] 누구나 조회 가능 (단, 실제 연동 시 프로젝트 멤버 여부 등을 체크할 수도 있음. 여기서는 기본 공개)
-- 프로젝트 멤버들이 볼 수 있도록 하려면 v2_get_public_projects 등에서 제어
DROP POLICY IF EXISTS "Enable read for authenticated users" ON mmcheck.tbl_user_check_ins_v2;
CREATE POLICY "Enable read for authenticated users" ON mmcheck.tbl_user_check_ins_v2
    FOR SELECT TO authenticated USING (true);

-- [INSERT/UPDATE] 본인만 작성/수정 가능
DROP POLICY IF EXISTS "Enable insert/update for owners" ON mmcheck.tbl_user_check_ins_v2;
CREATE POLICY "Enable insert/update for owners" ON mmcheck.tbl_user_check_ins_v2
    FOR ALL TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- 4. 권한 부여
GRANT ALL ON mmcheck.tbl_user_check_ins_v2 TO authenticated;

-- 5. 코멘트 추가
COMMENT ON TABLE mmcheck.tbl_user_check_ins_v2 IS '사용자별 통합 데일리 체크인 기록을 저장하는 테이블 (V2)';
