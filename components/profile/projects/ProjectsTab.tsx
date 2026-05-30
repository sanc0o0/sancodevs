// components/profile/projects/ProjectsTab.tsx
//
// Projects tab — full project history.
// Fetches from /api/users/:id/projects independently.
// Own skeleton, empty, and error states.

"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ProjectsSkeleton } from "@/components/profile/shared/ProfileSkeleton";

// ─── Types ────────────────────────────────────────────────────────────────────

interface ProjectEntry {
    teamMemberId: string;
    role: string;
    permissionLevel: string;
    joinedAt: string;
    active: boolean;
    contributionScore: number;
    project: {
        id: string;
        title: string;
        tagline: string | null;
        status: string;
        domain: string | null;
        projectType: string | null;
        difficulty: string;
        techStack: string[];
        phase: string;
        coverImage: string | null;
        createdAt: string;
    };
}

// ─── Constants ────────────────────────────────────────────────────────────────

const STATUS_COLORS: Record<string, string> = {
    OPEN: "#22c55e",
    IN_PROGRESS: "#378ADD",
    ACTIVE: "#378ADD",
    PAUSED: "#facc15",
    CLOSED: "#666",
    COMPLETED: "#86efac",
    TERMINATED: "#e24b4a",
    ARCHIVED: "#666",
    BUILDING: "#a78bfa",
    DRAFT: "#666",
};

const PERMISSION_LABELS: Record<string, string> = {
    OWNER: "Owner",
    LEAD: "Lead",
    CORE: "Core",
    CONTRIBUTOR: "Contributor",
};

// ─── Empty state ──────────────────────────────────────────────────────────────

function EmptyState({ isOwner }: { isOwner: boolean }) {
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
                    <path d="M3 7h18M3 12h18M3 17h18" />
                </svg>
            </div>
            <p style={{ fontSize: 13, fontWeight: 500, color: "var(--text)", margin: 0 }}>
                No project history yet
            </p>
            <p style={{ fontSize: 12, color: "var(--muted)", margin: 0, maxWidth: 280, lineHeight: 1.6 }}>
                {isOwner
                    ? "Join or create a project to start building your history."
                    : "This builder hasn't joined any projects yet."}
            </p>
            {isOwner && (
                <Link
                    href="/projects"
                    style={{
                        marginTop: 8,
                        padding: "7px 18px",
                        borderRadius: 8,
                        fontSize: 12,
                        background: "var(--accent)",
                        color: "var(--bg)",
                        textDecoration: "none",
                        fontWeight: 500,
                    }}
                >
                    Browse projects →
                </Link>
            )}
        </div>
    );
}

// ─── Error state ──────────────────────────────────────────────────────────────

function ErrorState({ onRetry }: { onRetry: () => void }) {
    return (
        <div
            style={{
                padding: "32px 20px",
                borderRadius: 10,
                border: "0.5px solid rgba(226,75,74,0.2)",
                background: "rgba(226,75,74,0.04)",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 10,
                textAlign: "center",
            }}
        >
            <p style={{ fontSize: 13, color: "var(--muted)", margin: 0 }}>
                Failed to load projects.
            </p>
            <button
                onClick={onRetry}
                style={{
                    padding: "6px 16px",
                    borderRadius: 8,
                    fontSize: 12,
                    border: "0.5px solid var(--border)",
                    background: "transparent",
                    color: "var(--text)",
                    cursor: "pointer",
                }}
            >
                Retry
            </button>
        </div>
    );
}

// ─── Project card ─────────────────────────────────────────────────────────────

function ProjectCard({ entry }: { entry: ProjectEntry }) {
    const { project, role, permissionLevel, joinedAt, active } = entry;

    return (
        <Link href={`/projects/${project.id}`} style={{ textDecoration: "none" }}>
            <div
                style={{
                    border: "0.5px solid var(--border)",
                    borderRadius: 10,
                    background: "var(--surface)",
                    padding: "14px 16px",
                    transition: "border-color 0.15s",
                    display: "flex",
                    flexDirection: "column",
                    gap: 10,
                }}
                onMouseEnter={(e) => (e.currentTarget.style.borderColor = "var(--accent)")}
                onMouseLeave={(e) => (e.currentTarget.style.borderColor = "var(--border)")}
            >
                {/* Row 1: title + status */}
                <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 3 }}>
                            <p
                                style={{
                                    fontSize: 13,
                                    fontWeight: 500,
                                    color: "var(--text)",
                                    margin: 0,
                                    overflow: "hidden",
                                    textOverflow: "ellipsis",
                                    whiteSpace: "nowrap",
                                }}
                            >
                                {project.title}
                            </p>
                            {!active && (
                                <span
                                    style={{
                                        fontSize: 9,
                                        padding: "2px 6px",
                                        borderRadius: 4,
                                        background: "var(--surface2)",
                                        color: "var(--muted)",
                                        textTransform: "uppercase",
                                        letterSpacing: "0.05em",
                                    }}
                                >
                                    Inactive
                                </span>
                            )}
                        </div>
                        {project.tagline && (
                            <p
                                style={{
                                    fontSize: 11,
                                    color: "var(--muted)",
                                    margin: 0,
                                    overflow: "hidden",
                                    textOverflow: "ellipsis",
                                    whiteSpace: "nowrap",
                                }}
                            >
                                {project.tagline}
                            </p>
                        )}
                    </div>
                    <span
                        style={{
                            fontSize: 9,
                            fontWeight: 600,
                            color: STATUS_COLORS[project.status] ?? "#666",
                            textTransform: "uppercase",
                            letterSpacing: "0.04em",
                            flexShrink: 0,
                        }}
                    >
                        {project.status.replace(/_/g, " ")}
                    </span>
                </div>

                {/* Row 2: meta pills */}
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                    <span
                        style={{
                            fontSize: 10,
                            padding: "3px 9px",
                            borderRadius: 20,
                            border: "0.5px solid var(--border)",
                            background: "var(--surface2)",
                            color: "var(--text)",
                            textTransform: "capitalize",
                        }}
                    >
                        {PERMISSION_LABELS[permissionLevel] ?? permissionLevel} · {role.replace(/_/g, " ")}
                    </span>

                    {project.domain && (
                        <span
                            style={{
                                fontSize: 10,
                                padding: "3px 9px",
                                borderRadius: 20,
                                border: "0.5px solid var(--border)",
                                background: "var(--surface2)",
                                color: "var(--muted)",
                                textTransform: "capitalize",
                            }}
                        >
                            {project.domain.replace(/_/g, " ")}
                        </span>
                    )}

                    {project.phase && project.phase !== "IDEA" && (
                        <span
                            style={{
                                fontSize: 10,
                                padding: "3px 9px",
                                borderRadius: 20,
                                border: "0.5px solid var(--border)",
                                background: "var(--surface2)",
                                color: "var(--muted)",
                                textTransform: "capitalize",
                            }}
                        >
                            {project.phase.toLowerCase()}
                        </span>
                    )}

                    <span
                        style={{
                            fontSize: 10,
                            padding: "3px 9px",
                            borderRadius: 20,
                            border: "0.5px solid var(--border)",
                            background: "var(--surface2)",
                            color: "var(--muted)",
                        }}
                    >
                        Joined {new Date(joinedAt).toLocaleDateString("en-GB", { month: "short", year: "numeric" })}
                    </span>
                </div>

                {/* Row 3: tech stack */}
                {project.techStack.length > 0 && (
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
                        {project.techStack.slice(0, 5).map((t) => (
                            <span
                                key={t}
                                style={{
                                    fontSize: 10,
                                    padding: "2px 8px",
                                    borderRadius: 4,
                                    border: "0.5px solid var(--border)",
                                    color: "var(--muted)",
                                    background: "transparent",
                                }}
                            >
                                {t}
                            </span>
                        ))}
                        {project.techStack.length > 5 && (
                            <span style={{ fontSize: 10, color: "var(--muted)", alignSelf: "center" }}>
                                +{project.techStack.length - 5}
                            </span>
                        )}
                    </div>
                )}
            </div>
        </Link>
    );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

interface ProjectsTabProps {
    subjectId: string;
    isOwner: boolean;
    username: string;
}

export default function ProjectsTab({ subjectId, isOwner, username }: ProjectsTabProps) {
    const [projects, setProjects] = useState<ProjectEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    useEffect(() => {
        const controller = new AbortController();

        async function fetchProjects() {
            setLoading(true);
            setError(false);
            try {
                const r = await fetch(`/api/users/${subjectId}/projects`, {
                    signal: controller.signal,
                });
                if (!r.ok) throw new Error("Failed");
                const d = await r.json();
                setProjects(d.projects ?? []);
            } catch (err: unknown) {
                if (err instanceof Error && err.name === "AbortError") return;
                setError(true);
            } finally {
                setLoading(false);
            }
        }

        fetchProjects();
        return () => controller.abort();
    }, [subjectId]);

    function load() {
        setLoading(true);
        setError(false);
        fetch(`/api/users/${subjectId}/projects`)
            .then((r) => {
                if (!r.ok) throw new Error("Failed");
                return r.json();
            })
            .then((d) => setProjects(d.projects ?? []))
            .catch(() => setError(true))
            .finally(() => setLoading(false));
    }

    if (loading) return <ProjectsSkeleton />;
    if (error) return <ErrorState onRetry={load} />;
    if (projects.length === 0) return <EmptyState isOwner={isOwner} />;

    const active = projects.filter((p) => p.active);
    const inactive = projects.filter((p) => !p.active);

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {/* Header */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <p style={{ fontSize: 11, color: "var(--muted)", margin: 0 }}>
                    {projects.length} project{projects.length !== 1 ? "s" : ""}
                    {active.length > 0 && ` · ${active.length} active`}
                </p>
            </div>

            {/* Active projects */}
            {active.length > 0 && (
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {active.map((entry) => (
                        <ProjectCard key={entry.teamMemberId} entry={entry} />
                    ))}
                </div>
            )}

            {/* Past projects */}
            {inactive.length > 0 && (
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    <p
                        style={{
                            fontSize: 10,
                            color: "var(--muted)",
                            textTransform: "uppercase",
                            letterSpacing: "0.07em",
                            margin: 0,
                        }}
                    >
                        Past
                    </p>
                    {inactive.map((entry) => (
                        <ProjectCard key={entry.teamMemberId} entry={entry} />
                    ))}
                </div>
            )}
        </div>
    );
}