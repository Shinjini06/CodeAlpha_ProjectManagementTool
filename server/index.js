const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
require("dotenv").config();

const app = express();
const server = http.createServer(app);

// Socket.io setup
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    methods: ["GET", "POST"],
  },
});

// Middleware
app.use(cors({ origin: process.env.CLIENT_URL || "http://localhost:3000" }));
app.use(express.json());

// Routes
app.use("/api/auth", require("./routes/auth"));
app.use("/api/projects", require("./routes/projects"));
app.use("/api/tasks", require("./routes/tasks"));

app.get("/", (req, res) => res.json({ message: "PM Tool API is running 🚀" }));

// Socket.io — real-time events
const projectRooms = {}; // track which users are in which project rooms

io.on("connection", (socket) => {
  console.log("🔌 User connected:", socket.id);

  // Join a project room
  socket.on("join_project", (projectId) => {
    socket.join(`project_${projectId}`);
    console.log(`Socket ${socket.id} joined project_${projectId}`);
  });

  // Leave a project room
  socket.on("leave_project", (projectId) => {
    socket.leave(`project_${projectId}`);
  });

  // Task moved (status changed)
  socket.on("task_moved", ({ projectId, task }) => {
    socket.to(`project_${projectId}`).emit("task_updated", task);
  });

  // New task created
  socket.on("task_created", ({ projectId, task }) => {
    socket.to(`project_${projectId}`).emit("task_added", task);
  });

  // Task deleted
  socket.on("task_deleted", ({ projectId, taskId }) => {
    socket.to(`project_${projectId}`).emit("task_removed", taskId);
  });

  // New comment
  socket.on("new_comment", ({ projectId, taskId, comment }) => {
    socket.to(`project_${projectId}`).emit("comment_added", { taskId, comment });
  });

  socket.on("disconnect", () => {
    console.log("❌ User disconnected:", socket.id);
  });
});

// Make io accessible in controllers if needed
app.set("io", io);

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});
