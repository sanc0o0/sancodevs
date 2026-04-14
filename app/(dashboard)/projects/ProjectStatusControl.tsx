"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const STATUSES = ["OPEN", "IN_PROGRESS", "CLOSED", "COMPLETED", "TERMINATED"];

const STATUS_LABELS: Record<string, string> = {
    OPEN: "Open",
    IN_PROGRESS: "In progress",
    CLOSED: "Closed",
    COMPLETED: "Completed",
    TERMINATED: "Terminated",
};

interface Props {
    projectId: string;
    currentStatus: string;
}

export default function ProjectStatusControl({ projectId, currentStatus }: Props) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [open, setOpen] = useState(false);

    async function updateStatus(status: string) {
        if (status === currentStatus) { setOpen(false); return; }
        setLoading(true);
        setOpen(false);
        await fetch(`/api/projects/${projectId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ status }),
        });
        setLoading(false);
        router.refresh();
    }

    return (
        <div style={{ position: "relative" }}>
            <button
                onClick={() => setOpen(o => !o)}
                disabled={loading}
                title="Update project status"
                aria-label="Update project status"
                style={{
                    padding: "6px 12px", borderRadius: "7px", fontSize: "12px",
                    border: "0.5px solid var(--border)", background: "var(--surface2)",
                    color: "var(--muted)", cursor: loading ? "not-allowed" : "pointer",
                    opacity: loading ? 0.5 : 1,
                }}
            >
                {loading ? "Updating..." : "Update status"}
            </button>

            {open && (
                <>
                    <div
                        onClick={() => setOpen(false)}
                        style={{ position: "fixed", inset: 0, zIndex: 40 }}
                    />
                    <div style={{
                        position: "absolute", right: 0, bottom: "calc(100% + 6px)",
                        width: "160px", borderRadius: "9px",
                        border: "0.5px solid var(--border)", background: "var(--surface)",
                        zIndex: 50, overflow: "hidden",
                        animation: "fadeIn 0.1s ease",
                    }}>
                        {STATUSES.map((s, i) => (
                            <button
                                key={s}
                                onClick={() => updateStatus(s)}
                                style={{
                                    display: "block", width: "100%", textAlign: "left",
                                    padding: "9px 14px", fontSize: "12px",
                                    color: s === currentStatus ? "var(--text)" : "var(--muted)",
                                    background: s === currentStatus ? "var(--surface2)" : "transparent",
                                    border: "none",
                                    borderBottom: i < STATUSES.length - 1 ? "0.5px solid var(--border)" : "none",
                                    cursor: "pointer", fontWeight: s === currentStatus ? 500 : 400,
                                }}
                            >
                                {STATUS_LABELS[s]}
                                {s === currentStatus && (
                                    <span style={{ float: "right", fontSize: "10px", color: "var(--muted)" }}>✓</span>
                                )}
                            </button>
                        ))}
                    </div>
                </>
            )}
        </div>
    );
}