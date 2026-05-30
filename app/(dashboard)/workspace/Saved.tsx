"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { WsEmptyState } from "./Created";
import { TabSkeleton } from "./Joined";

// 250025002500 Types 25002500250025002500250025002500250025002500250025002500250025002500250025002500250025002500250025002500250025002500250025002500250025002500250025002500250025002500250025002500250025002500250025002500250025002500250025002500250025002500250025002500250025002500250025002500250025002500250025002500250025002500250025002500
interface SavedProject {
    id: string;
    project: {
        id: string;
        title: string;
        tagline: string | null;
        domain: string | null;
        difficulty: string;
        techStack: string[];
        hiringOpen: boolean;
        _count?: { teams: number };
    };
}

const DIFFICULTY_COLORS: Record<string, string> = {
    Beginner: "#22c55e",
    Intermediate: "#f59e0b",
    Advanced: "#ef4444",
};

// ─── Confirmation modal ───────────────────────────────────────────────────────

function UnsaveConfirmModal({
    projectTitle,
    onConfirm,
    onCancel,
    loading,
}: {
    projectTitle: string;
    onConfirm: () => void;
    onCancel: () => void;
    loading: boolean;
}) {
    // Esc to cancel
    useEffect(() => {
        const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onCancel(); };
        window.addEventListener("keydown", handler);
        return () => window.removeEventListener("keydown", handler);
    }, [onCancel]);

    return createPortal(
        <div
            onClick={(e) => { if (e.target === e.currentTarget) onCancel(); }}
            style={{
                position: "fixed",
                top: 0, left: 0, right: 0, bottom: 0,
                zIndex: 9999,
                background: "rgba(0,0,0,0.75)",
                backdropFilter: "blur(14px)",
                WebkitBackdropFilter: "blur(14px)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: 24,
            }}
        >
            <style>{`
                @keyframes unsaveModalIn {
                    from { opacity: 0; transform: translateY(8px) scale(0.97); }
                    to   { opacity: 1; transform: none; }
                }
            `}</style>

            <div style={{
                width: "100%", maxWidth: 380,
                background: "var(--surface)",
                border: "0.5px solid var(--border)",
                borderRadius: 14,
                overflow: "hidden",
                boxShadow: "0 32px 80px rgba(0,0,0,0.65)",
                animation: "unsaveModalIn 0.16s ease",
                position: "relative",
            }}>
                {/* Header */}
                <div style={{ padding: "16px 18px 0" }}>
                    {/* Icon */}
                    <div style={{
                        width: 36, height: 36, borderRadius: 8,
                        background: "var(--surface2)",
                        border: "0.5px solid var(--border)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        marginBottom: 12,
                    }}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--muted)" strokeWidth="1.8">
                            <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
                        </svg>
                    </div>
                    <p style={{ fontSize: 14, fontWeight: 600, color: "var(--text)", margin: "0 0 6px" }}>
                        Remove from saved?
                    </p>
                    <p style={{ fontSize: 12, color: "var(--muted)", margin: "0 0 18px", lineHeight: 1.6 }}>
                        <span style={{ color: "var(--text)", fontWeight: 500 }}>{projectTitle}</span>
                        {" "}will be removed from your saved projects. You can always save it again later.
                    </p>
                </div>

                {/* Actions */}
                <div style={{
                    padding: "0 18px 16px",
                    display: "flex", gap: 8,
                }}>
                    <button
                        onClick={onCancel}
                        disabled={loading}
                        style={{
                            flex: 1, padding: "8px",
                            borderRadius: 8, fontSize: 13,
                            border: "0.5px solid var(--border)",
                            background: "transparent",
                            color: "var(--muted)",
                            cursor: "pointer",
                            fontFamily: "inherit",
                        }}
                    >
                        Cancel
                    </button>
                    <button
                        onClick={onConfirm}
                        disabled={loading}
                        style={{
                            flex: 1, padding: "8px",
                            borderRadius: 8, fontSize: 13, fontWeight: 500,
                            border: "0.5px solid rgba(226,75,74,0.4)",
                            background: "rgba(226,75,74,0.1)",
                            color: "#e24b4a",
                            cursor: loading ? "wait" : "pointer",
                            opacity: loading ? 0.6 : 1,
                            fontFamily: "inherit",
                            transition: "all 0.12s",
                            display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                        }}
                    >
                        {loading ? (
                            <>
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ animation: "spin 0.7s linear infinite" }}>
                                    <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
                                    <path d="M12 2a10 10 0 0 1 10 10" />
                                </svg>
                                Removing…
                            </>
                        ) : "Yes, remove"}
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function Saved({ userId }: { userId: string }) {
    const [items, setItems] = useState<SavedProject[]>([]);
    const [loading, setLoading] = useState(true);
    const [nextCursor, setNextCursor] = useState<string | null>(null);
    const [loadingMore, setLoadingMore] = useState(false);

    // Confirmation modal state
    const [confirmTarget, setConfirmTarget] = useState<{ id: string; title: string } | null>(null);
    const [unsaving, setUnsaving] = useState(false);

    async function load(cursor?: string) {
        const params = cursor ? `?cursor=${cursor}` : "";
        const res = await fetch(`/api/workspace/saved${params}`);
        return res.json();
    }

    useEffect(() => {
        load().then(({ data, nextCursor }) => {
            setItems(data);
            setNextCursor(nextCursor);
            setLoading(false);
        });
    }, []);

    async function loadMore() {
        if (!nextCursor) return;
        setLoadingMore(true);
        const { data, nextCursor: nc } = await load(nextCursor);
        setItems((prev) => [...prev, ...data]);
        setNextCursor(nc);
        setLoadingMore(false);
    }

    // Called when user clicks X — opens modal instead of immediately unsaving
    function requestUnsave(projectId: string, projectTitle: string) {
        setConfirmTarget({ id: projectId, title: projectTitle });
    }

    // Called after user confirms in modal
    async function confirmUnsave() {
        if (!confirmTarget) return;
        setUnsaving(true);
        try {
            // Reuse the same POST toggle endpoint — project is currently saved,
            // so POSTing will toggle it to unsaved.
            await fetch("/api/projects/save", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ projectId: confirmTarget.id }),
            });
            setItems((prev) => prev.filter((s) => s.project.id !== confirmTarget.id));
        } finally {
            setUnsaving(false);
            setConfirmTarget(null);
        }
    }

    function cancelUnsave() {
        if (unsaving) return; // don't cancel mid-request
        setConfirmTarget(null);
    }

    if (loading) return <TabSkeleton />;

    if (items.length === 0) {
        return (
            <WsEmptyState
                icon={
                    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2">
                        <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
                    </svg>
                }
                title="Nothing saved yet"
                subtitle="Bookmark projects while browsing to revisit them here."
                action={{ label: "Browse projects", href: "/projects" }}
            />
        );
    }

    return (
        <div>
            {/* Confirmation modal */}
            {confirmTarget && (
                <UnsaveConfirmModal
                    projectTitle={confirmTarget.title}
                    onConfirm={confirmUnsave}
                    onCancel={cancelUnsave}
                    loading={unsaving}
                />
            )}

            <p style={{ fontSize: "11px", color: "var(--muted)", marginBottom: "12px" }}>
                {items.length} saved
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {items.map((saved: SavedProject) => {
                    const p = saved.project;
                    const members = p._count?.teams ?? 0;
                    const isTarget = confirmTarget?.id === p.id;

                    return (
                        <div
                            key={saved.id}
                            className="card-hover"
                            style={{
                                border: "0.5px solid var(--border)",
                                borderRadius: "9px",
                                background: "var(--surface)",
                                overflow: "hidden",
                                opacity: isTarget ? 0.6 : 1,
                                transition: "opacity 0.15s",
                            }}
                        >
                            <div style={{ padding: "13px 14px", display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "10px" }}>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <Link
                                        href={`/projects/${p.id}`}
                                        style={{ fontSize: "13px", fontWeight: 500, color: "var(--text)", textDecoration: "none", display: "block", marginBottom: "4px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
                                    >
                                        {p.title}
                                    </Link>
                                    {p.tagline && (
                                        <p style={{ fontSize: "11px", color: "var(--muted)", marginBottom: "6px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                            {p.tagline}
                                        </p>
                                    )}
                                    <div style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap" }}>
                                        {p.domain && (
                                            <span style={{ fontSize: "10px", color: "var(--muted)", padding: "1px 6px", borderRadius: "20px", border: "0.5px solid var(--border)", background: "var(--surface2)" }}>
                                                {p.domain}
                                            </span>
                                        )}
                                        <span style={{ fontSize: "10px", color: DIFFICULTY_COLORS[p.difficulty] ?? "var(--muted)" }}>
                                            {p.difficulty}
                                        </span>
                                        <span style={{ fontSize: "10px", color: "var(--muted)" }}>
                                            {members} member{members !== 1 ? "s" : ""}
                                        </span>
                                        {p.hiringOpen && (
                                            <span style={{ fontSize: "10px", color: "#22c55e" }}>Hiring</span>
                                        )}
                                    </div>
                                </div>

                                {/* X button — now opens modal instead of directly unsaving */}
                                <button
                                    onClick={() => requestUnsave(p.id, p.title)}
                                    disabled={!!confirmTarget}
                                    title="Remove from saved"
                                    style={{
                                        padding: "5px",
                                        background: "transparent",
                                        border: "0.5px solid var(--border)",
                                        borderRadius: "6px",
                                        cursor: confirmTarget ? "default" : "pointer",
                                        color: "var(--muted)",
                                        flexShrink: 0,
                                        opacity: confirmTarget ? 0.4 : 1,
                                        transition: "all 0.12s",
                                    }}
                                    onMouseEnter={(e) => {
                                        if (!confirmTarget) {
                                            e.currentTarget.style.borderColor = "#e24b4a";
                                            e.currentTarget.style.color = "#e24b4a";
                                        }
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.borderColor = "var(--border)";
                                        e.currentTarget.style.color = "var(--muted)";
                                    }}
                                >
                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                        <line x1="18" y1="6" x2="6" y2="18" />
                                        <line x1="6" y1="6" x2="18" y2="18" />
                                    </svg>
                                </button>
                            </div>

                            {/* Tech stack */}
                            {p.techStack?.length > 0 && (
                                <div style={{ borderTop: "0.5px solid var(--border)", padding: "7px 12px", display: "flex", gap: "5px", flexWrap: "wrap" }}>
                                    {p.techStack.slice(0, 5).map((tech: string) => (
                                        <span key={tech} style={{ fontSize: "10px", color: "var(--muted)", padding: "1px 6px", borderRadius: "4px", background: "var(--surface2)", border: "0.5px solid var(--border)" }}>
                                            {tech}
                                        </span>
                                    ))}
                                    {p.techStack.length > 5 && (
                                        <span style={{ fontSize: "10px", color: "var(--muted)" }}>+{p.techStack.length - 5}</span>
                                    )}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {nextCursor && (
                <button
                    onClick={loadMore}
                    disabled={loadingMore}
                    style={{ marginTop: "12px", width: "100%", padding: "8px", fontSize: "11px", color: "var(--muted)", background: "transparent", border: "0.5px solid var(--border)", borderRadius: "7px", cursor: "pointer" }}
                >
                    {loadingMore ? "Loading..." : "Load more"}
                </button>
            )}
        </div>
    );
}