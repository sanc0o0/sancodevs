"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { WsEmptyState } from "./Created";
import { TabSkeleton } from "./Joined";

// ─── Config ───────────────────────────────────────────────────
const STATUS_COLS = [
    { id: "TODO", label: "To Do", color: "var(--muted)" },
    { id: "IN_PROGRESS", label: "In Progress", color: "#3b82f6" },
    { id: "REVIEW", label: "Review", color: "#f59e0b" },
    { id: "DONE", label: "Done", color: "#22c55e" },
];

const PRIORITY_CONFIG: Record<string, { label: string; color: string }> = {
    LOW: { label: "Low", color: "var(--muted)" },
    MEDIUM: { label: "Medium", color: "#3b82f6" },
    HIGH: { label: "High", color: "#f59e0b" },
    CRITICAL: { label: "Critical", color: "#ef4444" },
};

export default function Tasks({ userId }: { userId: string }) {
    const [view, setView] = useState<"list" | "board">("list");
    const [tasks, setTasks] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [nextCursor, setNextCursor] = useState<string | null>(null);
    const [loadingMore, setLoadingMore] = useState(false);

    async function load(cursor?: string) {
        const params = new URLSearchParams();
        if (cursor) params.set("cursor", cursor);
        const res = await fetch(`/api/workspace/tasks?${params}`);
        return res.json();
    }

    useEffect(() => {
        load().then(({ data, nextCursor }) => {
            setTasks(data);
            setNextCursor(nextCursor);
            setLoading(false);
        });
    }, []);

    async function loadMore() {
        if (!nextCursor) return;
        setLoadingMore(true);
        const { data, nextCursor: nc } = await load(nextCursor);
        setTasks((prev) => [...prev, ...data]);
        setNextCursor(nc);
        setLoadingMore(false);
    }

    if (loading) return <TabSkeleton />;

    if (tasks.length === 0) {
        return (
            <WsEmptyState
                icon={<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2"><polyline points="9 11 12 14 22 4" /><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" /></svg>}
                title="No tasks assigned"
                subtitle="Tasks assigned to you across projects will appear here."
            />
        );
    }

    const activeTasks = tasks.filter((t) => t.status !== "DONE");
    const doneTasks = tasks.filter((t) => t.status === "DONE");

    return (
        <div>
            {/* ── Toolbar ───────────────────────────────────── */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "14px" }}>
                <p style={{ fontSize: "11px", color: "var(--muted)" }}>
                    {activeTasks.length} active · {doneTasks.length} done
                </p>
                {/* View toggle */}
                <div style={{ display: "flex", border: "0.5px solid var(--border)", borderRadius: "7px", overflow: "hidden" }}>
                    <ViewBtn id="list" active={view === "list"} onClick={() => setView("list")}
                        icon={<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><line x1="8" y1="6" x2="21" y2="6" /><line x1="8" y1="12" x2="21" y2="12" /><line x1="8" y1="18" x2="21" y2="18" /><line x1="3" y1="6" x2="3.01" y2="6" /><line x1="3" y1="12" x2="3.01" y2="12" /><line x1="3" y1="18" x2="3.01" y2="18" /></svg>}
                        label="List"
                    />
                    <ViewBtn id="board" active={view === "board"} onClick={() => setView("board")}
                        icon={<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="3" width="5" height="18" rx="1" /><rect x="10" y="3" width="5" height="18" rx="1" /><rect x="17" y="3" width="5" height="18" rx="1" /></svg>}
                        label="Board"
                    />
                </div>
            </div>

            {/* ── List view ──────────────────────────────────── */}
            {view === "list" && (
                <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
                    {tasks.map((task) => (
                        <TaskRow key={task.id} task={task} />
                    ))}
                    {nextCursor && (
                        <button onClick={loadMore} disabled={loadingMore}
                            style={{ marginTop: "8px", padding: "7px", fontSize: "11px", color: "var(--muted)", background: "transparent", border: "0.5px solid var(--border)", borderRadius: "7px", cursor: "pointer" }}>
                            {loadingMore ? "Loading..." : "Load more"}
                        </button>
                    )}
                </div>
            )}

            {/* ── Kanban board ───────────────────────────────── */}
            {view === "board" && (
                <>
                    {/* Desktop: side-by-side columns */}
                    <div
                        className="board-desktop"
                        style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "10px", alignItems: "start" }}
                    >
                        {STATUS_COLS.map((col) => (
                            <KanbanColumn key={col.id} col={col} tasks={tasks.filter((t) => t.status === col.id)} />
                        ))}
                    </div>
                    {/* Mobile: stacked */}
                    <div
                        className="board-mobile"
                        style={{ display: "flex", flexDirection: "column", gap: "16px" }}
                    >
                        {STATUS_COLS.map((col) => {
                            const colTasks = tasks.filter((t) => t.status === col.id);
                            if (colTasks.length === 0) return null;
                            return <KanbanColumn key={col.id} col={col} tasks={colTasks} />;
                        })}
                    </div>
                </>
            )}
        </div>
    );
}

// ─── Task row (list view) ─────────────────────────────────────
function TaskRow({ task }: { task: any }) {
    const pc = PRIORITY_CONFIG[task.priority] ?? PRIORITY_CONFIG.MEDIUM;
    const statusCol = STATUS_COLS.find((s) => s.id === task.status);
    const overdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== "DONE";

    return (
        <div
            className="card-hover"
            style={{ display: "flex", alignItems: "center", gap: "10px", padding: "9px 12px", border: "0.5px solid var(--border)", borderRadius: "8px", background: "var(--surface)" }}
        >
            {/* Status dot */}
            <span style={{ width: "7px", height: "7px", borderRadius: "50%", background: statusCol?.color ?? "var(--muted)", flexShrink: 0 }} />

            {/* Title + project */}
            <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: "12px", color: "var(--text)", fontWeight: 400, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", marginBottom: "2px" }}>
                    {task.title}
                </p>
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <Link href={`/projects/${task.project.id}`} style={{ fontSize: "10px", color: "var(--muted)", textDecoration: "none" }}>
                        {task.project.title}
                    </Link>
                    {task.milestone && (
                        <span style={{ fontSize: "10px", color: "var(--muted)" }}>· {task.milestone.title}</span>
                    )}
                </div>
            </div>

            {/* Meta */}
            <div style={{ display: "flex", alignItems: "center", gap: "6px", flexShrink: 0 }}>
                {task.dueDate && (
                    <span style={{ fontSize: "10px", color: overdue ? "#ef4444" : "var(--muted)", fontWeight: overdue ? 500 : 400 }}>
                        {fmtDue(task.dueDate)}
                    </span>
                )}
                <span style={{ fontSize: "10px", color: pc.color, padding: "1px 6px", borderRadius: "20px", border: "0.5px solid var(--border)", background: "var(--surface2)" }}>
                    {pc.label}
                </span>
            </div>
        </div>
    );
}

// ─── Kanban column ────────────────────────────────────────────
function KanbanColumn({ col, tasks }: { col: { id: string; label: string; color: string }; tasks: any[] }) {
    return (
        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            {/* Column header */}
            <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "4px" }}>
                <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: col.color }} />
                <span style={{ fontSize: "11px", color: "var(--muted)", fontWeight: 500 }}>{col.label}</span>
                <span style={{ fontSize: "10px", color: "var(--muted)", marginLeft: "auto" }}>{tasks.length}</span>
            </div>

            {tasks.length === 0 ? (
                <div style={{ padding: "16px", border: "0.5px dashed var(--border)", borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <span style={{ fontSize: "10px", color: "var(--muted)" }}>Empty</span>
                </div>
            ) : (
                tasks.map((task) => <KanbanCard key={task.id} task={task} />)
            )}
        </div>
    );
}

// ─── Kanban card ──────────────────────────────────────────────
function KanbanCard({ task }: { task: any }) {
    const pc = PRIORITY_CONFIG[task.priority] ?? PRIORITY_CONFIG.MEDIUM;
    const overdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== "DONE";

    return (
        <div
            className="card-hover"
            style={{ padding: "10px 11px", border: "0.5px solid var(--border)", borderRadius: "8px", background: "var(--surface)", display: "flex", flexDirection: "column", gap: "6px" }}
        >
            <p style={{ fontSize: "12px", color: "var(--text)", lineHeight: 1.4 }}>{task.title}</p>
            <Link href={`/projects/${task.project.id}`} style={{ fontSize: "10px", color: "var(--muted)", textDecoration: "none" }}>
                {task.project.title}
            </Link>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{ fontSize: "10px", color: pc.color }}>{pc.label}</span>
                {task.dueDate && (
                    <span style={{ fontSize: "10px", color: overdue ? "#ef4444" : "var(--muted)" }}>{fmtDue(task.dueDate)}</span>
                )}
            </div>
        </div>
    );
}

// ─── View toggle button ───────────────────────────────────────
function ViewBtn({ id, active, onClick, icon, label }: {
    id: string; active: boolean; onClick: () => void;
    icon: React.ReactNode; label: string;
}) {
    return (
        <button
            onClick={onClick}
            style={{ display: "flex", alignItems: "center", gap: "5px", padding: "5px 10px", fontSize: "11px", color: active ? "var(--text)" : "var(--muted)", background: active ? "var(--surface2)" : "transparent", border: "none", cursor: "pointer" }}
        >
            {icon} {label}
        </button>
    );
}

function fmtDue(date: string) {
    const d = new Date(date);
    const now = new Date();
    const diff = Math.ceil((d.getTime() - now.getTime()) / 86400000);
    if (diff < 0) return `${Math.abs(diff)}d overdue`;
    if (diff === 0) return "Due today";
    if (diff === 1) return "Due tomorrow";
    if (diff < 7) return `Due in ${diff}d`;
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}