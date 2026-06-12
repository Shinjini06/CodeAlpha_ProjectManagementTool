const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const {
  getProjects,
  getProject,
  createProject,
  updateProject,
  deleteProject,
} = require("../controllers/projectController");
const { getTasks, createTask } = require("../controllers/taskController");

router.get("/", auth, getProjects);
router.post("/", auth, createProject);
router.get("/:id", auth, getProject);
router.put("/:id", auth, updateProject);
router.delete("/:id", auth, deleteProject);

// Tasks under a project
router.get("/:projectId/tasks", auth, getTasks);
router.post("/:projectId/tasks", auth, createTask);

module.exports = router;