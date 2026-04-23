import type { AIMode, AIResult } from "../services/aiService";

export type ProjectMessage = {
  id: string;
  prompt: string;
  mode: AIMode;
  result: AIResult;
  ts: string;
};

export type Project = {
  id: string;
  name: string;
  updatedAt: string;
  status: "Draft" | "Active" | "Archived";
  messages: ProjectMessage[];
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
