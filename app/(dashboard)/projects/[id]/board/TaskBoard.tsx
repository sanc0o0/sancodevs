"use client";

import { useState, useEffect, useRef } from "react";
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
    submissionUrl: string | null;
    submittedAt: string | null;
    reviewNote: string | null;
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
    { id: "TODO", label: "To do", color: "text-[var(--muted)]", dot: "bg-[var(--muted)]" },
    { id: "IN_PROGRESS", label: "In progress", color: "text-blue-400", dot: "bg-blue-400" },
    { id: "SUBMITTED", label: "Submitted", color: "text-amber-400", dot: "bg-amber-400" },
];

const STATUS_COLORS: Record<string, string> = {
    TODO: "text-[var(--muted)]",
    IN_PROGRESS: "text-blue-400",
    SUBMITTED: "text-amber-400",
    APPROVED: "text-green-500",
    DONE: "text-green-500",
    LATE: "text-orange-400",
    MISSED: "text-red-400",
    REJECTED: "text-red-400",
};

const PRIORITY_COLORS: Record<string, string> = {
    LOW: "bg-[var(--surface2)] text-[var(--muted)]",
    MEDIUM: "bg-blue-500/10 text-blue-400",
    HIGH: "bg-amber-500/10 text-amber-400",
    URGENT: "bg-red-500/10 text-red-400",
};

const PRIORITY_DOT: Record<string, string> = {
    LOW: "bg-[var(--muted)]",
    MEDIUM: "bg-blue-400",
    HIGH: "bg-amber-400",
    URGENT: "bg-red-400",
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
    const [dragOver, setDragOver] = useState<string | null>(null);
    const [activeTask, setActiveTask] = useState<Task | null>(null);
    const [submissionUrl, setSubmissionUrl] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState("");
    const [reviewNote, setReviewNote] = useState("");
    const [reviewing, setReviewing] = useState(false);

    useEffect(() => {
        fetch(`/api/projects/${project.id}/tasks/mark-missed`, { method: "POST" })
            .then(r => r.ok ? r.json() : null)
            .then(d => {
                if (d?.marked > 0) {
                    fetch(`/api/projects/${project.id}/tasks`)
                        .then(r => r.json())
                        .then(setTasks);
                }
            })
            .catch(() => { });
    }, [project.id]);

    const columns = COLUMNS.map(col => ({
        ...col,
        tasks: tasks.filter(t => t.status === col.id),
    }));

    const allMembers = project.teams.map(t => ({ userId: t.userId, user: t.user }));

    const totalTasks = tasks.length;
    const doneTasks = tasks.filter(t => ["DONE", "LATE", "MISSED", "REJECTED"].includes(t.status)).length;
    const progress = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;

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

    async function submitTask() {
        if (!activeTask || !submissionUrl.trim()) return;
        setSubmitting(true);
        setSubmitError("");
        const res = await fetch(`/api/projects/${project.id}/tasks/${activeTask.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action: "submit", submissionUrl: submissionUrl.trim() }),
        });
        const data = await res.json();
        if (!res.ok) {
            setSubmitError(data.error ?? "Submission failed.");
            setSubmitting(false);
            return;
        }
        setTasks(prev => prev.map(t => t.id === activeTask.id ? data : t));
        setActiveTask(data);
        setSubmissionUrl("");
        setSubmitting(false);
    }

    async function reviewTask(verdict: "APPROVED" | "REJECTED") {
        if (!activeTask) return;
        setReviewing(true);
        const res = await fetch(`/api/projects/${project.id}/tasks/${activeTask.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action: "review", verdict, reviewNote: reviewNote.trim() || null }),
        });
        const data = await res.json();
        if (res.ok) {
            setTasks(prev => prev.map(t => t.id === activeTask.id ? data : t));
            setActiveTask(data);
            setReviewNote("");
        }
        setReviewing(false);
    }

    function getColor(name: string) {
        const colors = ["bg-orange-500", "bg-blue-500", "bg-green-500", "bg-purple-500", "bg-pink-500", "bg-teal-500"];
        return colors[(name.charCodeAt(0) + (name.charCodeAt(1) || 0)) % colors.length];
    }

    const isOverdue = (task: Task) =>
        task.dueDate && new Date(task.dueDate) < new Date() && !["DONE", "LATE", "MISSED", "APPROVED"].includes(task.status);

    return (
        <div className="flex flex-col gap-5 min-w-0 w-full p-5 md:p-7">
            {/* Header */}
            <div className="flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center gap-2">
                    <Link href={`/projects/${project.id}`} className="text-xs text-[var(--muted)] no-underline hover:text-[var(--text)] transition-colors">
                        ← {project.title}
                    </Link>
                    <span className="text-xs text-[var(--border)]">/</span>
                    <span className="text-xs text-[var(--text)]">Board</span>
                </div>
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                        <div className="h-1 w-24 bg-[var(--border)] rounded-full overflow-hidden">
                            <div className="h-1 bg-[var(--accent)] rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
                        </div>
                        <span className="text-xs text-[var(--muted)]">{progress}%</span>
                    </div>
                    {isOwner && (
                        <button
                            onClick={() => setShowAddTask(true)}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-[var(--accent)] text-[var(--bg)] border-none cursor-pointer hover:opacity-85 transition-opacity"
                        >
                            + Add task
                        </button>
                    )}
                </div>
            </div>

            {/* Add task form */}
            {showAddTask && isOwner && (
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
                            <select title="Priority" className="form-select text-xs w-full" value={newTask.priority} onChange={e => setNewTask(p => ({ ...p, priority: e.target.value }))}>
                                {["LOW", "MEDIUM", "HIGH", "URGENT"].map(p => <option key={p} value={p}>{p}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="text-xs text-[var(--muted)] block mb-1">Assign to</label>
                            <select title="Assign to" className="form-select text-xs w-full" value={newTask.assignedTo} onChange={e => setNewTask(p => ({ ...p, assignedTo: e.target.value }))}>
                                <option value="">Unassigned</option>
                                {allMembers.map(m => <option key={m.userId} value={m.userId}>{m.user.name}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="text-xs text-[var(--muted)] block mb-1">Due date</label>
                            <input aria-label="Due date" type="date" className="form-input text-xs w-full" value={newTask.dueDate} onChange={e => setNewTask(p => ({ ...p, dueDate: e.target.value }))} />
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <button onClick={() => setShowAddTask(false)} className="flex-1 py-2 rounded-lg text-xs border border-[var(--border)] bg-transparent text-[var(--muted)] cursor-pointer">Cancel</button>
                        <button onClick={addTask} disabled={adding || !newTask.title.trim()} className="flex-1 py-2 rounded-lg text-xs bg-[var(--accent)] text-[var(--bg)] border-none cursor-pointer disabled:opacity-60">
                            {adding ? "Adding..." : "Add task"}
                        </button>
                    </div>
                </div>
            )}

            {/* ── KANBAN: Desktop — scrollable container so columns never hide behind sidebar ── */}
            {/* 
                Key fix: overflow-x-auto on the wrapper + each column has min-w-[200px]
                This means at any viewport width, columns stay readable and scroll horizontally
                instead of being crushed or hidden behind the sidebar.
            */}
            <div className="hidden md:block w-full overflow-x-auto pb-2">
                <div className="grid gap-3" style={{ gridTemplateColumns: "repeat(3, minmax(200px, 1fr))", minWidth: "620px" }}>
                    {columns.map(col => (
                        <div
                            key={col.id}
                            className={`flex flex-col gap-2 rounded-xl p-3 transition-colors ${dragOver === col.id ? "bg-[var(--surface2)]" : "bg-[var(--surface)]"} border border-[var(--border)]`}
                            onDragOver={e => { e.preventDefault(); setDragOver(col.id); }}
                            onDragLeave={() => setDragOver(null)}
                            onDrop={e => {
                                e.preventDefault();
                                if (dragging) updateStatus(dragging, col.id);
                                setDragging(null);
                                setDragOver(null);
                            }}
                        >
                            {/* Column header */}
                            <div className="flex items-center gap-2 px-1 pb-1 border-b border-[var(--border)]">
                                <span className={`w-2 h-2 rounded-full flex-shrink-0 ${col.dot}`} />
                                <span className={`text-xs font-semibold ${col.color}`}>{col.label}</span>
                                <span className="ml-auto text-[10px] text-[var(--muted)] bg-[var(--surface2)] px-1.5 py-0.5 rounded-full font-medium">
                                    {col.tasks.length}
                                </span>
                            </div>

                            {/* Cards */}
                            <div className="flex flex-col gap-1.5 min-h-[80px]">
                                {col.tasks.map(task => (
                                    <TaskCard
                                        key={task.id}
                                        task={task}
                                        isOwner={isOwner}
                                        currentUserId={currentUserId}
                                        dragging={dragging}
                                        onDragStart={() => setDragging(task.id)}
                                        onDragEnd={() => { setDragging(null); setDragOver(null); }}
                                        onDelete={() => deleteTask(task.id)}
                                        onStatusChange={s => updateStatus(task.id, s)}
                                        onClick={() => { setActiveTask(task); setSubmitError(""); }}
                                        isOverdue={!!isOverdue(task)}
                                        getColor={getColor}
                                        projectId={project.id}
                                    />
                                ))}
                                {col.tasks.length === 0 && (
                                    <div className="flex-1 flex items-center justify-center py-8 rounded-lg border border-dashed border-[var(--border)]">
                                        <p className="text-[10px] text-[var(--muted)]">Drop here</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* ── KANBAN: Mobile (vertical stacked) ── */}
            <div className="flex flex-col gap-3 md:hidden">
                {columns.map(col => (
                    col.tasks.length > 0 ? (
                        <div key={col.id} className="flex flex-col gap-2 rounded-xl p-3 bg-[var(--surface)] border border-[var(--border)]">
                            <div className="flex items-center gap-2 pb-1 border-b border-[var(--border)]">
                                <span className={`w-2 h-2 rounded-full flex-shrink-0 ${col.dot}`} />
                                <span className={`text-xs font-semibold ${col.color}`}>{col.label}</span>
                                <span className="ml-auto text-[10px] text-[var(--muted)] bg-[var(--surface2)] px-1.5 py-0.5 rounded-full font-medium">
                                    {col.tasks.length}
                                </span>
                            </div>
                            {col.tasks.map(task => (
                                <TaskCard
                                    key={task.id}
                                    task={task}
                                    isOwner={isOwner}
                                    currentUserId={currentUserId}
                                    dragging={dragging}
                                    onDragStart={() => setDragging(task.id)}
                                    onDragEnd={() => setDragging(null)}
                                    onDelete={() => deleteTask(task.id)}
                                    onStatusChange={s => updateStatus(task.id, s)}
                                    onClick={() => { setActiveTask(task); setSubmitError(""); }}
                                    isOverdue={!!isOverdue(task)}
                                    getColor={getColor}
                                    projectId={project.id}
                                />
                            ))}
                        </div>
                    ) : null
                ))}
            </div>

            {/* History section */}
            {(() => {
                const historyTasks = tasks.filter(t => ["DONE", "LATE", "MISSED", "REJECTED"].includes(t.status));
                return historyTasks.length > 0 ? (
                    <div>
                        <p className="text-xs text-[var(--muted)] font-semibold mb-2 uppercase tracking-wider">History</p>
                        <div className="flex flex-col gap-1.5">
                            {historyTasks.map(task => (
                                <div
                                    key={task.id}
                                    onClick={() => setActiveTask(task)}
                                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--surface)] cursor-pointer hover:border-[var(--muted)] transition-colors"
                                >
                                    <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full border flex-shrink-0 ${task.status === "DONE" ? "border-green-500/30 text-green-500 bg-green-500/5" :
                                            task.status === "LATE" ? "border-orange-400/30 text-orange-400 bg-orange-400/5" :
                                                "border-red-400/30 text-red-400 bg-red-400/5"
                                        }`}>
                                        {task.status}
                                    </span>
                                    <p className="text-xs text-[var(--text)] flex-1 truncate">{task.title}</p>
                                    {task.assignee && (
                                        <span className="text-[10px] text-[var(--muted)] flex-shrink-0">{task.assignee.name?.split(" ")[0]}</span>
                                    )}
                                    {task.dueDate && (
                                        <span className="text-[10px] text-[var(--muted)] flex-shrink-0">
                                            {new Date(task.dueDate).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
                                        </span>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                ) : null;
            })()}

            {/* Task detail modal */}
            {activeTask && (
                <div
                    className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
                    onClick={e => { if (e.target === e.currentTarget) setActiveTask(null); }}
                >
                    <div className="w-full max-w-md bg-[var(--surface)] border border-[var(--border)] rounded-2xl overflow-hidden shadow-2xl max-h-[90vh] overflow-y-auto" style={{ animation: "fadeUp 0.2s ease" }}>
                        <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border)]">
                            <div className="flex items-center gap-2">
                                <span className={`text-[10px] font-medium ${STATUS_COLORS[activeTask.status] ?? "text-[var(--muted)]"}`}>
                                    {activeTask.status.replace("_", " ")}
                                </span>
                                <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${PRIORITY_COLORS[activeTask.priority]}`}>
                                    {activeTask.priority}
                                </span>
                            </div>
                            <button
                                onClick={() => setActiveTask(null)}
                                className="w-7 h-7 flex items-center justify-center rounded-full text-[var(--muted)] hover:text-[var(--text)] hover:bg-[var(--surface2)] border-none bg-transparent cursor-pointer text-lg"
                            >×</button>
                        </div>

                        <div className="p-5 flex flex-col gap-4">
                            <div>
                                <h2 className="text-base font-semibold text-[var(--text)] mb-1">{activeTask.title}</h2>
                                {activeTask.description && (
                                    <p className="text-sm text-[var(--muted)] leading-relaxed">{activeTask.description}</p>
                                )}
                            </div>

                            <div className="flex flex-col gap-2">
                                {activeTask.assignee && (
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs text-[var(--muted)]">Assigned to</span>
                                        <span className="text-xs text-[var(--text)]">{activeTask.assignee.name}</span>
                                    </div>
                                )}
                                {activeTask.dueDate && (
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs text-[var(--muted)]">Due</span>
                                        <span className={`text-xs font-medium ${isOverdue(activeTask) ? "text-red-400" : "text-[var(--text)]"}`}>
                                            {new Date(activeTask.dueDate).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                                            {isOverdue(activeTask) && " — OVERDUE"}
                                        </span>
                                    </div>
                                )}
                                {activeTask.submissionUrl && (
                                    <div className="flex items-center justify-between gap-2">
                                        <span className="text-xs text-[var(--muted)]">Submission</span>
                                        <a href={activeTask.submissionUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-[var(--accent)] truncate max-w-[200px] hover:underline">
                                            {activeTask.submissionUrl}
                                        </a>
                                    </div>
                                )}
                                {activeTask.reviewNote && (isOwner || activeTask.assignedTo === currentUserId) && (
                                    <div className="p-3 rounded-xl border border-amber-400/20 bg-amber-400/5">
                                        <p className="text-[10px] text-amber-400 uppercase tracking-wider mb-1">Feedback</p>
                                        <p className="text-xs text-[var(--text)]">{activeTask.reviewNote}</p>
                                    </div>
                                )}
                                {["DONE", "LATE"].includes(activeTask.status) && activeTask.assignee && (
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs text-[var(--muted)]">Completed by</span>
                                        <span className="text-xs text-green-500 font-medium">{activeTask.assignee.name}</span>
                                    </div>
                                )}
                            </div>

                            {activeTask.assignedTo === currentUserId &&
                                ["TODO", "IN_PROGRESS", "MISSED"].includes(activeTask.status) && (
                                    <div className="flex flex-col gap-2 pt-2 border-t border-[var(--border)]">
                                        <p className="text-xs font-medium text-[var(--text)]">Submit your work</p>
                                        {activeTask.status === "MISSED" && (
                                            <div className="p-2.5 rounded-lg bg-amber-400/10 border border-amber-400/20">
                                                <p className="text-[10px] text-amber-400">This task is past its deadline. Submitting now counts as a late submission.</p>
                                            </div>
                                        )}
                                        <input
                                            className="form-input text-sm"
                                            placeholder="GitHub / GitLab / Bitbucket URL"
                                            value={submissionUrl}
                                            onChange={e => { setSubmissionUrl(e.target.value); setSubmitError(""); }}
                                        />
                                        {submitError && <p className="text-[10px] text-red-400">{submitError}</p>}
                                        <button
                                            onClick={submitTask}
                                            disabled={submitting || !submissionUrl.trim()}
                                            className="py-2 rounded-lg text-xs font-medium bg-[var(--accent)] text-[var(--bg)] border-none cursor-pointer disabled:opacity-50"
                                        >
                                            {submitting ? "Submitting..." : "Submit for review →"}
                                        </button>
                                    </div>
                                )}

                            {isOwner && activeTask.status === "SUBMITTED" && (
                                <div className="flex flex-col gap-3 pt-2 border-t border-[var(--border)]">
                                    <div className="flex items-center justify-between">
                                        <p className="text-xs font-medium text-[var(--text)]">Review submission</p>
                                        {activeTask.submittedAt && (
                                            <span className="text-[10px] text-[var(--muted)]">
                                                Submitted {new Date(activeTask.submittedAt).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
                                            </span>
                                        )}
                                    </div>
                                    {activeTask.submissionUrl && (
                                        <a
                                            href={activeTask.submissionUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex items-center gap-2 p-2.5 rounded-xl border border-[var(--border)] bg-[var(--surface2)] text-xs text-[var(--accent)] no-underline hover:opacity-80 transition-opacity"
                                        >
                                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22" />
                                            </svg>
                                            View repository
                                        </a>
                                    )}
                                    <textarea
                                        className="form-input text-sm resize-none"
                                        placeholder="Review note (optional)"
                                        rows={2}
                                        value={reviewNote}
                                        onChange={e => setReviewNote(e.target.value)}
                                    />
                                    <div className="flex gap-2">
                                        <button onClick={() => reviewTask("REJECTED")} disabled={reviewing} className="flex-1 py-2 rounded-lg text-xs border border-red-400/30 text-red-400 bg-transparent cursor-pointer disabled:opacity-50 hover:bg-red-400/5 transition-colors">
                                            {reviewing ? "..." : "✕ Reject"}
                                        </button>
                                        <button onClick={() => reviewTask("APPROVED")} disabled={reviewing} className="flex-1 py-2 rounded-lg text-xs bg-green-500 text-white border-none cursor-pointer disabled:opacity-50 font-medium">
                                            {reviewing ? "..." : "✓ Approve"}
                                        </button>
                                    </div>
                                </div>
                            )}

                            {isOwner && !["SUBMITTED", "DONE", "LATE", "MISSED"].includes(activeTask.status) && (
                                <div className="flex flex-wrap gap-1 pt-2 border-t border-[var(--border)]">
                                    {["TODO", "IN_PROGRESS"].filter(s => s !== activeTask.status).map(s => (
                                        <button
                                            key={s}
                                            onClick={() => { updateStatus(activeTask.id, s); setActiveTask(prev => prev ? { ...prev, status: s } : null); }}
                                            className="text-[10px] px-2 py-1 rounded-lg border border-[var(--border)] text-[var(--muted)] bg-transparent cursor-pointer hover:text-[var(--text)] transition-colors"
                                        >
                                            → {s.replace("_", " ")}
                                        </button>
                                    ))}
                                    <button
                                        onClick={() => { deleteTask(activeTask.id); setActiveTask(null); }}
                                        className="text-[10px] px-2 py-1 rounded-lg border border-red-400/20 text-red-400 bg-transparent cursor-pointer ml-auto"
                                    >
                                        Delete task
                                    </button>
                                </div>
                            )}

                            {isOwner && !activeTask.assignedTo && activeTask.status === "TODO" && (
                                <AssignmentRequestsSection
                                    projectId={project.id}
                                    taskId={activeTask.id}
                                    onAssigned={(task) => {
                                        setTasks(prev => prev.map(t => t.id === activeTask.id ? { ...t, ...task } : t));
                                        setActiveTask(prev => prev ? { ...prev, ...task } : null);
                                    }}
                                />
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

// ── TaskCard with 3-dot dropdown menu ──
function TaskCard({ task, isOwner, currentUserId, dragging, onDragStart, onDragEnd, onDelete, onStatusChange, onClick, isOverdue, getColor, projectId }: {
    task: Task; isOwner: boolean; currentUserId: string;
    dragging: string | null;
    onDragStart: () => void; onDragEnd: () => void;
    onDelete: () => void; onStatusChange: (s: string) => void;
    onClick: () => void; isOverdue: boolean;
    getColor: (s: string) => string;
    projectId: string;
}) {
    const [menuOpen, setMenuOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        function handleClick(e: MouseEvent) {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
                setMenuOpen(false);
            }
        }
        if (menuOpen) document.addEventListener("mousedown", handleClick);
        return () => document.removeEventListener("mousedown", handleClick);
    }, [menuOpen]);

    const statusOptions = ["TODO", "IN_PROGRESS"].filter(s => s !== task.status);

    return (
        <div
            draggable={isOwner}
            onDragStart={onDragStart}
            onDragEnd={onDragEnd}
            onClick={onClick}
            className={`group relative p-3 rounded-xl border bg-[var(--bg)] cursor-pointer transition-all select-none
                ${dragging === task.id ? "opacity-40 scale-[0.97]" : ""}
                ${isOverdue ? "border-red-400/30 hover:border-red-400/50" : "border-[var(--border)] hover:border-[var(--muted)]/50"}`}
        >
            {/* Top row: title + 3-dot menu */}
            <div className="flex items-start gap-2">
                <p className="text-xs font-medium text-[var(--text)] flex-1 leading-relaxed line-clamp-2 min-w-0">{task.title}</p>

                {/* 3-dot menu — only for owner, stops click propagation */}
                {isOwner && (
                    <div ref={menuRef} className="relative flex-shrink-0" onClick={e => e.stopPropagation()}>
                        <button
                            title="Open task options"
                            aria-label="Open task options"
                            onClick={e => { e.stopPropagation(); setMenuOpen(o => !o); }}
                            className="w-6 h-6 rounded-md flex items-center justify-center text-[var(--muted)] hover:text-[var(--text)] hover:bg-[var(--surface2)] border-none bg-transparent cursor-pointer opacity-0 group-hover:opacity-100 transition-all"
                        >
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                                <circle cx="12" cy="5" r="2" /><circle cx="12" cy="12" r="2" /><circle cx="12" cy="19" r="2" />
                            </svg>
                        </button>
                        {menuOpen && (
                            <div className="absolute right-0 top-7 z-30 w-36 bg-[var(--surface)] border border-[var(--border)] rounded-xl shadow-xl overflow-hidden" style={{ animation: "fadeUp 0.1s ease" }}>
                                {statusOptions.map(s => (
                                    <button
                                        key={s}
                                        onClick={e => { e.stopPropagation(); onStatusChange(s); setMenuOpen(false); }}
                                        className="w-full flex items-center gap-2 px-3 py-2 text-[11px] text-[var(--muted)] hover:text-[var(--text)] hover:bg-[var(--surface2)] bg-transparent border-none cursor-pointer text-left transition-colors"
                                    >
                                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6" /></svg>
                                        Move to {s.replace("_", " ")}
                                    </button>
                                ))}
                                {statusOptions.length > 0 && <div className="border-t border-[var(--border)]" />}
                                <button
                                    onClick={e => { e.stopPropagation(); onDelete(); setMenuOpen(false); }}
                                    className="w-full flex items-center gap-2 px-3 py-2 text-[11px] text-red-400 hover:bg-red-400/5 bg-transparent border-none cursor-pointer text-left transition-colors"
                                >
                                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14H6L5 6" /><path d="M10 11v6M14 11v6" /></svg>
                                    Delete
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Bottom row: priority badge + assignee + due date */}
            <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                <span className={`text-[9px] px-1.5 py-0.5 rounded font-semibold uppercase tracking-wide ${{ LOW: "bg-[var(--surface2)] text-[var(--muted)]", MEDIUM: "bg-blue-500/10 text-blue-400", HIGH: "bg-amber-500/10 text-amber-400", URGENT: "bg-red-500/10 text-red-400" }[task.priority] ?? ""
                    }`}>
                    {task.priority}
                </span>

                {task.dueDate && (
                    <span className={`text-[9px] flex items-center gap-0.5 ml-auto ${isOverdue ? "text-red-400 font-medium" : "text-[var(--muted)]"}`}>
                        {isOverdue && "⚠ "}
                        {new Date(task.dueDate).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
                    </span>
                )}

                {task.assignee && (
                    <a href={`/user/${task.assignee.id}`} onClick={e => e.stopPropagation()} className="no-underline flex-shrink-0">
                        <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[8px] font-bold text-white overflow-hidden cursor-pointer hover:opacity-80 transition-opacity ${getColor(task.assignee.name ?? "?")}`}>
                            {task.assignee.image
                                ? <img src={task.assignee.image} alt="" className="w-full h-full object-cover" />
                                : task.assignee.name?.charAt(0)
                            }
                        </div>
                    </a>
                )}
            </div>

            {/* Status indicators */}
            {task.status === "SUBMITTED" && (
                <div className="mt-2 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse flex-shrink-0" />
                    <span className="text-[9px] text-amber-400 font-medium">Awaiting review</span>
                </div>
            )}

            {!task.assignedTo && !isOwner && (
                <div className="mt-2" onClick={e => e.stopPropagation()}>
                    <RequestAssignButton projectId={projectId} taskId={task.id} currentUserId={currentUserId} />
                </div>
            )}
        </div>
    );
}

function RequestAssignButton({ projectId, taskId, currentUserId }: { projectId: string; taskId: string; currentUserId: string }) {
    const [status, setStatus] = useState<"idle" | "pending" | "loading">("idle");
    const [error, setError] = useState("");

    async function request(e: React.MouseEvent) {
        e.stopPropagation();
        setStatus("loading");
        setError("");
        const res = await fetch(`/api/projects/${projectId}/tasks/${taskId}/request-assignment`, { method: "POST" });
        const data = await res.json();
        if (res.ok) setStatus("pending");
        else { setError(data.error ?? "Failed."); setStatus("idle"); }
    }

    if (status === "pending") return <p className="text-[9px] text-amber-400 font-medium">Request sent ···</p>;

    return (
        <div>
            <button
                onClick={request}
                disabled={status === "loading"}
                className="text-[9px] px-2 py-0.5 rounded border border-[var(--accent)]/30 text-[var(--accent)] bg-transparent cursor-pointer hover:bg-[var(--accent)]/5 transition-colors disabled:opacity-50"
            >
                {status === "loading" ? "..." : "Request assignment"}
            </button>
            {error && <p className="text-[9px] text-red-400 mt-0.5">{error}</p>}
        </div>
    );
}

function AssignmentRequestsSection({ projectId, taskId, onAssigned }: {
    projectId: string; taskId: string;
    onAssigned: (task: Partial<Task>) => void;
}) {
    const [requests, setRequests] = useState<{ userId: string; user: { name: string | null; image: string | null } }[]>([]);
    const [acting, setActing] = useState<string | null>(null);

    useEffect(() => {
        fetch(`/api/projects/${projectId}/tasks/${taskId}/assignment-requests`)
            .then(r => r.ok ? r.json() : [])
            .then(setRequests)
            .catch(() => { });
    }, [taskId]);

    async function act(requestUserId: string, action: "approve" | "reject") {
        setActing(requestUserId);
        const res = await fetch(`/api/projects/${projectId}/tasks/${taskId}/approve-assignment`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ requestUserId, action }),
        });
        if (res.ok) {
            if (action === "approve") onAssigned({ assignedTo: requestUserId, status: "TODO" });
            setRequests(prev => prev.filter(r => r.userId !== requestUserId));
        }
        setActing(null);
    }

    if (requests.length === 0) return null;

    return (
        <div className="flex flex-col gap-2 pt-2 border-t border-[var(--border)]">
            <p className="text-xs font-medium text-[var(--text)]">Assignment requests ({requests.length})</p>
            {requests.map(r => (
                <div key={r.userId} className="flex items-center gap-2">
                    <p className="text-xs text-[var(--text)] flex-1">{r.user.name}</p>
                    <button onClick={() => act(r.userId, "reject")} disabled={acting === r.userId} className="text-[10px] px-2 py-1 rounded border border-[var(--border)] text-[var(--muted)] bg-transparent cursor-pointer">✕</button>
                    <button onClick={() => act(r.userId, "approve")} disabled={acting === r.userId} className="text-[10px] px-2 py-1 rounded bg-green-500 text-white border-none cursor-pointer">✓ Assign</button>
                </div>
            ))}
        </div>
    );
}