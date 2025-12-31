# Framer Motion 애니메이션 구현 가이드
## Apple Invites 앱을 위한 완전한 예제

---

## 1. 기본 설정 & 설치

### 패키지 설치
```bash
npm install framer-motion react-router-dom date-fns axios
```

### 전역 애니메이션 설정 파일
```javascript
// src/config/animations.js

export const EASING = {
  standard: [0.25, 0.46, 0.45, 0.94],  // iOS standard easing
  spring: { type: 'spring', stiffness: 120, damping: 14 },
  springSmooth: { type: 'spring', stiffness: 100, damping: 12 },
};

export const DURATION = {
  fast: 0.15,
  normal: 0.3,
  slow: 0.5,
};

export const TRANSITIONS = {
  page: {
    duration: DURATION.normal,
    ease: EASING.standard,
  },
  button: {
    type: 'spring',
    stiffness: 300,
    damping: 20,
  },
  smooth: {
    type: 'spring',
    stiffness: 100,
    damping: 12,
  },
};
```

---

## 2. 핵심 애니메이션 패턴

### 2.1 페이지 진입/종료 애니메이션

#### 페이드 + 슬라이드 업
```jsx
// animations/PageTransitions.jsx
import { motion } from 'framer-motion';
import { TRANSITIONS } from '../config/animations';

export const FadeInUp = ({ children, delay = 0 }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 48 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 48 }}
      transition={{ 
        duration: TRANSITIONS.page.duration,
        delay,
        ease: TRANSITIONS.page.ease,
      }}
    >
      {children}
    </motion.div>
  );
};

export const SlideInRight = ({ children }) => {
  return (
    <motion.div
      initial={{ opacity: 0, x: 100 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -100 }}
      transition={{ ...TRANSITIONS.page }}
    >
      {children}
    </motion.div>
  );
};
```

---

### 2.2 버튼 & 인터랙티브 요소

#### 다목적 버튼 애니메이션
```jsx
// components/ui/Button.jsx
import { motion } from 'framer-motion';
import { TRANSITIONS } from '../../config/animations';

export function Button({ 
  children, 
  variant = 'primary',
  onClick,
  disabled = false,
}) {
  return (
    <motion.button
      className={`btn btn--${variant}`}
      // 탭 피드백
      whileTap={!disabled ? { scale: 0.98 } : {}}
      // 호버 피드백
      whileHover={!disabled ? { opacity: 0.9 } : {}}
      // 스프링 애니메이션
      transition={TRANSITIONS.button}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </motion.button>
  );
}
```

---

### 2.3 카드 리스트 애니메이션 (Staggering)

#### 여러 카드의 순차 애니메이션
```jsx
// components/EventsList/index.jsx
import { motion } from 'framer-motion';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,      // 각 자식 사이 0.1초 간격
      delayChildren: 0.2,         // 첫 자식은 0.2초 후 시작
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.3 },
  },
};

export function EventsList() {
  const [events, setEvents] = useState([]);

  return (
    <motion.div
      className="events-list"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {events.map((event) => (
        <motion.div
          key={event.id}
          variants={itemVariants}
          className="event-card-wrapper"
        >
          <EventCard event={event} />
        </motion.div>
      ))}
    </motion.div>
  );
}
```

---

### 2.4 Progress Bar 애니메이션

#### 단계 진행도 바
```jsx
// components/StepProgress.jsx
import { motion } from 'framer-motion';

export function StepProgress({ currentStep, totalSteps }) {
  const progress = currentStep / totalSteps;

  return (
    <div className="progress-container">
      {/* 배경 바 */}
      <div className="progress-background">
        {/* 진행 바 - 스케일 애니메이션 */}
        <motion.div
          className="progress-bar"
          initial={{ scaleX: 0 }}
          animate={{ scaleX: progress }}
          transition={{
            duration: 0.5,
            ease: [0.25, 0.46, 0.45, 0.94],
          }}
          style={{ originX: 0 }}
        />
      </div>

      {/* 단계 텍스트 */}
      <motion.p
        className="step-indicator"
        key={currentStep}
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.2 }}
      >
        Step {currentStep}/{totalSteps}
      </motion.p>
    </div>
  );
}
```

---

### 2.5 Modal/Bottom Sheet 애니메이션

#### 하단 시트 (사진 선택)
```jsx
// components/PhotoGallerySheet.jsx
import { motion, AnimatePresence } from 'framer-motion';

export function PhotoGallerySheet({ isOpen, onClose, onSelect }) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* 백드롭 */}
          <motion.div
            className="sheet-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
          />

          {/* 시트 컨테이너 */}
          <motion.div
            className="sheet-container"
            initial={{ y: 600 }}           // 화면 아래에서 시작
            animate={{ y: 0 }}             // 위로 슬라이드 업
            exit={{ y: 600 }}              // 아래로 슬라이드 다운
            transition={{
              type: 'spring',
              stiffness: 100,
              damping: 12,
              mass: 1,
            }}
          >
            {/* 갤러리 콘텐츠 */}
            <PhotoGallery onSelect={onSelect} />
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
```

---

### 2.6 사진 선택 애니메이션

#### 갤러리 그리드 + 선택 애니메이션
```jsx
// components/PhotoGallery.jsx
import { motion } from 'framer-motion';
import { useState } from 'react';

export function PhotoGallery({ onSelect }) {
  const [selectedId, setSelectedId] = useState(null);

  const photos = [
    { id: 1, url: '/assets/photo1.jpg', category: 'birthday' },
    { id: 2, url: '/assets/photo2.jpg', category: 'party' },
  ];

  return (
    <motion.div
      className="photo-gallery"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <div className="gallery-grid">
        {photos.map((photo) => (
          <PhotoItem
            key={photo.id}
            photo={photo}
            isSelected={selectedId === photo.id}
            onSelect={() => {
              setSelectedId(photo.id);
              onSelect(photo);
            }}
          />
        ))}
      </div>
    </motion.div>
  );
}

function PhotoItem({ photo, isSelected, onSelect }) {
  return (
    <motion.div
      className="photo-item"
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={onSelect}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
    >
      {/* 이미지 */}
      <motion.img
        src={photo.url}
        alt="Gallery"
        animate={{
          opacity: isSelected ? 0.7 : 1,
        }}
        transition={{ duration: 0.2 }}
      />

      {/* 선택 오버레이 */}
      <AnimatePresence>
        {isSelected && (
          <motion.div
            className="photo-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
          >
            {/* 체크마크 */}
            <motion.div
              className="checkmark"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ 
                type: 'spring',
                stiffness: 200,
                damping: 15,
              }}
            >
              ✓
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
```

---

### 2.7 다단계 폼 (Create Event)

#### 단계 간 전환 애니메이션
```jsx
// screens/CreateEvent/index.jsx
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const STEPS = [
  { component: Step1_Photo, title: 'Choose Photo' },
  { component: Step2_Info, title: 'Event Details' },
  { component: Step3_DateTime, title: 'Date & Time' },
  { component: Step4_Location, title: 'Location' },
  { component: Step5_Review, title: 'Review' },
];

export function CreateEvent() {
  const [currentStep, setCurrentStep] = useState(0);
  const [direction, setDirection] = useState(1); // 1: forward, -1: backward
  const [formData, setFormData] = useState({});

  const handleNext = () => {
    if (currentStep < STEPS.length - 1) {
      setDirection(1);
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setDirection(-1);
      setCurrentStep(currentStep - 1);
    }
  };

  const CurrentStepComponent = STEPS[currentStep].component;

  return (
    <div className="create-event">
      {/* Step Content - AnimatePresence로 래핑 */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentStep}
          className="create-event__content"
          // 진행 방향에 따른 다른 애니메이션
          initial={{
            opacity: 0,
            x: direction > 0 ? 100 : -100,
          }}
          animate={{
            opacity: 1,
            x: 0,
          }}
          exit={{
            opacity: 0,
            x: direction > 0 ? -100 : 100,
          }}
          transition={{
            duration: 0.3,
            ease: [0.25, 0.46, 0.45, 0.94],
          }}
        >
          <CurrentStepComponent
            data={formData}
            onChange={(newData) => setFormData({ ...formData, ...newData })}
          />
        </motion.div>
      </AnimatePresence>

      {/* Navigation Buttons */}
      <div className="create-event__footer">
        <motion.button
          className="btn btn--outline"
          onClick={handlePrev}
          disabled={currentStep === 0}
          whileTap={{ scale: 0.98 }}
        >
          Back
        </motion.button>

        <motion.button
          className="btn btn--primary"
          onClick={handleNext}
          whileTap={{ scale: 0.98 }}
        >
          {currentStep === STEPS.length - 1 ? 'Create Event' : 'Next'}
        </motion.button>
      </div>
    </div>
  );
}
```

---

### 2.8 스켈레톤 로딩 애니메이션

#### Shimmer 효과
```jsx
// components/Skeleton.jsx
import { motion } from 'framer-motion';

const shimmerVariants = {
  animate: {
    backgroundPosition: ['200% 0%', '-200% 0%'],
    transition: {
      duration: 1.5,
      repeat: Infinity,
      ease: 'linear',
    },
  },
};

export function Skeleton({ width = '100%', height = '100px', className = '' }) {
  return (
    <motion.div
      className={`skeleton ${className}`}
      style={{
        width,
        height,
        background: 'linear-gradient(90deg, #E9E9EA 0%, #F5F5F7 50%, #E9E9EA 100%)',
        backgroundSize: '200% 100%',
      }}
      variants={shimmerVariants}
      animate="animate"
    />
  );
}

// 사용 예시
export function EventCardSkeleton() {
  return (
    <div className="event-card-skeleton">
      <Skeleton height="200px" className="card-image" />
      <Skeleton height="20px" className="card-title" />
      <Skeleton height="16px" className="card-subtitle" />
    </div>
  );
}
```

---

### 2.9 Toast 알림 애니메이션

#### 복사 완료 토스트
```jsx
// components/Toast.jsx
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useCallback } from 'react';

export function useToast() {
  const [toasts, setToasts] = useState([]);

  const showToast = useCallback((message, duration = 2000) => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message }]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, duration);
  }, []);

  return { toasts, showToast };
}

export function ToastContainer({ toasts }) {
  return (
    <div className="toast-container">
      <AnimatePresence>
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            className="toast"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.2 }}
          >
            {toast.message}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
```

---

### 2.10 RSVP 상태 변경 애니메이션

#### 선택지 토글
```jsx
// screens/EventDetails/RSVPSection.jsx
import { motion } from 'framer-motion';
import { useState } from 'react';

const rsvpOptions = [
  { id: 'attending', label: 'Attending', color: '#34C759' },
  { id: 'maybe', label: 'Maybe', color: '#FF9500' },
  { id: 'not-attending', label: 'Not Attending', color: '#FF3B30' },
];

export function RSVPSection() {
  const [selectedRsvp, setSelectedRsvp] = useState('attending');

  return (
    <div className="rsvp-section">
      <h3>RSVP Status</h3>

      <div className="rsvp-options">
        {rsvpOptions.map((option) => (
          <RSVPOption
            key={option.id}
            option={option}
            isSelected={selectedRsvp === option.id}
            onSelect={() => setSelectedRsvp(option.id)}
          />
        ))}
      </div>
    </div>
  );
}

function RSVPOption({ option, isSelected, onSelect }) {
  return (
    <motion.button
      className={`rsvp-option ${isSelected ? 'selected' : ''}`}
      onClick={onSelect}
      whileTap={{ scale: 0.95 }}
    >
      {/* 라디오 버튼 */}
      <motion.div
        className="radio-button"
        animate={{
          borderColor: isSelected ? option.color : '#E5E5EA',
          backgroundColor: isSelected ? option.color : 'transparent',
        }}
        transition={{ duration: 0.2 }}
      >
        {/* 내부 점 */}
        <motion.div
          className="radio-dot"
          animate={{
            scale: isSelected ? 1 : 0,
            opacity: isSelected ? 1 : 0,
          }}
          transition={{
            type: 'spring',
            stiffness: 200,
            damping: 15,
          }}
        />
      </motion.div>

      <label>{option.label}</label>
    </motion.button>
  );
}
```

---

## 3. 성능 최적화 팁

### 3.1 불필요한 리렌더링 방지
```jsx
// memo를 사용하여 props가 바뀌지 않으면 리렌더링 스킵
import { memo } from 'react';

const EventCard = memo(({ event, onClick }) => {
  return (
    <motion.div onClick={onClick}>
      {/* 카드 콘텐츠 */}
    </motion.div>
  );
});
```

### 3.2 Framer Motion 성능 최적화
```jsx
// GPU 가속을 위해 transform 사용 (opacity, scale, rotate, x, y)
// ❌ 피해야 할 것:
animate={{ width: 100, height: 100 }}

// ✅ 추천:
animate={{ scale: 1.5 }}
```

### 3.3 useMotionValue로 성능 개선
```jsx
import { useMotionValue, useTransform } from 'framer-motion';

export function OptimizedScroll({ scrollY }) {
  const opacity = useTransform(scrollY, [0, 100], [1, 0]);
  
  return <motion.div style={{ opacity }} />;
}
```

---

**이 가이드는 Apple Invites 앱의 모든 애니메이션을 Framer Motion으로 구현하기 위한 실전 예제 모음입니다.**
