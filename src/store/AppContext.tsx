import {
  createContext,
  useContext,
  useReducer,
  useEffect,
  PropsWithChildren,
  Dispatch,
} from "react";
import { mockNotifications, mockProjects } from "../data/mock";
import type { AppNotification, Project } from "../data/mock";

// ── Types ──────────────────────────────────────────────────────────────────

export type Settings = {
  workspaceName: string;
  outputStyle: "clean" | "expressive" | "technical";
  providerRouting: "single" | "hybrid";
  experimentalImage: boolean;
  theme: "light" | "dark" | "system";
};

export type AuthState = {
  name: string;
  email: string;
};

type AppState = {
  projects: Project[];
  notifications: AppNotification[];
  settings: Settings;
  auth: AuthState;
};

type Action =
  | { type: "PROJECT_CREATE"; name: string }
  | { type: "PROJECT_RENAME"; id: string; name: string }
  | { type: "PROJECT_ARCHIVE"; id: string }
  | { type: "PROJECT_RESTORE"; id: string }
  | { type: "PROJECT_DELETE"; id: string }
  | { type: "NOTIFICATION_MARK_READ"; id: string }
  | { type: "NOTIFICATION_MARK_ALL_READ" }
  | { type: "NOTIFICATION_ADD"; notification: Omit<AppNotification, "id"> }
  | { type: "SETTINGS_UPDATE"; patch: Partial<Settings> }
  | { type: "AUTH_UPDATE"; patch: Partial<AuthState> };

// ── Initial state ──────────────────────────────────────────────────────────

const defaultSettings: Settings = {
  workspaceName: "VibesAI Workspace",
  outputStyle: "clean",
  providerRouting: "single",
  experimentalImage: false,
  theme: "system",
};

const defaultAuth: AuthState = {
  name: "Creator",
  email: "creator@prism.example",
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

function buildInitialState(): AppState {
  const p = loadPersisted();
  return {
    projects: p.projects ?? mockProjects,
    notifications: p.notifications ?? mockNotifications,
    settings: { ...defaultSettings, ...(p.settings ?? {}) },
    auth: { ...defaultAuth, ...(p.auth ?? {}) },
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
          { id: uid(), name: action.name, updatedAt: "just now", status: "Draft" },
          ...state.projects,
        ],
      };
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
    case "NOTIFICATION_ADD":
      return {
        ...state,
        notifications: [{ ...action.notification, id: uid() }, ...state.notifications],
      };
    case "SETTINGS_UPDATE":
      return { ...state, settings: { ...state.settings, ...action.patch } };
    case "AUTH_UPDATE":
      return { ...state, auth: { ...state.auth, ...action.patch } };
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
