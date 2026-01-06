-- =====================================================
-- 033_v2_check_in.sql
-- 사용자 통합 체크인 정보를 기록하는 함수 (V2)
-- 
-- 인자:
--   @p_user_id: 사용자 ID
--   @p_condition: 컨디션 점수 (0-10)
--   @p_note: 오늘의 한 줄 평
--   @p_check_in_date: 체크인 날짜 (기본값 CURRENT_DATE)
-- 
-- 실행 방법:
--   psql "postgresql://postgres.xyqpggpilgcdsawuvpzn:ZNDqDunnaydr0aFQ@aws-0-ap-northeast-2.pooler.supabase.com:5432/postgres" -f docs/sql/033_v2_check_in.sql
-- =====================================================

CREATE OR REPLACE FUNCTION mmcheck.v2_check_in(
    p_user_id uuid,
    p_condition integer,
    p_note text,
    p_check_in_date date DEFAULT (now() AT TIME ZONE 'Asia/Seoul')::date
)
RETURNS mmcheck.tbl_user_check_ins_v2
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = mmcheck, public
AS $$
DECLARE
    v_check_in mmcheck.tbl_user_check_ins_v2;
BEGIN
    INSERT INTO mmcheck.tbl_user_check_ins_v2 (
        user_id, condition, note, check_in_date
    )
    VALUES (
        p_user_id, p_condition, p_note, p_check_in_date
    )
    ON CONFLICT (user_id, check_in_date) DO UPDATE
    SET 
        condition = EXCLUDED.condition,
        note = EXCLUDED.note,
        created_at = now()
    RETURNING * INTO v_check_in;

    RETURN v_check_in;
END;
$$;

COMMENT ON FUNCTION mmcheck.v2_check_in IS '사용자 통합 체크인 정보를 생성하거나 업데이트합니다. (V2)';
GRANT EXECUTE ON FUNCTION mmcheck.v2_check_in TO authenticated;
