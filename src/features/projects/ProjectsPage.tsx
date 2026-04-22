import { useMemo, useState } from "react";
import { GlassPanel } from "../../components/GlassPanel";
import { mockProjects } from "../../data/mock";

export function ProjectsPage() {
  const [query, setQuery] = useState("");

  const filtered = useMemo(
    () =>
      mockProjects.filter((project) =>
        project.name.toLowerCase().includes(query.trim().toLowerCase())
      ),
    [query]
  );

  return (
    <div className="page-stack">
      <header className="page-header">
        <h1>Projects</h1>
        <p>Manage your VibesAI library with simple controls first and deeper options inside each project.</p>
      </header>

      <GlassPanel>
        <div className="inline-controls">
          <input
            className="search-input"
            placeholder="Search projects"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
          <button type="button" className="run-button">
            New Project
          </button>
        </div>
      </GlassPanel>

      <GlassPanel title="Library">
        <ul className="list-grid" aria-label="Project list">
          {filtered.map((project) => (
            <li key={project.id} className="list-item">
              <div>
                <strong>{project.name}</strong>
                <p>Updated {project.updatedAt}</p>
              </div>
              <span className={`status ${project.status.toLowerCase()}`}>{project.status}</span>
            </li>
          ))}
        </ul>
      </GlassPanel>
    </div>
  );
}
