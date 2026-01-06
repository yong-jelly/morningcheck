-- =====================================================
-- 038_v2_project_stats_sync.sql
-- 사용자 통합 체크인(V2) 데이터를 기반으로 프로젝트 통계를 동기화하는 로직
-- 
-- 주요 변경 사항:
--   1. fn_sync_daily_stats가 tbl_user_check_ins_v2 테이블을 참조하도록 수정
--   2. tbl_user_check_ins_v2 테이블에 체크인 발생 시 관련 프로젝트 통계를 갱신하는 트리거 추가
-- 
-- 실행 방법:
--   psql "postgresql://postgres.xyqpggpilgcdsawuvpzn:ZNDqDunnaydr0aFQ@aws-0-ap-northeast-2.pooler.supabase.com:5432/postgres" -f docs/sql/038_v2_project_stats_sync.sql
-- =====================================================

-- 1. 통계 동기화 함수 수정 (V2 테이블 참조)
CREATE OR REPLACE FUNCTION mmcheck.fn_sync_daily_stats(p_project_id uuid, p_date date)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_member_count integer;
    v_check_in_count integer;
    v_avg_condition numeric(3,1);
    v_participation_rate integer;
BEGIN
    -- 1. 해당 날짜 기준 활성 멤버 수 계산
    SELECT count(*)::integer INTO v_member_count
    FROM mmcheck.tbl_project_members
    WHERE project_id = p_project_id
      AND joined_at::date <= p_date
      AND (deleted_at IS NULL OR deleted_at::date > p_date);

    -- 2. 해당 날짜의 체크인 정보 계산 (V2 테이블 참조)
    -- 프로젝트 멤버들의 통합 체크인 정보를 합산
    SELECT 
        count(*)::integer,
        COALESCE(avg(uci.condition), 0)::numeric(3,1)
    INTO v_check_in_count, v_avg_condition
    FROM mmcheck.tbl_project_members m
    JOIN mmcheck.tbl_user_check_ins_v2 uci ON m.user_id = uci.user_id
    WHERE m.project_id = p_project_id
      AND m.deleted_at IS NULL
      AND uci.check_in_date = p_date;

    -- 3. 참여율 계산
    IF v_member_count > 0 THEN
        v_participation_rate := (v_check_in_count * 100) / v_member_count;
    ELSE
        v_participation_rate := 0;
    END IF;

    -- 4. 통계 테이블 UPSERT
    INSERT INTO mmcheck.tbl_project_daily_stats (
        project_id, stats_date, member_count, check_in_count, avg_condition, participation_rate, updated_at
    )
    VALUES (
        p_project_id, p_date, v_member_count, v_check_in_count, v_avg_condition, v_participation_rate, now()
    )
    ON CONFLICT (project_id, stats_date) DO UPDATE
    SET 
        member_count = EXCLUDED.member_count,
        check_in_count = EXCLUDED.check_in_count,
        avg_condition = EXCLUDED.avg_condition,
        participation_rate = EXCLUDED.participation_rate,
        updated_at = EXCLUDED.updated_at;
END;
$$;

-- 2. V2 체크인 변경 시 관련 모든 프로젝트의 통계를 갱신하는 함수
CREATE OR REPLACE FUNCTION mmcheck.tr_sync_project_stats_on_v2_checkin()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    r record;
BEGIN
    -- 체크인이 발생한 사용자가 속한 모든 활성 프로젝트를 찾아 통계 갱신
    IF (TG_OP = 'INSERT' OR TG_OP = 'UPDATE') THEN
        FOR r IN 
            SELECT project_id 
            FROM mmcheck.tbl_project_members 
            WHERE user_id = NEW.user_id AND deleted_at IS NULL
        LOOP
            PERFORM mmcheck.fn_sync_daily_stats(r.project_id, NEW.check_in_date);
        END LOOP;
    ELSIF (TG_OP = 'DELETE') THEN
        FOR r IN 
            SELECT project_id 
            FROM mmcheck.tbl_project_members 
            WHERE user_id = OLD.user_id AND deleted_at IS NULL
        LOOP
            PERFORM mmcheck.fn_sync_daily_stats(r.project_id, OLD.check_in_date);
        END LOOP;
    END IF;
    RETURN NULL;
END;
$$;

-- 3. V2 체크인 테이블에 트리거 적용
DROP TRIGGER IF EXISTS tr_v2_checkin_sync_stats ON mmcheck.tbl_user_check_ins_v2;
CREATE TRIGGER tr_v2_checkin_sync_stats
AFTER INSERT OR UPDATE OR DELETE ON mmcheck.tbl_user_check_ins_v2
FOR EACH ROW EXECUTE FUNCTION mmcheck.tr_sync_project_stats_on_v2_checkin();

-- 4. 구버전 트리거 제거 (선택 사항이지만 혼선 방지를 위해 권장)
DROP TRIGGER IF EXISTS tr_checkin_change_sync_stats ON mmcheck.tbl_project_check_ins;

COMMENT ON FUNCTION mmcheck.tr_sync_project_stats_on_v2_checkin() IS 'V2 통합 체크인 변경 시 해당 사용자가 속한 프로젝트들의 통계를 자동으로 갱신합니다.';
