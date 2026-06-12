const db = require("../config/db");

const getProjects = async (req, res) => {
  try {
    const [projects] = await db.promise().query(
      `SELECT p.*, u.name AS owner_name,
        (SELECT COUNT(*) FROM tasks t WHERE t.project_id = p.id) AS task_count
       FROM projects p
       JOIN users u ON u.id = p.user_id
       WHERE p.user_id = ?
       ORDER BY p.created_at DESC`,
      [req.user.id]
    );
    res.json(projects);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch projects." });
  }
};

const getProject = async (req, res) => {
  const { id } = req.params;
  try {
    const [projects] = await db.promise().query(
      `SELECT p.*, u.name AS owner_name FROM projects p
       JOIN users u ON u.id = p.user_id
       WHERE p.id = ? AND p.user_id = ?`,
      [id, req.user.id]
    );
    if (projects.length === 0) return res.status(404).json({ message: "Project not found." });
    res.json(projects[0]);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch project." });
  }
};

const createProject = async (req, res) => {
  const { name, description } = req.body;
  if (!name) return res.status(400).json({ message: "Name is required." });
  try {
    const [result] = await db.promise().query(
      "INSERT INTO projects (name, description, user_id) VALUES (?, ?, ?)",
      [name, description || "", req.user.id]
    );
    await db.promise().query(
      "INSERT INTO project_members (project_id, user_id, role) VALUES (?, ?, 'owner')",
      [result.insertId, req.user.id]
    );
    res.status(201).json({ id: result.insertId, name, description, user_id: req.user.id });
  } catch (err) {
    res.status(500).json({ message: "Failed to create project." });
  }
};

const updateProject = async (req, res) => {
  const { id } = req.params;
  const { name, description } = req.body;
  try {
    const [rows] = await db.promise().query(
      "SELECT * FROM projects WHERE id = ? AND user_id = ?",
      [id, req.user.id]
    );
    if (rows.length === 0) return res.status(403).json({ message: "Not authorized." });
    await db.promise().query(
      "UPDATE projects SET name = ?, description = ? WHERE id = ?",
      [name, description, id]
    );
    res.json({ message: "Project updated." });
  } catch (err) {
    res.status(500).json({ message: "Failed to update project." });
  }
};

const deleteProject = async (req, res) => {
  const { id } = req.params;
  try {
    const [rows] = await db.promise().query(
      "SELECT * FROM projects WHERE id = ? AND user_id = ?",
      [id, req.user.id]
    );
    if (rows.length === 0) return res.status(403).json({ message: "Not authorized." });
    await db.promise().query("DELETE FROM projects WHERE id = ?", [id]);
    res.json({ message: "Project deleted." });
  } catch (err) {
    res.status(500).json({ message: "Failed to delete project." });
  }
};

module.exports = { getProjects, getProject, createProject, updateProject, deleteProject };