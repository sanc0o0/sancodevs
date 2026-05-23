"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import ProjectStatusControl from "../ProjectStatusControl";

interface Props {
    projectId: string;
    isOwner: boolean;
    isInsider: boolean;
    liveUrl: string | null;
    repoUrl: string | null;
    currentStatus: string;
}

export default function MobileActions({
    projectId,
    isOwner,
    isInsider,
    liveUrl,
    repoUrl,
    currentStatus,
}: Props) {
    const [open, setOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);
    const btnRef = useRef<HTMLButtonElement>(null);

    // Close on outside click
    useEffect(() => {
        if (!open) return;
        function onDown(e: MouseEvent) {
            if (
                menuRef.current && !menuRef.current.contains(e.target as Node) &&
                btnRef.current && !btnRef.current.contains(e.target as Node)
            ) setOpen(false);
        }
        document.addEventListener("mousedown", onDown);
        return () => document.removeEventListener("mousedown", onDown);
    }, [open]);

    const hasItems = isInsider || liveUrl || repoUrl || isOwner;
    if (!hasItems) return null;

    return (
        <div style={{ position: "relative" }}>
            {/* Kebab trigger */}
            <button
                ref={btnRef}
                onClick={() => setOpen(o => !o)}
                aria-label="Project actions"
                style={{
                    display: "flex", alignItems: "center", justifyContent: "center",
                    width: 36, height: 36, borderRadius: 8,
                    border: "0.5px solid var(--border)", background: "var(--surface2)",
                    cursor: "pointer", transition: "border-color 0.15s",
                }}
            >
                {/* Three dots vertical */}
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="5" r="1.5" fill="var(--muted)" />
                    <circle cx="12" cy="12" r="1.5" fill="var(--muted)" />
                    <circle cx="12" cy="19" r="1.5" fill="var(--muted)" />
                </svg>
            </button>

            {/* Dropdown */}
            {open && (
                <>
                    {/* Backdrop */}
                    <div
                        style={{ position: "fixed", inset: 0, zIndex: 199 }}
                        onClick={() => setOpen(false)}
                    />
                    <div
                        ref={menuRef}
                        style={{
                            position: "absolute",
                            top: "calc(100% + 6px)",
                            right: 0,
                            zIndex: 200,
                            minWidth: 200,
                            background: "var(--surface)",
                            border: "0.5px solid var(--border)",
                            borderRadius: 10,
                            overflow: "hidden",
                            boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
                            animation: "fadeUp 0.12s ease",
                        }}
                    >
                        {/* Task board */}
                        {isInsider && (
                            <MenuItem onClick={() => setOpen(false)}>
                                <Link
                                    href={`/projects/${projectId}/board`}
                                    style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none", color: "inherit", width: "100%" }}
                                >
                                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--muted)" strokeWidth="1.5" strokeLinecap="round">
                                        <rect x="3" y="3" width="7" height="7" rx="1" />
                                        <rect x="14" y="3" width="7" height="7" rx="1" />
                                        <rect x="3" y="14" width="7" height="7" rx="1" />
                                        <rect x="14" y="14" width="7" height="7" rx="1" />
                                    </svg>
                                    Task board
                                </Link>
                            </MenuItem>
                        )}

                        {/* Live link */}
                        {liveUrl && (
                            <MenuItem onClick={() => setOpen(false)}>
                                <a
                                    href={liveUrl} target="_blank" rel="noopener noreferrer"
                                    style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none", color: "inherit", width: "100%" }}
                                >
                                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--muted)" strokeWidth="1.5" strokeLinecap="round">
                                        <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                                        <polyline points="15 3 21 3 21 9" />
                                        <line x1="10" y1="14" x2="21" y2="3" />
                                    </svg>
                                    Live project
                                </a>
                            </MenuItem>
                        )}

                        {/* Repo link */}
                        {repoUrl && (
                            <MenuItem onClick={() => setOpen(false)}>
                                <a
                                    href={repoUrl} target="_blank" rel="noopener noreferrer"
                                    style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none", color: "inherit", width: "100%" }}
                                >
                                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--muted)" strokeWidth="1.5" strokeLinecap="round">
                                        <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22" />
                                    </svg>
                                    Repository
                                </a>
                            </MenuItem>
                        )}

                        {/* Status control — owner only */}
                        {isOwner && (
                            <div style={{ borderTop: (isInsider || liveUrl || repoUrl) ? "0.5px solid var(--border)" : "none" }}>
                                <div style={{ padding: "10px 14px" }}>
                                    <p style={{ fontSize: 9, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 8 }}>
                                        Update status
                                    </p>
                                    <ProjectStatusControl
                                        projectId={projectId}
                                        currentStatus={currentStatus}
                                    />
                                </div>
                            </div>
                        )}
                    </div>
                </>
            )}
        </div>
    );
}

// ─── Menu item wrapper ────────────────────────────────────────────────────────

function MenuItem({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
    return (
        <div
            onClick={onClick}
            style={{
                padding: "10px 14px",
                fontSize: 13,
                color: "var(--text)",
                cursor: "pointer",
                borderBottom: "0.5px solid var(--border)",
                transition: "background 0.1s",
                display: "flex", alignItems: "center",
            }}
            onMouseEnter={e => (e.currentTarget.style.background = "var(--surface2)")}
            onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
        >
            {children}
        </div>
    );
}