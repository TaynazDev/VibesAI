export type Project = {
  id: string;
  name: string;
  updatedAt: string;
  status: "Draft" | "Active" | "Archived";
};

export type AppNotification = {
  id: string;
  title: string;
  detail: string;
  timestamp: string;
  unread: boolean;
};

export const mockProjects: Project[] = [];
export const mockNotifications: AppNotification[] = [];
