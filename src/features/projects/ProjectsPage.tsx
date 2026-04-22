import { useMemo, useState } from "react";
import { GlassPanel } from "../../components/GlassPanel";
import { Modal } from "../../components/Modal";
import { useAppDispatch, useProjects } from "../../store/AppContext";

export function ProjectsPage() {
  const projects = useProjects();
  const dispatch = useAppDispatch();

  const [query, setQuery] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState("");
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");

  const filtered = useMemo(
    () =>
      projects.filter((p) =>
        p.name.toLowerCase().includes(query.trim().toLowerCase())
      ),
    [projects, query]
  );

  const handleCreate = () => {
    if (!newName.trim()) return;
    dispatch({ type: "PROJECT_CREATE", name: newName.trim() });
    setNewName("");
    setShowCreate(false);
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
        <p>Your VibesAI library. Double-click a name to rename inline.</p>
      </header>

      <GlassPanel>
        <div className="inline-controls">
          <input
            className="search-input"
            placeholder="Search projects…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <button type="button" className="run-button" onClick={() => setShowCreate(true)}>
            + New Project
          </button>
        </div>
      </GlassPanel>

      <GlassPanel title={`Library (${filtered.length})`}>
        {filtered.length === 0 ? (
          <p className="empty-state">
            {query ? "No projects match your search." : "No projects yet. Create your first one above."}
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
                    <strong>{project.name}</strong>
                    <p>Updated {project.updatedAt}</p>
                  </div>
                )}

                <div className="item-actions">
                  <span className={`status ${project.status.toLowerCase()}`}>
                    {project.status}
                  </span>
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

      {showCreate && (
        <Modal
          title="New Project"
          onClose={() => {
            setShowCreate(false);
            setNewName("");
          }}
        >
          <label>
            Project name
            <input
              autoFocus
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="e.g. Q3 Campaign Copy"
              onKeyDown={(e) => {
                if (e.key === "Enter") handleCreate();
              }}
            />
          </label>
          <div className="modal-actions">
            <button
              type="button"
              className="text-button"
              onClick={() => {
                setShowCreate(false);
                setNewName("");
              }}
            >
              Cancel
            </button>
            <button
              type="button"
              className="run-button"
              onClick={handleCreate}
              disabled={!newName.trim()}
            >
              Create
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
