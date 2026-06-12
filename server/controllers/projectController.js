const db = require("../config/db");

// GET /api/projects — get all projects for logged-in user
const getProjects = async (req, res) => {
  try {
    const [projects] = await db.query(
      `SELECT p.*, u.name AS owner_name,
        (SELECT COUNT(*) FROM tasks t WHERE t.project_id = p.id) AS task_count,
        (SELECT COUNT(*) FROM project_members pm WHERE pm.project_id = p.id) AS member_count
       FROM projects p
       JOIN project_members pm ON pm.project_id = p.id
       JOIN users u ON u.id = p.owner_id
       WHERE pm.user_id = ?
       ORDER BY p.created_at DESC`,
      [req.user.id]
    );
    res.json(projects);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch projects." });
  }
};

// GET /api/projects/:id — get single project with members
const getProject = async (req, res) => {
  const { id } = req.params;
  try {
    // Check membership
    const [membership] = await db.query(
      "SELECT * FROM project_members WHERE project_id = ? AND user_id = ?",
      [id, req.user.id]
    );
    if (membership.length === 0) {
      return res.status(403).json({ message: "Access denied." });
    }

    const [projects] = await db.query(
      `SELECT p.*, u.name AS owner_name FROM projects p
       JOIN users u ON u.id = p.owner_id
       WHERE p.id = ?`,
      [id]
    );
    if (projects.length === 0) return res.status(404).json({ message: "Project not found." });

    const [members] = await db.query(
      `SELECT u.id, u.name, u.email, u.avatar, pm.role
       FROM project_members pm
       JOIN users u ON u.id = pm.user_id
       WHERE pm.project_id = ?`,
      [id]
    );

    res.json({ ...projects[0], members });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch project." });
  }
};

// POST /api/projects — create project
const createProject = async (req, res) => {
  const { title, description } = req.body;
  if (!title) return res.status(400).json({ message: "Title is required." });

  try {
    const [result] = await db.query(
      "INSERT INTO projects (title, description, owner_id) VALUES (?, ?, ?)",
      [title, description || "", req.user.id]
    );
    const projectId = result.insertId;

    // Add creator as owner member
    await db.query(
      "INSERT INTO project_members (project_id, user_id, role) VALUES (?, ?, 'owner')",
      [projectId, req.user.id]
    );

    res.status(201).json({ id: projectId, title, description, owner_id: req.user.id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to create project." });
  }
};

// PUT /api/projects/:id — update project
const updateProject = async (req, res) => {
  const { id } = req.params;
  const { title, description } = req.body;

  try {
    const [rows] = await db.query(
      "SELECT * FROM projects WHERE id = ? AND owner_id = ?",
      [id, req.user.id]
    );
    if (rows.length === 0) return res.status(403).json({ message: "Not authorized." });

    await db.query("UPDATE projects SET title = ?, description = ? WHERE id = ?", [
      title,
      description,
      id,
    ]);
    res.json({ message: "Project updated." });
  } catch (err) {
    res.status(500).json({ message: "Failed to update project." });
  }
};

// DELETE /api/projects/:id
const deleteProject = async (req, res) => {
  const { id } = req.params;
  try {
    const [rows] = await db.query(
      "SELECT * FROM projects WHERE id = ? AND owner_id = ?",
      [id, req.user.id]
    );
    if (rows.length === 0) return res.status(403).json({ message: "Not authorized." });

    await db.query("DELETE FROM projects WHERE id = ?", [id]);
    res.json({ message: "Project deleted." });
  } catch (err) {
    res.status(500).json({ message: "Failed to delete project." });
  }
};

// POST /api/projects/:id/members — add member by email
const addMember = async (req, res) => {
  const { id } = req.params;
  const { email } = req.body;

  try {
    // Only owner can add members
    const [ownership] = await db.query(
      "SELECT * FROM project_members WHERE project_id = ? AND user_id = ? AND role = 'owner'",
      [id, req.user.id]
    );
    if (ownership.length === 0) return res.status(403).json({ message: "Only project owner can add members." });

    const [users] = await db.query("SELECT id, name, email, avatar FROM users WHERE email = ?", [email]);
    if (users.length === 0) return res.status(404).json({ message: "User not found." });

    const newMember = users[0];

    const [existing] = await db.query(
      "SELECT * FROM project_members WHERE project_id = ? AND user_id = ?",
      [id, newMember.id]
    );
    if (existing.length > 0) return res.status(409).json({ message: "User is already a member." });

    await db.query(
      "INSERT INTO project_members (project_id, user_id, role) VALUES (?, ?, 'member')",
      [id, newMember.id]
    );

    // Notify the new member
    await db.query(
      "INSERT INTO notifications (user_id, message, type) VALUES (?, ?, 'project')",
      [newMember.id, `You were added to a project by ${req.user.name}`]
    );

    res.status(201).json({ message: "Member added.", member: { ...newMember, role: "member" } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to add member." });
  }
};

// DELETE /api/projects/:id/members/:userId
const removeMember = async (req, res) => {
  const { id, userId } = req.params;
  try {
    const [ownership] = await db.query(
      "SELECT * FROM project_members WHERE project_id = ? AND user_id = ? AND role = 'owner'",
      [id, req.user.id]
    );
    if (ownership.length === 0) return res.status(403).json({ message: "Only owner can remove members." });

    await db.query(
      "DELETE FROM project_members WHERE project_id = ? AND user_id = ? AND role != 'owner'",
      [id, userId]
    );
    res.json({ message: "Member removed." });
  } catch (err) {
    res.status(500).json({ message: "Failed to remove member." });
  }
};

module.exports = { getProjects, getProject, createProject, updateProject, deleteProject, addMember, removeMember };
