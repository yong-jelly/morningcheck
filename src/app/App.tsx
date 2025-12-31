import { BrowserRouter, Routes, Route, Navigate } from "react-router";
import { LandingPage, HelpPage, OnboardingPage, ProfilePage, ProjectListPage } from "@/pages";
import { useAppStore } from "@/shared/lib/store";
import { MainLayout } from "@/app/layouts/MainLayout";

export default function App() {
  const isAuthenticated = useAppStore((state) => state.isAuthenticated);

  return (
    <BrowserRouter>
      <main className="flex-1 flex flex-col overflow-hidden">
        <Routes>
          <Route 
            path="/" 
            element={isAuthenticated ? <Navigate to="/projects" replace /> : <LandingPage />} 
          />
          <Route path="/onboarding" element={<OnboardingPage />} />
          <Route path="/help" element={<HelpPage />} />
          
          {/* Authenticated Routes with Bottom Nav */}
          <Route element={isAuthenticated ? <MainLayout /> : <Navigate to="/" replace />}>
            <Route path="/projects" element={<ProjectListPage />} />
            <Route path="/profile" element={<ProfilePage />} />
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </BrowserRouter>
  );
}
