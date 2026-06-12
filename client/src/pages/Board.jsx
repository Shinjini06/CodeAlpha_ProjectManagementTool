import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import api from "../api/axios";
import Navbar from "../components/Layout/Navbar";
import TaskModal from "../components/Task/TaskModal";
import AddTaskModal from "../components/Task/AddTaskModal";
import MembersPanel from "../components/Board/MembersPanel";
import { useSocket } from "../context/SocketContext";
import "./Board.css";

const COLUMNS = [
  { id: "todo", label: "To Do", color: "#64748b", emoji: "📋" },
  { id: "in_progress", label: "In Progress", color: "#d97706", emoji: "⚡" },
  { id: "done", label: "Done", color: "#059669", emoji: "✅" },
];

const Board = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const socketRef = useSocket();

  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTask, setSelectedTask] = useState(null);
  const [showAddTask, setShowAddTask] = useState(false);
  const [addColumn, setAddColumn] = useState("todo");
  const [showMembers, setShowMembers] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchData();
    // Socket: join this project room
    const socket = socketRef?.current;
    if (socket) {
      socket.emit("join_project", id);
      socket.on("task_updated", (updatedTask) => {
        setTasks((prev) => prev.map((t) => (t.id === updatedTask.id ? updatedTask : t)));
      });
      socket.on("task_added", (newTask) => {
        setTasks((prev) => [...prev, newTask]);
      });
      socket.on("task_removed", (taskId) => {
        setTasks((prev) => prev.filter((t) => t.id !== taskId));
      });
    }
    return () => {
      socket?.emit("leave_project", id);
      socket?.off("task_updated");
      socket?.off("task_added");
      socket?.off("task_removed");
    };
  }, [id]);

  const fetchData = async () => {
    try {
      const [projectRes, tasksRes] = await Promise.all([
        api.get(`/projects/${id}`),
        api.get(`/projects/${id}/tasks`),
      ]);
      setProject(projectRes.data);
      setTasks(tasksRes.data);
    } catch (err) {
      if (err.response?.status === 403) {
        navigate("/dashboard");
      } else {
        setError("Failed to load board.");
      }
    } finally {
      setLoading(false);
    }
  };

  const getTasksByStatus = (status) => tasks.filter((t) => t.status === status);

  const handleDragEnd = async (result) => {
    const { destination, source, draggableId } = result;
    if (!destination) return;
    if (destination.droppableId === source.droppableId && destination.index === source.index) return;

    const newStatus = destination.droppableId;
    const taskId = parseInt(draggableId);

    // Optimistic update
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, status: newStatus } : t))
    );

    try {
      const res = await api.put(`/tasks/${taskId}`, { status: newStatus });
      // Broadcast via socket
      socketRef?.current?.emit("task_moved", { projectId: id, task: res.data });
    } catch {
      fetchData(); // rollback on error
    }
  };

  const handleTaskCreated = (newTask) => {
    setTasks((prev) => [...prev, newTask]);
    socketRef?.current?.emit("task_created", { projectId: id, task: newTask });
  };

  const handleTaskUpdated = (updatedTask) => {
    setTasks((prev) => prev.map((t) => (t.id === updatedTask.id ? updatedTask : t)));
    socketRef?.current?.emit("task_moved", { projectId: id, task: updatedTask });
  };

  const handleTaskDeleted = (taskId) => {
    setTasks((prev) => prev.filter((t) => t.id !== taskId));
    setSelectedTask(null);
    socketRef?.current?.emit("task_deleted", { projectId: id, taskId });
  };

  if (loading) return (
    <div className="board-page">
      <Navbar />
      <div className="board-loading">
        <div className="spinner" />
        <p>Loading board...</p>
      </div>
    </div>
  );

  return (
    <div className="board-page">
      <Navbar />

      {/* Board Header */}
      <div className="board-header">
        <div className="board-header-left">
          <button className="btn btn-ghost btn-sm" onClick={() => navigate("/dashboard")}>
            ← Back
          </button>
          <div>
            <h1>{project?.title}</h1>
            {project?.description && <p>{project.description}</p>}
          </div>
        </div>
        <div className="board-header-right">
          <div className="member-avatars">
            {project?.members?.slice(0, 4).map((m) => (
              <span key={m.id} title={m.name} className="member-chip">{m.avatar}</span>
            ))}
            {project?.members?.length > 4 && (
              <span className="member-chip more">+{project.members.length - 4}</span>
            )}
          </div>
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => setShowMembers(true)}
          >
            👥 Members
          </button>
        </div>
      </div>

      {error && <div className="alert alert-error" style={{ margin: "0 24px" }}>{error}</div>}

      {/* Kanban Board */}
      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="kanban-board">
          {COLUMNS.map((col) => {
            const colTasks = getTasksByStatus(col.id);
            return (
              <div key={col.id} className="kanban-column">
                <div className="kanban-column-header">
                  <div className="col-title">
                    <span>{col.emoji}</span>
                    <span style={{ color: col.color }}>{col.label}</span>
                    <span className="col-count">{colTasks.length}</span>
                  </div>
                  <button
                    className="btn btn-ghost btn-icon add-task-btn"
                    onClick={() => { setAddColumn(col.id); setShowAddTask(true); }}
                    title="Add task"
                  >
                    +
                  </button>
                </div>

                <Droppable droppableId={col.id}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className={`kanban-drop-zone ${snapshot.isDraggingOver ? "dragging-over" : ""}`}
                    >
                      {colTasks.map((task, index) => (
                        <Draggable key={task.id} draggableId={String(task.id)} index={index}>
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              className={`task-card ${snapshot.isDragging ? "dragging" : ""}`}
                              onClick={() => setSelectedTask(task)}
                            >
                              <div className="task-card-top">
                                <span className={`badge badge-${task.priority}`}>
                                  {task.priority}
                                </span>
                                {task.due_date && (
                                  <span className="task-due">
                                    📅 {new Date(task.due_date).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
                                  </span>
                                )}
                              </div>
                              <h4 className="task-title">{task.title}</h4>
                              {task.description && (
                                <p className="task-desc">{task.description}</p>
                              )}
                              {task.assigned_to_name && (
                                <div className="task-assignee">
                                  <span>{task.assigned_to_avatar}</span>
                                  <span>{task.assigned_to_name}</span>
                                </div>
                              )}
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}

                      {colTasks.length === 0 && !snapshot.isDraggingOver && (
                        <div className="empty-column">
                          Drop tasks here
                        </div>
                      )}
                    </div>
                  )}
                </Droppable>
              </div>
            );
          })}
        </div>
      </DragDropContext>

      {/* Modals */}
      {showAddTask && (
        <AddTaskModal
          projectId={id}
          defaultStatus={addColumn}
          members={project?.members || []}
          onClose={() => setShowAddTask(false)}
          onCreated={handleTaskCreated}
        />
      )}

      {selectedTask && (
        <TaskModal
          task={selectedTask}
          members={project?.members || []}
          onClose={() => setSelectedTask(null)}
          onUpdated={handleTaskUpdated}
          onDeleted={handleTaskDeleted}
          projectId={id}
          socketRef={socketRef}
        />
      )}

      {showMembers && (
        <MembersPanel
          project={project}
          onClose={() => setShowMembers(false)}
          onUpdated={fetchData}
        />
      )}
    </div>
  );
};

export default Board;
