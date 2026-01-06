-- =====================================================
-- 035_v2_get_public_projects.sql
-- 공개된 프로젝트 목록 또는 본인이 멤버인 프로젝트 목록을 관련 정보와 함께 조회하는 함수 (V2)
-- 통합 데일리 체크인 정보를 포함합니다.
-- 
-- 인자:
--   @p_auth_id: 조회를 요청하는 사용자의 ID (선택)
-- 
-- 실행 방법:
--   psql "postgresql://postgres.xyqpggpilgcdsawuvpzn:ZNDqDunnaydr0aFQ@aws-0-ap-northeast-2.pooler.supabase.com:5432/postgres" -f docs/sql/035_v2_get_public_projects.sql
-- =====================================================

CREATE OR REPLACE FUNCTION mmcheck.v2_get_public_projects(
    p_auth_id uuid DEFAULT NULL
)
RETURNS TABLE (
    id uuid,
    name text,
    description text,
    icon text,
    icon_type text,
    invite_code text,
    visibility_type text,
    created_by uuid,
    created_at timestamptz,
    updated_at timestamptz,
    deleted_at timestamptz,
    archived_at timestamptz,
    members jsonb,
    check_ins jsonb,
    stats jsonb,
    invitations jsonb,
    join_requests jsonb
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = mmcheck, public
AS $$
DECLARE
    v_user_email text;
BEGIN
    -- 요청한 사용자의 이메일 가져오기
    IF p_auth_id IS NOT NULL THEN
        SELECT u.email INTO v_user_email FROM auth.users u WHERE u.id = p_auth_id;
    END IF;

    RETURN QUERY
    SELECT 
        proj.id,
        proj.name,
        proj.description,
        proj.icon,
        proj.icon_type,
        proj.invite_code,
        proj.visibility_type,
        proj.created_by,
        proj.created_at,
        proj.updated_at,
        proj.deleted_at,
        proj.archived_at,
        (
            SELECT jsonb_agg(jsonb_build_object(
                'user_id', m.user_id,
                'role', m.role,
                'user', jsonb_build_object(
                    'display_name', users.display_name,
                    'avatar_url', users.avatar_url
                )
            ))
            FROM mmcheck.tbl_project_members m
            JOIN mmcheck.tbl_users users ON m.user_id = users.auth_id
            WHERE m.project_id = proj.id AND m.deleted_at IS NULL
        ) as members,
        (
            -- V2: 프로젝트 멤버들의 오늘의 통합 체크인 정보를 가져옴
            SELECT jsonb_agg(jsonb_build_object(
                'id', uci.id,
                'project_id', proj.id,
                'user_id', uci.user_id,
                'condition', uci.condition,
                'note', uci.note,
                'check_in_date', uci.check_in_date,
                'created_at', uci.created_at,
                'user', jsonb_build_object(
                    'display_name', COALESCE(u.display_name, '익명'),
                    'avatar_url', u.avatar_url
                )
            ))
            FROM mmcheck.tbl_project_members m
            JOIN mmcheck.tbl_user_check_ins_v2 uci ON m.user_id = uci.user_id
            LEFT JOIN mmcheck.tbl_users u ON uci.user_id = u.auth_id
            WHERE m.project_id = proj.id 
              AND m.deleted_at IS NULL
              AND uci.check_in_date = (now() AT TIME ZONE 'Asia/Seoul')::date
        ) as check_ins,
        (
            SELECT jsonb_agg(s.*)
            FROM mmcheck.tbl_project_daily_stats s
            WHERE s.project_id = proj.id
        ) as stats,
        (
            SELECT jsonb_agg(inv.*)
            FROM mmcheck.tbl_project_invitations inv
            WHERE inv.project_id = proj.id
        ) as invitations,
        (
            SELECT jsonb_agg(req.*)
            FROM mmcheck.tbl_project_join_requests req
            WHERE req.project_id = proj.id
        ) as join_requests
    FROM mmcheck.tbl_project proj
    WHERE proj.deleted_at IS NULL
      AND (
          -- 아카이브되지 않은 공개/요청 프로젝트는 모두에게 노출
          (proj.archived_at IS NULL AND (proj.visibility_type = 'public' OR proj.visibility_type = 'request'))
          OR 
          -- 본인이 생성자인 경우 아카이브 여부와 상관없이 노출 (복원 등을 위해)
          (p_auth_id IS NOT NULL AND proj.created_by = p_auth_id)
          OR
          -- 본인이 멤버이거나 초대받은 경우, 아카이브되지 않은 프로젝트만 노출
          (p_auth_id IS NOT NULL AND proj.archived_at IS NULL AND (
              EXISTS (
                  SELECT 1 FROM mmcheck.tbl_project_members pm 
                  WHERE pm.project_id = proj.id 
                    AND pm.user_id = p_auth_id 
                    AND pm.deleted_at IS NULL
              )
              OR (v_user_email IS NOT NULL AND EXISTS (
                  SELECT 1 FROM mmcheck.tbl_project_invitations invitations_check
                  WHERE invitations_check.project_id = proj.id
                    AND invitations_check.invitee_email = v_user_email
                    AND invitations_check.status = 'pending'
              ))
          ))
      );
END;
$$;

COMMENT ON FUNCTION mmcheck.v2_get_public_projects(uuid) IS '공개 프로젝트 및 본인이 참여/생성한 프로젝트 목록을 조회합니다. (V2, 통합 체크인 포함)';
GRANT EXECUTE ON FUNCTION mmcheck.v2_get_public_projects(uuid) TO authenticated;
