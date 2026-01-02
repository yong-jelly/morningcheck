import { BrowserRouter, Routes, Route, Navigate } from "react-router";
import { LandingPage, HelpPage, OnboardingPage, ProfilePage, ProjectListPage, AuthCallbackPage, CheckInPage } from "@/pages";
import { useAppStore } from "@/shared/lib/store";
import { MainLayout } from "@/app/layouts/MainLayout";
import { QueryProvider } from "@/app/providers/QueryProvider";

export default function App() {
  const isAuthenticated = useAppStore((state) => state.isAuthenticated);

  return (
    <QueryProvider>
      <BrowserRouter>
        <main className="flex-1 flex flex-col overflow-hidden">
          <Routes>
            {/* 
              메인 경로: 인증된 사용자는 체크인 페이지로, 
              인증되지 않은 사용자는 온보딩 페이지로 이동합니다. 
            */}
            <Route 
              path="/" 
              element={isAuthenticated ? <Navigate to="/check-in" replace /> : <Navigate to="/onboarding" replace />} 
            />
            
            {/* 인증 콜백 페이지 */}
            <Route path="/auth/callback" element={<AuthCallbackPage />} />

            {/* 온보딩 페이지: 이미 로그인된 경우 체크인 페이지로 이동합니다. */}
            <Route path="/onboarding" element={isAuthenticated ? <Navigate to="/check-in" replace /> : <OnboardingPage />} />
            <Route path="/help" element={<HelpPage />} />
            
            {/* 
              인증이 필요한 라우트: 
              MainLayout(하단 네비게이션 포함)을 공통 레이아웃으로 사용합니다.
              로그인이 안 된 상태로 직접 접근 시 온보딩 페이지로 리다이렉트합니다.
            */}
            <Route element={isAuthenticated ? <MainLayout /> : <Navigate to="/onboarding" replace />}>
              {/* 체크인 페이지 */}
              <Route path="/check-in" element={<CheckInPage />} />
              {/* 프로젝트 목록 페이지 */}
              <Route path="/projects" element={<ProjectListPage />} />
              {/* 프로젝트 상세 모달이 포함된 목록 페이지: URL로 직접 접근이 가능합니다. */}
              <Route path="/projects/:projectId" element={<ProjectListPage />} />
              <Route path="/profile" element={<ProfilePage />} />
            </Route>

            {/* Fallback: 정의되지 않은 경로는 모두 루트로 리다이렉트 */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </BrowserRouter>
    </QueryProvider>
  );
}
