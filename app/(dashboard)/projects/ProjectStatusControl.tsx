"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";

const STATUSES = ["OPEN", "IN_PROGRESS", "CLOSED", "COMPLETED", "TERMINATED"];

const STATUS_LABELS: Record<string, string> = {
    OPEN: "Open",
    IN_PROGRESS: "In progress",
    CLOSED: "Closed",
    COMPLETED: "Completed",
    TERMINATED: "Terminated",
};

const STATUS_COLORS: Record<string, string> = {
    OPEN: "#22c55e",
    IN_PROGRESS: "#378ADD",
    CLOSED: "#666",
    COMPLETED: "#639922",
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

    // Recalculate position every time dropdown opens
    useEffect(() => {
        if (!open || !buttonRef.current) return;
        const btn = buttonRef.current.getBoundingClientRect();
        const W = window.innerWidth;
        const EDGE = 8;
        const MENU_W = Math.min(168, W - EDGE * 2); // never wider than viewport

        // Try right-aligned first (right edge of dropdown = right edge of button)
        let left = btn.right - MENU_W;
        // If that pushes left edge off screen, try left-aligned
        if (left < EDGE) left = btn.left;
        // Clamp: right edge must stay on screen
        left = Math.min(left, W - MENU_W - EDGE);
        // Clamp: left edge must stay on screen
        left = Math.max(EDGE, left);

        setPos({
            position: "fixed",
            top: btn.bottom + 6,
            left,
            width: MENU_W,
            zIndex: 200,
        });
    }, [open]);

    // Close on outside click
    useEffect(() => {
        if (!open) return;
        function onDown(e: MouseEvent) {
            if (!dropdownRef.current?.contains(e.target as Node) &&
                !buttonRef.current?.contains(e.target as Node)) {
                setOpen(false);
            }
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
                    padding: "6px 12px", borderRadius: "7px", fontSize: "12px",
                    border: "0.5px solid var(--border)", background: "var(--surface2)",
                    color: "var(--text)", cursor: loading ? "not-allowed" : "pointer",
                    opacity: loading ? 0.5 : 1, whiteSpace: "nowrap",
                }}
            >
                {loading ? "Updating..." : "Update status"}
            </button>

            {open && (
                <>
                    {/* Invisible full-screen backdrop to catch outside clicks */}
                    <div
                        style={{ position: "fixed", inset: 0, zIndex: 199 }}
                        onClick={() => setOpen(false)}
                    />
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
                                    cursor: "pointer", fontWeight: s === currentStatus ? 500 : 400,
                                }}
                            >
                                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                    <span style={{
                                        width: "6px", height: "6px", borderRadius: "50%",
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