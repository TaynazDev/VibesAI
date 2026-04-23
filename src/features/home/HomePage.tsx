import { useEffect, useMemo, useRef, useState } from "react";
import { NavLink } from "react-router-dom";
import { Spinner } from "../../components/Spinner";
import { runAI, type AIOptions } from "../../services/aiService";
import { useAppDispatch, useSettings } from "../../store/AppContext";

type ChatMessage = {
  id: string;
  role: "user" | "ai";
  content: string;
  timestamp: string;
};

type ChatSession = {
  id: string;
  title: string;
  updatedAt: number;
  messages: ChatMessage[];
};

const uid = () => Math.random().toString(36).slice(2, 10);

const DEFAULT_OPTIONS: AIOptions = {
  creativity: 62,
  length: "balanced",
  references: true,
};

const STARTERS = [
  "Help me design a modern onboarding flow.",
  "Give me a launch checklist for my SaaS app.",
  "Refine this feature idea into clear user stories.",
  "Draft a clean pricing page section with copy.",
];

const CHAT_HISTORY_KEY = "vibesai_chat_history_v1";

function makeSessionTitle(messages: ChatMessage[]): string {
  const firstUser = messages.find((m) => m.role === "user")?.content.trim();
  if (!firstUser) return "New chat";
  return firstUser.length > 42 ? `${firstUser.slice(0, 42)}...` : firstUser;
}

function formatSessionLabel(session: ChatSession): string {
  const d = new Date(session.updatedAt);
  const stamp = Number.isNaN(d.getTime()) ? "recent" : d.toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
  return `${session.title} • ${stamp}`;
}

function createEmptySession(): ChatSession {
  return {
    id: uid(),
    title: "New chat",
    updatedAt: Date.now(),
    messages: [],
  };
}

function buildChatPrompt(messages: ChatMessage[], userInput: string): string {
  const transcript = [...messages, { id: "latest", role: "user" as const, content: userInput, timestamp: "now" }]
    .map((msg) => `${msg.role === "user" ? "User" : "Assistant"}: ${msg.content}`)
    .join("\n\n");

  return [
    "You are VibesAI's chat assistant.",
    "Respond naturally and helpfully as a normal conversational AI assistant.",
    "Keep continuity with prior messages.",
    "Conversation:",
    transcript,
    "Assistant:",
  ].join("\n");
}

export function HomePage() {
  const dispatch = useAppDispatch();
  const settings = useSettings();

  const hasApiKey =
    Boolean(settings.openrouterKey) ||
    Boolean(settings.gemmaKey) ||
    Boolean(settings.apiKey);

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [history, setHistory] = useState<ChatSession[]>([]);
  const [activeHistoryId, setActiveHistoryId] = useState<string>("");
  const [input, setInput] = useState("");
  const [isRunning, setIsRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesRef = useRef<ChatMessage[]>([]);
  const endRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const didHydrateRef = useRef(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(CHAT_HISTORY_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as ChatSession[];
        if (Array.isArray(parsed) && parsed.length > 0) {
          const sorted = [...parsed].sort((a, b) => b.updatedAt - a.updatedAt);
          setHistory(sorted);
          setActiveHistoryId(sorted[0].id);
          setMessages(sorted[0].messages ?? []);
          didHydrateRef.current = true;
          return;
        }
      }
    } catch {
      /* ignore bad history payload */
    }

    const first = createEmptySession();
    setHistory([first]);
    setActiveHistoryId(first.id);
    setMessages([]);
    didHydrateRef.current = true;
  }, []);

  useEffect(() => {
    if (!didHydrateRef.current || !activeHistoryId) {
      return;
    }

    setHistory((prev) => {
      if (prev.length === 0) {
        return prev;
      }

      const next = prev.map((session) =>
        session.id === activeHistoryId
          ? {
              ...session,
              title: makeSessionTitle(messages),
              updatedAt: Date.now(),
              messages,
            }
          : session
      );
      next.sort((a, b) => b.updatedAt - a.updatedAt);
      localStorage.setItem(CHAT_HISTORY_KEY, JSON.stringify(next));
      return next;
    });
  }, [activeHistoryId, messages]);

  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, isRunning]);

  const placeholder = useMemo(() => {
    if (!hasApiKey) {
      return "Add any provider key in Settings to start chatting...";
    }
    return "Send a message…";
  }, [hasApiKey]);

  function startNewChat() {
    const fresh = createEmptySession();
    setHistory((prev) => {
      const next = [fresh, ...prev].sort((a, b) => b.updatedAt - a.updatedAt);
      localStorage.setItem(CHAT_HISTORY_KEY, JSON.stringify(next));
      return next;
    });
    setActiveHistoryId(fresh.id);
    setMessages([]);
    setInput("");
    setError(null);
  }

  function switchHistory(nextId: string) {
    if (!nextId || nextId === activeHistoryId) {
      return;
    }
    const selected = history.find((session) => session.id === nextId);
    setActiveHistoryId(nextId);
    setMessages(selected?.messages ?? []);
    setInput("");
    setError(null);
  }

  async function sendMessage(overrideText?: string) {
    const content = (overrideText ?? input).trim();
    if (!content || isRunning || !hasApiKey) {
      return;
    }

    const userMessage: ChatMessage = {
      id: uid(),
      role: "user",
      content,
      timestamp: new Date().toLocaleTimeString(),
    };

    const baseMessages = messagesRef.current;
    setMessages([...baseMessages, userMessage]);
    setInput("");
    if (inputRef.current) {
      inputRef.current.style.height = "auto";
    }
    setError(null);
    setIsRunning(true);

    try {
      const prompt = buildChatPrompt(baseMessages, content);
      const result = await runAI("Generate", prompt, DEFAULT_OPTIONS);
      if (result.type !== "text") {
        throw new Error("Unexpected non-text response.");
      }

      const aiMessage: ChatMessage = {
        id: uid(),
        role: "ai",
        content: result.content,
        timestamp: new Date().toLocaleTimeString(),
      };
      setMessages((prev) => [...prev, aiMessage]);

      dispatch({
        type: "NOTIFICATION_ADD",
        notification: {
          title: "AI Chat reply ready",
          detail: result.content.slice(0, 88),
          timestamp: "just now",
          unread: true,
        },
      });
    } catch (e: unknown) {
      if (e instanceof Error && e.message === "NO_API_KEY") {
        setError("NO_API_KEY");
      } else {
        setError(e instanceof Error ? e.message : "Something went wrong. Please try again.");
      }
    } finally {
      setIsRunning(false);
    }
  }

  return (
    <div className="page-stack home-page">
      <header className="hero">
        <div className="ai-chat-history-menu">
          <select
            className="ai-chat-history-select"
            value={activeHistoryId}
            onChange={(e) => switchHistory(e.target.value)}
            aria-label="Chat history"
          >
            {history.map((session) => (
              <option key={session.id} value={session.id}>
                {formatSessionLabel(session)}
              </option>
            ))}
          </select>
          <button type="button" className="text-button ai-chat-new-btn" onClick={startNewChat}>
            New chat
          </button>
        </div>
        <h1>AI Chat</h1>
        <p className="hero-copy">Uses any configured provider key from Settings</p>
      </header>

      {!hasApiKey && (
        <div className="api-key-banner">
          <span>Connect any provider API key in Settings to enable AI chat.</span>
          <NavLink to="/settings" className="banner-cta">Add key →</NavLink>
        </div>
      )}

      <section className="ai-chat-shell" aria-label="AI Chat conversation">
        <div className="ai-chat-thread" style={{ maxHeight: "58vh", minHeight: "48vh" }}>
          {messages.length === 0 && !isRunning && (
            <div className="chat-empty">Start a conversation with AI.</div>
          )}

          {messages.map((msg) => (
            <div key={msg.id} className={`chat-msg ai-chat-msg chat-msg--${msg.role}`}>
              <div className="chat-msg-bubble ai-chat-msg-bubble">{msg.content}</div>
            </div>
          ))}

          {isRunning && (
            <div className="chat-msg ai-chat-msg chat-msg--ai">
              <div className="chat-msg-bubble ai-chat-msg-bubble chat-loading">
                <Spinner /> <span>Thinking…</span>
              </div>
            </div>
          )}

          <div ref={endRef} />
        </div>

        {hasApiKey && (
          <div className="suggestion-row ai-chat-suggestions">
            {STARTERS.map((starter) => (
              <button
                key={starter}
                type="button"
                className="suggestion-chip"
                onClick={() => sendMessage(starter)}
                disabled={isRunning}
              >
                {starter}
              </button>
            ))}
          </div>
        )}

        {error === "NO_API_KEY" && (
          <p className="error-text" style={{ marginTop: "0.75rem" }}>
            No API key set. <NavLink to="/settings" style={{ color: "var(--accent)" }}>Go to Settings →</NavLink>
          </p>
        )}
        {error && error !== "NO_API_KEY" && (
          <p className="error-text" style={{ marginTop: "0.75rem" }}>⚠ {error}</p>
        )}

        <div className="chat-input-area ai-chat-input-area" style={{ marginTop: "0.75rem" }}>
          <textarea
            ref={inputRef}
            className="chat-input"
            placeholder={placeholder}
            value={input}
            rows={2}
            disabled={isRunning || !hasApiKey}
            onChange={(e) => {
              setInput(e.target.value);
              const el = e.target;
              el.style.height = "auto";
              el.style.height = `${Math.min(el.scrollHeight, 140)}px`;
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                void sendMessage();
              }
            }}
          />
          <div className="chat-input-btns">
            <button
              className="run-button"
              onClick={() => void sendMessage()}
              disabled={!input.trim() || isRunning || !hasApiKey}
            >
              {isRunning ? <Spinner /> : "Send"}
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
