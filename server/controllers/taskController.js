const db = require("../config/db");

// Helper: check if user is a member of the project
const isMember = async (projectId, userId) => {
  const [rows] = await db.query(
    "SELECT * FROM project_members WHERE project_id = ? AND user_id = ?",
    [projectId, userId]
  );
  return rows.length > 0;
};

// GET /api/projects/:projectId/tasks
const getTasks = async (req, res) => {
  const { projectId } = req.params;
  try {
    if (!(await isMember(projectId, req.user.id))) {
      return res.status(403).json({ message: "Access denied." });
    }

    const [tasks] = await db.query(
      `SELECT t.*, 
        u1.name AS assigned_to_name, u1.avatar AS assigned_to_avatar,
        u2.name AS created_by_name
       FROM tasks t
       LEFT JOIN users u1 ON u1.id = t.assigned_to
       LEFT JOIN users u2 ON u2.id = t.created_by
       WHERE t.project_id = ?
       ORDER BY t.created_at ASC`,
      [projectId]
    );
    res.json(tasks);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch tasks." });
  }
};

// POST /api/projects/:projectId/tasks
const createTask = async (req, res) => {
  const { projectId } = req.params;
  const { title, description, assigned_to, priority, due_date, status } = req.body;

  if (!title) return res.status(400).json({ message: "Task title is required." });

  try {
    if (!(await isMember(projectId, req.user.id))) {
      return res.status(403).json({ message: "Access denied." });
    }

    const [result] = await db.query(
      `INSERT INTO tasks (project_id, title, description, assigned_to, priority, due_date, status, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        projectId,
        title,
        description || "",
        assigned_to || null,
        priority || "medium",
        due_date || null,
        status || "todo",
        req.user.id,
      ]
    );

    // Notify assigned user
    if (assigned_to && assigned_to !== req.user.id) {
      await db.query(
        "INSERT INTO notifications (user_id, message, type) VALUES (?, ?, 'task')",
        [assigned_to, `You were assigned a task: "${title}" by ${req.user.name}`]
      );
    }

    const [tasks] = await db.query(
      `SELECT t.*, 
        u1.name AS assigned_to_name, u1.avatar AS assigned_to_avatar,
        u2.name AS created_by_name
       FROM tasks t
       LEFT JOIN users u1 ON u1.id = t.assigned_to
       LEFT JOIN users u2 ON u2.id = t.created_by
       WHERE t.id = ?`,
      [result.insertId]
    );

    res.status(201).json(tasks[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to create task." });
  }
};

// PUT /api/tasks/:id — update task (status, title, description, etc.)
const updateTask = async (req, res) => {
  const { id } = req.params;
  const { title, description, status, priority, due_date, assigned_to } = req.body;

  try {
    const [tasks] = await db.query("SELECT * FROM tasks WHERE id = ?", [id]);
    if (tasks.length === 0) return res.status(404).json({ message: "Task not found." });

    const task = tasks[0];
    if (!(await isMember(task.project_id, req.user.id))) {
      return res.status(403).json({ message: "Access denied." });
    }

    await db.query(
      `UPDATE tasks SET 
        title = COALESCE(?, title),
        description = COALESCE(?, description),
        status = COALESCE(?, status),
        priority = COALESCE(?, priority),
        due_date = COALESCE(?, due_date),
        assigned_to = ?
       WHERE id = ?`,
      [title, description, status, priority, due_date, assigned_to !== undefined ? assigned_to : task.assigned_to, id]
    );

    // Notify if newly assigned
    if (assigned_to && assigned_to !== task.assigned_to && assigned_to !== req.user.id) {
      await db.query(
        "INSERT INTO notifications (user_id, message, type) VALUES (?, ?, 'task')",
        [assigned_to, `You were assigned a task: "${task.title}" by ${req.user.name}`]
      );
    }

    const [updated] = await db.query(
      `SELECT t.*, 
        u1.name AS assigned_to_name, u1.avatar AS assigned_to_avatar,
        u2.name AS created_by_name
       FROM tasks t
       LEFT JOIN users u1 ON u1.id = t.assigned_to
       LEFT JOIN users u2 ON u2.id = t.created_by
       WHERE t.id = ?`,
      [id]
    );

    res.json(updated[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to update task." });
  }
};

// DELETE /api/tasks/:id
const deleteTask = async (req, res) => {
  const { id } = req.params;
  try {
    const [tasks] = await db.query("SELECT * FROM tasks WHERE id = ?", [id]);
    if (tasks.length === 0) return res.status(404).json({ message: "Task not found." });

    if (!(await isMember(tasks[0].project_id, req.user.id))) {
      return res.status(403).json({ message: "Access denied." });
    }

    await db.query("DELETE FROM tasks WHERE id = ?", [id]);
    res.json({ message: "Task deleted." });
  } catch (err) {
    res.status(500).json({ message: "Failed to delete task." });
  }
};

// GET /api/tasks/:id/comments
const getComments = async (req, res) => {
  const { id } = req.params;
  try {
    const [comments] = await db.query(
      `SELECT c.*, u.name AS user_name, u.avatar AS user_avatar
       FROM comments c
       JOIN users u ON u.id = c.user_id
       WHERE c.task_id = ?
       ORDER BY c.created_at ASC`,
      [id]
    );
    res.json(comments);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch comments." });
  }
};

// POST /api/tasks/:id/comments
const addComment = async (req, res) => {
  const { id } = req.params;
  const { content } = req.body;
  if (!content) return res.status(400).json({ message: "Comment cannot be empty." });

  try {
    const [tasks] = await db.query("SELECT * FROM tasks WHERE id = ?", [id]);
    if (tasks.length === 0) return res.status(404).json({ message: "Task not found." });

    const [result] = await db.query(
      "INSERT INTO comments (task_id, user_id, content) VALUES (?, ?, ?)",
      [id, req.user.id, content]
    );

    const [comments] = await db.query(
      `SELECT c.*, u.name AS user_name, u.avatar AS user_avatar
       FROM comments c
       JOIN users u ON u.id = c.user_id
       WHERE c.id = ?`,
      [result.insertId]
    );

    res.status(201).json(comments[0]);
  } catch (err) {
    res.status(500).json({ message: "Failed to add comment." });
  }
};

// GET /api/notifications
const getNotifications = async (req, res) => {
  try {
    const [notifications] = await db.query(
      "SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 20",
      [req.user.id]
    );
    res.json(notifications);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch notifications." });
  }
};

// PUT /api/notifications/read
const markNotificationsRead = async (req, res) => {
  try {
    await db.query("UPDATE notifications SET is_read = TRUE WHERE user_id = ?", [req.user.id]);
    res.json({ message: "Notifications marked as read." });
  } catch (err) {
    res.status(500).json({ message: "Server error." });
  }
};

module.exports = { getTasks, createTask, updateTask, deleteTask, getComments, addComment, getNotifications, markNotificationsRead };
