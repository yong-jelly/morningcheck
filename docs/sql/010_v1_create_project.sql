-- =====================================================
-- 010_v1_create_project.sql
-- 프로젝트를 생성하고 생성자를 소유자로 등록하는 함수
-- 
-- 인자:
--   @p_name: 프로젝트 이름
--   @p_description: 프로젝트 설명
--   @p_icon: 아이콘 (이모지 또는 이미지 URL)
--   @p_icon_type: 아이콘 타입 (emoji, image)
--   @p_invite_code: 초대 코드
--   @p_visibility_type: 공개 범위 (public, request, invite)
--   @p_created_by: 생성자 ID (UUID)
-- 
-- 실행 방법:
--   psql "postgresql://postgres.xyqpggpilgcdsawuvpzn:ZNDqDunnaydr0aFQ@aws-0-ap-northeast-2.pooler.supabase.com:5432/postgres" -f docs/sql/010_v1_create_project.sql
-- =====================================================

CREATE OR REPLACE FUNCTION mmcheck.v1_create_project(
    p_name text,
    p_description text,
    p_icon text,
    p_icon_type text,
    p_invite_code text,
    p_visibility_type text,
    p_created_by uuid
)
RETURNS mmcheck.tbl_project
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = mmcheck, public
AS $$
DECLARE
    v_project mmcheck.tbl_project;
BEGIN
    -- 1. 프로젝트 생성
    INSERT INTO mmcheck.tbl_project (
        name, description, icon, icon_type, invite_code, visibility_type, created_by
    )
    VALUES (
        p_name, p_description, p_icon, p_icon_type, p_invite_code, p_visibility_type, p_created_by
    )
    RETURNING * INTO v_project;

    -- 2. 생성자를 소유자로 멤버 테이블에 추가
    INSERT INTO mmcheck.tbl_project_members (
        project_id, user_id, role
    )
    VALUES (
        v_project.id, p_created_by, 'owner'
    );

    RETURN v_project;
END;
$$;

COMMENT ON FUNCTION mmcheck.v1_create_project IS '새로운 프로젝트를 생성하고 생성자를 소유자로 등록합니다.';
GRANT EXECUTE ON FUNCTION mmcheck.v1_create_project TO authenticated;
