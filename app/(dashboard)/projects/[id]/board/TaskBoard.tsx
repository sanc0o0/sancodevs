"use client";

import { useState } from "react";
import Link from "next/link";

type User = { id: string; name: string | null; image: string | null };
type Task = {
    id: string;
    title: string;
    description: string | null;
    status: string;
    priority: string;
    assignedTo: string | null;
    assignee: User | null;
    dueDate: string | null;
    createdAt: string;
};
type TeamMember = { id: string; userId: string; role: string; user: User };
type Project = {
    id: string;
    title: string;
    status: string;
    tasks: Task[];
    teams: TeamMember[];
    createdBy: string;
    createdAt: string;
};

const COLUMNS = [
    { id: "TODO", label: "To do", color: "text-[var(--muted)]" },
    { id: "IN_PROGRESS", label: "In progress", color: "text-blue-400" },
    { id: "REVIEW", label: "In review", color: "text-amber-400" },
    { id: "DONE", label: "Done", color: "text-green-500" },
];

const PRIORITY_COLORS: Record<string, string> = {
    LOW: "bg-[var(--surface2)] text-[var(--muted)]",
    MEDIUM: "bg-blue-500/10 text-blue-400",
    HIGH: "bg-amber-500/10 text-amber-400",
    URGENT: "bg-red-500/10 text-red-400",
};

interface Props {
    project: Project;
    currentUserId: string;
    isOwner: boolean;
}

export default function TaskBoard({ project, currentUserId, isOwner }: Props) {
    const [tasks, setTasks] = useState<Task[]>(project.tasks);
    const [showAddTask, setShowAddTask] = useState(false);
    const [newTask, setNewTask] = useState({ title: "", description: "", priority: "MEDIUM", assignedTo: "", dueDate: "" });
    const [adding, setAdding] = useState(false);
    const [dragging, setDragging] = useState<string | null>(null);

    const columns = COLUMNS.map(col => ({
        ...col,
        tasks: tasks.filter(t => t.status === col.id),
    }));

    async function addTask() {
        if (!newTask.title.trim()) return;
        setAdding(true);
        const res = await fetch(`/api/projects/${project.id}/tasks`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(newTask),
        });
        const task = await res.json();
        setTasks(prev => [task, ...prev]);
        setNewTask({ title: "", description: "", priority: "MEDIUM", assignedTo: "", dueDate: "" });
        setShowAddTask(false);
        setAdding(false);
    }

    async function updateStatus(taskId: string, status: string) {
        setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status } : t));
        await fetch(`/api/projects/${project.id}/tasks/${taskId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ status }),
        });
    }

    async function deleteTask(taskId: string) {
        setTasks(prev => prev.filter(t => t.id !== taskId));
        await fetch(`/api/projects/${project.id}/tasks/${taskId}`, { method: "DELETE" });
    }

    const totalTasks = tasks.length;
    const doneTasks = tasks.filter(t => t.status === "DONE").length;
    const progress = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;

    const allMembers = [
        { userId: project.createdBy, user: { id: project.createdBy, name: "Owner", image: null } },
        ...project.teams,
    ];

    return (
        <div className="flex flex-col gap-5 min-w-0 w-full">
            {/* Header */}
            <div className="flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center gap-3">
                    <Link href={`/projects/${project.id}`} className="text-xs text-[var(--muted)] no-underline hover:text-[var(--text)]">
                        ← {project.title}
                    </Link>
                    <span className="text-xs text-[var(--muted)]">/</span>
                    <span className="text-xs text-[var(--text)]">Board</span>
                </div>
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                        <div className="h-1 w-24 bg-[var(--border)] rounded-full overflow-hidden">
                            <div className="h-1 bg-[var(--accent)] rounded-full transition-all" style={{ width: `${progress}%` }} />
                        </div>
                        <span className="text-xs text-[var(--muted)]">{progress}%</span>
                    </div>
                    <button
                        onClick={() => setShowAddTask(true)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-[var(--accent)] text-[var(--bg)] border-none cursor-pointer hover:opacity-85"
                    >
                        + Add task
                    </button>
                </div>
            </div>

            {/* Add task form */}
            {showAddTask && (
                <div className="p-4 rounded-xl border border-[var(--border)] bg-[var(--surface)] flex flex-col gap-3">
                    <p className="text-sm font-medium text-[var(--text)]">New task</p>
                    <input
                        className="form-input text-sm"
                        placeholder="Task title *"
                        value={newTask.title}
                        onChange={e => setNewTask(p => ({ ...p, title: e.target.value }))}
                        autoFocus
                    />
                    <textarea
                        className="form-input text-sm resize-none"
                        placeholder="Description (optional)"
                        rows={2}
                        value={newTask.description}
                        onChange={e => setNewTask(p => ({ ...p, description: e.target.value }))}
                    />
                    <div className="grid grid-cols-3 gap-2">
                        <div>
                            <label className="text-xs text-[var(--muted)] block mb-1">Priority</label>
                            <select title="Task priority" className="form-select text-xs" value={newTask.priority} onChange={e => setNewTask(p => ({ ...p, priority: e.target.value }))}>
                                {["LOW", "MEDIUM", "HIGH", "URGENT"].map(p => <option key={p} value={p}>{p}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="text-xs text-[var(--muted)] block mb-1">Assign to</label>
                            <select title="Assign task" className="form-select text-xs" value={newTask.assignedTo} onChange={e => setNewTask(p => ({ ...p, assignedTo: e.target.value }))}>
                                <option value="">Unassigned</option>
                                {allMembers.map(m => <option key={m.userId} value={m.userId}>{m.user.name}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="text-xs text-[var(--muted)] block mb-1">Due date</label>
                            <input 
                                aria-label="Due date"
                                type="date"  
                                className="form-input text-xs" 
                                value={newTask.dueDate} 
                                onChange={e => setNewTask(p => ({ ...p, dueDate: e.target.value }))} 
                            />
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <button onClick={() => setShowAddTask(false)} className="flex-1 py-2 rounded-lg text-xs border border-[var(--border)] bg-transparent text-[var(--muted)] cursor-pointer">
                            Cancel
                        </button>
                        <button onClick={addTask} disabled={adding || !newTask.title.trim()} className="flex-1 py-2 rounded-lg text-xs bg-[var(--accent)] text-[var(--bg)] border-none cursor-pointer disabled:opacity-60">
                            {adding ? "Adding..." : "Add task"}
                        </button>
                    </div>
                </div>
            )}

            {/* Kanban columns */}
            <div className="grid grid-cols-4 gap-3 min-w-0" style={{ gridTemplateColumns: "repeat(4, minmax(0, 1fr))" }}>
                {columns.map(col => (
                    <div
                        key={col.id}
                        className="flex flex-col gap-2"
                        onDragOver={e => e.preventDefault()}
                        onDrop={e => {
                            e.preventDefault();
                            if (dragging) updateStatus(dragging, col.id);
                            setDragging(null);
                        }}
                    >
                        {/* Column header */}
                        <div className="flex items-center gap-2 px-1">
                            <span className={`text-xs font-medium ${col.color}`}>{col.label}</span>
                            <span className="text-[10px] text-[var(--muted)] bg-[var(--surface2)] px-1.5 py-0.5 rounded-full">
                                {col.tasks.length}
                            </span>
                        </div>

                        {/* Tasks */}
                        <div className="flex flex-col gap-2 min-h-[100px]">
                            {col.tasks.map(task => (
                                <div
                                    key={task.id}
                                    draggable
                                    onDragStart={() => setDragging(task.id)}
                                    onDragEnd={() => setDragging(null)}
                                    className={`p-3 rounded-lg border bg-[var(--surface)] cursor-grab active:cursor-grabbing transition-all
                                        ${dragging === task.id ? "opacity-50 scale-95" : "border-[var(--border)] hover:border-[var(--muted)]"}`}
                                >
                                    <p className="text-xs font-medium text-[var(--text)] mb-1.5 leading-relaxed">{task.title}</p>

                                    {task.description && (
                                        <p className="text-[10px] text-[var(--muted)] mb-2 leading-relaxed line-clamp-2">{task.description}</p>
                                    )}

                                    <div className="flex items-center justify-between gap-1 flex-wrap">
                                        <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${PRIORITY_COLORS[task.priority]}`}>
                                            {task.priority}
                                        </span>

                                        {task.assignee && (
                                            <div className="flex items-center gap-1">
                                                <div className="w-4 h-4 rounded-full bg-[var(--surface2)] border border-[var(--border)] overflow-hidden flex items-center justify-center text-[8px] text-[var(--text)]">
                                                    {task.assignee.image
                                                        ? <img src={task.assignee.image} alt="" className="w-full h-full object-cover" />
                                                        : task.assignee.name?.charAt(0)
                                                    }
                                                </div>
                                                <span className="text-[10px] text-[var(--muted)] max-w-[60px] truncate">{task.assignee.name}</span>
                                            </div>
                                        )}
                                    </div>

                                    {task.dueDate && (
                                        <p className={`text-[10px] mt-1.5 ${new Date(task.dueDate) < new Date() && task.status !== "DONE" ? "text-red-400" : "text-[var(--muted)]"}`}>
                                            Due {new Date(task.dueDate).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
                                        </p>
                                    )}

                                    {/* Move + delete */}
                                    <div className="flex gap-1 mt-2 flex-wrap">
                                        {COLUMNS.filter(c => c.id !== col.id).map(c => (
                                            <button
                                                key={c.id}
                                                onClick={() => updateStatus(task.id, c.id)}
                                                className="text-[10px] px-1.5 py-0.5 rounded border border-[var(--border)] text-[var(--muted)] bg-transparent cursor-pointer hover:text-[var(--text)] hover:border-[var(--muted)]"
                                            >
                                                → {c.label}
                                            </button>
                                        ))}
                                        {(isOwner || task.assignedTo === currentUserId) && (
                                            <button
                                                onClick={() => deleteTask(task.id)}
                                                className="text-[10px] px-1.5 py-0.5 rounded border border-red-400/20 text-red-400 bg-transparent cursor-pointer"
                                            >
                                                ✕
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}

                            {col.tasks.length === 0 && (
                                <div className="border border-dashed border-[var(--border)] rounded-lg py-6 text-center">
                                    <p className="text-[10px] text-[var(--muted)]">Drop here</p>
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {/* Mobile: column selector */}
            <div className="show-mobile hidden flex-col gap-3">
                {columns.map(col => (
                    <div key={col.id} className="flex flex-col gap-2">
                        <div className={`text-xs font-medium ${col.color} flex items-center gap-2`}>
                            {col.label}
                            <span className="text-[10px] text-[var(--muted)]">({col.tasks.length})</span>
                        </div>
                        {col.tasks.map(task => (
                            <div key={task.id} className="p-3 rounded-lg border border-[var(--border)] bg-[var(--surface)]">
                                <p className="text-xs font-medium text-[var(--text)] mb-1">{task.title}</p>
                                <div className="flex gap-2 flex-wrap mt-2">
                                    {COLUMNS.filter(c => c.id !== col.id).map(c => (
                                        <button key={c.id} onClick={() => updateStatus(task.id, c.id)} className="text-[10px] px-2 py-0.5 rounded border border-[var(--border)] text-[var(--muted)] bg-transparent cursor-pointer">
                                            → {c.label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                ))}
            </div>
        </div>
    );
}