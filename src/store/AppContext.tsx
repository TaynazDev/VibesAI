import {
  createContext,
  useContext,
  useReducer,
  useEffect,
  PropsWithChildren,
  Dispatch,
} from "react";
import { mockNotifications, mockProjects } from "../data/mock";
import type { AppNotification, Project, ProjectBuilderState, ProjectMessage } from "../data/mock";

// ── Types ──────────────────────────────────────────────────────────────────

export type UsageRecord = {
  id: string;
  timestamp: number;
  model: string;
  mode: "text" | "image";
  inputTokens: number;
  outputTokens: number;
  cost: number;
  projectId?: string;
};

export type Snapshot = {
  id: string;
  projectId: string;
  timestamp: number;
  label: string;
  builder: ProjectBuilderState;
};

export type CriticScore = {
  id: string;
  projectId: string;
  timestamp: number;
  uxScore: number;
  a11yScore: number;
  perfScore: number;
  overallScore: number;
  issues: { category: string; severity: "critical" | "warning" | "info"; message: string }[];
};

export type Settings = {
  workspaceName: string;
  outputStyle: "clean" | "expressive" | "technical";
  providerRouting: "single" | "hybrid";
  experimentalImage: boolean;
  theme: "light" | "dark" | "system";
  /** OpenAI API key */
  apiKey: string;
  /** AI provider to use for text generation */
  provider: "openai" | "openrouter" | "gemma";
  /** OpenRouter API key */
  openrouterKey: string;
  /** OpenRouter model slug, e.g. "google/gemma-3-27b-it" */
  openrouterModel: string;
  /** Google AI Studio key for Gemma direct access */
  gemmaKey: string;
};

export type AuthState = {
  name: string;
  email: string;
  role: string;
  studio: string;
  focus: string;
};

export type PromptTemplate = {
  id: string;
  name: string;
  prompt: string;
  tags: string[];
  updatedAt: string;
};

type AppState = {
  projects: Project[];
  notifications: AppNotification[];
  promptLibrary: PromptTemplate[];
  settings: Settings;
  auth: AuthState;
  usage: UsageRecord[];
  snapshots: Snapshot[];
  criticScores: CriticScore[];
};

type Action =
  | { type: "PROJECT_CREATE"; id?: string; name: string; builder?: ProjectBuilderState }
  | { type: "PROJECT_IMPORT"; project: Project }
  | { type: "PROJECT_RENAME"; id: string; name: string }
  | { type: "PROJECT_ARCHIVE"; id: string }
  | { type: "PROJECT_RESTORE"; id: string }
  | { type: "PROJECT_DELETE"; id: string }
  | { type: "PROJECT_ADD_MESSAGE"; id: string; message: Omit<ProjectMessage, "id"> }
  | { type: "PROJECT_BUILDER_SAVE"; id: string; name: string; status: Project["status"]; builder: ProjectBuilderState }
  | { type: "NOTIFICATION_MARK_READ"; id: string }
  | { type: "NOTIFICATION_MARK_ALL_READ" }
  | { type: "NOTIFICATION_CLEAR_READ" }
  | { type: "NOTIFICATION_DELETE"; id: string }
  | { type: "NOTIFICATION_ADD"; notification: Omit<AppNotification, "id"> }
  | { type: "PROMPT_SAVE"; template: Omit<PromptTemplate, "id" | "updatedAt"> }
  | { type: "PROMPT_DELETE"; id: string }
  | { type: "SETTINGS_UPDATE"; patch: Partial<Settings> }
  | { type: "AUTH_UPDATE"; patch: Partial<AuthState> }
  | { type: "USAGE_ADD"; usage: Omit<UsageRecord, "id"> }
  | { type: "SNAPSHOT_CREATE"; projectId: string; label: string; builder: ProjectBuilderState }
  | { type: "SNAPSHOT_DELETE"; id: string }
  | { type: "SNAPSHOT_RESTORE"; projectId: string; snapshotId: string }
  | { type: "CRITIC_SCORE_ADD"; projectId: string; score: Omit<CriticScore, "id"> };

// ── Initial state ──────────────────────────────────────────────────────────

const defaultSettings: Settings = {
  workspaceName: "My Workspace",
  outputStyle: "clean",
  providerRouting: "single",
  experimentalImage: false,
  theme: "system",
  apiKey: "",
  provider: "openai",
  openrouterKey: "",
  openrouterModel: "google/gemma-3-27b-it",
  gemmaKey: "",
};

const defaultAuth: AuthState = {
  name: "Creator",
  email: "creator@prism.example",
  role: "Founder",
  studio: "Prism Studio",
  focus: "Ship elegant AI-native apps fast",
};

const STORAGE_KEY = "vibesai_state_v1";

function loadPersisted(): Partial<AppState> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Partial<AppState>) : {};
  } catch {
    return {};
  }
}

// Generate mock usage data for testing analytics
function generateMockUsageData(): UsageRecord[] {
  const models = ["gpt-4", "gpt-3.5-turbo", "claude-3-opus", "gemma-2-27b"];
  const modes: Array<"text" | "image"> = ["text", "image"];
  const records: UsageRecord[] = [];
  
  // Generate data for past 30 days
  for (let dayOffset = 30; dayOffset >= 0; dayOffset--) {
    const timestamp = Date.now() - dayOffset * 24 * 60 * 60 * 1000;
    const requestsPerDay = Math.floor(Math.random() * 8) + 2; // 2-10 requests
    
    for (let i = 0; i < requestsPerDay; i++) {
      const model = models[Math.floor(Math.random() * models.length)];
      const mode = modes[Math.floor(Math.random() * modes.length)];
      const inputTokens = Math.floor(Math.random() * 1000) + 100;
      const outputTokens = Math.floor(Math.random() * 500) + 50;
      
      // Pricing per 1M tokens (rough estimates)
      const pricingMap: Record<string, { input: number; output: number }> = {
        "gpt-4": { input: 30, output: 60 },
        "gpt-3.5-turbo": { input: 0.5, output: 1.5 },
        "claude-3-opus": { input: 15, output: 75 },
        "gemma-2-27b": { input: 0.1, output: 0.3 },
      };
      
      const pricing = pricingMap[model] || { input: 1, output: 2 };
      const cost = (inputTokens * pricing.input + outputTokens * pricing.output) / 1000000;
      
      records.push({
        id: Math.random().toString(36).slice(2, 10),
        timestamp: timestamp + Math.random() * 24 * 60 * 60 * 1000,
        model,
        mode,
        inputTokens,
        outputTokens,
        cost: parseFloat(cost.toFixed(6)),
      });
    }
  }
  
  return records;
}


function buildInitialState(): AppState {
  const p = loadPersisted();
  return {
    projects: p.projects ?? mockProjects,
    notifications: p.notifications ?? mockNotifications,
    promptLibrary: p.promptLibrary ?? [],
    settings: { ...defaultSettings, ...(p.settings ?? {}) },
    auth: { ...defaultAuth, ...(p.auth ?? {}) },
    usage: p.usage ?? generateMockUsageData(),
    snapshots: p.snapshots ?? [],
    criticScores: p.criticScores ?? [],
  };
}

// ── Reducer ────────────────────────────────────────────────────────────────

let _id = Date.now();
const uid = () => String(++_id);

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case "PROJECT_CREATE":
      return {
        ...state,
        projects: [
          {
            id: action.id ?? uid(),
            name: action.name,
            updatedAt: "just now",
            status: action.builder ? "Active" : "Draft",
            messages: [],
            builder: action.builder,
          },
          ...state.projects,
        ],
      };
    case "PROJECT_IMPORT": {
      const idTaken = state.projects.some((project) => project.id === action.project.id);
      const nextProject = idTaken
        ? {
            ...action.project,
            id: uid(),
            name: `${action.project.name} (Imported)`,
            updatedAt: "just now",
          }
        : {
            ...action.project,
            updatedAt: "just now",
          };

      return {
        ...state,
        projects: [nextProject, ...state.projects],
      };
    }
    case "PROJECT_RENAME":
      return {
        ...state,
        projects: state.projects.map((p) =>
          p.id === action.id ? { ...p, name: action.name, updatedAt: "just now" } : p
        ),
      };
    case "PROJECT_ARCHIVE":
      return {
        ...state,
        projects: state.projects.map((p) =>
          p.id === action.id ? { ...p, status: "Archived", updatedAt: "just now" } : p
        ),
      };
    case "PROJECT_RESTORE":
      return {
        ...state,
        projects: state.projects.map((p) =>
          p.id === action.id ? { ...p, status: "Draft", updatedAt: "just now" } : p
        ),
      };
    case "PROJECT_DELETE":
      return { ...state, projects: state.projects.filter((p) => p.id !== action.id) };
    case "PROJECT_ADD_MESSAGE":
      return {
        ...state,
        projects: state.projects.map((p) =>
          p.id === action.id
            ? { ...p, updatedAt: "just now", messages: [{ ...action.message, id: uid() }, ...(p.messages ?? [])] }
            : p
        ),
      };
    case "PROJECT_BUILDER_SAVE": {
      const existing = state.projects.find((p) => p.id === action.id);
      if (!existing) {
        return {
          ...state,
          projects: [
            {
              id: action.id,
              name: action.name,
              updatedAt: "just now",
              status: action.status,
              messages: [],
              builder: action.builder,
            },
            ...state.projects,
          ],
        };
      }
      return {
        ...state,
        projects: state.projects.map((p) =>
          p.id === action.id
            ? {
                ...p,
                name: action.name,
                status: action.status,
                updatedAt: "just now",
                builder: action.builder,
              }
            : p
        ),
      };
    }
    case "NOTIFICATION_MARK_READ":
      return {
        ...state,
        notifications: state.notifications.map((n) =>
          n.id === action.id ? { ...n, unread: false } : n
        ),
      };
    case "NOTIFICATION_MARK_ALL_READ":
      return {
        ...state,
        notifications: state.notifications.map((n) => ({ ...n, unread: false })),
      };
    case "NOTIFICATION_CLEAR_READ":
      return {
        ...state,
        notifications: state.notifications.filter((n) => n.unread),
      };
    case "NOTIFICATION_DELETE":
      return {
        ...state,
        notifications: state.notifications.filter((n) => n.id !== action.id),
      };
    case "NOTIFICATION_ADD":
      return {
        ...state,
        notifications: [{ ...action.notification, id: uid() }, ...state.notifications],
      };
    case "PROMPT_SAVE":
      return {
        ...state,
        promptLibrary: [
          {
            id: uid(),
            ...action.template,
            updatedAt: "just now",
          },
          ...state.promptLibrary,
        ],
      };
    case "PROMPT_DELETE":
      return {
        ...state,
        promptLibrary: state.promptLibrary.filter((template) => template.id !== action.id),
      };
    case "SETTINGS_UPDATE":
      return { ...state, settings: { ...state.settings, ...action.patch } };
    case "AUTH_UPDATE":
      return { ...state, auth: { ...state.auth, ...action.patch } };
    case "USAGE_ADD":
      return {
        ...state,
        usage: [{ ...action.usage, id: uid() }, ...state.usage],
      };
    case "SNAPSHOT_CREATE":
      return {
        ...state,
        snapshots: [
          {
            id: uid(),
            projectId: action.projectId,
            timestamp: Date.now(),
            label: action.label,
            builder: action.builder,
          },
          ...state.snapshots,
        ],
      };
    case "SNAPSHOT_DELETE":
      return {
        ...state,
        snapshots: state.snapshots.filter((s) => s.id !== action.id),
      };
    case "SNAPSHOT_RESTORE": {
      const snapshot = state.snapshots.find((s) => s.id === action.snapshotId);
      if (!snapshot) return state;
      return {
        ...state,
        projects: state.projects.map((p) =>
          p.id === action.projectId
            ? { ...p, builder: snapshot.builder, updatedAt: "just now" }
            : p
        ),
      };
    }
    case "CRITIC_SCORE_ADD":
      return {
        ...state,
        criticScores: [
          { ...action.score, id: uid() },
          ...state.criticScores,
        ],
      };
    default:
      return state;
  }
}

// ── Context & Provider ─────────────────────────────────────────────────────

const StateCtx = createContext<AppState | null>(null);
const DispatchCtx = createContext<Dispatch<Action> | null>(null);

export function AppProvider({ children }: PropsWithChildren) {
  const [state, dispatch] = useReducer(reducer, undefined, buildInitialState);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      /* storage full or unavailable */
    }
  }, [state]);

  return (
    <StateCtx.Provider value={state}>
      <DispatchCtx.Provider value={dispatch}>{children}</DispatchCtx.Provider>
    </StateCtx.Provider>
  );
}

// ── Hooks ──────────────────────────────────────────────────────────────────

function useAppState(): AppState {
  const ctx = useContext(StateCtx);
  if (!ctx) throw new Error("useAppState must be inside AppProvider");
  return ctx;
}

export function useAppDispatch(): Dispatch<Action> {
  const ctx = useContext(DispatchCtx);
  if (!ctx) throw new Error("useAppDispatch must be inside AppProvider");
  return ctx;
}

export function useProjects() {
  return useAppState().projects;
}

export function useNotifications() {
  const { notifications } = useAppState();
  return { notifications, unreadCount: notifications.filter((n) => n.unread).length };
}

export function useSettings() {
  return useAppState().settings;
}

export function useAuth() {
  return useAppState().auth;
}

export function usePromptLibrary() {
  return useAppState().promptLibrary;
}

export function useUsage() {
  return useAppState().usage;
}

export function useSnapshots() {
  return useAppState().snapshots;
}

export function useCriticScores() {
  return useAppState().criticScores;
}
