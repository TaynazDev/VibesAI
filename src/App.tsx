import { Navigate, Route, Routes } from "react-router-dom";
import { AppShell } from "./app/AppShell";
import { AccountPage } from "./features/account/AccountPage";
import { HomePage } from "./features/home/HomePage";
import { NotificationsPage } from "./features/notifications/NotificationsPage";
import { ProjectsPage } from "./features/projects/ProjectsPage";
import { SettingsPage } from "./features/settings/SettingsPage";
import { AppProvider } from "./store/AppContext";

function App() {
  return (
    <AppProvider>
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
    </AppProvider>
  );
}

export default App;
