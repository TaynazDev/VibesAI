import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { GlassPanel } from "../../components/GlassPanel";
import { useAppDispatch, usePromptLibrary } from "../../store/AppContext";

export function PromptLibraryPage() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const templates = usePromptLibrary();

  const [query, setQuery] = useState("");
  const [tagFilter, setTagFilter] = useState("all");

  const tags = useMemo(
    () => Array.from(new Set(templates.flatMap((template) => template.tags))).sort((a, b) => a.localeCompare(b)),
    [templates]
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return templates.filter((template) => {
      const matchesQuery =
        !q ||
        template.name.toLowerCase().includes(q) ||
        template.prompt.toLowerCase().includes(q) ||
        template.tags.some((tag) => tag.toLowerCase().includes(q));

      const matchesTag = tagFilter === "all" || template.tags.includes(tagFilter);
      return matchesQuery && matchesTag;
    });
  }, [query, tagFilter, templates]);

  return (
    <div className="page-stack">
      <header className="page-header">
        <h1>Prompt Library</h1>
        <p>Save, search, and reuse your best prompts.</p>
      </header>

      <GlassPanel>
        <div className="inline-controls" style={{ gap: "0.7rem" }}>
          <input
            className="search-input"
            value={query}
            placeholder="Search prompts, names, or tags…"
            onChange={(event) => setQuery(event.target.value)}
          />
          <select value={tagFilter} onChange={(event) => setTagFilter(event.target.value)}>
            <option value="all">All tags</option>
            {tags.map((tag) => (
              <option key={tag} value={tag}>{tag}</option>
            ))}
          </select>
        </div>
      </GlassPanel>

      {filtered.length === 0 ? (
        <GlassPanel>
          <div className="empty-state">
            <h3>No prompts yet</h3>
            <p>Save prompts from AI Chat to build your library.</p>
          </div>
        </GlassPanel>
      ) : (
        <GlassPanel title={`Saved Prompts (${filtered.length})`}>
          <ul className="list-grid">
            {filtered.map((template) => (
              <li key={template.id} className="list-item">
                <div className="list-item-top">
                  <strong>{template.name}</strong>
                  <span className="badge muted">{template.updatedAt}</span>
                </div>

                <p style={{ margin: "0.45rem 0 0.6rem", color: "var(--ink-soft)", whiteSpace: "pre-wrap" }}>
                  {template.prompt}
                </p>

                {template.tags.length > 0 && (
                  <div className="suggestion-row" style={{ justifyContent: "flex-start", paddingTop: 0 }}>
                    {template.tags.map((tag) => (
                      <span key={`${template.id}-${tag}`} className="badge">#{tag}</span>
                    ))}
                  </div>
                )}

                <div className="inline-controls" style={{ justifyContent: "flex-end", marginTop: "0.6rem" }}>
                  <button
                    type="button"
                    className="text-button"
                    onClick={() => {
                      navigate("/ai-chat", { state: { prompt: template.prompt } });
                    }}
                  >
                    Use In AI Chat
                  </button>
                  <button
                    type="button"
                    className="text-button"
                    onClick={() => {
                      dispatch({ type: "PROMPT_DELETE", id: template.id });
                    }}
                  >
                    Delete
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </GlassPanel>
      )}
    </div>
  );
}
