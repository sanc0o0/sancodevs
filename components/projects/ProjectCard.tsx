"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo } from "react";

// ─── TYPES ────────────────────────────────────────────────────────────────────

export interface ProjectCardProject {
    id: string;
    title: string;
    description: string;
    status: string;
    difficulty: string;
    techStack: string[];
    projectType: string | null;
    domain: string | null;
    buildGoal: string | null;
    estimatedDuration: string | null;
    collaborationType: string;
    monetization: string | null;
    openRoles: string [];
    maxMembers: number | null;
    createdAt: string;
    updatedAt?: string;
    createdBy: string;
    _count: { applicants: number; teams: number };
    // enriched data
    ownerName?: string | null;
    ownerImage?: string | null;           // creator avatar URL
    teamAvatars?: string[];               // array of team member avatar URLs (up to 5)
    milestoneProgress?: number | null;    // 0–100
    recentActivity?: string | null;       // e.g. "3 tasks completed this week"
    isUrgent?: boolean;                   // urgent hiring flag
    isTrending?: boolean;                 // trending flag
    projectCategory?: string | null;      // "AI" | "Open Source" | "Startup" | "SaaS" | "Hackathon" | "Research"
    accentColor?: string | null;          // optional per-project accent hex
}

interface ProjectCardProps {
    project: ProjectCardProject;
    isOwner: boolean;
    isMember: boolean;
    hasPending?: boolean;
}

// ─── CONFIG ───────────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
    OPEN: { label: "Open", color: "#22c55e", bg: "rgba(34,197,94,0.08)" },
    IN_PROGRESS: { label: "In Progress", color: "#378ADD", bg: "rgba(55,138,221,0.08)" },
    CLOSED: { label: "Closed", color: "#666", bg: "rgba(102,102,102,0.08)" },
    COMPLETED: { label: "Completed", color: "#86efac", bg: "rgba(134,239,172,0.08)" },
    TERMINATED: { label: "Terminated", color: "#e24b4a", bg: "rgba(226,75,74,0.08)" },
};

const CATEGORY_CONFIG: Record<string, { label: string; color: string; bg: string; icon: string }> = {
    AI: { label: "AI", color: "#a78bfa", bg: "rgba(167,139,250,0.1)", icon: "✦" },
    "Open Source": { label: "Open Source", color: "#34d399", bg: "rgba(52,211,153,0.1)", icon: "⬡" },
    Startup: { label: "Startup", color: "#fb923c", bg: "rgba(251,146,60,0.1)", icon: "◈" },
    SaaS: { label: "SaaS", color: "#38bdf8", bg: "rgba(56,189,248,0.1)", icon: "◇" },
    Hackathon: { label: "Hackathon", color: "#f472b6", bg: "rgba(244,114,182,0.1)", icon: "⚡" },
    Research: { label: "Research", color: "#94a3b8", bg: "rgba(148,163,184,0.1)", icon: "◉" },
};

const DOMAIN_ACCENT: Record<string, string> = {
    Education: "#378ADD",
    Fintech: "#22c55e",
    Health: "#f472b6",
    "Social Media": "#a78bfa",
    "E-commerce": "#fb923c",
    Productivity: "#38bdf8",
    "Developer Tools": "#facc15",
    "AI Tools": "#a78bfa",
    Gaming: "#f472b6",
    "Content / Blogging": "#94a3b8",
};

// ─── HELPERS ──────────────────────────────────────────────────────────────────

function getHealthLabel(p: ProjectCardProject): { dot: string; text: string } {
    const daysSince = p.updatedAt
        ? (Date.now() - new Date(p.updatedAt).getTime()) / 86400000
        : (Date.now() - new Date(p.createdAt).getTime()) / 86400000;

    if (p.status === "TERMINATED") return { dot: "#ef4444", text: "Terminated" };
    if (p.status === "COMPLETED") return { dot: "#86efac", text: "Completed" };
    if (p.status === "CLOSED") return { dot: "#666", text: "Closed" };
    if (daysSince < 1) return { dot: "#22c55e", text: "Active today" };
    if (daysSince < 7) return { dot: "#22c55e", text: "Active this week" };
    if (daysSince < 30) return { dot: "#facc15", text: "Stable" };
    return { dot: "#fb923c", text: "Inactive" };
}

function getCtaConfig(p: ProjectCardProject, isOwner: boolean) {
    if (isOwner) return { label: "Manage", href: `/projects/${p.id}`, style: "ghost" as const };
    if (p.status === "TERMINATED" || p.status === "CLOSED")
        return { label: "View archive", href: `/projects/${p.id}`, style: "muted" as const };
    if (p.status === "COMPLETED")
        return { label: "View project", href: `/projects/${p.id}`, style: "ghost" as const };
    const max = p.maxMembers ?? Infinity;
    const filled = p._count.teams;
    if (filled >= max)
        return { label: "Slots full", href: `/projects/${p.id}`, style: "muted" as const };
    if (p.status === "OPEN")
        return { label: "Apply to join", href: `/projects/${p.id}`, style: "primary" as const };
    return { label: "View project", href: `/projects/${p.id}`, style: "ghost" as const };
}

function parseRoles(openRoles: string | null): string[] {
    if (!openRoles) return [];
    return openRoles
        .split(/[,\n•·\-|\/]/)
        .map(s => s.trim())
        .filter(s => s.length > 0 && s.length < 40)
        .slice(0, 3);
}

/** Generates a deterministic HSL color from a string (for avatar fallbacks) */
function stringToColor(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
    return `hsl(${hash % 360}, 45%, 45%)`;
}

function initials(name: string): string {
    return name
        .split(" ")
        .map(w => w[0])
        .slice(0, 2)
        .join("")
        .toUpperCase();
}

// ─── SUB-COMPONENTS ───────────────────────────────────────────────────────────

function Avatar({ src, name, size = 22 }: { src?: string | null; name: string; size?: number }) {
    if (src) {
        return (
            <Image
                src={src}
                alt={name}
                width={size}
                height={size}
                style={{
                    borderRadius: "50%",
                    objectFit: "cover",
                    border: "1.5px solid var(--bg)",
                    flexShrink: 0,
                    display: "block",
                }}
            />
        );
    }
    return (
        <div style={{
            width: size, height: size,
            borderRadius: "50%",
            background: stringToColor(name),
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: size * 0.38,
            fontWeight: 700,
            color: "#fff",
            border: "1.5px solid var(--bg)",
            flexShrink: 0,
            letterSpacing: "-0.02em",
        }}>
            {initials(name)}
        </div>
    );
}

function TeamAvatarStack({ avatars, names, filled, max }: {
    avatars: string[];
    names: string[];
    filled: number;
    max: number | null;
}) {
    const shown = avatars.slice(0, 4);
    const overflow = filled - shown.length;

    return (
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            {/* Stacked avatars */}
            <div style={{ display: "flex" }}>
                {shown.map((src, i) => (
                    <div key={i} style={{ marginLeft: i === 0 ? 0 : -7 }}>
                        <Avatar src={src} name={names[i] ?? "Member"} size={22} />
                    </div>
                ))}
                {overflow > 0 && (
                    <div style={{
                        marginLeft: -7,
                        width: 22, height: 22,
                        borderRadius: "50%",
                        background: "var(--surface2)",
                        border: "1.5px solid var(--bg)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: 9, color: "var(--muted)", fontWeight: 600,
                    }}>
                        +{overflow}
                    </div>
                )}
            </div>

            {/* Slot text */}
            <span style={{ fontSize: 11, color: "var(--muted)" }}>
                {max !== null
                    ? `${filled}/${max} members`
                    : `${filled} member${filled !== 1 ? "s" : ""}`
                }
            </span>
        </div>
    );
}

// ─── ACCENT STRIP (top colored line based on domain/category) ─────────────────

function AccentStrip({ color }: { color: string }) {
    return (
        <div style={{
            position: "absolute",
            top: 0, left: 0, right: 0,
            height: 2,
            background: `linear-gradient(90deg, ${color}cc, ${color}22)`,
            borderRadius: "10px 10px 0 0",
        }} />
    );
}

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────

export default function ProjectCard({ project: p, isOwner, isMember = false, hasPending = false }: ProjectCardProps) {
    const health = useMemo(() => getHealthLabel(p), [p]);
    const cta = useMemo(() => getCtaConfig(p, isOwner), [p, isOwner]);
    const roles = useMemo(() => p.openRoles, [p.openRoles]);
    const statusCfg = STATUS_CONFIG[p.status] ?? STATUS_CONFIG.OPEN;
    const categoryCfg = p.projectCategory ? CATEGORY_CONFIG[p.projectCategory] : null;

    const maxMembers = p.maxMembers ?? null;
    const filled = p._count.teams;
    const isFull = maxMembers !== null && filled >= maxMembers;

    const techVisible = p.techStack.slice(0, 4);
    const techExtra = p.techStack.length - techVisible.length;

    // Derive accent color: explicit > domain > category > default
    const accent =
        p.accentColor ||
        (p.domain ? DOMAIN_ACCENT[p.domain] : undefined) ||
        categoryCfg?.color ||
        "var(--accent)";

    // Mission snippet
    const firstSentence = p.description.match(/^[^.!?\n]+[.!?]?/)?.[0]?.trim() ?? p.description;
    const mission = firstSentence.length <= 100 ? firstSentence : firstSentence.slice(0, 97) + "…";

    const progress = p.milestoneProgress ?? null;
    const teamAvatars = p.teamAvatars ?? [];

    const slotsLeft = maxMembers !== null ? maxMembers - filled : null;
    const isUrgent = p.isUrgent && p.status === "OPEN" && !isFull;

    return (
        <div
            style={{
                position: "relative",
                background: "var(--surface)",
                border: "0.5px solid var(--border)",
                borderRadius: 10,
                padding: "18px 16px 14px",
                display: "flex",
                flexDirection: "column",
                gap: 11,
                transition: "border-color 0.15s, transform 0.15s",
                cursor: "default",
                overflow: "hidden",
            }}
            className="card-hover"
        >
            {/* ── ACCENT STRIP ── */}
            <AccentStrip color={typeof accent === "string" && accent.startsWith("var") ? "#378ADD" : accent as string} />

            {/* ── ROW 1: Creator identity + status ── */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                {/* Creator */}
                {p.ownerName && (
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <Avatar src={p.ownerImage} name={p.ownerName} size={20} />
                        <span style={{ fontSize: 11, color: "var(--muted)" }}>{p.ownerName}</span>
                    </div>
                )}

                <div style={{ display: "flex", alignItems: "center", gap: 6, marginLeft: "auto" }}>
                    {/* Urgent badge */}
                    {isUrgent && (
                        <span style={{
                            fontSize: 9, padding: "2px 7px", borderRadius: 20,
                            background: "rgba(251,146,60,0.12)",
                            border: "0.5px solid rgba(251,146,60,0.4)",
                            color: "#fb923c",
                            fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em",
                        }}>
                            ⚡ Urgent
                        </span>
                    )}

                    {/* Trending badge */}
                    {p.isTrending && (
                        <span style={{
                            fontSize: 9, padding: "2px 7px", borderRadius: 20,
                            background: "rgba(244,114,182,0.1)",
                            border: "0.5px solid rgba(244,114,182,0.35)",
                            color: "#f472b6",
                            fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em",
                        }}>
                            ↑ Trending
                        </span>
                    )}

                    {/* Status badge */}
                    <span style={{
                        fontSize: 9, padding: "3px 8px", borderRadius: 20,
                        border: `0.5px solid ${statusCfg.color}33`,
                        color: statusCfg.color, background: statusCfg.bg,
                        fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em",
                        whiteSpace: "nowrap",
                    }}>
                        {statusCfg.label}
                    </span>
                </div>
            </div>

            {/* ── ROW 2: Title + category ── */}
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                <div style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
                    <Link href={`/projects/${p.id}`} style={{ textDecoration: "none", flex: 1, minWidth: 0 }}>
                        <h3 style={{
                            fontSize: 14, fontWeight: 600, color: "var(--text)",
                            margin: 0, lineHeight: 1.3,
                            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                        }}>
                            {p.title}
                        </h3>
                    </Link>

                    {/* Category badge */}
                    {categoryCfg && (
                        <span style={{
                            fontSize: 9, padding: "2px 7px", borderRadius: 4,
                            background: categoryCfg.bg,
                            border: `0.5px solid ${categoryCfg.color}44`,
                            color: categoryCfg.color,
                            fontWeight: 600, letterSpacing: "0.04em",
                            flexShrink: 0, whiteSpace: "nowrap",
                        }}>
                            {categoryCfg.icon} {categoryCfg.label}
                        </span>
                    )}
                </div>

                <p style={{ fontSize: 12, color: "var(--muted)", margin: 0, lineHeight: 1.5 }}>
                    {mission}
                </p>
            </div>

            {/* ── ROW 3: Health + meta ── */}
            <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                    <span style={{
                        width: 6, height: 6, borderRadius: "50%",
                        background: health.dot, flexShrink: 0,
                        boxShadow: `0 0 6px ${health.dot}88`,
                    }} />
                    <span style={{ fontSize: 11, color: "var(--muted)" }}>{health.text}</span>
                </div>

                {p.recentActivity && (
                    <span style={{ fontSize: 11, color: "var(--muted)" }}>· {p.recentActivity}</span>
                )}

                {p.difficulty && (
                    <span style={{
                        fontSize: 10, padding: "2px 7px", borderRadius: 4,
                        border: "0.5px solid var(--border)", color: "var(--muted)",
                    }}>
                        {p.difficulty}
                    </span>
                )}

                {isOwner && (
                    <span style={{
                        fontSize: 10, padding: "2px 7px", borderRadius: 4,
                        border: "0.5px solid var(--border)", color: "var(--muted)",
                    }}>
                        Your project
                    </span>
                )}
            </div>

            {/* ── ROW 4: Progress bar ── */}
            {progress !== null && (
                <div>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                        <span style={{ fontSize: 10, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                            Progress
                        </span>
                        <span style={{ fontSize: 10, color: "var(--text)", fontWeight: 600 }}>{progress}%</span>
                    </div>
                    <div style={{ height: 3, background: "var(--surface2)", borderRadius: 2, overflow: "hidden" }}>
                        <div style={{
                            height: "100%",
                            width: `${progress}%`,
                            background: progress >= 75
                                ? "#22c55e"
                                : progress >= 40
                                    ? "#378ADD"
                                    : typeof accent === "string" && accent.startsWith("#") ? accent : "#378ADD",
                            borderRadius: 2,
                            transition: "width 0.5s ease",
                        }} />
                    </div>
                </div>
            )}

            {/* ── ROW 5: Open roles ── */}
            {roles.length > 0 && p.status === "OPEN" && (
                <div>
                    <p style={{
                        fontSize: 10, color: "var(--muted)",
                        textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6,
                    }}>
                        Open roles
                        {isUrgent && slotsLeft !== null && (
                            <span style={{ color: "#fb923c", marginLeft: 6 }}>
                                · {slotsLeft} slot{slotsLeft !== 1 ? "s" : ""} left
                            </span>
                        )}
                    </p>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
                        {roles.map(r => (
                            <span key={r} style={{
                                fontSize: 11, padding: "3px 9px", borderRadius: 20,
                                border: "0.5px solid rgba(55,138,221,0.3)",
                                color: "#93c5fd", background: "rgba(55,138,221,0.06)",
                            }}>
                                {r}
                            </span>
                        ))}
                    </div>
                </div>
            )}

            {/* ── ROW 6: Tech stack ── */}
            {techVisible.length > 0 && (
                <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
                    {techVisible.map(t => (
                        <span key={t} style={{
                            fontSize: 10, padding: "3px 8px", borderRadius: 5,
                            border: "0.5px solid var(--border)",
                            color: "var(--muted)", background: "var(--surface2)",
                        }}>
                            {t}
                        </span>
                    ))}
                    {techExtra > 0 && (
                        <span style={{ fontSize: 10, color: "var(--muted)", padding: "3px 0" }}>
                            +{techExtra} more
                        </span>
                    )}
                </div>
            )}

            {/* ── ROW 7: Team avatars + CTA ── */}
            <div style={{
                display: "flex", alignItems: "center",
                justifyContent: "space-between",
                gap: 8, flexWrap: "wrap",
                paddingTop: 2,
                borderTop: "0.5px solid var(--border)",
                marginTop: 1,
            }}>
                {/* Left: team presence + applicants + time */}
                <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
                    <TeamAvatarStack
                        avatars={teamAvatars}
                        names={Array(filled).fill("Member")}
                        filled={filled}
                        max={maxMembers}
                    />

                    <span style={{ fontSize: 11, color: "var(--muted)" }}>
                        {p._count.applicants} applied
                    </span>

                    {p.estimatedDuration && (
                        <span style={{ fontSize: 11, color: "var(--muted)" }}>{p.estimatedDuration}</span>
                    )}
                </div>

                {/* CTA button */}
                <Link
                    href={cta.href}
                    style={{
                        display: "inline-block",
                        padding: "7px 14px",
                        borderRadius: 7,
                        fontSize: 12,
                        fontWeight: 500,
                        textDecoration: "none",
                        flexShrink: 0,
                        transition: "all 0.15s",
                        ...(cta.style === "primary" ? {
                            background: "var(--accent)",
                            color: "var(--bg)",
                            border: "0.5px solid var(--accent)",
                        } : cta.style === "ghost" ? {
                            background: "transparent",
                            color: "var(--text)",
                            border: "0.5px solid var(--border)",
                        } : {
                            background: "transparent",
                            color: "var(--muted)",
                            border: "0.5px solid var(--border)",
                            opacity: 0.7,
                        }),
                    }}
                    className="cta-hover"
                >
                    {cta.label} →
                </Link>
            </div>
        </div>
    );
}