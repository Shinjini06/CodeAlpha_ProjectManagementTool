# TaskFlow - Project Management Tool

A collaborative project management application built with React, Node.js, and MySQL. Organize your work by creating projects, adding tasks, and managing them in a Kanban-style board.

## Features

-  **User Authentication** - Secure login and registration with JWT
-  **Project Management** - Create and manage multiple projects
-  **Task Management** - Add tasks and organize by status (To Do, In Progress, Done)
-  **Drag & Drop** - Move tasks between columns effortlessly
-  **Comments** - Add comments to tasks for collaboration
-  **Real-time Updates** - Socket.IO for live updates across team members

## Tech Stack

**Frontend:**
- React.js
- Tailwind CSS
- Axios

**Backend:**
- Node.js
- Express.js
- Socket.IO

**Database:**
- MySQL

**Deployment:**
- Vercel (Frontend)
- Railway (Backend & Database)

**Access the app**
   - Frontend: `http://localhost:3000`
   - Backend: `http://localhost:5000`

## Usage

1. **Register** - Create a new account
2. **Create Project** - Start a new project
3. **Add Tasks** - Create tasks within your project
4. **Organize** - Drag tasks between columns to update status
5. **Collaborate** - Add comments to tasks and invite team members

## File Structure

```
project-management-tool/
├── client/                 # React frontend
│   ├── src/
│   ├── public/
│   └── package.json
├── server/                 # Node.js backend
│   ├── config/            # Database config
│   ├── controllers/        # Business logic
│   ├── routes/            # API endpoints
│   ├── middleware/        # Auth & utilities
│   └── index.js
└── README.md
```

## Author

**Shinjini Pal**
- GitHub: [@Shinjini06](https://github.com/Shinjini06)

## License

MIT License - feel free to use this project for your own purposes.

---
