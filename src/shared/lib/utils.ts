/**
 * 컨디션 점수에 따른 색상을 반환합니다.
 */
export function getConditionColor(score: number): string {
  if (score <= 3) return "#E15A5A";
  if (score <= 6) return "#F19B4C";
  if (score <= 8) return "#5BB782";
  return "#2FB06B";
}

/**
 * 숫자를 한국식 축약 형태로 포맷합니다.
 * 예: 1234 -> "1.2천", 12345 -> "1.2만"
 */
export function formatNumber(num: number): string {
  if (num >= 100000000) {
    return `${(num / 100000000).toFixed(1)}억`;
  }
  if (num >= 10000) {
    return `${(num / 10000).toFixed(1)}만`;
  }
  if (num >= 1000) {
    return `${(num / 1000).toFixed(1)}천`;
  }
  return num.toLocaleString("ko-KR");
}

/**
 * 좋아요 수를 k 단위로 포맷합니다.
 * 예: 0 -> "0", 100 -> "100", 1000 -> "1k", 1300 -> "1.3k", 15000 -> "15k"
 */
export function formatLikesCount(count: number): string {
  if (count === 0) {
    return "0";
  }
  if (count < 1000) {
    return count.toString();
  }
  const k = count / 1000;
  // 소수점이 0이면 정수로 표시 (예: 1k, 2k)
  if (k % 1 === 0) {
    return `${k}k`;
  }
  // 소수점이 있으면 한 자리까지 표시 (예: 1.3k, 2.5k)
  return `${k.toFixed(1)}k`;
}

/**
 * 날짜를 상대적 시간으로 포맷합니다.
 * 예: "방금 전", "5분 전", "3시간 전", "2일 전"
 */
export function formatRelativeTime(date: Date | string): string {
  const now = new Date();
  const target = typeof date === "string" ? new Date(date) : date;
  const diffMs = now.getTime() - target.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffSec < 60) return "방금 전";
  if (diffMin < 60) return `${diffMin}분 전`;
  if (diffHour < 24) return `${diffHour}시간 전`;
  if (diffDay < 7) return `${diffDay}일 전`;
  
  return target.toLocaleDateString("ko-KR");
}

/**
 * 날짜를 D-n 형식으로 포맷합니다.
 * 예: 오늘 -> "D-0", 내일 -> "D-1", 어제 -> "D+1", 3일 후 -> "D-3"
 * 
 * @param date - 목표 날짜 (Date 객체 또는 ISO 문자열)
 * @returns "D-n" 형식의 문자열 (n은 오늘 기준 일수 차이)
 */
export function formatDueDate(date: Date | string): string {
  const now = new Date();
  const target = typeof date === "string" ? new Date(date) : date;
  
  // 날짜만 비교 (시간 제외)
  const nowDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const targetDate = new Date(target.getFullYear(), target.getMonth(), target.getDate());
  
  const diffMs = targetDate.getTime() - nowDate.getTime();
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) {
    return "D-0";
  } else if (diffDays > 0) {
    return `D-${diffDays}`;
  } else {
    return `D+${Math.abs(diffDays)}`;
  }
}

/**
 * 날짜를 YY월DD일 형식으로 포맷합니다.
 * 예: "12월25일", "1월5일"
 * 
 * @param date - 날짜 (Date 객체 또는 ISO 문자열)
 * @returns "YY월DD일" 형식의 문자열
 */
export function formatDateShort(date: Date | string): string {
  const target = typeof date === "string" ? new Date(date) : date;
  const month = target.getMonth() + 1;
  const day = target.getDate();
  return `${month}월${day}일`;
}

/**
 * 현재 날짜를 YYYY-MM-DD 형식의 문자열로 반환합니다. (한국 시간 기준)
 */
export function getCurrentDateString(): string {
  const now = new Date();
  const kstOffset = 9 * 60 * 60 * 1000;
  const kstDate = new Date(now.getTime() + kstOffset);
  return kstDate.toISOString().split("T")[0];
}

/**
 * 어제 날짜를 YYYY-MM-DD 형식의 문자열로 반환합니다. (한국 시간 기준)
 */
export function getYesterdayDateString(): string {
  const now = new Date();
  const kstOffset = 9 * 60 * 60 * 1000;
  const kstDate = new Date(now.getTime() + kstOffset);
  kstDate.setDate(kstDate.getDate() - 1);
  return kstDate.toISOString().split("T")[0];
}

/**
 * 현재 시간을 ISO 8601 형식의 문자열로 반환합니다.
 * (클라이언트 시간 기준)
 */
export function getCurrentIsoString(): string {
  return new Date().toISOString();
}
