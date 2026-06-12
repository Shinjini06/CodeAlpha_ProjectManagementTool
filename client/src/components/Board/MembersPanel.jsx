import { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import api from "../../api/axios";
import "./MembersPanel.css";

const MembersPanel = ({ project, onClose, onUpdated }) => {
  const { user } = useAuth();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const isOwner = project?.members?.find(
    (m) => m.id === user.id && m.role === "owner"
  );

  const handleAddMember = async (e) => {
    e.preventDefault();
    if (!email.trim()) return;
    setError(""); setSuccess("");
    setLoading(true);
    try {
      await api.post(`/projects/${project.id}/members`, { email });
      setSuccess(`${email} added to the project!`);
      setEmail("");
      onUpdated();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to add member.");
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async (memberId) => {
    if (!window.confirm("Remove this member?")) return;
    try {
      await api.delete(`/projects/${project.id}/members/${memberId}`);
      onUpdated();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to remove member.");
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>👥 Team Members</h2>
          <button className="btn btn-ghost btn-icon" onClick={onClose}>✕</button>
        </div>

        <div className="modal-body">
          {error && <div className="alert alert-error">{error}</div>}
          {success && <div className="alert alert-success">{success}</div>}

          {/* Add Member */}
          {isOwner && (
            <form onSubmit={handleAddMember} className="add-member-form">
              <div className="form-group" style={{ flex: 1, marginBottom: 0 }}>
                <input
                  className="form-input"
                  type="email"
                  placeholder="Add member by email..."
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? "Adding..." : "Add"}
              </button>
            </form>
          )}

          {/* Members List */}
          <div className="members-list">
            {project?.members?.map((m) => (
              <div key={m.id} className="member-row">
                <span className="member-avatar-large">{m.avatar}</span>
                <div className="member-info">
                  <span className="member-name">{m.name}</span>
                  <span className="member-email">{m.email}</span>
                </div>
                <span className={`role-badge ${m.role}`}>{m.role}</span>
                {isOwner && m.id !== user.id && m.role !== "owner" && (
                  <button
                    className="btn btn-danger btn-sm"
                    onClick={() => handleRemove(m.id)}
                  >
                    Remove
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MembersPanel;
