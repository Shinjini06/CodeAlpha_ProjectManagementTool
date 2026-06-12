# TaskFlow — Project Management Tool
> CodeAlpha Full Stack Internship — Task 3

A full-stack Trello-inspired project management tool with real-time collaboration via Socket.io.

## 🛠 Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React.js, React Router, CSS |
| Backend | Node.js, Express.js |
| Database | MySQL |
| Real-time | Socket.io |
| Auth | JWT (JSON Web Tokens) |
| Drag & Drop | @hello-pangea/dnd |

## ✨ Features

- **JWT Authentication** — Register / Login / Auto logout
- **Project Management** — Create, view, delete projects
- **Team Collaboration** — Invite members by email, role-based access
- **Kanban Board** — Drag & drop tasks across To Do / In Progress / Done
- **Task Management** — Create, assign, update, delete tasks with priorities & due dates
- **Comments** — Real-time commenting on tasks
- **Notifications** — In-app notifications when assigned to tasks or added to projects
- **Real-time Updates** — Socket.io keeps all team members in sync

## 🚀 Setup Instructions

### Prerequisites
- Node.js v16+
- MySQL 8+

### 1. Clone the repository
```bash
git clone https://github.com/Shinjini06/CodeAlpha_ProjectManagementTool
cd CodeAlpha_ProjectManagementTool
```

### 2. Set up the database
```bash
mysql -u root -p < server/config/schema.sql
```

### 3. Configure environment variables
```bash
cd server
cp .env.example .env
# Edit .env with your MySQL credentials and a JWT secret
```

### 4. Install and run the backend
```bash
cd server
npm install
npm run dev
# Server runs at http://localhost:5000
```

### 5. Install and run the frontend
```bash
cd client
npm install
npm start
# App opens at http://localhost:3000
```

## 📁 Project Structure

```
CodeAlpha_ProjectManagementTool/
├── server/
│   ├── config/
│   │   ├── db.js              # MySQL connection pool
│   │   └── schema.sql         # Database schema
│   ├── controllers/
│   │   ├── authController.js  # Register, Login, GetMe
│   │   ├── projectController.js
│   │   └── taskController.js  # Tasks, Comments, Notifications
│   ├── middleware/
│   │   └── auth.js            # JWT middleware
│   ├── routes/
│   │   ├── auth.js
│   │   ├── projects.js
│   │   └── tasks.js
│   ├── .env.example
│   └── index.js               # Express + Socket.io server
│
└── client/
    └── src/
        ├── api/
        │   └── axios.js       # Axios instance with interceptors
        ├── components/
        │   ├── Auth/          # PrivateRoute
        │   ├── Board/         # MembersPanel
        │   ├── Layout/        # Navbar
        │   └── Task/          # AddTaskModal, TaskModal
        ├── context/
        │   ├── AuthContext.jsx
        │   └── SocketContext.jsx
        ├── pages/
        │   ├── Login.jsx
        │   ├── Register.jsx
        │   ├── Dashboard.jsx
        │   └── Board.jsx       # Kanban board with DnD
        └── App.jsx
```

## 🔗 API Endpoints

### Auth
- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET  /api/auth/me`

### Projects
- `GET    /api/projects`
- `POST   /api/projects`
- `GET    /api/projects/:id`
- `PUT    /api/projects/:id`
- `DELETE /api/projects/:id`
- `POST   /api/projects/:id/members`
- `DELETE /api/projects/:id/members/:userId`

### Tasks
- `GET    /api/projects/:projectId/tasks`
- `POST   /api/projects/:projectId/tasks`
- `PUT    /api/tasks/:id`
- `DELETE /api/tasks/:id`
- `GET    /api/tasks/:id/comments`
- `POST   /api/tasks/:id/comments`
- `GET    /api/tasks/notifications/all`
- `PUT    /api/tasks/notifications/read`

---

Built with ❤️ by Shinjini Pal | CodeAlpha Full Stack Internship
