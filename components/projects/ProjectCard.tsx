"use client";

import Link from "next/link";
import { useMemo } from "react";
import UserAvatar from "@/components/ui/UserAvatar";

// ─── TYPES ────────────────────────────────────────────────────────────────────
// Mirrors the new Prisma schema. Key changes from old schema:
//   lookingFor  (string)   → openRoles (string[])
//   timeToComplete         → estimatedDuration
//   complexityType         → removed
//   projectUrl             → liveUrl
//   featuresIncluded       → plannedFeatures / completedFeatures

export interface ProjectCardProject {
    id: string;
    title: string;
    description: string;
    tagline?: string | null;
    status: string;
    visibility?: string;
    difficulty: string;
    techStack: string[];
    projectType: string | null;
    domain: string | null;
    buildGoal: string | null;
    estimatedDuration: string | null;
    collaborationType: string;
    monetization: string | null;
    openRoles: string[];
    maxMembers: number | null;
    hiringOpen?: boolean;
    phase?: string | null;
    accentColor?: string | null;
    coverImage?: string | null;
    liveUrl?: string | null;
    repoUrl?: string | null;
    createdBy: string;
    createdAt: string;
    updatedAt?: string;
    _count: { applicants: number; teams: number };
    // Enriched — computed server-side
    ownerName?: string | null;
    ownerImage?: string | null;
    ownerUsername?: string | null;
    teamAvatars?: string[];
    milestoneProgress?: number | null;
    recentActivity?: string | null;
    isUrgent?: boolean;
    isTrending?: boolean;
    projectCategory?: string | null;
}

interface ProjectCardProps {
    project: ProjectCardProject;
    isOwner: boolean;
    currentUserId: string;
    isMember?: boolean;
    hasPending?: boolean;
}

// ─── CONFIG ───────────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
    OPEN: { label: "Open", color: "#22c55e", bg: "rgba(34,197,94,0.08)" },
    IN_PROGRESS: { label: "In Progress", color: "#378ADD", bg: "rgba(55,138,221,0.08)" },
    PAUSED: { label: "Paused", color: "#facc15", bg: "rgba(250,204,21,0.08)" },
    CLOSED: { label: "Closed", color: "#666", bg: "rgba(102,102,102,0.08)" },
    COMPLETED: { label: "Completed", color: "#86efac", bg: "rgba(134,239,172,0.08)" },
    ARCHIVED: { label: "Archived", color: "#666", bg: "rgba(102,102,102,0.08)" },
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
    web_dev: "#378ADD",
    ai_ml: "#a78bfa",
    game_dev: "#f472b6",
    cybersecurity: "#22c55e",
    devops: "#fb923c",
    mobile: "#38bdf8",
    data: "#facc15",
};

// Phase and status are architecturally separate:
//   status = operational state  (OPEN, PAUSED, COMPLETED…)
//   phase  = product maturity   (IDEA → LAUNCHED)
// Phase gets a distinct color ramp — not the same muted chip as difficulty.
const PHASE_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
    IDEA: { label: "Idea", color: "#94a3b8", bg: "rgba(148,163,184,0.08)" },
    PLANNING: { label: "Planning", color: "#60a5fa", bg: "rgba(96,165,250,0.08)" },
    BUILDING: { label: "Building", color: "#a78bfa", bg: "rgba(167,139,250,0.08)" },
    TESTING: { label: "Testing", color: "#fb923c", bg: "rgba(251,146,60,0.08)" },
    LAUNCHED: { label: "Launched", color: "#22c55e", bg: "rgba(34,197,94,0.08)" },
};

// ─── HELPERS ──────────────────────────────────────────────────────────────────

function getHealthLabel(p: ProjectCardProject): { dot: string; text: string } {
    const daysSince = p.updatedAt
        ? (Date.now() - new Date(p.updatedAt).getTime()) / 86400000
        : (Date.now() - new Date(p.createdAt).getTime()) / 86400000;

    if (p.status === "TERMINATED") return { dot: "#ef4444", text: "Terminated" };
    if (p.status === "ARCHIVED") return { dot: "#666", text: "Archived" };
    if (p.status === "COMPLETED") return { dot: "#86efac", text: "Completed" };
    if (p.status === "PAUSED") return { dot: "#facc15", text: "Paused" };
    if (p.status === "CLOSED") return { dot: "#666", text: "Closed" };
    if (daysSince < 1) return { dot: "#22c55e", text: "Active today" };
    if (daysSince < 7) return { dot: "#22c55e", text: "Active this week" };
    if (daysSince < 30) return { dot: "#facc15", text: "Stable" };
    return { dot: "#fb923c", text: "Inactive" };
}

function getCtaConfig(
    p: ProjectCardProject,
    isOwner: boolean,
    isMember: boolean,
    hasPending: boolean,
): { label: string; href: string; style: "primary" | "ghost" | "muted" | "pending" } {
    const href = `/projects/${p.id}`;
    if (isOwner) return { label: "Manage", href, style: "ghost" };
    if (isMember) return { label: "View project", href, style: "ghost" };
    if (hasPending) return { label: "Applied ✓", href, style: "pending" };
    if (["TERMINATED", "ARCHIVED", "CLOSED"].includes(p.status))
        return { label: "View archive", href, style: "muted" };
    if (p.status === "COMPLETED")
        return { label: "View project", href, style: "ghost" };
    const isFull = p.maxMembers !== null && p._count.teams >= p.maxMembers;
    if (isFull)
        return { label: "Slots full", href, style: "muted" };
    if (p.status === "OPEN" && p.hiringOpen !== false)
        return { label: "Apply to join", href, style: "primary" };
    return { label: "View project", href, style: "ghost" };
}


// SimpleAvatarStack — image-URL only, no user ID, so no link.
// Used on project cards where we only have avatar URLs, not full user data.
function SimpleAvatarStack({ avatars, filled, max }: { avatars: string[]; filled: number; max: number | null }) {
    const shown = avatars.slice(0, 4);
    const overflow = filled - shown.length;
    return (
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <div style={{ display: "flex", alignItems: "center" }}>
                {shown.length > 0 ? (
                    shown.map((src, i) => (
                        <div key={i} style={{ marginLeft: i === 0 ? 0 : -8, lineHeight: 0, flexShrink: 0 }}>
                            <img src={src} alt="Member"
                                style={{ width: 22, height: 22, minWidth: 22, minHeight: 22, borderRadius: "50%", objectFit: "cover", border: "1.5px solid var(--bg)", display: "block" }}
                            />
                        </div>
                    ))
                ) : filled > 0 ? (
                    <div style={{ width: 22, height: 22, borderRadius: "50%", background: "var(--surface2)", border: "1.5px solid var(--bg)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, color: "var(--muted)", fontWeight: 700 }}>
                        {filled}
                    </div>
                ) : null}
                {overflow > 0 && (
                    <div style={{ marginLeft: -8, width: 22, height: 22, minWidth: 22, minHeight: 22, borderRadius: "50%", background: "var(--surface2)", border: "1.5px solid var(--bg)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, color: "var(--muted)", fontWeight: 600, flexShrink: 0 }}>
                        +{overflow}
                    </div>
                )}
            </div>
            <span style={{ fontSize: 11, color: "var(--muted)" }}>
                {max !== null ? `${filled}/${max} members` : `${filled} member${filled !== 1 ? "s" : ""}`}
            </span>
        </div>
    );
}


// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────

export default function ProjectCard({
    project: p,
    isOwner,
    currentUserId,
    isMember = false,
    hasPending = false,
}: ProjectCardProps) {
    const health = useMemo(() => getHealthLabel(p), [p]);
    const cta = useMemo(() => getCtaConfig(p, isOwner, isMember, hasPending), [p, isOwner, isMember, hasPending]);
    const statusCfg = STATUS_CONFIG[p.status] ?? STATUS_CONFIG.OPEN;
    const categoryCfg = p.projectCategory ? CATEGORY_CONFIG[p.projectCategory] : null;

    const maxMembers = p.maxMembers ?? null;
    const filled = p._count.teams;
    const isFull = maxMembers !== null && filled >= maxMembers;
    const slotsLeft = maxMembers !== null ? maxMembers - filled : null;
    const isUrgent = !!(p.isUrgent && p.status === "OPEN" && !isFull);

    // Accent color: explicit > domain > category > default
    const accentHex =
        p.accentColor ||
        (p.domain ? DOMAIN_ACCENT[p.domain] : undefined) ||
        categoryCfg?.color ||
        "var(--accent)";

    const techVisible = p.techStack.slice(0, 4);
    const techExtra = p.techStack.length - techVisible.length;

    // Mission: prefer tagline, then first sentence of description
    const descSnippet = p.description.match(/^[^.!?\n]+[.!?]?/)?.[0]?.trim() ?? p.description;
    const mission = p.tagline
        ? (p.tagline.length <= 120 ? p.tagline : p.tagline.slice(0, 117) + "…")
        : (descSnippet.length <= 100 ? descSnippet : descSnippet.slice(0, 97) + "…");

    const progress = p.milestoneProgress ?? null;
    const teamAvatars = p.teamAvatars ?? [];

    const ctaBtnStyle: React.CSSProperties = {
        display: "inline-block", padding: "7px 14px", borderRadius: 7,
        fontSize: 12, fontWeight: 500, textDecoration: "none",
        flexShrink: 0, transition: "all 0.15s",
        ...(cta.style === "primary" ? { background: "var(--accent)", color: "var(--bg)", border: "0.5px solid var(--accent)" } : {}),
        ...(cta.style === "ghost" ? { background: "transparent", color: "var(--text)", border: "0.5px solid var(--border)" } : {}),
        ...(cta.style === "pending" ? { background: "transparent", color: "#22c55e", border: "0.5px solid rgba(34,197,94,0.35)" } : {}),
        ...(cta.style === "muted" ? { background: "transparent", color: "var(--muted)", border: "0.5px solid var(--border)", opacity: 0.7 } : {}),
    };

    return (
        <div
            style={{
                position: "relative",
                background: "var(--surface)",
                border: "0.5px solid var(--border)",
                borderRadius: 10,
                padding: "18px 16px 14px",
                display: "flex", flexDirection: "column", gap: 11,
                transition: "border-color 0.15s", cursor: "default",
                overflow: "hidden",
            }}
            className="card-hover"
        >
            {/* ── ACCENT STRIP ── */}
            <div style={{
                position: "absolute", top: 0, left: 0, right: 0, height: 2,
                background: `linear-gradient(90deg, ${accentHex}cc, ${accentHex}11)`,
                borderRadius: "10px 10px 0 0",
            }} />

            {/* ── ROW 1: Creator identity + status badges ── */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                {p.ownerName && (
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        {p.createdBy && p.ownerName ? (
                            <UserAvatar
                                userId={p.createdBy}
                                name={p.ownerName}
                                image={p.ownerImage}
                                size={20}
                                showTooltip
                            />
                        ) : null}
                        <span style={{ fontSize: 11, color: "var(--muted)" }}>
                            {p.ownerUsername ?? p.ownerName}
                        </span>
                    </div>
                )}
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginLeft: "auto", flexWrap: "wrap" }}>
                    {isUrgent && (
                        <span style={{
                            fontSize: 9, padding: "2px 7px", borderRadius: 20,
                            background: "rgba(251,146,60,0.12)", border: "0.5px solid rgba(251,146,60,0.4)",
                            color: "#fb923c", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em",
                        }}>⚡ Urgent</span>
                    )}
                    {p.isTrending && (
                        <span style={{
                            fontSize: 9, padding: "2px 7px", borderRadius: 20,
                            background: "rgba(244,114,182,0.1)", border: "0.5px solid rgba(244,114,182,0.35)",
                            color: "#f472b6", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em",
                        }}>↑ Trending</span>
                    )}
                    <span style={{
                        fontSize: 9, padding: "3px 8px", borderRadius: 20,
                        border: `0.5px solid ${statusCfg.color}33`,
                        color: statusCfg.color, background: statusCfg.bg,
                        fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", whiteSpace: "nowrap",
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
                    {categoryCfg && (
                        <span style={{
                            fontSize: 9, padding: "2px 7px", borderRadius: 4,
                            background: categoryCfg.bg, border: `0.5px solid ${categoryCfg.color}44`,
                            color: categoryCfg.color, fontWeight: 600, letterSpacing: "0.04em",
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

            {/* ── ROW 3: Health + meta chips ── */}
            <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                    <span style={{
                        width: 6, height: 6, borderRadius: "50%",
                        background: health.dot, flexShrink: 0, boxShadow: `0 0 6px ${health.dot}88`,
                    }} />
                    <span style={{ fontSize: 11, color: "var(--muted)" }}>{health.text}</span>
                </div>

                {p.recentActivity && (
                    <span style={{ fontSize: 11, color: "var(--muted)" }}>· {p.recentActivity}</span>
                )}

                {p.difficulty && (
                    <span style={{ fontSize: 10, padding: "2px 7px", borderRadius: 4, border: "0.5px solid var(--border)", color: "var(--muted)" }}>
                        {p.difficulty}
                    </span>
                )}

                {p.phase && (() => {
                    const pc = PHASE_CONFIG[p.phase] ?? { label: p.phase, color: "#94a3b8", bg: "rgba(148,163,184,0.08)" };
                    return (
                        <span style={{
                            fontSize: 9, padding: "2px 7px", borderRadius: 20,
                            border: `0.5px solid ${pc.color}44`,
                            color: pc.color, background: pc.bg,
                            fontWeight: 600, letterSpacing: "0.04em", whiteSpace: "nowrap",
                        }}>
                            {pc.label}
                        </span>
                    );
                })()}

                {isOwner && (
                    <span style={{ fontSize: 10, padding: "2px 7px", borderRadius: 4, border: "0.5px solid var(--border)", color: "var(--muted)" }}>
                        Your project
                    </span>
                )}
            </div>

            {/* ── ROW 4: Milestone progress bar ── */}
            {progress !== null && (
                <div>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                        <span style={{ fontSize: 10, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>Progress</span>
                        <span style={{ fontSize: 10, color: "var(--text)", fontWeight: 600 }}>{progress}%</span>
                    </div>
                    <div style={{ height: 3, background: "var(--surface2)", borderRadius: 2, overflow: "hidden" }}>
                        <div style={{
                            height: "100%", width: `${progress}%`,
                            background: progress >= 75 ? "#22c55e" : progress >= 40 ? "#378ADD" : accentHex,
                            borderRadius: 2, transition: "width 0.5s ease",
                        }} />
                    </div>
                </div>
            )}

            {/* ── ROW 5: Open roles ── */}
            {p.openRoles.length > 0 &&
                ["OPEN", "IN_PROGRESS"].includes(p.status) &&
                p.hiringOpen !== false && (
                    <div>
                        <p style={{ fontSize: 10, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6 }}>
                            Open roles
                            {isUrgent && slotsLeft !== null && (
                                <span style={{ color: "#fb923c", marginLeft: 6, textTransform: "none" }}>
                                    · {slotsLeft} slot{slotsLeft !== 1 ? "s" : ""} left
                                </span>
                            )}
                        </p>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
                            {p.openRoles.slice(0, 3).map(r => (
                                <span key={r} style={{
                                    fontSize: 11, padding: "3px 9px", borderRadius: 20,
                                    border: "0.5px solid rgba(55,138,221,0.3)",
                                    color: "#93c5fd", background: "rgba(55,138,221,0.06)",
                                }}>
                                    {r}
                                </span>
                            ))}
                            {p.openRoles.length > 3 && (
                                <span style={{ fontSize: 11, color: "var(--muted)", padding: "3px 0" }}>
                                    +{p.openRoles.length - 3} more
                                </span>
                            )}
                        </div>
                    </div>
                )}

            {/* ── ROW 6: Tech stack tags ── */}
            {techVisible.length > 0 && (
                <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
                    {techVisible.map(t => (
                        <span key={t} style={{
                            fontSize: 10, padding: "3px 8px", borderRadius: 5,
                            border: "0.5px solid var(--border)", color: "var(--muted)", background: "var(--surface2)",
                        }}>
                            {t}
                        </span>
                    ))}
                    {techExtra > 0 && (
                        <span style={{ fontSize: 10, color: "var(--muted)", padding: "3px 0" }}>+{techExtra} more</span>
                    )}
                </div>
            )}

            {/* ── ROW 7: Team avatars + stats + CTA ── */}
            <div style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                gap: 8, flexWrap: "wrap",
                paddingTop: 8, borderTop: "0.5px solid var(--border)",
            }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
                    <SimpleAvatarStack avatars={teamAvatars} filled={filled} max={maxMembers} />
                    <span style={{ fontSize: 11, color: "var(--muted)" }}>{p._count.applicants} applied</span>
                    {p.estimatedDuration && (
                        <span style={{ fontSize: 11, color: "var(--muted)" }}>
                            {p.estimatedDuration.replace(/_/g, " ")}
                        </span>
                    )}
                </div>
                <Link href={cta.href} style={ctaBtnStyle} className="cta-hover">
                    {cta.label} →
                </Link>
            </div>
        </div>
    );
}