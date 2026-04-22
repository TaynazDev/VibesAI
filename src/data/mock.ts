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

export const mockProjects: Project[] = [
  { id: "p1", name: "Launch Storyboard", updatedAt: "2m ago", status: "Active" },
  { id: "p2", name: "Landing Copy Variants", updatedAt: "35m ago", status: "Draft" },
  { id: "p3", name: "Style Exploration", updatedAt: "1d ago", status: "Archived" }
];

export const mockNotifications: AppNotification[] = [
  {
    id: "n1",
    title: "Render complete",
    detail: "Your image generation task finished for Launch Storyboard.",
    timestamp: "Now",
    unread: true
  },
  {
    id: "n2",
    title: "Suggestion ready",
    detail: "Refactor suggestions were generated for your draft.",
    timestamp: "10m",
    unread: true
  },
  {
    id: "n3",
    title: "Sync successful",
    detail: "Project library synced across devices.",
    timestamp: "1h",
    unread: false
  }
];
