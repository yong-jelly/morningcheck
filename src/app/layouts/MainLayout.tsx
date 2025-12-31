import { Outlet } from "react-router";

export function MainLayout() {
  return (
    <div className="flex flex-col h-full bg-white dark:bg-surface-900 overflow-hidden">
      <main className="flex-1 relative overflow-hidden">
        <Outlet />
      </main>
    </div>
  );
}
