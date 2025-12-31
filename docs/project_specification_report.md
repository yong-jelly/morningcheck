# 팀 컨디션 체크인 웹 애플리케이션 - 프로젝트 명세 리포트

**문서 작성일**: 2025년 12월 31일  
**프로젝트 타입**: React 기반 Team Condition Check-In System  
**주요 기술 스택**: TypeScript, React 18, Tailwind CSS, Recharts, Framer Motion

---

## 목차
1. [프로젝트 개요](#프로젝트-개요)
2. [시스템 아키텍처](#시스템-아키텍처)
3. [주요 컴포넌트 분석](#주요-컴포넌트-분석)
4. [기능 명세](#기능-명세)
5. [UI/UX 설계](#uiux-설계)
6. [디자인 시스템](#디자인-시스템)
7. [상태 관리 및 데이터 흐름](#상태-관리-및-데이터-흐름)
8. [기술적 특성](#기술적-특성)

---

## 프로젝트 개요

### 프로젝트 목표
팀 멤버들의 일일 컨디션(상태)을 체계적으로 기록하고 관리하며, 팀 차원의 건강 상태를 시각화하는 웹 기반 협업 플랫폼

### 핵심 가치
- **투명한 소통**: 팀 멤버들이 서로의 컨디션을 공유하여 상호 이해도 향상
- **데이터 기반 관리**: 컨디션 추이를 차트로 시각화하여 팀 건강도 모니터링
- **간편한 협업**: 초대 코드 기반의 프로젝트 참여로 쉬운 팀 구성
- **개인 추적**: 개인별 컨디션 변화를 추적하여 자기관리 지원

### 대상 사용자
- IT 팀, 스타트업, 협업 조직의 팀 리더 및 멤버
- 팀 건강도를 중시하는 조직

---

## 시스템 아키텍처

### 전체 구조도
```
┌─────────────────────────────────────────────────────────┐
│              Landing Page / Project List                 │
│  (사용자 진입점, 프로젝트 관리)                          │
└────────────────────┬────────────────────────────────────┘
                     │
       ┌─────────────┴──────────────┐
       │                            │
    [Join]                      [Create]
    기존 프로젝트                신규 프로젝트
    참여 (초대코드)             생성
       │                            │
       └─────────────┬──────────────┘
                     │
        ┌────────────▼────────────┐
        │  Dashboard Layout       │
        │  (네비게이션 & UI)      │
        └────────────┬────────────┘
                     │
    ┌────────────────┼────────────────┐
    │                │                │
[Daily Check-In]  [Team Dashboard]  [My History]
 (일일 입력)       (팀 분석)         (개인 분석)
```

### 데이터 모델

#### User 타입
```typescript
interface User {
  id: string;           // 사용자 고유 ID
  name: string;         // 사용자 이름
  // 추가 필드: 이메일, 프로필 등
}
```

#### Project 타입
```typescript
interface Project {
  id: string;           // 프로젝트 ID
  name: string;         // 프로젝트명
  inviteCode: string;   // 팀 참여용 초대 코드
  members: User[];      // 팀 멤버 배열
  checkIns: CheckIn[];  // 일일 체크인 기록
  createdBy: string;    // 생성자 ID
  createdAt: string;    // 생성 날짜
}
```

#### CheckIn 타입
```typescript
interface CheckIn {
  id: string;           // 체크인 ID
  userId: string;       // 사용자 ID
  date: string;         // 기록 날짜 (yyyy-MM-dd)
  condition: number;    // 컨디션 점수 (1-10)
  note: string;         // 선택 메모
  createdAt: string;    // 기록 생성 시간
}
```

---

## 주요 컴포넌트 분석

### 1. LandingPage.tsx
**담당 역할**: 애플리케이션 진입점, 사용자 인증 및 프로젝트 선택

#### Props
```typescript
interface LandingPageProps {
  onJoin: (name: string, code: string) => void;      // 기존 프로젝트 참여
  onCreate: (projectName: string, userName: string) => void;  // 신규 프로젝트 생성
}
```

#### 상태 관리
- `mode`: 'welcome' | 'join' | 'create' - 현재 보여지는 화면 모드
- `name`: 사용자 이름 입력값
- `code`: 초대 코드 입력값
- `projectName`: 프로젝트명 입력값

#### 주요 기능
1. **Welcome 화면**
   - 앱 소개 및 프로젝트 선택 버튼 표시
   - "프로젝트 참여" 또는 "프로젝트 생성" 선택

2. **Join 화면**
   - 사용자명 입력 필드
   - 초대 코드 입력 필드
   - 유효성 검사 (공백 체크)
   - 참여 버튼 클릭 시 onJoin 콜백 실행

3. **Create 화면**
   - 사용자명 입력 필드
   - 프로젝트명 입력 필드
   - 생성 버튼 클릭 시 onCreate 콜백 실행

#### UI/애니메이션
- Framer Motion 라이브러리를 사용한 부드러운 전환 애니메이션
- 모드별 조건부 렌더링

---

### 2. ProjectList.tsx
**담당 역할**: 사용자가 참여 중인 프로젝트 목록 표시 및 관리

#### Props
```typescript
interface ProjectListProps {
  currentUser: User;                    // 현재 로그인 사용자
  projects: Project[];                  // 사용자가 참여한 프로젝트 배열
  onSelectProject: (project: Project) => void;  // 프로젝트 선택 콜백
  onCreateProject: (name: string) => void;     // 프로젝트 생성 콜백
  onJoinProject: (code: string) => void;       // 프로젝트 참여 콜백
}
```

#### 상태 관리
- `newProjectName`: 신규 프로젝트명 입력값
- `inviteCode`: 초대 코드 입력값
- `isCreateOpen`: 신규 프로젝트 생성 모달 오픈 여부
- `isJoinOpen`: 프로젝트 참여 모달 오픈 여부

#### 주요 기능
1. **프로젝트 목록**
   - 현재 사용자가 참여한 모든 프로젝트 카드 표시
   - 각 프로젝트 카드에 아이콘, 이름, 팀원 수, 최근 체크인 정보 표시
   - 프로젝트 클릭 시 해당 프로젝트 대시보드로 이동

2. **신규 프로젝트 생성**
   - "새 프로젝트 만들기" 버튼으로 모달 오픈
   - 프로젝트명 입력 후 생성
   - 생성 후 모달 자동 닫기 및 입력값 초기화

3. **기존 프로젝트 참여**
   - "프로젝트 참여" 버튼으로 모달 오픈
   - 초대 코드 입력 후 참여
   - 참여 후 모달 자동 닫기

#### UI 요소
- Dialog 컴포넌트를 사용한 모달
- Input, Label 컴포넌트 활용
- Motion 애니메이션으로 프로젝트 카드 표시

---

### 3. DailyCheckIn.tsx
**담당 역할**: 사용자의 일일 컨디션 기록 및 팀 멤버 현황 표시

#### Props
```typescript
interface DailyCheckInProps {
  currentUser: User;              // 현재 로그인 사용자
  project: Project;               // 현재 프로젝트
  onCheckIn: (condition: number, note: string) => void;  // 체크인 저장 콜백
}
```

#### 상태 관리
- `condition`: 컨디션 점수 (1-10, 기본값: 5)
- `note`: 선택 메모 텍스트
- `isSubmitting`: 제출 중 여부 (UI 피드백용)

#### 주요 기능
1. **체크인 입력 화면** (미입력 상태)
   - 제목 및 설명 텍스트
   - 컨디션 점수 선택 (1-10 슬라이더)
   - 선택된 점수에 따른 라벨 표시
     - 10점: "최상"
     - 8-9점: "좋음"
     - 6-7점: "보통"
     - 4-5점: "조금 피곤"
     - 1-3점: "나쁨"
   - 색상 코딩 (빨강 → 주황 → 초록)
   - 선택 메모 입력 필드
   - 제출 버튼

2. **완료 상태 표시** (체크인 완료 후)
   - 오늘 등록한 체크인 정보 표시
   - 컨디션 점수와 메모 표시
   - "다시 수정" 옵션

3. **팀 멤버 체크인 현황**
   - 오늘 다른 팀 멤버들의 체크인 목록
   - 각 멤버의 이름, 컨디션 점수, 메모 표시
   - 카드형 UI로 정보 표현
   - 미참여 팀원에 대한 안내 메시지

#### 색상 시스템
```
점수 범위    | 텍스트색       | 배경색        | 테두리색
─────────────────────────────────────────────────
8-10점      | text-green-600 | bg-green-50   | border-green-100
5-7점       | text-orange-600| bg-orange-50  | border-orange-100
1-4점       | text-red-600   | bg-red-50     | border-red-100
```

#### UI 특징
- 슬라이더에 그래디언트 스타일 적용 (빨강 → 주황 → 초록)
- Motion 애니메이션으로 부드러운 전환
- Quote 아이콘으로 메모 표시
- CheckCircle2 아이콘으로 완료 상태 표현

---

### 4. TeamDashboard.tsx
**담당 역할**: 팀 전체의 컨디션 통계 및 추이 분석

#### Props
```typescript
interface TeamDashboardProps {
  project: Project;  // 현재 프로젝트
}
```

#### 데이터 계산 로직

1. **일일 평균값 계산** (최근 7일)
   ```typescript
   dailyData = Array.from({ length: 7 }).map((_, i) => {
     // 해당 날짜의 모든 체크인 가져오기
     // 평균값 계산 (소수점 1자리)
     // 오늘 기준으로 과거 6일까지 포함
   })
   ```

2. **오늘 분포 분석**
   - 좋음 (8-10점): 초록색
   - 보통 (5-7점): 주황색
   - 나쁨 (1-4점): 빨강색

3. **참여율 계산**
   ```typescript
   (오늘 체크인 수 / 전체 팀원 수) × 100
   ```

#### 주요 기능
1. **오늘 평균 컨디션**
   - 오늘 전체 팀 멤버의 평균 컨디션 점수 표시
   - 소수점 1자리까지 표현

2. **팀 참여율**
   - 오늘 체크인한 팀원 수와 전체 팀원 수 표시
   - 참여율 백분율 계산

3. **오늘 날짜**
   - 현지화된 날짜 표시 (예: 12월 31일 수요일)
   - date-fns 라이브러리의 ko(한국어) 로케일 사용

4. **추이 차트** (라인 차트)
   - 최근 7일간의 일일 평균값 표시
   - X축: 날짜 (MM/dd 형식)
   - Y축: 평균 컨디션 점수
   - 부드러운 곡선으로 표현

5. **오늘 분포** (바 차트)
   - 세 가지 카테고리별 팀원 수 표시
   - 색상으로 구분된 바 차트
   - 범례 표시

#### 차트 라이브러리
- Recharts: 반응형 차트 컴포넌트
- ResponsiveContainer: 화면 크기에 자동 조정
- LineChart, BarChart, Line, Bar, Cell 등 사용

---

### 5. MyHistory.tsx
**담당 역할**: 사용자 개인의 컨디션 추이 분석

#### Props
```typescript
interface MyHistoryProps {
  currentUser: User;  // 현재 로그인 사용자
  project: Project;   // 현재 프로젝트
}
```

#### 데이터 계산 로직

1. **개인 체크인 필터링**
   ```typescript
   myChecks = project.checkIns.filter(c => c.userId === currentUser.id)
   ```

2. **통계 계산**
   - **총 기록 횟수**: myChecks 배열의 길이
   - **평균 컨디션**: 모든 컨디션 점수의 평균값
   - **연속 기록** (스트릭): 가장 최근부터 역순으로 연속된 날짜 수 계산

3. **연속 기록 알고리즘**
   - 과거 30일까지 검사
   - 오늘이 체크인되지 않았으면 어제부터 시작
   - 연속된 날에 체크인이 없으면 스트릭 종료

4. **차트 데이터** (최근 14일)
   ```typescript
   chartData = Array.from({ length: 14 }).map((_, i) => {
     // 각 날짜별로 체크인 데이터 조회
     // 없으면 null 값으로 처리 (차트에 표시 안함)
   })
   ```

#### 주요 기능
1. **통계 카드 표시**
   - **나의 평균 컨디션**: 소수점 1자리까지
   - **현재 연속 기록**: XX일 형식
   - **총 기록 횟수**: XX회 형식

2. **개인 추이 차트** (라인 차트)
   - 최근 14일간의 컨디션 변화
   - X축: 날짜 (MM/dd 형식)
   - Y축: 컨디션 점수 (1-10)

3. **Tooltip 정보**
   - 마우스 호버 시 해당 날짜의 상세 정보 표시
   - 컨디션 점수와 메모 함께 표시
   - 메모가 없으면 "메모 없음" 표시

#### 아이콘 사용
- TrendingUp: 추이 변화
- Award: 성취감
- CalendarClock: 일일 기록

---

### 6. DashboardLayout.tsx
**담당 역할**: 대시보드 네비게이션 및 프로젝트 정보 표시

#### Props
```typescript
interface DashboardLayoutProps {
  children: React.ReactNode;                              // 메인 콘텐츠
  currentView: 'checkin' | 'dashboard' | 'history';      // 현재 탭
  onNavigate: (view: 'checkin' | 'dashboard' | 'history') => void;  // 탭 변경
  projectName: string;                                    // 프로젝트명
  inviteCode: string;                                     // 초대 코드
  userName: string;                                       // 사용자명
  onLogout: () => void;                                   // 로그아웃 콜백
  onBackToProjects: () => void;                          // 프로젝트 목록으로 돌아가기
}
```

#### 상태 관리
- `isMobileMenuOpen`: 모바일 메뉴 오픈 여부

#### 주요 기능
1. **네비게이션 탭**
   - Daily Check-In (Calendar 아이콘)
   - Team Dashboard (BarChart2 아이콘)
   - My History (User 아이콘)
   - 현재 탭은 활성화 상태로 표시

2. **초대 코드 복사 기능**
   - 초대 코드 표시 영역
   - Copy 버튼 클릭 시 클립보드 복사
   - 다단계 폴백 처리:
     1. 네이티브 `navigator.clipboard` 시도
     2. 모바일 환경에서는 `navigator.share` 우선 시도
     3. 제한된 환경에서는 textarea 활용한 수동 복사
   - Toast 알림으로 성공/실패 표시
   - Sonner 라이브러리 사용

3. **모바일 반응형 메뉴**
   - Desktop: 상단 네비게이션 바
   - Mobile: Menu/X 아이콘으로 토글 메뉴
   - 메뉴 아이템 동적 렌더링

4. **사용자 정보 섹션**
   - 프로젝트명 표시
   - 현재 사용자명 표시
   - 뒤로 가기 버튼 (프로젝트 목록으로)
   - 로그아웃 버튼

#### 텍스트 스타일 활용
- `clsx` 라이브러리로 조건부 클래스 적용
- 활성 탭과 비활성 탭 구분

---

### 7. ImageWithFallback.tsx
**담당 역할**: 이미지 로드 실패 시 폴백 처리

#### Props
```typescript
React.ImgHTMLAttributes  // 표준 img 태그 속성
```

#### 기능
1. **이미지 로드 실패 감지**
   - onError 이벤트 리스너 등록
   - 실패 시 `didError` 상태를 true로 변경

2. **폴백 이미지**
   - Base64 인코딩된 SVG 사용 (사진 아이콘 모양)
   - 외부 파일 로드 불필요
   - 일관된 시각적 피드백

3. **조건부 렌더링**
   - 로드 실패 시 SVG 폴백 이미지 표시
   - 정상 로드 시 원본 이미지 표시

#### SVG 폴백 디자인
- 88x88 픽셀 크기
- 테두리 있는 사각형 + 산 아이콘 모양
- 회색 스트로크 (opacity: 0.3)
- 접근성 고려 (alt 텍스트 전달)

---

### 8. Carousel.tsx
**담당 역할**: 수평/수직 캐러셀 UI 컴포넌트

#### 주요 특징
1. **Embla Carousel 라이브러리 활용**
   - 경량 캐러셀 솔루션
   - 부드러운 스크롤 애니메이션
   - 모바일 터치 지원

2. **Context API 기반 구조**
   - CarouselContext로 상태 관리
   - useCarousel 커스텀 훅으로 자식 컴포넌트 연결

3. **방향 지원**
   - 수평 모드 (기본값)
   - 수직 모드
   - `orientation` prop으로 제어

4. **네비게이션 제어**
   - 이전/다음 버튼
   - 스크롤 가능 여부 추적
   - 비활성 상태 표시

5. **키보드 지원**
   - 좌측/우측 화살표 키로 네비게이션

---

## 기능 명세

### 1. 사용자 인증 및 프로젝트 관리

#### 1.1 프로젝트 생성
**시나리오**: 새로운 팀 프로젝트 시작
1. Landing Page에서 "프로젝트 만들기" 선택
2. 사용자명 입력 (필수)
3. 프로젝트명 입력 (필수)
4. 생성 버튼 클릭
5. 새 프로젝트 및 초대 코드 자동 생성
6. 프로젝트 대시보드로 이동

**데이터 처리**:
- 프로젝트 ID: UUID 또는 임의 생성
- 초대 코드: 8-10자 알파벳/숫자 조합
- 생성자: 현재 사용자로 설정
- 초기 멤버: 생성자 포함

#### 1.2 프로젝트 참여
**시나리오**: 기존 팀 프로젝트에 참여
1. Landing Page에서 "프로젝트 참여" 선택
2. 사용자명 입력 (필수)
3. 초대 코드 입력 (필수, 6자 이상 권장)
4. 참여 버튼 클릭
5. 프로젝트 검증 및 멤버 추가
6. 프로젝트 대시보드로 이동

**검증 규칙**:
- 초대 코드 유효성 확인
- 중복 참여 방지 (같은 사용자)
- 코드 존재 여부 확인

#### 1.3 프로젝트 목록 관리
**기능**:
- 사용자가 참여한 모든 프로젝트 나열
- 프로젝트별 팀원 수, 최근 활동 표시
- 프로젝트 선택으로 상세 대시보드 이동
- 모바일/데스크톱 반응형 레이아웃

---

### 2. 일일 컨디션 체크인

#### 2.1 체크인 입력
**시나리오**: 일일 컨디션 기록
1. Daily Check-In 탭 접근
2. 컨디션 점수 선택 (1-10 슬라이더)
3. 선택 메모 입력 (선택)
4. 제출 버튼 클릭
5. 체크인 저장 및 UI 업데이트

**점수 기준**:
```
10점    : 최상
8-9점   : 좋음
6-7점   : 보통
4-5점   : 조금 피곤
1-3점   : 나쁨
```

**기술적 구현**:
- 슬라이더 min=1, max=10, step=1
- 실시간 라벨 업데이트
- 슬라이더 색상: 그래디언트 (red → orange → green)
- 제출 시 500ms 로딩 애니메이션

#### 2.2 체크인 상태 표시
**입력 전**: 입력 폼 표시
**입력 후**: 
- 저장된 컨디션 정보 표시
- 수정 불가 상태 (재입력 위해 재로드 필요)
- 팀 멤버 현황 표시

#### 2.3 팀 멤버 현황
**표시 정보**:
- 오늘 체크인한 모든 팀 멤버 목록
- 각 멤버의 이름, 컨디션 점수, 메모
- 카드형 UI로 구성
- 미참여 멤버에 대한 안내

---

### 3. 팀 대시보드 및 분석

#### 3.1 팀 통계
**표시 항목**:
1. **오늘 평균 컨디션**
   - 계산식: (모든 체크인 컨디션 합) / (체크인 수)
   - 소수점 1자리 반올림
   - 체크인 0건 시 '-' 표시

2. **팀 참여율**
   - 계산식: (오늘 체크인 수) / (전체 멤버 수) × 100
   - 백분율 및 분자/분모 표시
   - 예: "80% (8/10)"

3. **오늘 날짜**
   - 한국어 현지화 날짜 (예: "12월 31일 수요일")
   - date-fns의 ko 로케일 사용

#### 3.2 추이 분석
**라인 차트** (최근 7일):
- X축: 날짜 (MM/dd 형식)
- Y축: 일일 평균 컨디션
- 데이터 포인트: 매일 자정 기준 계산
- 비활성 날짜: null로 처리하여 선 끊김

**바 차트** (오늘 분포):
- 좋음 (8-10점): 초록색 (#22c55e)
- 보통 (5-7점): 주황색 (#f97316)
- 나쁨 (1-4점): 빨강색 (#ef4444)
- 카테고리별 인원수 표시
- 색상 범례 포함

#### 3.3 차트 기술 스택
- Recharts 라이브러리
- ResponsiveContainer: 반응형 크기 조정
- Tooltip: 호버 시 상세 정보 표시
- CartesianGrid: 배경 그리드

---

### 4. 개인 분석 (My History)

#### 4.1 개인 통계
**표시 항목**:
1. **나의 평균 컨디션**
   - 현재 사용자의 모든 체크인 평균값
   - 소수점 1자리 반올림

2. **현재 연속 기록**
   - 최근부터 역순으로 연속된 체크인 날짜 수
   - 최대 30일까지 추적

3. **총 기록 횟수**
   - 현재 사용자의 누적 체크인 수

#### 4.2 개인 추이 차트
**라인 차트** (최근 14일):
- 기간: 현재 날짜로부터 과거 14일
- X축: 날짜 (MM/dd 형식)
- Y축: 컨디션 점수 (1-10)
- 데이터 포인트: 일일 1개 (중복 무시)

**Tooltip 정보**:
- 날짜
- 컨디션 점수
- 메모 (있으면 표시, 없으면 "메모 없음")

---

### 5. 프로젝트 협업 기능

#### 5.1 초대 코드 공유
**기능**:
- 프로젝트당 고유 초대 코드 할당
- 초대 코드 복사 기능
- 모바일 네이티브 공유 지원
- Toast 알림으로 피드백

**플로우**:
1. 초대 코드 복사 버튼 클릭
2. 다단계 폴백 처리:
   - 모바일 + navigator.share 지원 → 네이티브 공유 사용
   - 일반 환경 → clipboard API 사용
   - 제한 환경 → textarea 수동 복사
3. 성공 메시지: "초대 코드가 복사되었습니다"
4. 실패 메시지: "복사에 실패했습니다. 코드를 직접 복사해주세요."

#### 5.2 팀 멤버 관리
**표시 정보**:
- 팀 멤버 목록 (프로젝트별)
- 각 멤버의 최근 체크인 상태
- 참여 날짜

---

## UI/UX 설계

### 1. 색상 체계

#### 컨디션 점수별 색상
```
점수 범위  | 라벨        | 텍스트색       | 배경색        | 테두리색
─────────────────────────────────────────────────────────────
10점      | 최상        | text-green-600 | bg-green-50   | border-green-100
8-9점     | 좋음        | text-green-600 | bg-green-50   | border-green-100
6-7점     | 보통        | text-orange-600| bg-orange-50  | border-orange-100
4-5점     | 조금 피곤   | text-orange-600| bg-orange-50  | border-orange-100
1-3점     | 나쁨        | text-red-600   | bg-red-50     | border-red-100
```

#### 슬라이더 그래디언트
```css
background: linear-gradient(
  to right, 
  #fca5a5 0%,      /* 빨강 (나쁨) */
  #fb923c 50%,     /* 주황 (보통) */
  #86efac 100%     /* 초록 (좋음) */
)
```

#### 차트 색상
- 좋음: #22c55e (Tailwind green-500)
- 보통: #f97316 (Tailwind orange-500)
- 나쁨: #ef4444 (Tailwind red-500)

### 2. 레이아웃 구조

#### Desktop 레이아웃
```
┌─────────────────────────────────────────┐
│  Project Name  │  User Name  │ Log Out │
├─────────────────────────────────────────┤
│ Daily Check │ Team Dash │ My History    │
├─────────────────────────────────────────┤
│                                         │
│          Main Content Area              │
│         (선택한 탭의 내용)              │
│                                         │
└─────────────────────────────────────────┘
```

#### Mobile 레이아웃
```
┌─────────────────────┐
│ Menu │ Project │ X  │
├─────────────────────┤
│ Main Content Area   │
│  (전체 폭 사용)     │
└─────────────────────┘
```

### 3. 네비게이션 패턴

#### 주 네비게이션
- **Daily Check-In**: 일일 컨디션 입력 화면
- **Team Dashboard**: 팀 전체 분석 화면
- **My History**: 개인 분석 화면

#### 보조 네비게이션
- **Back to Projects**: 프로젝트 목록으로 복귀
- **Logout**: 로그아웃 및 랜딩 페이지로 이동

### 4. 애니메이션 및 트랜지션

#### Framer Motion 사용 사례
1. **LandingPage**: 화면 전환 애니메이션
2. **ProjectList**: 프로젝트 카드 스케일 애니메이션
3. **DailyCheckIn**: 카드 펼침 애니메이션

#### 기본 타이밍
- 페이드인: 300-500ms
- 스케일: 150-300ms
- 사라지기: 200ms

### 5. 반응형 디자인

#### Breakpoint (Tailwind CSS 기반)
- sm: 640px
- md: 768px
- lg: 1024px
- xl: 1280px

#### 반응형 전략
- Mobile first 접근
- Flex/Grid 레이아웃
- 터치 친화적 버튼 사이즈 (최소 44×44px)

---

## 디자인 시스템

### 1. 색상 변수 (theme.css)

#### Light Mode (기본값)
```css
--background: #ffffff;              /* 배경색 */
--foreground: oklch(0.145 0 0);     /* 전경색 (검정) */
--primary: #030213;                 /* 주요 색상 */
--secondary: oklch(0.95 0.0058);    /* 보조 색상 */
--muted: #ececf0;                   /* 연한 색상 */
--accent: #e9ebef;                  /* 강조 색상 */
--destructive: #d4183d;             /* 위험 (빨강) */
--border: rgba(0, 0, 0, 0.1);      /* 테두리 */
--input: transparent;               /* 입력 필드 */
--input-background: #f3f3f5;       /* 입력 배경 */
```

#### Dark Mode
```css
--background: oklch(0.145 0 0);     /* 검정 배경 */
--foreground: oklch(0.985 0 0);     /* 흰색 전경 */
--primary: oklch(0.985 0 0);        /* 흰색 주요 색상 */
--secondary: oklch(0.269 0 0);      /* 어두운 보조 색상 */
--muted: oklch(0.269 0 0);          /* 어두운 연한 색상 */
```

#### Chart 색상
```css
--chart-1: oklch(0.646 0.222 41.116);    /* 주황/황색 */
--chart-2: oklch(0.6 0.118 184.704);     /* 청색 */
--chart-3: oklch(0.398 0.07 227.392);    /* 남색 */
--chart-4: oklch(0.828 0.189 84.429);    /* 노랑 */
--chart-5: oklch(0.769 0.188 70.08);     /* 주황 */
```

### 2. 타이포그래피

#### 글꼴
- **기본 폰트**: 시스템 기본 (sans-serif)
- **Monospace**: 'Berkeley Mono', ui-monospace, SFMono-Regular

#### 폰트 사이즈
```css
--font-size: 16px;                  /* 기본 크기 */
/* Tailwind 변수 (text-sm, text-lg 등)와 연동 */
```

#### 폰트 두께
```css
--font-weight-normal: 400;
--font-weight-medium: 500;
--font-weight-semibold: 550;
--font-weight-bold: 600;
```

### 3. 공간 (Spacing)

#### Border Radius
```css
--radius: 0.625rem (10px);
--radius-sm: 6px;
--radius-md: 8px;
--radius-lg: 10px;
--radius-xl: 14px;
```

### 4. 조명 및 그림자

#### 그림자 (Shadow)
```css
--shadow-xs: 0 1px 2px rgba(0, 0, 0, 0.02);
--shadow-sm: 0 1px 3px rgba(0, 0, 0, 0.04), ...;
--shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.04), ...;
--shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.04), ...;
```

### 5. Sidebar 테마 (옵션)
```css
--sidebar: oklch(0.985 0 0);                 /* 배경 */
--sidebar-foreground: oklch(0.145 0 0);      /* 텍스트 */
--sidebar-primary: #030213;                  /* 주요 색 */
--sidebar-border: oklch(0.922 0 0);         /* 테두리 */
```

---

## 상태 관리 및 데이터 흐름

### 1. Props 기반 상태 관리

현재 프로젝트는 **Props Drilling** 방식 사용:
```
App (또는 최상위 컴포넌트)
  ├─ state: currentUser, projects, currentProject
  ├─ LandingPage (onJoin, onCreate 콜백)
  ├─ ProjectList (projects, onSelectProject)
  └─ DashboardLayout
      ├─ DailyCheckIn (project, onCheckIn)
      ├─ TeamDashboard (project)
      └─ MyHistory (currentUser, project)
```

### 2. 데이터 흐름

#### 프로젝트 생성 흐름
```
User Input (LandingPage)
  ↓
onCreate(projectName, userName)
  ↓
Create new Project object
  ↓
Generate unique inviteCode
  ↓
Add user as creator
  ↓
Save to state/backend
  ↓
Navigate to ProjectList
```

#### 체크인 입력 흐름
```
User Input (DailyCheckIn)
  ↓
Select condition (1-10)
  ↓
Enter optional note
  ↓
Submit button click
  ↓
onCheckIn(condition, note) callback
  ↓
Create CheckIn object with:
  - userId: currentUser.id
  - date: today (yyyy-MM-dd)
  - condition: selected value
  - note: user input
  ↓
Add to project.checkIns
  ↓
Update UI to show confirmation
```

### 3. 컴포넌트 간 통신

#### 부모 → 자식 (Props)
```typescript
<DailyCheckIn 
  currentUser={user}
  project={project}
  onCheckIn={handleCheckIn}
/>
```

#### 자식 → 부모 (Callbacks)
```typescript
const handleCheckIn = (condition: number, note: string) => {
  // 1. 유효성 검사
  // 2. 새 CheckIn 객체 생성
  // 3. project.checkIns에 추가
  // 4. 상태 업데이트
  // 5. UI 리렌더링
}
```

### 4. 로컬 상태 vs 글로벌 상태

#### 로컬 상태 (useState)
각 컴포넌트의 UI 상태:
- 입력 필드 값
- 모달 오픈/닫기
- 로딩 상태
- 메뉴 토글 상태

#### 글로벌 상태 (Props 또는 Context)
앱 전체에서 공유되는 상태:
- 현재 사용자
- 프로젝트 목록
- 현재 선택된 프로젝트
- 체크인 데이터

---

## 기술적 특성

### 1. 의존성 및 라이브러리

#### Core Framework
- **React 18**: UI 라이브러리
- **TypeScript**: 정적 타입 체크

#### UI & Styling
- **Tailwind CSS**: 유틸리티 CSS 프레임워크
- **Framer Motion**: 애니메이션 라이브러리
- **Lucide React**: 아이콘 라이브러리 (50+ 아이콘)

#### 데이터 시각화
- **Recharts**: React용 차트 라이브러리
  - LineChart (추이 분석)
  - BarChart (분포 분석)
  - ResponsiveContainer (반응형)

#### 날짜 및 시간
- **date-fns**: 날짜 유틸리티
  - `format()`: 날짜 포맷팅
  - `subDays()`: 과거 날짜 계산
  - `ko` 로케일: 한국어 지원

#### UI 컴포넌트
- **Carousel** (Embla 기반)
- **Dialog/Modal**: 프로젝트 생성/참여
- **Input/Label**: 폼 요소
- **Button/Card**: 기본 컴포넌트
- **Toast/Notification**: Sonner

#### 유틸리티
- **clsx**: 조건부 클래스명 생성
- **cn()** (utils): Tailwind 클래스 병합

### 2. 파일 구조

```
├── components/
│   ├── LandingPage.tsx          // 진입점
│   ├── ProjectList.tsx          // 프로젝트 관리
│   ├── DashboardLayout.tsx      // 네비게이션
│   ├── DailyCheckIn.tsx         // 체크인 입력
│   ├── TeamDashboard.tsx        // 팀 분석
│   ├── MyHistory.tsx            // 개인 분석
│   ├── ImageWithFallback.tsx    // 이미지 폴백
│   ├── carousel.tsx             // 캐러셀 UI
│   └── ui/
│       ├── card.tsx
│       ├── button.tsx
│       ├── dialog.tsx
│       ├── input.tsx
│       └── label.tsx
├── styles/
│   ├── theme.css               // 디자인 시스템
│   ├── index.css              // 글로벌 스타일
│   └── tailwind.css           // Tailwind 설정
├── types/
│   └── index.ts               // TypeScript 인터페이스
└── utils/
    └── utils.ts               // 유틸리티 함수
```

### 3. TypeScript 인터페이스

```typescript
interface User {
  id: string;
  name: string;
}

interface Project {
  id: string;
  name: string;
  inviteCode: string;
  members: User[];
  checkIns: CheckIn[];
  createdBy: string;
  createdAt: string;
}

interface CheckIn {
  id: string;
  userId: string;
  date: string;           // yyyy-MM-dd
  condition: number;      // 1-10
  note: string;
  createdAt: string;
}
```

### 4. 성능 최적화

#### 렌더링 최적화
- React.memo 사용 (필요시)
- useCallback으로 콜백 메모이제이션
- useEffect 의존성 배열 최적화

#### 번들 최적화
- 코드 스플리팅
- 동적 임포트
- 트리 쉐이킹

#### 네트워크 최적화
- 이미지 폴백 (ImageWithFallback)
- Base64 인코딩 폴백 이미지
- 최소화된 SVG 사용

### 5. 접근성 (Accessibility)

#### WCAG 준수
- 의미 있는 HTML 구조
- alt 텍스트 제공
- 색상 대비 충분함
- 포커스 관리

#### 키보드 네비게이션
- Tab 키로 포커스 이동
- Enter 키로 액션 실행
- Escape 키로 모달 닫기
- 캐러셀 좌/우 화살표 지원

#### 스크린 리더
- aria-label, aria-describedby 사용
- 의미 있는 버튼 텍스트
- 폼 레이블 연결

### 6. 브라우저 지원

#### 지원 대상
- Chrome/Edge (최신 2 버전)
- Firefox (최신 2 버전)
- Safari (최신 2 버전)
- Mobile Safari (iOS 12+)
- Chrome Mobile (최신)

#### 폴백 처리
- 클립보드 복사 (3단계 폴백)
- 이미지 로드 실패
- 캐러셀 브라우저 호환성

### 7. 환경 변수 (예상)

```env
# API 엔드포인트 (필요시)
REACT_APP_API_URL=https://api.example.com

# 테마 설정
REACT_APP_DEFAULT_THEME=light

# 분석 추적
REACT_APP_ANALYTICS_ID=

# 환경 구분
REACT_APP_ENV=production
```

### 8. 빌드 및 배포

#### 빌드 커맨드
```bash
npm run build      # 프로덕션 빌드
npm run dev        # 개발 서버
npm run test       # 테스트 실행
npm run lint       # 린트 검사
```

#### 배포 전략
- Static Site Hosting (Vercel, Netlify, GitHub Pages)
- Docker 컨테이너화 (선택)
- CDN 캐싱
- 버전 관리

---

## 주요 사용 사례 (Use Cases)

### 1. 신규 팀 설립
**배경**: 새로운 프로젝트팀이 구성됨

**프로세스**:
1. 팀 리더가 "프로젝트 만들기" 선택
2. 프로젝트명 입력 및 생성
3. 초대 코드 발급 및 팀원에게 공유
4. 각 팀원이 초대 코드로 참여
5. 매일 Daily Check-In으로 팀 모니터링

**예상 기간**: 5분 (프로젝트 생성 및 초대)

### 2. 일일 컨디션 관리
**배경**: 팀이 매일 아침 건강 체크

**프로세스**:
1. 각 팀원이 Daily Check-In 탭 접근
2. 현재 컨디션 점수 선택 (슬라이더)
3. 필요시 메모 작성 (예: "어제 야근함", "감기 초기 증상")
4. 제출 완료
5. 다른 팀원들의 현황 확인

**예상 시간**: 30초/인

### 3. 팀 건강도 모니터링
**배경**: 팀 리더가 팀 상태 파악 필요

**프로세스**:
1. Team Dashboard 탭 접근
2. 오늘 평균 컨디션 확인
3. 팀 참여율 확인
4. 7일 추이 차트로 트렌드 분석
5. 필요시 팀원 격려 또는 휴식 권장

**인사이트 예시**:
- "평균 5.2점으로 최근 낮은 추세"
- "오늘 참여율 60% (일부 팀원 미참여)"
- "지난주 평균 7.1점에서 8.5점으로 개선"

### 4. 개인 건강 추적
**배경**: 개인이 자신의 패턴 파악

**프로세스**:
1. My History 탭 접근
2. 평균 컨디션 확인 (예: 6.8점)
3. 현재 연속 기록 확인 (예: 23일)
4. 14일 차트로 자신의 추이 분석
5. 개선 계획 수립

**패턴 인식 예시**:
- "월요일은 항상 낮은 점수"
- "주말 활동 후 월요일 개선"
- "스트레스 시기와 점수 저하 연관"

---

## 기대 효과

### 1. 팀 소통 개선
- 투명한 건강 상태 공유로 상호 이해 증진
- 조기 문제 감지 및 대응

### 2. 건강 관리
- 체계적인 건강 상태 추적
- 개인별 패턴 인식
- 예방 차원의 관리

### 3. 조직 문화
- 팀 멤버 웰빙 중시 문화 형성
- 심리 안전도 향상
- 생산성 향상 (건강한 팀)

### 4. 데이터 기반 관리
- 객관적인 팀 상태 수치화
- 트렌드 분석 및 인사이트 도출
- 의사결정 근거 제공

---

## 확장 가능성 및 향후 개발 계획

### Phase 2 기능 (제안)
1. **백엔드 통합**
   - 데이터베이스 연동
   - 사용자 인증 (OAuth, JWT)
   - 실시간 동기화

2. **고급 분석**
   - 월간/분기별 리포트
   - 팀 내 비교 분석
   - 트렌드 예측

3. **알림 및 자동화**
   - 미입력 팀원 알림
   - 임계값 초과 시 알림
   - 정기 리포트 자동 생성

4. **소셜 기능**
   - 팀 채팅 통합
   - 댓글/코멘트
   - 응원 메시지

5. **모바일 앱**
   - React Native / Tauri
   - iOS/Android 네이티브 앱
   - 오프라인 지원

6. **AI 통합**
   - 건강도 예측
   - 개인화된 조언
   - 이상 탐지

---

## 결론

이 프로젝트는 **팀 웰빙 관리를 위한 현대적이고 사용자 친화적인 플랫폼**입니다. 

### 핵심 특징
✅ **직관적인 UX**: 간단한 입력과 명확한 시각화  
✅ **실시간 협업**: 초대 코드 기반의 팀 구성  
✅ **데이터 기반**: 차트와 통계로 인사이트 제공  
✅ **모바일 친화**: 반응형 디자인으로 언제 어디서나 접근  
✅ **확장 가능**: 향후 기능 추가를 고려한 구조  

### 기술 우수성
- TypeScript로 타입 안전성 보장
- React 18의 최신 기능 활용
- Tailwind CSS로 일관된 디자인
- Recharts로 전문적인 시각화
- 접근성 및 성능 고려

이러한 설계와 구현은 **중소 기업, 스타트업, IT팀** 등 다양한 조직에서 팀 건강도 관리를 위한 핵심 도구로 활용될 수 있습니다.

---

## 부록: 주요 기술 명령어

### 개발 환경 설정
```bash
# 프로젝트 초기화
npm init
npm install react @types/react typescript

# 필수 라이브러리
npm install date-fns recharts framer-motion lucide-react tailwindcss clsx
npm install sonner

# 개발 도구
npm install --save-dev tailwindcss postcss autoprefixer
npx tailwindcss init -p
```

### 실행 명령어
```bash
npm run dev          # 개발 서버 시작 (보통 localhost:3000)
npm run build        # 프로덕션 빌드
npm run preview      # 빌드 결과물 미리보기
npm run lint         # ESLint 검사
npm run type-check   # TypeScript 검사
```

---

**문서 버전**: 1.0  
**마지막 업데이트**: 2025년 12월 31일  
**작성자**: AI Assistant