const express = require("express");
const router = express.Router({ mergeParams: true });
const auth = require("../middleware/auth");
const db = require("../config/db");

// Get comments for a task
router.get("/:taskId/comments", auth, async (req, res) => {
  try {
    const [comments] = await db.promise().query(
      `SELECT c.*, u.name FROM comments c 
       JOIN users u ON c.user_id = u.id 
       WHERE c.task_id = ? ORDER BY c.created_at ASC`,
      [req.params.taskId]
    );
    res.json(comments);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Add a comment
router.post("/:taskId/comments", auth, async (req, res) => {
  const { content } = req.body;
  try {
    const [result] = await db.promise().query(
      "INSERT INTO comments (task_id, user_id, content) VALUES (?, ?, ?)",
      [req.params.taskId, req.user.id, content]
    );
    res.status(201).json({ id: result.insertId, content, user_id: req.user.id });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;