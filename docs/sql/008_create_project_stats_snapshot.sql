-- =====================================================
-- 008_create_project_stats_snapshot.sql
-- 프로젝트 일일 통계 스냅샷 및 자동 동기화 트리거
-- 
-- 실행 방법:
--   psql "postgresql://postgres.xyqpggpilgcdsawuvpzn:ZNDqDunnaydr0aFQ@aws-0-ap-northeast-2.pooler.supabase.com:5432/postgres" -f docs/sql/008_create_project_stats_snapshot.sql
-- =====================================================

-- 1. 일일 통계 테이블 생성
CREATE TABLE IF NOT EXISTS mmcheck.tbl_project_daily_stats (
    project_id uuid REFERENCES mmcheck.tbl_project(id) ON DELETE CASCADE,
    stats_date date NOT NULL,
    member_count integer DEFAULT 0,
    check_in_count integer DEFAULT 0,
    avg_condition numeric(3,1) DEFAULT 0,
    participation_rate integer DEFAULT 0,
    updated_at timestamptz DEFAULT now() NOT NULL,
    PRIMARY KEY (project_id, stats_date)
);

-- 2. 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_project_daily_stats_date ON mmcheck.tbl_project_daily_stats(stats_date);

-- 3. 통계 동기화 함수
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
    -- 가입일이 기준일 이전이고, 탈퇴하지 않았거나 기준일 이후에 탈퇴한 멤버
    SELECT count(*)::integer INTO v_member_count
    FROM mmcheck.tbl_project_members
    WHERE project_id = p_project_id
      AND joined_at::date <= p_date
      AND (deleted_at IS NULL OR deleted_at::date > p_date);

    -- 2. 해당 날짜의 체크인 정보 계산
    SELECT 
        count(*)::integer,
        COALESCE(avg(condition), 0)::numeric(3,1)
    INTO v_check_in_count, v_avg_condition
    FROM mmcheck.tbl_project_check_ins
    WHERE project_id = p_project_id
      AND check_in_date = p_date;

    -- 3. 참여율 계산 (분모가 0인 경우 대비)
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

-- 4. 트리거용 함수 (멤버 변경 시)
CREATE OR REPLACE FUNCTION mmcheck.tr_sync_stats_on_member_change()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    -- 신규 멤버 추가 또는 소프트 삭제 시 오늘 날짜 통계 갱신
    IF (TG_OP = 'INSERT') THEN
        PERFORM mmcheck.fn_sync_daily_stats(NEW.project_id, CURRENT_DATE);
    ELSIF (TG_OP = 'UPDATE') THEN
        IF (OLD.deleted_at IS NULL AND NEW.deleted_at IS NOT NULL) OR (OLD.deleted_at IS NOT NULL AND NEW.deleted_at IS NULL) THEN
            PERFORM mmcheck.fn_sync_daily_stats(NEW.project_id, CURRENT_DATE);
        END IF;
    END IF;
    RETURN NULL;
END;
$$;

-- 5. 트리거용 함수 (체크인 변경 시)
CREATE OR REPLACE FUNCTION mmcheck.tr_sync_stats_on_checkin_change()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    IF (TG_OP = 'INSERT' OR TG_OP = 'UPDATE') THEN
        PERFORM mmcheck.fn_sync_daily_stats(NEW.project_id, NEW.check_in_date);
    ELSIF (TG_OP = 'DELETE') THEN
        PERFORM mmcheck.fn_sync_daily_stats(OLD.project_id, OLD.check_in_date);
    END IF;
    RETURN NULL;
END;
$$;

-- 6. 트리거 적용
DROP TRIGGER IF EXISTS tr_member_change_sync_stats ON mmcheck.tbl_project_members;
CREATE TRIGGER tr_member_change_sync_stats
AFTER INSERT OR UPDATE ON mmcheck.tbl_project_members
FOR EACH ROW EXECUTE FUNCTION mmcheck.tr_sync_stats_on_member_change();

DROP TRIGGER IF EXISTS tr_checkin_change_sync_stats ON mmcheck.tbl_project_check_ins;
CREATE TRIGGER tr_checkin_change_sync_stats
AFTER INSERT OR UPDATE OR DELETE ON mmcheck.tbl_project_check_ins
FOR EACH ROW EXECUTE FUNCTION mmcheck.tr_sync_stats_on_checkin_change();

-- 7. RLS 설정
ALTER TABLE mmcheck.tbl_project_daily_stats ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read for authenticated users" ON mmcheck.tbl_project_daily_stats
    FOR SELECT TO authenticated USING (true);

-- 8. 권한 부여
GRANT ALL ON mmcheck.tbl_project_daily_stats TO authenticated;
GRANT EXECUTE ON FUNCTION mmcheck.fn_sync_daily_stats(uuid, date) TO authenticated;

-- 9. 코멘트 추가
COMMENT ON TABLE mmcheck.tbl_project_daily_stats IS '프로젝트별 일일 통계 스냅샷 테이블';
COMMENT ON COLUMN mmcheck.tbl_project_daily_stats.participation_rate IS '참여율 (체크인 수 / 활성 멤버 수 * 100)';

-- 10. 배치 통계 동기화 기능 (pg_cron용)
-- 모든 활성 프로젝트의 통계를 한 번에 동기화합니다.
CREATE OR REPLACE FUNCTION mmcheck.fn_sync_all_projects_daily_stats(p_date date)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    r record;
BEGIN
    FOR r IN SELECT id FROM mmcheck.tbl_project WHERE deleted_at IS NULL LOOP
        PERFORM mmcheck.fn_sync_daily_stats(r.id, p_date);
    END LOOP;
END;
$$;

-- 11. 한국 시간 매일 00:00 (UTC 15:00)에 실행 예약
-- '0 15 * * *' -> 매일 15시 00분 (UTC) = 익일 00시 00분 (KST)
-- 주의: Supabase 대시보드에서 pg_cron 활성화가 필요할 수 있습니다.
SELECT cron.schedule(
    'sync-daily-stats-at-midnight-kst',
    '0 15 * * *',
    'SELECT mmcheck.fn_sync_all_projects_daily_stats(CURRENT_DATE)'
);

COMMENT ON FUNCTION mmcheck.fn_sync_all_projects_daily_stats(date) IS '모든 활성 프로젝트의 일일 통계를 일괄 동기화하는 배치 함수';
