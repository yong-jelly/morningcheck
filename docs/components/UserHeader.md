# UserHeader

로그인한 사용자의 프로필 정보, 오늘의 체크인 현황, 최근 체크인 히스토리를 보여주는 대시보드형 헤더 컴포넌트입니다.

## 주요 기능

- **프로필 요약**: 아바타, 인사말, 이름을 표시하며 클릭 시 `/profile`로 이동합니다.
- **알림**: 알림 아이콘과 읽지 않은 알림 표시를 제공합니다.
- **오늘의 요약 카드**: 오늘의 날짜, 날씨, 체크인 점수 및 노트를 시각적으로 보여줍니다. 체크인 점수에 따라 카드 색상이 변경됩니다.
- **데일리 체크인 그리드**: 최근 6일간의 체크인 점수를 그리드 형태로 보여줍니다.
- **스켈레톤 UI**: 데이터 로딩 중에는 `animate-pulse` 효과가 적용된 스켈레톤을 표시하여 UX를 개선합니다.

## Props

| Prop | Type | Description |
| :--- | :--- | :--- |
| `user` | `object \| null` | 사용자 프로필 정보 (`display_name`, `avatar_url`, `id`, `name`) |
| `todayCheckIn` | `CheckIn \| null` | 오늘의 체크인 데이터 |
| `checkInHistory` | `CheckIn[]` | 최근 체크인 히스토리 목록 (최근 6일 권장) |
| `weather` | `object \| null` | 날씨 정보 (`temp`, `code`) |
| `isLoading` | `boolean` | 로딩 상태 여부. `true`일 경우 스켈레톤 UI 노출 |

## 사용 예시

```tsx
<UserHeader 
  user={dbProfile}
  todayCheckIn={todayCheckIn}
  checkInHistory={checkInHistory}
  weather={weather}
  isLoading={isProfileLoading || isTodayCheckInLoading}
/>
```

## 스타일링

- **배경색**: 점수(`condition`)에 따라 `shared/lib/utils.ts`의 `getConditionColor` 함수를 사용하여 배경색이 결정됩니다.
  - 0-3: `#E15A5A` (Red)
  - 4-6: `#F19B4C` (Orange)
  - 7-8: `#5BB782` (Light Green)
  - 9-10: `#2FB06B` (Green)
- **다크 모드**: Tailwind CSS의 `dark:` 프리픽스를 사용하여 다크 모드를 지원합니다.
- **애니메이션**: `framer-motion`을 사용하여 카드가 부드럽게 나타나는 효과를 적용했습니다.
