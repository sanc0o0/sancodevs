// components/profile/tasks/TasksTab.tsx
//
// Tasks tab — owner only.
// Fetches from /api/users/:id/tasks independently.
// Server-side ownership is enforced on the API — this is just the UI.

"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { TasksSkeleton } from "@/components/profile/shared/ProfileSkeleton";

// ─── Types ────────────────────────────────────────────────────────────────────

interface TaskEntry {
    id: string;
    title: string;
    description: string | null;
    status: string;
    priority: string;
    category: string | null;
    dueDate: string | null;
    estimatedHours: number | null;
    createdAt: string;
    project: { id: string; title: string; status: string };
    milestone: { id: string; title: string } | null;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
    TODO: { label: "To do", color: "var(--muted)", bg: "var(--surface2)" },
    IN_PROGRESS: { label: "In progress", color: "#378ADD", bg: "rgba(55,138,221,0.1)" },
    REVIEW: { label: "Review", color: "#a78bfa", bg: "rgba(167,139,250,0.1)" },
    DONE: { label: "Done", color: "#22c55e", bg: "rgba(34,197,94,0.1)" },
};

const PRIORITY_CONFIG: Record<string, { label: string; color: string }> = {
    CRITICAL: { label: "Critical", color: "#e24b4a" },
    HIGH: { label: "High", color: "#fb923c" },
    MEDIUM: { label: "Medium", color: "#facc15" },
    LOW: { label: "Low", color: "#666" },
};

// ─── Filter bar ───────────────────────────────────────────────────────────────

const STATUS_FILTERS = [
    { id: "", label: "All" },
    { id: "TODO", label: "To do" },
    { id: "IN_PROGRESS", label: "In progress" },
    { id: "REVIEW", label: "Review" },
];

// ─── Empty state ──────────────────────────────────────────────────────────────

function EmptyState({ filter }: { filter: string }) {
    return (
        <div
            style={{
                padding: "48px 24px",
                borderRadius: 12,
                border: "0.5px dashed var(--border)",
                background: "var(--surface)",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 10,
                textAlign: "center",
            }}
        >
            <div
                style={{
                    width: 40,
                    height: 40,
                    borderRadius: "50%",
                    background: "var(--surface2)",
                    border: "0.5px solid var(--border)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                }}
            >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--muted)" strokeWidth="1.5" strokeLinecap="round">
                    <path d="M9 11l3 3L22 4" /><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" />
                </svg>
            </div>
            <p style={{ fontSize: 13, fontWeight: 500, color: "var(--text)", margin: 0 }}>
                {filter ? `No ${STATUS_FILTERS.find(f => f.id === filter)?.label?.toLowerCase()} tasks` : "No active tasks"}
            </p>
            <p style={{ fontSize: 12, color: "var(--muted)", margin: 0, maxWidth: 280, lineHeight: 1.6 }}>
                Tasks you&apos;re assigned to across your projects will appear here.
            </p>
        </div>
    );
}

// ─── Task row ─────────────────────────────────────────────────────────────────

function TaskRow({ task }: { task: TaskEntry }) {
    const status = STATUS_CONFIG[task.status] ?? { label: task.status, color: "var(--muted)", bg: "var(--surface2)" };
    const priority = PRIORITY_CONFIG[task.priority] ?? { label: task.priority, color: "#666" };
    const overdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== "DONE";

    return (
        <Link href={`/projects/${task.project.id}/board`} style={{ textDecoration: "none" }}>
            <div
                style={{
                    border: "0.5px solid var(--border)",
                    borderRadius: 10,
                    background: "var(--surface)",
                    padding: "11px 14px",
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    transition: "border-color 0.15s",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.borderColor = "var(--accent)")}
                onMouseLeave={(e) => (e.currentTarget.style.borderColor = "var(--border)")}
            >
                {/* Status badge */}
                <span
                    style={{
                        fontSize: 9,
                        fontWeight: 600,
                        padding: "3px 8px",
                        borderRadius: 4,
                        textTransform: "uppercase",
                        letterSpacing: "0.04em",
                        flexShrink: 0,
                        background: status.bg,
                        color: status.color,
                        whiteSpace: "nowrap",
                    }}
                >
                    {status.label}
                </span>

                {/* Priority dot */}
                <span
                    style={{
                        width: 6,
                        height: 6,
                        borderRadius: "50%",
                        background: priority.color,
                        flexShrink: 0,
                    }}
                    title={priority.label}
                />

                {/* Title */}
                <div style={{ flex: 1, minWidth: 0 }}>
                    <p
                        style={{
                            fontSize: 12,
                            fontWeight: 500,
                            color: "var(--text)",
                            margin: 0,
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                        }}
                    >
                        {task.title}
                    </p>
                    {task.milestone && (
                        <p
                            style={{
                                fontSize: 10,
                                color: "var(--muted)",
                                margin: 0,
                                marginTop: 2,
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                whiteSpace: "nowrap",
                            }}
                        >
                            {task.milestone.title}
                        </p>
                    )}
                </div>

                {/* Project */}
                <span
                    style={{
                        fontSize: 10,
                        color: "var(--muted)",
                        flexShrink: 0,
                        maxWidth: 120,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                    }}
                >
                    {task.project.title}
                </span>

                {/* Category */}
                {task.category && (
                    <span
                        style={{
                            fontSize: 9,
                            padding: "2px 7px",
                            borderRadius: 4,
                            border: "0.5px solid var(--border)",
                            color: "var(--muted)",
                            background: "var(--surface2)",
                            textTransform: "capitalize",
                            flexShrink: 0,
                        }}
                    >
                        {task.category}
                    </span>
                )}

                {/* Due date */}
                {task.dueDate && (
                    <span
                        style={{
                            fontSize: 10,
                            color: overdue ? "#ef4444" : "var(--muted)",
                            flexShrink: 0,
                            fontWeight: overdue ? 500 : 400,
                        }}
                    >
                        {overdue ? "⚠ " : ""}
                        {new Date(task.dueDate).toLocaleDateString("en-GB", {
                            day: "numeric",
                            month: "short",
                        })}
                    </span>
                )}
            </div>
        </Link>
    );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

interface TasksTabProps {
    subjectId: string;
    isOwner: boolean;
    username: string;
}

export default function TasksTab({ subjectId, isOwner }: TasksTabProps) {
    const [tasks, setTasks] = useState<TaskEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);
    const [filter, setFilter] = useState("");

    useEffect(() => {
        const controller = new AbortController();

        async function fetchTasks() {
            setLoading(true);
            setError(false);
            try {
                const url = filter
                    ? `/api/users/${subjectId}/tasks?status=${filter}`
                    : `/api/users/${subjectId}/tasks`;
                const r = await fetch(url, { signal: controller.signal });
                if (!r.ok) throw new Error("Failed");
                const d = await r.json();
                setTasks(d.tasks ?? []);
            } catch (err: unknown) {
                if (err instanceof Error && err.name === "AbortError") return;
                setError(true);
            } finally {
                setLoading(false);
            }
        }

        fetchTasks();
        return () => controller.abort();
    }, [subjectId, filter]);

    function load() {
        setLoading(true);
        setError(false);
        const url = filter
            ? `/api/users/${subjectId}/tasks?status=${filter}`
            : `/api/users/${subjectId}/tasks`;
        fetch(url)
            .then((r) => {
                if (!r.ok) throw new Error("Failed");
                return r.json();
            })
            .then((d) => setTasks(d.tasks ?? []))
            .catch(() => setError(true))
            .finally(() => setLoading(false));
    }

    // Guard: tasks tab is owner-only, but double-check
    if (!isOwner) {
        return (
            <div style={{ padding: "32px 20px", textAlign: "center" }}>
                <p style={{ fontSize: 13, color: "var(--muted)" }}>This section is private.</p>
            </div>
        );
    }

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {/* Filter bar */}
            <div style={{ display: "flex", gap: 4 }}>
                {STATUS_FILTERS.map((f) => (
                    <button
                        key={f.id}
                        onClick={() => setFilter(f.id)}
                        style={{
                            padding: "5px 12px",
                            borderRadius: 7,
                            fontSize: 11,
                            cursor: "pointer",
                            border: "0.5px solid var(--border)",
                            background: filter === f.id ? "var(--surface2)" : "transparent",
                            color: filter === f.id ? "var(--text)" : "var(--muted)",
                            fontFamily: "inherit",
                            transition: "all 0.12s",
                            fontWeight: filter === f.id ? 500 : 400,
                        }}
                    >
                        {f.label}
                    </button>
                ))}
            </div>

            {/* Content */}
            {loading ? (
                <TasksSkeleton />
            ) : error ? (
                <div style={{ padding: "24px 20px", textAlign: "center" }}>
                    <p style={{ fontSize: 13, color: "var(--muted)", margin: 0 }}>
                        Failed to load tasks.{" "}
                        <button
                            onClick={load}
                            style={{ background: "none", border: "none", color: "var(--accent)", cursor: "pointer", fontSize: 13 }}
                        >
                            Retry
                        </button>
                    </p>
                </div>
            ) : tasks.length === 0 ? (
                <EmptyState filter={filter} />
            ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    <p style={{ fontSize: 11, color: "var(--muted)", margin: 0, marginBottom: 4 }}>
                        {tasks.length} task{tasks.length !== 1 ? "s" : ""}
                    </p>
                    {tasks.map((task) => (
                        <TaskRow key={task.id} task={task} />
                    ))}
                </div>
            )}
        </div>
    );
}