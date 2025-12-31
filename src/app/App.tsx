import { BrowserRouter, Routes, Route, Navigate } from "react-router";
import { LandingPage } from "@/pages/LandingPage";
import { DashboardPage } from "@/pages/DashboardPage";
import { HistoryPage } from "@/pages/HistoryPage";
import { HelpPage } from "@/pages/HelpPage";
import { OnboardingPage } from "@/pages/OnboardingPage";
import { ProfilePage } from "@/pages/ProfilePage";
import { useAppStore } from "@/shared/lib/store";

export default function App() {
  const isAuthenticated = useAppStore((state) => state.isAuthenticated);

  return (
    <BrowserRouter>
      <main className="flex-1 flex flex-col overflow-hidden">
        <Routes>
          <Route 
            path="/" 
            element={isAuthenticated ? <LandingPage /> : <Navigate to="/onboarding" replace />} 
          />
          <Route path="/onboarding" element={<OnboardingPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/history" element={<HistoryPage />} />
          <Route path="/help" element={<HelpPage />} />
        </Routes>
      </main>
    </BrowserRouter>
  );
}
