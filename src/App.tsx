import { useState } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { AppShell } from "./app/AppShell";
import { SplashScreen } from "./components/SplashScreen";
import { AccountPage } from "./features/account/AccountPage";
import { BuildPage } from "./features/builder/BuildPage";
import { NotificationsPage } from "./features/notifications/NotificationsPage";
import { ProjectDetailPage } from "./features/projects/ProjectDetailPage";
import { ProjectsPage } from "./features/projects/ProjectsPage";
import { SettingsPage } from "./features/settings/SettingsPage";
import { AppProvider } from "./store/AppContext";

function AppInner() {
  const [splashDone, setSplashDone] = useState(
    () => sessionStorage.getItem("va_splash_done") === "1"
  );

  const handleSplashDone = () => {
    sessionStorage.setItem("va_splash_done", "1");
    setSplashDone(true);
  };

  if (!splashDone) {
    return <SplashScreen onDone={handleSplashDone} />;
  }

  return (
    <AppShell>
      <Routes>
        <Route path="/" element={<BuildPage />} />
        <Route path="/projects" element={<ProjectsPage />} />
        <Route path="/projects/:id" element={<ProjectDetailPage />} />
        <Route path="/notifications" element={<NotificationsPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/account" element={<AccountPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AppShell>
  );
}

function App() {
  return (
    <AppProvider>
      <AppInner />
    </AppProvider>
  );
}

export default App;
