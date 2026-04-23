import { ChangeEvent, useMemo, useRef, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { GlassPanel } from "../../components/GlassPanel";
import type { Project } from "../../data/mock";
import { useAppDispatch, useProjects } from "../../store/AppContext";

export function ProjectsPage() {
  const projects = useProjects();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const importInputRef = useRef<HTMLInputElement>(null);

  const [query, setQuery] = useState("");
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");

  const filtered = useMemo(
    () =>
      projects.filter((p) =>
        p.name.toLowerCase().includes(query.trim().toLowerCase())
      ),
    [projects, query]
  );

  const exportProject = (project: Project) => {
    const blob = new Blob([JSON.stringify(project, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${project.name.replace(/[^a-z0-9-]+/gi, "-").toLowerCase() || "project"}.vibesai.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportPreview = (project: Project) => {
    if (!project.builder?.generatedCode) return;
    const blob = new Blob([project.builder.generatedCode], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${project.name.replace(/[^a-z0-9-]+/gi, "-").toLowerCase() || "project"}.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const importProject = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      const raw = await file.text();
      const project = JSON.parse(raw) as Project;
      if (!project.name || !project.id) {
        throw new Error("Invalid project file.");
      }
      dispatch({ type: "PROJECT_IMPORT", project });
    } catch {
      window.alert("That file is not a valid VibesAI project export.");
    } finally {
      event.target.value = "";
    }
  };

  const startRename = (id: string, current: string) => {
    setRenamingId(id);
    setRenameValue(current);
  };

  const commitRename = () => {
    if (renamingId && renameValue.trim()) {
      dispatch({ type: "PROJECT_RENAME", id: renamingId, name: renameValue.trim() });
    }
    setRenamingId(null);
  };

  const handleDelete = (id: string, name: string) => {
    if (window.confirm(`Delete "${name}"? This cannot be undone.`)) {
      dispatch({ type: "PROJECT_DELETE", id });
    }
  };

  return (
    <div className="page-stack">
      <header className="page-header">
        <h1>Projects</h1>
        <p>Your VibesAI library. Builder sessions save here automatically, and you can import or export them.</p>
      </header>

      <GlassPanel>
        <div className="inline-controls">
          <input
            className="search-input"
            placeholder="Search projects…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <div className="project-toolbar-actions">
            <button type="button" className="text-button" onClick={() => importInputRef.current?.click()}>
              Import Project
            </button>
            <NavLink to="/" className="run-button project-build-link">
              Open Builder →
            </NavLink>
          </div>
          <input
            ref={importInputRef}
            type="file"
            accept="application/json,.json"
            hidden
            onChange={importProject}
          />
        </div>
      </GlassPanel>

      <GlassPanel title={`Library (${filtered.length})`}>
        {filtered.length === 0 ? (
          <p className="empty-state">
            {query ? "No projects match your search." : "No projects yet. Start in the builder or import a saved project."}
          </p>
        ) : (
          <ul className="list-grid">
            {filtered.map((project) => (
              <li key={project.id} className="list-item">
                {renamingId === project.id ? (
                  <input
                    className="inline-edit"
                    autoFocus
                    value={renameValue}
                    onChange={(e) => setRenameValue(e.target.value)}
                    onBlur={commitRename}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") commitRename();
                      if (e.key === "Escape") setRenamingId(null);
                    }}
                  />
                ) : (
                  <div
                    className="project-name"
                    onDoubleClick={() => startRename(project.id, project.name)}
                    title="Double-click to rename"
                  >
                    <strong
                      className="project-name-link"
                      onClick={() => navigate(`/projects/${project.id}`)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => e.key === "Enter" && navigate(`/projects/${project.id}`)}
                    >
                      {project.name}
                    </strong>
                    <p>
                      Updated {project.updatedAt}
                      {project.messages?.length ? ` · ${project.messages.length} msg${project.messages.length !== 1 ? "s" : ""}` : ""}
                      {project.builder ? ` · ${project.builder.checkpoints.length} checkpoints` : ""}
                    </p>
                    {project.builder && (
                      <div className="project-list-builder-row">
                        <span className="badge">Builder</span>
                        <span className="badge muted">
                          {project.builder.generatedCode ? "Live preview saved" : "Plan saved"}
                        </span>
                        <NavLink to={`/builder/${project.id}`} className="project-inline-link">
                          Resume
                        </NavLink>
                      </div>
                    )}
                  </div>
                )}

                <div className="item-actions">
                  <span className={`status ${project.status.toLowerCase()}`}>
                    {project.status}
                  </span>
                  <button
                    type="button"
                    className="icon-btn"
                    title="Export project package"
                    onClick={() => exportProject(project)}
                  >
                    ⇩
                  </button>
                  {project.builder?.generatedCode && (
                    <button
                      type="button"
                      className="icon-btn"
                      title="Export live preview as HTML"
                      onClick={() => exportPreview(project)}
                    >
                      ⤓
                    </button>
                  )}
                  <button
                    type="button"
                    className="icon-btn"
                    title="Rename"
                    onClick={() => startRename(project.id, project.name)}
                  >
                    ✎
                  </button>
                  {project.status === "Archived" ? (
                    <button
                      type="button"
                      className="icon-btn"
                      title="Restore to Draft"
                      onClick={() => dispatch({ type: "PROJECT_RESTORE", id: project.id })}
                    >
                      ↩
                    </button>
                  ) : (
                    <button
                      type="button"
                      className="icon-btn"
                      title="Archive"
                      onClick={() => dispatch({ type: "PROJECT_ARCHIVE", id: project.id })}
                    >
                      ⊘
                    </button>
                  )}
                  <button
                    type="button"
                    className="icon-btn danger"
                    title="Delete permanently"
                    onClick={() => handleDelete(project.id, project.name)}
                  >
                    ✕
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </GlassPanel>
    </div>
  );
}
