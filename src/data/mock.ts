import type { AIMode, AIResult } from "../services/aiService";
import type { AppPlan, BuildMessage, BuildStep, Checkpoint } from "../features/builder/buildTypes";

export type ProjectMessage = {
  id: string;
  prompt: string;
  mode: AIMode;
  result: AIResult;
  ts: string;
};

export type ProjectBuilderState = {
  currentStep: BuildStep;
  plan: AppPlan | null;
  generatedCode: string;
  checkpoints: Checkpoint[];
  messages: BuildMessage[];
  stepHistory: Record<number, { role: string; content: string }[]>;
};

export type Project = {
  id: string;
  name: string;
  updatedAt: string;
  status: "Draft" | "Active" | "Archived";
  messages: ProjectMessage[];
  builder?: ProjectBuilderState;
  exportedAt?: string;
};

export type AppNotification = {
  id: string;
  title: string;
  detail: string;
  timestamp: string;
  unread: boolean;
  kind?: "builder" | "project" | "system";
};

export const mockProjects: Project[] = [];
export const mockNotifications: AppNotification[] = [];
