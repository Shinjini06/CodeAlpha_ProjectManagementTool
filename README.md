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

## Local Setup

### Prerequisites
- Node.js v16+
- MySQL Server
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/Shinjini06/CodeAlpha_ProjectManagementTool.git
   cd CodeAlpha_ProjectManagementTool/project-management-tool
   ```

2. **Setup Database**
   ```bash
   mysql -u root -p < server/config/schema.sql
   ```

3. **Configure Backend**
   ```bash
   cd server
   cp .env.example .env
   # Edit .env with your MySQL credentials
   npm install
   npm run dev
   ```

4. **Configure Frontend**
   ```bash
   cd client
   npm install
   npm start
   ```

5. **Access the app**
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

## Environment Variables

**Server (.env)**
```
PORT=5000
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=pm_tool
JWT_SECRET=your_secret_key
CLIENT_URL=http://localhost:3000
```

## Deployment

### Deploy to Vercel (Frontend)
1. Push to GitHub
2. Connect GitHub repo to Vercel
3. Deploy automatically

### Deploy to Railway (Backend)
1. Create Railway project
2. Connect MySQL database
3. Deploy backend service
4. Set environment variables

## Author

**Shinjini Pal**
- GitHub: [@Shinjini06](https://github.com/Shinjini06)

## License

MIT License - feel free to use this project for your own purposes.

---