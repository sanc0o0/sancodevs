"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";

// New schema: DRAFT | OPEN | ACTIVE | PAUSED | COMPLETED | ARCHIVED
// (TERMINATED removed — use ARCHIVED instead; IN_PROGRESS → ACTIVE)
const STATUSES = ["OPEN", "IN_PROGRESS", "PAUSED", "COMPLETED", "ARCHIVED", "TERMINATED"];

const STATUS_LABELS: Record<string, string> = {
    OPEN: "Open",
    IN_PROGRESS: "In Progress",
    PAUSED: "Paused",
    COMPLETED: "Completed",
    ARCHIVED: "Archived",
    TERMINATED: "Terminated",
};

const STATUS_COLORS: Record<string, string> = {
    OPEN: "#22c55e",
    IN_PROGRESS: "#378ADD",
    PAUSED: "#facc15",
    COMPLETED: "#86efac",
    ARCHIVED: "#666",
    TERMINATED: "#e24b4a",
};

interface Props {
    projectId: string;
    currentStatus: string;
}

export default function ProjectStatusControl({ projectId, currentStatus }: Props) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [open, setOpen] = useState(false);
    const buttonRef = useRef<HTMLButtonElement>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const [pos, setPos] = useState<React.CSSProperties>({});

    // Recalculate dropdown position on open
    useEffect(() => {
        if (!open || !buttonRef.current) return;
        const btn = buttonRef.current.getBoundingClientRect();
        const W = window.innerWidth;
        const EDGE = 8;
        const MENU_W = Math.min(172, W - EDGE * 2);

        let left = btn.right - MENU_W;
        if (left < EDGE) left = btn.left;
        left = Math.min(left, W - MENU_W - EDGE);
        left = Math.max(EDGE, left);

        setPos({ position: "fixed", top: btn.bottom + 6, left, width: MENU_W, zIndex: 200 });
    }, [open]);

    // Close on outside click
    useEffect(() => {
        if (!open) return;
        function onDown(e: MouseEvent) {
            if (
                !dropdownRef.current?.contains(e.target as Node) &&
                !buttonRef.current?.contains(e.target as Node)
            ) setOpen(false);
        }
        document.addEventListener("mousedown", onDown);
        return () => document.removeEventListener("mousedown", onDown);
    }, [open]);

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
        <>
            <button
                ref={buttonRef}
                onClick={() => setOpen(o => !o)}
                disabled={loading}
                style={{
                    display: "flex", alignItems: "center", gap: 7,
                    padding: "6px 12px", borderRadius: "7px", fontSize: "12px",
                    border: "0.5px solid var(--border)", background: "var(--surface2)",
                    color: "var(--text)", cursor: loading ? "not-allowed" : "pointer",
                    opacity: loading ? 0.5 : 1, whiteSpace: "nowrap",
                }}
            >
                {/* Current status dot */}
                <span style={{
                    width: 6, height: 6, borderRadius: "50%", flexShrink: 0,
                    background: STATUS_COLORS[currentStatus] ?? "#666",
                }} />
                {loading ? "Updating…" : (STATUS_LABELS[currentStatus] ?? currentStatus)}
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                    style={{ opacity: 0.5, marginLeft: 2 }}>
                    <polyline points="6 9 12 15 18 9" />
                </svg>
            </button>

            {open && (
                <>
                    {/* Backdrop */}
                    <div style={{ position: "fixed", inset: 0, zIndex: 199 }} onClick={() => setOpen(false)} />

                    <div
                        ref={dropdownRef}
                        style={{
                            ...pos,
                            borderRadius: "10px",
                            border: "0.5px solid var(--border)",
                            background: "var(--surface)",
                            overflow: "hidden",
                            boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
                            animation: "fadeUp 0.12s ease",
                        }}
                    >
                        {STATUSES.map((s, i) => (
                            <button
                                key={s}
                                onClick={() => updateStatus(s)}
                                style={{
                                    display: "flex", alignItems: "center", justifyContent: "space-between",
                                    width: "100%", textAlign: "left",
                                    padding: "9px 14px", fontSize: "12px",
                                    color: s === currentStatus ? "var(--text)" : "var(--muted)",
                                    background: s === currentStatus ? "var(--surface2)" : "transparent",
                                    border: "none",
                                    borderBottom: i < STATUSES.length - 1 ? "0.5px solid var(--border)" : "none",
                                    cursor: "pointer",
                                    fontWeight: s === currentStatus ? 500 : 400,
                                }}
                            >
                                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                    <span style={{
                                        width: 6, height: 6, borderRadius: "50%",
                                        background: STATUS_COLORS[s] ?? "#666", flexShrink: 0,
                                    }} />
                                    {STATUS_LABELS[s]}
                                </div>
                                {s === currentStatus && (
                                    <span style={{ fontSize: "10px", color: "var(--muted)" }}>✓</span>
                                )}
                            </button>
                        ))}
                    </div>
                </>
            )}
        </>
    );
}