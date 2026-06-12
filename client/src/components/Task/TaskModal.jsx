import { useState, useEffect } from "react";
import api from "../../api/axios";
import { useAuth } from "../../context/AuthContext";
import "./TaskModal.css";

const TaskModal = ({ task, members, onClose, onUpdated, onDeleted, projectId, socketRef }) => {
  const { user } = useAuth();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ ...task });
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchComments();
  }, [task.id]);

  const fetchComments = async () => {
    try {
      const res = await api.get(`/tasks/${task.id}/comments`);
      setComments(res.data);
    } catch {}
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await api.put(`/tasks/${task.id}`, form);
      onUpdated(res.data);
      setEditing(false);
    } catch (err) {
      setError("Failed to update task.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("Delete this task? This cannot be undone.")) return;
    try {
      await api.delete(`/tasks/${task.id}`);
      onDeleted(task.id);
    } catch {
      setError("Failed to delete task.");
    }
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    setLoading(true);
    try {
      const res = await api.post(`/tasks/${task.id}/comments`, { content: newComment });
      setComments((prev) => [...prev, res.data]);
      setNewComment("");
      // Broadcast via socket
      socketRef?.current?.emit("new_comment", { projectId, taskId: task.id, comment: res.data });
    } catch {
      setError("Failed to add comment.");
    } finally {
      setLoading(false);
    }
  };

  const currentTask = form;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="task-modal-box" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="task-modal-header">
          <div className="task-modal-badges">
            <span className={`badge badge-${currentTask.status}`}>{currentTask.status.replace("_", " ")}</span>
            <span className={`badge badge-${currentTask.priority}`}>{currentTask.priority}</span>
          </div>
          <div className="task-modal-actions">
            {!editing ? (
              <button className="btn btn-secondary btn-sm" onClick={() => setEditing(true)}>✏️ Edit</button>
            ) : (
              <button className="btn btn-primary btn-sm" onClick={handleSave} disabled={saving}>
                {saving ? "Saving..." : "💾 Save"}
              </button>
            )}
            <button className="btn btn-danger btn-sm" onClick={handleDelete}>🗑️</button>
            <button className="btn btn-ghost btn-icon" onClick={onClose}>✕</button>
          </div>
        </div>

        <div className="task-modal-content">
          {error && <div className="alert alert-error">{error}</div>}

          {/* Title */}
          {editing ? (
            <input
              className="form-input task-title-input"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
            />
          ) : (
            <h2 className="task-modal-title">{currentTask.title}</h2>
          )}

          {/* Meta row */}
          <div className="task-meta-row">
            {editing ? (
              <>
                <div className="form-group">
                  <label>Status</label>
                  <select className="form-input" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                    <option value="todo">📋 To Do</option>
                    <option value="in_progress">⚡ In Progress</option>
                    <option value="done">✅ Done</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Priority</label>
                  <select className="form-input" value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}>
                    <option value="low">🟢 Low</option>
                    <option value="medium">🟡 Medium</option>
                    <option value="high">🔴 High</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Assign To</label>
                  <select className="form-input" value={form.assigned_to || ""} onChange={(e) => setForm({ ...form, assigned_to: e.target.value || null })}>
                    <option value="">Unassigned</option>
                    {members.map((m) => <option key={m.id} value={m.id}>{m.avatar} {m.name}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>Due Date</label>
                  <input className="form-input" type="date" value={form.due_date?.split("T")[0] || ""} onChange={(e) => setForm({ ...form, due_date: e.target.value })} />
                </div>
              </>
            ) : (
              <>
                {currentTask.assigned_to_name && (
                  <div className="task-meta-item">
                    <span className="meta-label">Assigned To</span>
                    <span className="meta-value">{currentTask.assigned_to_avatar} {currentTask.assigned_to_name}</span>
                  </div>
                )}
                {currentTask.due_date && (
                  <div className="task-meta-item">
                    <span className="meta-label">Due Date</span>
                    <span className="meta-value">📅 {new Date(currentTask.due_date).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}</span>
                  </div>
                )}
                <div className="task-meta-item">
                  <span className="meta-label">Created By</span>
                  <span className="meta-value">{currentTask.created_by_name}</span>
                </div>
              </>
            )}
          </div>

          {/* Description */}
          <div className="task-section">
            <label className="section-label">Description</label>
            {editing ? (
              <textarea
                className="form-input"
                rows={3}
                value={form.description || ""}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Add a description..."
              />
            ) : (
              <p className="task-description">
                {currentTask.description || <span style={{ color: "#94a3b8" }}>No description</span>}
              </p>
            )}
          </div>

          {/* Comments */}
          <div className="task-section">
            <label className="section-label">Comments ({comments.length})</label>
            <div className="comments-list">
              {comments.map((c) => (
                <div key={c.id} className={`comment ${c.user_id === user.id ? "own" : ""}`}>
                  <span className="comment-avatar">{c.user_avatar}</span>
                  <div className="comment-body">
                    <div className="comment-meta">
                      <span className="comment-author">{c.user_name}</span>
                      <span className="comment-time">
                        {new Date(c.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>
                    <p className="comment-text">{c.content}</p>
                  </div>
                </div>
              ))}
              {comments.length === 0 && (
                <p className="no-comments">No comments yet. Be the first!</p>
              )}
            </div>

            <form onSubmit={handleAddComment} className="comment-form">
              <span className="comment-avatar">{user?.avatar}</span>
              <input
                className="form-input"
                placeholder="Write a comment..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
              />
              <button type="submit" className="btn btn-primary btn-sm" disabled={loading || !newComment.trim()}>
                Send
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TaskModal;
