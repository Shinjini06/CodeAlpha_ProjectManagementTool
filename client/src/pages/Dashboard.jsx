import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../api/axios";
import Navbar from "../components/Layout/Navbar";
import "./Dashboard.css";

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ title: "", description: "" });
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");
  const [deletingId, setDeletingId] = useState(null);

  useEffect(() => { fetchProjects(); }, []);

  const fetchProjects = async () => {
    try {
      const res = await api.get("/projects");
      setProjects(res.data);
    } catch {
      setError("Failed to load projects.");
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) return;
    setCreating(true);
    try {
      await api.post("/projects", { name: form.title, description: form.description });
      setShowModal(false);
      setForm({ title: "", description: "" });
      fetchProjects();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to create project.");
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (e, projectId, projectName) => {
    e.stopPropagation();
    if (!window.confirm(`Delete project "${projectName}"? This cannot be undone.`)) return;
    setDeletingId(projectId);
    try {
      await api.delete(`/projects/${projectId}`);
      setProjects((prev) => prev.filter((p) => p.id !== projectId));
    } catch (err) {
      setError(err.response?.data?.message || "Failed to delete project.");
    } finally {
      setDeletingId(null);
    }
  };

  const getInitials = (title) => (title || "??").slice(0, 2).toUpperCase();
  const colors = ["#4f46e5", "#7c3aed", "#0891b2", "#059669", "#d97706", "#dc2626"];
  const getColor = (id) => colors[id % colors.length];

  return (
    <div className="dashboard-page">
      <Navbar />
      <div className="dashboard-content">
        <div className="dashboard-header">
          <div>
            <h1>My Projects</h1>
            <p>Welcome back, {user?.name?.split(" ")[0]} {user?.avatar} — here are your workspaces.</p>
          </div>
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>
            + New Project
          </button>
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        {loading ? (
          <div className="loading-grid">
            {[1, 2, 3].map(i => <div key={i} className="project-skeleton" />)}
          </div>
        ) : projects.length === 0 ? (
          <div className="empty-state">
            <span>🗂️</span>
            <h3>No projects yet</h3>
            <p>Create your first project to get started</p>
            <button className="btn btn-primary" onClick={() => setShowModal(true)}>
              + Create Project
            </button>
          </div>
        ) : (
          <div className="projects-grid">
            {projects.map((p) => (
              <div
                key={p.id}
                className="project-card"
                onClick={() => navigate(`/project/${p.id}`)}
                style={{ position: "relative" }}
              >
                <button
                  className="btn btn-ghost btn-icon"
                  onClick={(e) => handleDelete(e, p.id, p.name)}
                  disabled={deletingId === p.id}
                  title="Delete project"
                  style={{
                    position: "absolute",
                    top: "10px",
                    right: "10px",
                    fontSize: "16px",
                    zIndex: 2,
                  }}
                >
                  {deletingId === p.id ? "..." : "🗑️"}
                </button>
                <div
                  className="project-card-icon"
                  style={{ background: getColor(p.id) }}
                >
                  {getInitials(p.name)}
                </div>
                <div className="project-card-body">
                  <h3>{p.name}</h3>
                  <p>{p.description || "No description"}</p>
                  <div className="project-card-meta">
                    <span>📌 {p.task_count} tasks</span>
                    <span>👥 1 member</span>
                  </div>
                </div>
                <div className="project-card-arrow">→</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Project Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>New Project</h2>
              <button className="btn btn-ghost btn-icon" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <form onSubmit={handleCreate} className="modal-body">
              <div className="form-group">
                <label>Project Name</label>
                <input
                  className="form-input"
                  placeholder="e.g. Website Redesign"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  autoFocus
                  required
                />
              </div>
              <div className="form-group">
                <label>Description (optional)</label>
                <textarea
                  className="form-input"
                  placeholder="What is this project about?"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                />
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-ghost" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={creating}>
                  {creating ? "Creating..." : "Create Project"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;