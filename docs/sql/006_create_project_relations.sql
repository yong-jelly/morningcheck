-- =====================================================
-- 006_create_project_relations.sql
-- 프로젝트 멤버, 참여 요청, 초대 관련 테이블
-- 
-- 실행 방법:
--   psql "postgresql://postgres.xyqpggpilgcdsawuvpzn:ZNDqDunnaydr0aFQ@aws-0-ap-northeast-2.pooler.supabase.com:5432/postgres" -f docs/sql/006_create_project_relations.sql
-- =====================================================

-- 1. 프로젝트 멤버 테이블
CREATE TABLE IF NOT EXISTS mmcheck.tbl_project_members (
    id uuid PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
    project_id uuid REFERENCES mmcheck.tbl_project(id) ON DELETE CASCADE,
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    role text NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'member')),
    joined_at timestamptz DEFAULT now() NOT NULL,
    deleted_at timestamptz, -- 소프트 삭제를 위한 컬럼
    UNIQUE(project_id, user_id)
);

-- 2. 프로젝트 참여 요청 테이블 (참여요청 옵션용)
CREATE TABLE IF NOT EXISTS mmcheck.tbl_project_join_requests (
    id uuid PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
    project_id uuid REFERENCES mmcheck.tbl_project(id) ON DELETE CASCADE,
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    requested_at timestamptz DEFAULT now() NOT NULL,
    processed_at timestamptz,
    processed_by uuid REFERENCES auth.users(id),
    rejection_reason text
);

-- 3. 프로젝트 초대 테이블 (초대 옵션용)
CREATE TABLE IF NOT EXISTS mmcheck.tbl_project_invitations (
    id uuid PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
    project_id uuid REFERENCES mmcheck.tbl_project(id) ON DELETE CASCADE,
    inviter_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    invitee_email text NOT NULL,
    status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'cancelled')),
    invited_at timestamptz DEFAULT now() NOT NULL,
    responded_at timestamptz
);

-- 4. 인덱스 및 고유 제약 조건 생성
CREATE INDEX IF NOT EXISTS idx_project_members_project_id ON mmcheck.tbl_project_members(project_id);
CREATE INDEX IF NOT EXISTS idx_project_members_user_id ON mmcheck.tbl_project_members(user_id);
CREATE INDEX IF NOT EXISTS idx_project_members_deleted_at ON mmcheck.tbl_project_members(deleted_at) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_join_requests_project_id ON mmcheck.tbl_project_join_requests(project_id);
-- 대기 중인 요청은 사용자당 프로젝트별로 하나만 존재해야 함 (부분 고유 인덱스)
CREATE UNIQUE INDEX IF NOT EXISTS idx_tbl_project_join_requests_pending_unique 
    ON mmcheck.tbl_project_join_requests(project_id, user_id) 
    WHERE status = 'pending';

CREATE INDEX IF NOT EXISTS idx_project_invitations_email ON mmcheck.tbl_project_invitations(invitee_email);
-- 대기 중인 초대는 이메일당 프로젝트별로 하나만 존재해야 함 (부분 고유 인덱스)
CREATE UNIQUE INDEX IF NOT EXISTS idx_tbl_project_invitations_pending_unique 
    ON mmcheck.tbl_project_invitations(project_id, invitee_email) 
    WHERE status = 'pending';

-- 5. RLS 설정
ALTER TABLE mmcheck.tbl_project_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE mmcheck.tbl_project_join_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE mmcheck.tbl_project_invitations ENABLE ROW LEVEL SECURITY;

-- [tbl_project_members]
-- 멤버 조회: 활성 멤버만 보이도록 설정
DROP POLICY IF EXISTS "Enable select for authenticated users" ON mmcheck.tbl_project_members;
CREATE POLICY "Enable select for authenticated users" ON mmcheck.tbl_project_members
    FOR SELECT TO authenticated USING (deleted_at IS NULL);

-- 멤버 추가: 본인이 본인을 추가하는 것만 허용 (우선은 단순화, 추후 공개범위에 따른 로직 추가 가능)
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON mmcheck.tbl_project_members;
CREATE POLICY "Enable insert for authenticated users" ON mmcheck.tbl_project_members
    FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- 멤버 수정/삭제: 프로젝트 소유자이거나 본인인 경우
DROP POLICY IF EXISTS "Enable update/delete for owners and members" ON mmcheck.tbl_project_members;
CREATE POLICY "Enable update/delete for owners and members" ON mmcheck.tbl_project_members
    FOR ALL TO authenticated 
    USING (
        auth.uid() = user_id OR 
        EXISTS (
            SELECT 1 FROM mmcheck.tbl_project 
            WHERE id = project_id AND created_by = auth.uid()
        )
    );

-- [tbl_project_join_requests]
-- 참여 요청 조회: 본인이 요청하거나 프로젝트 소유자가 확인 가능
DROP POLICY IF EXISTS "Enable select for owners and requesters" ON mmcheck.tbl_project_join_requests;
CREATE POLICY "Enable select for owners and requesters" ON mmcheck.tbl_project_join_requests
    FOR SELECT TO authenticated 
    USING (
        auth.uid() = user_id OR 
        EXISTS (
            SELECT 1 FROM mmcheck.tbl_project 
            WHERE id = project_id AND created_by = auth.uid()
        )
    );

-- 참여 요청 생성: 인증된 사용자
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON mmcheck.tbl_project_join_requests;
CREATE POLICY "Enable insert for authenticated users" ON mmcheck.tbl_project_join_requests
    FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- 참여 요청 처리: 프로젝트 소유자만 가능
DROP POLICY IF EXISTS "Enable update for owners" ON mmcheck.tbl_project_join_requests;
CREATE POLICY "Enable update for owners" ON mmcheck.tbl_project_join_requests
    FOR UPDATE TO authenticated 
    USING (
        EXISTS (
            SELECT 1 FROM mmcheck.tbl_project 
            WHERE id = project_id AND created_by = auth.uid()
        )
    );

-- [tbl_project_invitations]
-- 초대 조회: 본인이 초대받았거나 프로젝트 소유자가 확인 가능
DROP POLICY IF EXISTS "Enable select for owners and invitees" ON mmcheck.tbl_project_invitations;
CREATE POLICY "Enable select for owners and invitees" ON mmcheck.tbl_project_invitations
    FOR SELECT TO authenticated 
    USING (
        invitee_email = (SELECT email FROM auth.users WHERE id = auth.uid()) OR 
        EXISTS (
            SELECT 1 FROM mmcheck.tbl_project 
            WHERE id = project_id AND created_by = auth.uid()
        )
    );

-- 초대 생성: 프로젝트 소유자만 가능
DROP POLICY IF EXISTS "Enable insert for owners" ON mmcheck.tbl_project_invitations;
CREATE POLICY "Enable insert for owners" ON mmcheck.tbl_project_invitations
    FOR INSERT TO authenticated 
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM mmcheck.tbl_project 
            WHERE id = project_id AND created_by = auth.uid()
        )
    );

-- 6. 권한 부여
GRANT ALL ON mmcheck.tbl_project_members TO authenticated;
GRANT ALL ON mmcheck.tbl_project_join_requests TO authenticated;
GRANT ALL ON mmcheck.tbl_project_invitations TO authenticated;
