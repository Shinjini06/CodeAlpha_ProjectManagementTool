import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import api from "../../api/axios";
import "./Navbar.css";

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [showNotifs, setShowNotifs] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  useEffect(() => {
    if (user) fetchNotifications();
  }, [user]);

  const fetchNotifications = async () => {
    try {
      const res = await api.get("/tasks/notifications/all");
      setNotifications(res.data);
    } catch {}
  };

  const handleMarkRead = async () => {
    try {
      await api.put("/tasks/notifications/read");
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    } catch {}
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const unread = notifications.filter((n) => !n.is_read).length;

  return (
    <nav className="navbar">
      <Link to="/dashboard" className="navbar-brand">
        <span>📋</span>
        <span>TaskFlow</span>
      </Link>

      <div className="navbar-actions">
        {/* Notifications */}
        <div className="notif-wrapper">
          <button
            className="btn btn-ghost btn-icon notif-btn"
            onClick={() => { setShowNotifs(!showNotifs); setShowMenu(false); handleMarkRead(); }}
          >
            🔔
            {unread > 0 && <span className="notif-badge">{unread}</span>}
          </button>

          {showNotifs && (
            <div className="notif-dropdown">
              <div className="notif-header">
                <span>Notifications</span>
                <button className="btn btn-ghost btn-sm" onClick={() => setShowNotifs(false)}>✕</button>
              </div>
              {notifications.length === 0 ? (
                <p className="notif-empty">No notifications yet</p>
              ) : (
                notifications.map((n) => (
                  <div key={n.id} className={`notif-item ${!n.is_read ? "unread" : ""}`}>
                    <span className="notif-icon">{n.type === "task" ? "📌" : "👥"}</span>
                    <p>{n.message}</p>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* User Menu */}
        <div className="user-menu-wrapper">
          <button
            className="user-avatar-btn"
            onClick={() => { setShowMenu(!showMenu); setShowNotifs(false); }}
          >
            <span className="user-avatar">{user?.avatar || "🧑"}</span>
            <span className="user-name">{user?.name?.split(" ")[0]}</span>
            <span>▾</span>
          </button>

          {showMenu && (
            <div className="user-dropdown">
              <div className="user-dropdown-header">
                <span>{user?.avatar}</span>
                <div>
                  <p className="ud-name">{user?.name}</p>
                  <p className="ud-email">{user?.email}</p>
                </div>
              </div>
              <hr />
              <button className="dropdown-item danger" onClick={handleLogout}>
                🚪 Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
