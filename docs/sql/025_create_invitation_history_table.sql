-- =====================================================
-- 025_create_invitation_history_table.sql
-- 프로젝트 초대 및 멤버 변경 히스토리를 저장하는 테이블
-- 
-- 실행 방법:
--   psql "postgresql://postgres.xyqpggpilgcdsawuvpzn:ZNDqDunnaydr0aFQ@aws-0-ap-northeast-2.pooler.supabase.com:5432/postgres" -f docs/sql/025_create_invitation_history_table.sql
-- =====================================================

CREATE TABLE IF NOT EXISTS mmcheck.tbl_project_invitation_history (
    id uuid PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
    project_id uuid REFERENCES mmcheck.tbl_project(id) ON DELETE CASCADE,
    invitation_id uuid, -- 삭제된 초대일 수도 있으므로 FK는 걸지 않거나 NULL 허용
    actor_id uuid REFERENCES auth.users(id) ON DELETE SET NULL, -- 행동을 수행한 사람
    invitee_email text NOT NULL, -- 초대 대상자 이메일
    action text NOT NULL CHECK (action IN ('invited', 'cancelled', 'accepted', 'rejected', 'requested', 'approved')),
    metadata jsonb, -- 추가 정보 (거절 사유 등)
    created_at timestamptz DEFAULT now() NOT NULL
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_invitation_history_project_id ON mmcheck.tbl_project_invitation_history(project_id);
CREATE INDEX IF NOT EXISTS idx_invitation_history_invitee_email ON mmcheck.tbl_project_invitation_history(invitee_email);

-- RLS
ALTER TABLE mmcheck.tbl_project_invitation_history ENABLE ROW LEVEL SECURITY;

-- 조회: 프로젝트 소유자이거나 본인이 초대 대상자인 경우
DROP POLICY IF EXISTS "Enable select for owners and invitees" ON mmcheck.tbl_project_invitation_history;
CREATE POLICY "Enable select for owners and invitees" ON mmcheck.tbl_project_invitation_history
    FOR SELECT TO authenticated 
    USING (
        invitee_email = (SELECT email FROM auth.users WHERE id = auth.uid()) OR 
        EXISTS (
            SELECT 1 FROM mmcheck.tbl_project 
            WHERE id = project_id AND created_by = auth.uid()
        )
    );

-- 권한 부여
GRANT ALL ON mmcheck.tbl_project_invitation_history TO authenticated;

COMMENT ON TABLE mmcheck.tbl_project_invitation_history IS '프로젝트 초대 및 멤버 상태 변경 히스토리 기록 테이블';
