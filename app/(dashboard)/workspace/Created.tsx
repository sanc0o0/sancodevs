"use client";

import Link from "next/link";
import type { WsCreatedProject } from "./types";

interface CreatedProps {
    initialProjects: WsCreatedProject[];
    userId: string;
}

const STATUS_COLORS: Record<string, string> = {
    OPEN: "#22c55e",
    ACTIVE: "#3b82f6",
    PAUSED: "#f59e0b",
    DRAFT: "var(--muted)",
    COMPLETED: "#8b5cf6",
    ARCHIVED: "var(--muted)",
};

const PHASE_LABELS: Record<string, string> = {
    IDEA: "Idea",
    PLANNING: "Planning",
    BUILDING: "Building",
    TESTING: "Testing",
    LAUNCHED: "Launched",
};

export default function Created({ initialProjects }: CreatedProps) {
    const projects = initialProjects;

    if (projects.length === 0) {
        return (
            <WsEmptyState
                icon={
                    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2">
                        <path d="M12 5v14M5 12h14" />
                    </svg>
                }
                title="No projects created yet"
                subtitle="Start building something. Your projects will appear here."
                action={{ label: "Create project", href: "/projects/new" }}
            />
        );
    }

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: "1px" }}>
            {/* ── Header ───────────────────────────────────── */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
                <p style={{ fontSize: "11px", color: "var(--muted)" }}>
                    {projects.length} project{projects.length !== 1 ? "s" : ""}
                </p>
                <Link
                    href="/projects/new"
                    style={{
                        display: "flex", alignItems: "center", gap: "5px",
                        fontSize: "11px", color: "var(--muted)", textDecoration: "none",
                        padding: "5px 10px", borderRadius: "6px",
                        border: "0.5px solid var(--border)", background: "var(--surface)",
                    }}
                >
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M12 5v14M5 12h14" />
                    </svg>
                    New project
                </Link>
            </div>

            {/* ── Project list ─────────────────────────────── */}
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {projects.map((project) => {
                    const pending = project._count?.applicants ?? 0;
                    const members = project._count?.teams ?? 0;
                    const taskTotal = project._count?.tasks ?? 0;
                    const nextMilestone = project.milestones?.[0];
                    const statusColor = STATUS_COLORS[project.status] ?? "var(--muted)";

                    return (
                        <div
                            key={project.id}
                            className="card-hover"
                            style={{
                                border: "0.5px solid var(--border)",
                                borderRadius: "9px",
                                background: "var(--surface)",
                                overflow: "hidden",
                            }}
                        >
                            {/* ── Title row ───────────────────────── */}
                            <div style={{ padding: "13px 14px 10px", display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "10px" }}>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ display: "flex", alignItems: "center", gap: "7px", marginBottom: "3px" }}>
                                        <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: statusColor, flexShrink: 0 }} />
                                        <Link
                                            href={`/projects/${project.id}`}
                                            style={{ fontSize: "13px", fontWeight: 500, color: "var(--text)", textDecoration: "none", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
                                        >
                                            {project.title}
                                        </Link>
                                    </div>
                                    {project.tagline && (
                                        <p style={{ fontSize: "11px", color: "var(--muted)", paddingLeft: "13px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                            {project.tagline}
                                        </p>
                                    )}
                                </div>

                                <span style={{ fontSize: "10px", color: "var(--muted)", padding: "2px 7px", borderRadius: "20px", border: "0.5px solid var(--border)", background: "var(--surface2)", whiteSpace: "nowrap", flexShrink: 0 }}>
                                    {PHASE_LABELS[project.phase] ?? project.phase}
                                </span>
                            </div>

                            {/* ── Stats row ───────────────────────── */}
                            <div style={{ borderTop: "0.5px solid var(--border)", display: "flex" }}>
                                <MiniStat
                                    icon={<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /></svg>}
                                    value={pending}
                                    label="pending"
                                    href={pending > 0 ? `/projects/${project.id}` : undefined}
                                    alert={pending > 0}
                                />
                                <MiniStat
                                    icon={<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" /></svg>}
                                    value={members}
                                    label="members"
                                />
                                <MiniStat
                                    icon={<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><polyline points="9 11 12 14 22 4" /><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" /></svg>}
                                    value={taskTotal}
                                    label="tasks"
                                />
                                {nextMilestone && (
                                    <div style={{ flex: "2", padding: "7px 10px", display: "flex", alignItems: "center", gap: "5px", borderLeft: "0.5px solid var(--border)" }}>
                                        <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ color: "var(--muted)", flexShrink: 0 }}>
                                            <polygon points="3 11 22 2 13 21 11 13 3 11" />
                                        </svg>
                                        <span style={{ fontSize: "10px", color: "var(--muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                            {nextMilestone.title}
                                        </span>
                                    </div>
                                )}
                            </div>

                            {/* ── Actions ─────────────────────────── */}
                            <div style={{ borderTop: "0.5px solid var(--border)", padding: "7px 10px", display: "flex", gap: "5px" }}>
                                <MiniLink href={`/projects/${project.id}`} label="View" />
                                <MiniLink href={`/projects/${project.id}/board`} label="Board" />
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

// ─── Shared sub-components ────────────────────────────────────

function MiniStat({ icon, value, label, href, alert }: {
    icon: React.ReactNode;
    value: number;
    label: string;
    href?: string;
    alert?: boolean;
}) {
    const inner = (
        <div style={{ flex: 1, padding: "7px 10px", display: "flex", alignItems: "center", gap: "4px", borderRight: "0.5px solid var(--border)", minWidth: 0 }}>
            <span style={{ color: alert ? "#f59e0b" : "var(--muted)", flexShrink: 0 }}>{icon}</span>
            <span style={{ fontSize: "10px", color: alert ? "var(--text)" : "var(--muted)", fontWeight: alert ? 500 : 400, whiteSpace: "nowrap" }}>
                {value} {label}
            </span>
        </div>
    );
    if (href) return <Link href={href} style={{ flex: 1, textDecoration: "none" }}>{inner}</Link>;
    return inner;
}

function MiniLink({ href, label }: { href: string; label: string }) {
    return (
        <Link
            href={href}
            className="link-hover"
            style={{ fontSize: "11px", color: "var(--muted)", textDecoration: "none", padding: "3px 9px", borderRadius: "5px", border: "0.5px solid var(--border)", background: "var(--surface2)" }}
        >
            {label}
        </Link>
    );
}

export function WsEmptyState({ icon, title, subtitle, action }: {
    icon: React.ReactNode;
    title: string;
    subtitle: string;
    action?: { label: string; href: string };
}) {
    return (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "4rem 2rem", gap: "10px", textAlign: "center" }}>
            <span style={{ color: "var(--border)" }}>{icon}</span>
            <p style={{ fontSize: "13px", fontWeight: 500, color: "var(--text)" }}>{title}</p>
            <p style={{ fontSize: "11px", color: "var(--muted)", maxWidth: "260px", lineHeight: 1.5 }}>{subtitle}</p>
            {action && (
                <Link href={action.href} style={{ marginTop: "4px", fontSize: "11px", color: "var(--text)", textDecoration: "none", padding: "6px 14px", borderRadius: "7px", border: "0.5px solid var(--border)", background: "var(--surface)" }}>
                    {action.label}
                </Link>
            )}
        </div>
    );
}