const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const {
  updateTask,
  deleteTask,
  getComments,
  addComment,
  getNotifications,
  markNotificationsRead,
} = require("../controllers/taskController");

router.put("/:id", auth, updateTask);
router.delete("/:id", auth, deleteTask);
router.get("/:id/comments", auth, getComments);
router.post("/:id/comments", auth, addComment);

// Notifications
router.get("/notifications/all", auth, getNotifications);
router.put("/notifications/read", auth, markNotificationsRead);

module.exports = router;
