# React 컴포넌트 구현 가이드
## Apple Invites 앱 - 실전 예제

---

## 1. 기본 UI 컴포넌트

### 1.1 Button Component (완전 구현)

```jsx
// src/components/ui/Button.jsx
import { motion } from 'framer-motion';
import '../styles/Button.css';
import PropTypes from 'prop-types';

/**
 * Apple Invites 스타일 버튼 컴포넌트
 * @param {string} variant - 'primary' | 'outline' | 'destructive' | 'plain'
 * @param {string} size - 'sm' | 'md' | 'lg'
 * @param {boolean} fullWidth - 너비 100%
 * @param {boolean} disabled - 비활성화
 * @param {function} onClick - 클릭 콜백
 * @param {React.ReactNode} children - 버튼 텍스트
 */
export function Button({
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  disabled = false,
  loading = false,
  onClick,
  children,
  className = '',
  type = 'button',
  ...props
}) {
  return (
    <motion.button
      className={`
        btn
        btn--${variant}
        btn--${size}
        ${fullWidth ? 'btn--full-width' : ''}
        ${disabled ? 'btn--disabled' : ''}
        ${className}
      `}
      whileTap={!disabled ? { scale: 0.98 } : {}}
      whileHover={!disabled ? { opacity: 0.9 } : {}}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      disabled={disabled || loading}
      onClick={onClick}
      type={type}
      {...props}
    >
      {loading ? (
        <>
          <span className="btn-loader" />
          {children}
        </>
      ) : (
        children
      )}
    </motion.button>
  );
}

Button.propTypes = {
  variant: PropTypes.oneOf(['primary', 'outline', 'destructive', 'plain']),
  size: PropTypes.oneOf(['sm', 'md', 'lg']),
  fullWidth: PropTypes.bool,
  disabled: PropTypes.bool,
  loading: PropTypes.bool,
  onClick: PropTypes.func,
  children: PropTypes.node.isRequired,
  className: PropTypes.string,
  type: PropTypes.oneOf(['button', 'submit', 'reset']),
};
```

#### CSS (Button.css)
```css
.btn {
  font-family: var(--font-family-base);
  border: none;
  border-radius: var(--radius-lg);
  cursor: pointer;
  font-weight: 500;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  transition: var(--transition-fast);
  outline: none;
  position: relative;
}

/* Variants */
.btn--primary {
  background-color: var(--color-primary);
  color: white;
}

.btn--outline {
  background-color: transparent;
  border: 1px solid var(--color-border);
  color: var(--color-text-primary);
}

.btn--destructive {
  background-color: var(--color-error);
  color: white;
}

.btn--plain {
  background-color: transparent;
  color: var(--color-primary);
}

/* Sizes */
.btn--sm {
  padding: 8px 12px;
  font-size: 13px;
  height: 32px;
}

.btn--md {
  padding: 10px 16px;
  font-size: 15px;
  height: 44px;
}

.btn--lg {
  padding: 12px 20px;
  font-size: 17px;
  height: 48px;
}

.btn--full-width {
  width: 100%;
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-loader {
  display: inline-block;
  width: 12px;
  height: 12px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
```

---

### 1.2 Input Component

```jsx
// src/components/ui/Input.jsx
import { motion } from 'framer-motion';
import '../styles/Input.css';
import { useState } from 'react';

export function Input({
  type = 'text',
  placeholder = '',
  value = '',
  onChange,
  onFocus,
  onBlur,
  error = null,
  label = '',
  disabled = false,
  maxLength,
  className = '',
  ...props
}) {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <div className={`input-group ${className}`}>
      {label && (
        <label className="input-label">
          {label}
          {props.required && <span className="input-required">*</span>}
        </label>
      )}

      <motion.div
        className={`input-wrapper ${error ? 'input-error' : ''}`}
        animate={{
          borderColor: isFocused
            ? 'var(--color-primary)'
            : error
            ? 'var(--color-error)'
            : 'var(--color-border)',
          boxShadow: isFocused
            ? '0 0 0 3px rgba(0, 122, 255, 0.2)'
            : 'none',
        }}
        transition={{ duration: 0.2 }}
      >
        <input
          type={type}
          className="input-field"
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          onFocus={(e) => {
            setIsFocused(true);
            onFocus?.(e);
          }}
          onBlur={(e) => {
            setIsFocused(false);
            onBlur?.(e);
          }}
          disabled={disabled}
          maxLength={maxLength}
          {...props}
        />

        {maxLength && (
          <span className="input-counter">
            {value.length}/{maxLength}
          </span>
        )}
      </motion.div>

      {error && (
        <motion.p
          className="input-error-text"
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.15 }}
        >
          {error}
        </motion.p>
      )}
    </div>
  );
}
```

---

### 1.3 Card Component

```jsx
// src/components/ui/Card.jsx
import { motion } from 'framer-motion';
import '../styles/Card.css';

export function Card({
  image,
  title,
  subtitle,
  metadata,
  onClick,
  children,
  className = '',
  loading = false,
}) {
  if (loading) {
    return (
      <div className={`card-skeleton ${className}`}>
        <div className="card-image-skeleton" />
        <div className="card-content-skeleton">
          <div className="skeleton skeleton-title" />
          <div className="skeleton skeleton-subtitle" />
        </div>
      </div>
    );
  }

  return (
    <motion.div
      className={`card ${className}`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      whileTap={{ scale: 0.98 }}
      transition={{ duration: 0.3 }}
      onClick={onClick}
    >
      {image && (
        <div className="card-image-wrapper">
          <img 
            src={image} 
            alt={title || 'Card image'}
            className="card-image"
          />
        </div>
      )}

      <div className="card-content">
        {title && <h3 className="card-title">{title}</h3>}
        
        {subtitle && (
          <p className="card-subtitle">{subtitle}</p>
        )}

        {metadata && (
          <div className="card-metadata">
            {Array.isArray(metadata) ? (
              metadata.map((item, i) => (
                <span key={i} className="card-meta-item">
                  {item}
                </span>
              ))
            ) : (
              <p className="card-meta-item">{metadata}</p>
            )}
          </div>
        )}

        {children && <div className="card-body">{children}</div>}
      </div>
    </motion.div>
  );
}
```

---

## 2. 레이아웃 컴포넌트

### 2.1 TabBar Navigation

```jsx
// src/components/layout/TabBar.jsx
import { motion } from 'framer-motion';
import { useLocation, useNavigate } from 'react-router-dom';
import '../styles/TabBar.css';

const TABS = [
  { id: 'events', label: 'Events', icon: '📅', path: '/' },
  { id: 'rsvp', label: 'RSVP', icon: '🎯', path: '/rsvp' },
  { id: 'create', label: 'Create', icon: '➕', path: '/create' },
  { id: 'profile', label: 'Profile', icon: '👤', path: '/profile' },
];

export function TabBar() {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <motion.nav
      className="tab-bar"
      initial={{ y: 100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {TABS.map((tab) => {
        const isActive = location.pathname === tab.path;

        return (
          <motion.button
            key={tab.id}
            className={`tab-button ${isActive ? 'active' : ''}`}
            onClick={() => navigate(tab.path)}
            whileTap={{ scale: 0.95 }}
          >
            <span className="tab-icon">{tab.icon}</span>
            <span className="tab-label">{tab.label}</span>

            {/* 활성화 인디케이터 */}
            {isActive && (
              <motion.div
                className="tab-indicator"
                layoutId="tab-indicator"
                transition={{ type: 'spring', stiffness: 200, damping: 15 }}
              />
            )}
          </motion.button>
        );
      })}
    </motion.nav>
  );
}
```

---

## 3. 스크린 컴포넌트

### 3.1 Events List Screen

```jsx
// src/screens/EventsList.jsx
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';

export function EventsList() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/events');
      const data = await response.json();
      setEvents(data);
    } catch (error) {
      console.error('Failed to fetch events:', error);
    } finally {
      setLoading(false);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
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

  return (
    <div className="events-list-screen">
      {/* 헤더 */}
      <motion.div
        className="events-header"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <h1>My Events</h1>
        <Button variant="plain" size="sm">
          ⋯
        </Button>
      </motion.div>

      {/* 이벤트 목록 */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <AnimatePresence mode="wait">
          {loading ? (
            <motion.div exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
              {[...Array(3)].map((_, i) => (
                <div key={i} className="events-list__item">
                  <Card loading={true} />
                </div>
              ))}
            </motion.div>
          ) : events.length > 0 ? (
            <motion.div
              initial="hidden"
              animate="visible"
              variants={containerVariants}
            >
              {events.map((event) => (
                <motion.div
                  key={event.id}
                  variants={itemVariants}
                  className="events-list__item"
                  layout
                >
                  <Card
                    image={event.imageUrl}
                    title={event.name}
                    subtitle={`${event.date} · ${event.time}`}
                    metadata={`📍 ${event.location}`}
                  />
                </motion.div>
              ))}
            </motion.div>
          ) : (
            <motion.div
              className="events-empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              <p className="empty-message">
                No events yet. Create your first one!
              </p>
              <Button variant="primary">
                Create Event
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
```

---

## 4. 커스텀 Hooks

### 4.1 useEventForm Hook

```javascript
// src/hooks/useEventForm.js
import { useState, useCallback } from 'react';

export function useEventForm(initialData = {}) {
  const [formData, setFormData] = useState({
    photo: null,
    title: '',
    description: '',
    date: '',
    time: '',
    location: '',
    coordinates: null,
    ...initialData,
  });

  const [errors, setErrors] = useState({});

  const updateField = useCallback((field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
    // 에러 제거
    if (errors[field]) {
      setErrors((prev) => ({
        ...prev,
        [field]: null,
      }));
    }
  }, [errors]);

  const validate = useCallback(() => {
    const newErrors = {};

    if (!formData.photo) newErrors.photo = 'Photo is required';
    if (!formData.title) newErrors.title = 'Event name is required';
    if (!formData.date) newErrors.date = 'Date is required';
    if (!formData.time) newErrors.time = 'Time is required';
    if (!formData.location) newErrors.location = 'Location is required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);

  const reset = useCallback(() => {
    setFormData(initialData);
    setErrors({});
  }, [initialData]);

  return {
    formData,
    updateField,
    setFormData,
    errors,
    validate,
    reset,
  };
}
```

---

## 5. 통합 예제: 완전한 앱 구조

```jsx
// src/App.jsx
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { motion } from 'framer-motion';
import { TabBar } from './components/layout/TabBar';
import { EventsList } from './screens/EventsList';
import { CreateEvent } from './screens/CreateEvent';
import { EventDetails } from './screens/EventDetails';
import { Profile } from './screens/Profile';
import './styles/globals.css';
import './styles/tokens.css';

function App() {
  return (
    <BrowserRouter>
      <motion.div className="app">
        <Routes>
          <Route path="/" element={<EventsList />} />
          <Route path="/create" element={<CreateEvent />} />
          <Route path="/event/:eventId" element={<EventDetails />} />
          <Route path="/profile" element={<Profile />} />
        </Routes>
        <TabBar />
      </motion.div>
    </BrowserRouter>
  );
}

export default App;
```

---

**이 구현 가이드는 Apple Invites 앱을 React.js + Framer Motion으로 완벽하게 구현하기 위한 실전 예제들입니다.**
