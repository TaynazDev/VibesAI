import { useState } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { AppShell } from "./app/AppShell";
import { SplashScreen } from "./components/SplashScreen";
import { AccountPage } from "./features/account/AccountPage";
import { HomePage } from "./features/home/HomePage";
import { NotificationsPage } from "./features/notifications/NotificationsPage";
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
        <Route path="/" element={<HomePage />} />
        <Route path="/projects" element={<ProjectsPage />} />
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
