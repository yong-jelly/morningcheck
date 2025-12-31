# ProjectCard Component

`ProjectCard`는 프로젝트 목록에서 개별 프로젝트를 표시하는 카드 컴포넌트입니다.

## 위치
`src/entities/project/ui/ProjectCard.tsx`

## Props

| Name | Type | Description |
| :--- | :--- | :--- |
| `project` | `Project` | 표시할 프로젝트 데이터 객체 |
| `index` | `number` | 리스트에서의 인덱스 (애니메이션 딜레이용) |
| `onClick` | `(projectId: string) => void` | 카드를 클릭했을 때의 핸들러 |
| `isInvitation` | `boolean` (optional) | 초대 상태인지 여부. `true`일 경우 수락 버튼이 노출될 수 있습니다. |
| `onAccept` | `(projectId: string) => void` (optional) | 초대 수락 버튼을 클릭했을 때의 핸들러 |

## 주요 기능
- 프로젝트 아이콘(이모지 또는 이미지) 표시
- 프로젝트 이름 및 초대 코드 표시
- 멤버 수, 오늘 평균 컨디션, 참여율 통계 표시
- `framer-motion`을 이용한 진입 애니메이션
- `isInvitation` 및 `onAccept`가 제공될 경우 '수락하기' 버튼 노출

## 사용 예시

```tsx
<ProjectCard
  project={project}
  index={index}
  onClick={(id) => console.log('Project clicked:', id)}
/>
```

초대 탭에서의 사용 예시:

```tsx
<ProjectCard
  project={project}
  index={index}
  onClick={handleProjectClick}
  isInvitation={true}
  onAccept={handleAcceptInvite}
/>
```
