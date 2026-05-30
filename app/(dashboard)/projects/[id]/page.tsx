// app/(dashboard)/projects/[id]/page.tsx

import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import JoinRequestButton from "./JoinRequestButton";
import ProjectStatusControl from "../ProjectStatusControl";
import CopyButton from "./CopyButton";
import AccordionSections from "./AccordionSections";
import MobileActions from "./MobileActions";
import SaveProjectButton from "./SaveProjectButton";

// ─── Config ───────────────────────────────────────────────────────────────────

const STATUS_CFG: Record<string, { color: string; bg: string; label: string }> = {
    OPEN: { color: "#22c55e", bg: "rgba(34,197,94,0.08)", label: "Open" },
    IN_PROGRESS: { color: "#378ADD", bg: "rgba(55,138,221,0.08)", label: "In Progress" },
    PAUSED: { color: "#facc15", bg: "rgba(250,204,21,0.08)", label: "Paused" },
    COMPLETED: { color: "#86efac", bg: "rgba(134,239,172,0.08)", label: "Completed" },
    ARCHIVED: { color: "#666", bg: "rgba(102,102,102,0.08)", label: "Archived" },
    TERMINATED: { color: "#e24b4a", bg: "rgba(226,75,74,0.08)", label: "Terminated" },
};

const PHASE_CFG: Record<string, { color: string; bg: string; label: string; icon: string }> = {
    IDEA: { color: "#94a3b8", bg: "rgba(148,163,184,0.08)", label: "Idea", icon: "◎" },
    PLANNING: { color: "#60a5fa", bg: "rgba(96,165,250,0.08)", label: "Planning", icon: "◈" },
    BUILDING: { color: "#a78bfa", bg: "rgba(167,139,250,0.08)", label: "Building", icon: "◆" },
    TESTING: { color: "#fb923c", bg: "rgba(251,146,60,0.08)", label: "Testing", icon: "◉" },
    LAUNCHED: { color: "#22c55e", bg: "rgba(34,197,94,0.08)", label: "Launched", icon: "✦" },
};

const CATEGORY_CFG: Record<string, { color: string; bg: string; icon: string }> = {
    AI: { color: "#a78bfa", bg: "rgba(167,139,250,0.1)", icon: "✦" },
    "Open Source": { color: "#34d399", bg: "rgba(52,211,153,0.1)", icon: "⬡" },
    Startup: { color: "#fb923c", bg: "rgba(251,146,60,0.1)", icon: "◈" },
    SaaS: { color: "#38bdf8", bg: "rgba(56,189,248,0.1)", icon: "◇" },
    Hackathon: { color: "#f472b6", bg: "rgba(244,114,182,0.1)", icon: "⚡" },
    Research: { color: "#94a3b8", bg: "rgba(148,163,184,0.1)", icon: "◉" },
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

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function ProjectDetailPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const session = await getServerSession(authOptions);
    if (!session) redirect("/login");

    // Resolve real DB viewer by email — OAuth safe
    const viewer = await prisma.user.findUnique({
        where: { email: session.user.email! },
        select: { id: true },
    });
    if (!viewer) redirect("/login");

    const { id } = await params;

    // Parallel fetch: project + saved status
    const [project, savedRecord] = await Promise.all([
        prisma.project.findUnique({
            where: { id },
            include: {
                owner: {
                    select: { id: true, username: true, name: true, image: true },
                },
                applicants: {
                    include: {
                        user: { select: { id: true, name: true, username: true, email: true, image: true } },
                    },
                    orderBy: { createdAt: "desc" },
                },
                teams: {
                    where: { active: true },
                    include: {
                        user: { select: { id: true, name: true, username: true, image: true } },
                    },
                    orderBy: { joinedAt: "asc" },
                },
                milestones: {
                    orderBy: { order: "asc" },
                    take: 6,
                },
                updates: {
                    orderBy: { createdAt: "desc" },
                    take: 5,
                },
                analytics: {
                    select: { views: true },
                },
            },
        }),
        prisma.savedProject.findUnique({
            where: { userId_projectId: { userId: viewer.id, projectId: id } },
            select: { id: true },
        }),
    ]);

    if (!project) notFound();

    const isOwner = project.createdBy === viewer.id;
    const isMember = project.teams.some(t => t.userId === viewer.id);
    const hasApplied = project.applicants.some(a => a.userId === viewer.id);
    const isInsider = isOwner || isMember;
    const initialSaved = !!savedRecord;

    const statusCfg = STATUS_CFG[project.status] ?? STATUS_CFG.OPEN;
    const phaseCfg = PHASE_CFG[project.phase] ?? null;
    const categoryCfg = project.projectType ? CATEGORY_CFG[project.projectType] : null;
    const accentHex = project.accentColor
        ?? (project.domain ? DOMAIN_ACCENT[project.domain] : null)
        ?? categoryCfg?.color
        ?? "#378ADD";

    const milestoneProgress = project.milestones.length > 0
        ? Math.round(project.milestones.reduce((s, m) => s + m.progress, 0) / project.milestones.length)
        : null;

    const pendingCount = project.applicants.filter(a => a.status === "PENDING").length;
    const daysSinceUpdate = (Date.now() - new Date(project.updatedAt).getTime()) / 86400000;

    return (
        <>
            <style>{`
                .pd-back:hover     { color: var(--text) !important; }
                .pd-ext-link:hover { border-color: var(--accent) !important; color: var(--text) !important; }
                .pd-tag:hover      { border-color: var(--accent) !important; color: var(--text) !important; }
                .pd-comm:hover     { border-color: var(--muted) !important; }
                .pd-member:hover   { border-color: var(--accent) !important; }
                @media (max-width: 768px) {
                    .pd-desktop-only { display: none !important; }
                    .pd-layout       { flex-direction: column !important; }
                    .pd-sidebar      { width: 100% !important; position: static !important; }
                }
                @media (min-width: 769px) {
                    .pd-mobile-only { display: none !important; }
                }
            `}</style>

            <div style={{ width: "100%", paddingBottom: 60 }}>

                {/* ── BANNER ── */}
                {project.coverImage ? (
                    <div style={{ position: "relative", width: "100%", height: 250, overflow: "hidden" }}>
                        <Image
                            src={project.coverImage} alt={project.title}
                            fill style={{ objectFit: "cover" }} priority sizes="100vw"
                        />
                        <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 80, background: "linear-gradient(to top, var(--bg), transparent)" }} />
                        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: `linear-gradient(90deg, ${accentHex}ee, ${accentHex}22)` }} />
                    </div>
                ) : (
                    <div style={{ height: 3, background: `linear-gradient(90deg, ${accentHex}ee, ${accentHex}22)` }} />
                )}

                <div style={{ padding: "18px 24px 0", margin: "0 auto" }}>

                    {/* ── TOP NAV ── */}
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, marginBottom: 20, flexWrap: "wrap" }}>
                        <Link
                            href="/projects"
                            className="pd-back"
                            style={{ fontSize: 12, color: "var(--muted)", textDecoration: "none", display: "flex", alignItems: "center", gap: 5, transition: "color 0.15s" }}
                        >
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6" /></svg>
                            Projects
                        </Link>

                        {/* Desktop actions */}
                        <div className="pd-desktop-only" style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            {isInsider && (
                                <Link href={`/projects/${project.id}/board`} className="pd-ext-link" style={{
                                    padding: "6px 14px", borderRadius: 8, fontSize: 12,
                                    border: "0.5px solid var(--border)", color: "var(--muted)",
                                    textDecoration: "none", transition: "all 0.15s",
                                }}>
                                    Task board →
                                </Link>
                            )}
                            {project.liveUrl && (
                                <a href={project.liveUrl} target="_blank" rel="noopener noreferrer" className="pd-ext-link" style={{
                                    padding: "6px 14px", borderRadius: 8, fontSize: 12,
                                    border: "0.5px solid var(--border)", color: "var(--muted)",
                                    textDecoration: "none", transition: "all 0.15s",
                                }}>↗ Live</a>
                            )}
                            {project.repoUrl && (
                                <a href={project.repoUrl} target="_blank" rel="noopener noreferrer" className="pd-ext-link" style={{
                                    padding: "6px 14px", borderRadius: 8, fontSize: 12,
                                    border: "0.5px solid var(--border)", color: "var(--muted)",
                                    textDecoration: "none", transition: "all 0.15s",
                                }}>↗ Repo</a>
                            )}

                            {/* Save button — visible to everyone, sits next to other actions */}
                            <SaveProjectButton
                                projectId={project.id}
                                initialSaved={initialSaved}
                            />

                            {isOwner && (
                                <ProjectStatusControl projectId={project.id} currentStatus={project.status} />
                            )}
                        </div>

                        {/* Mobile: kebab menu */}
                        <div className="pd-mobile-only">
                            <MobileActions
                                projectId={project.id}
                                isOwner={isOwner}
                                isInsider={isInsider}
                                liveUrl={project.liveUrl}
                                repoUrl={project.repoUrl}
                                currentStatus={project.status}
                                initialSaved={initialSaved}
                            />
                        </div>
                    </div>

                    {/* ── HEADER ── */}
                    <div style={{ marginBottom: 22 }}>
                        {/* Owner row */}
                        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                            <div style={{ width: 24, height: 24, borderRadius: "50%", overflow: "hidden", border: "1.5px solid var(--border)", background: "var(--surface2)", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                                {project.owner.image
                                    ? <Image src={project.owner.image} alt={project.owner.username} width={24} height={24} style={{ objectFit: "cover", width: "100%", height: "100%" }} />
                                    : <span style={{ fontSize: 10, fontWeight: 700, color: "var(--text)" }}>{project.owner.username.charAt(0).toUpperCase()}</span>
                                }
                            </div>
                            <Link
                                href={`/user/${project.owner.username}`}
                                style={{ fontSize: 11, color: "var(--muted)", textDecoration: "none", transition: "color 0.15s" }}
                                className="pd-back"
                            >
                                @{project.owner.username}
                            </Link>
                            {isOwner && (
                                <span style={{ fontSize: 9, padding: "1px 7px", borderRadius: 10, background: "rgba(55,138,221,0.1)", color: "#378ADD", border: "0.5px solid rgba(55,138,221,0.25)" }}>
                                    Your project
                                </span>
                            )}
                        </div>

                        {/* Title + badges */}
                        <div style={{ display: "flex", alignItems: "flex-start", gap: 10, flexWrap: "wrap", marginBottom: 8 }}>
                            <h1 style={{ fontSize: 22, fontWeight: 600, color: "var(--text)", margin: 0, lineHeight: 1.2, flex: 1, minWidth: 200 }}>
                                {project.title}
                            </h1>
                            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
                                <span style={{
                                    fontSize: 9, padding: "3px 9px", borderRadius: 20, fontWeight: 700,
                                    textTransform: "uppercase", letterSpacing: "0.06em",
                                    color: statusCfg.color, background: statusCfg.bg,
                                    border: `0.5px solid ${statusCfg.color}44`,
                                }}>{statusCfg.label}</span>
                                {phaseCfg && (
                                    <span style={{
                                        fontSize: 9, padding: "3px 9px", borderRadius: 20, fontWeight: 600,
                                        color: phaseCfg.color, background: phaseCfg.bg,
                                        border: `0.5px solid ${phaseCfg.color}44`,
                                    }}>{phaseCfg.icon} {phaseCfg.label}</span>
                                )}
                                {categoryCfg && project.projectType && (
                                    <span style={{
                                        fontSize: 9, padding: "3px 9px", borderRadius: 20, fontWeight: 600,
                                        color: categoryCfg.color, background: categoryCfg.bg,
                                        border: `0.5px solid ${categoryCfg.color}44`,
                                    }}>{categoryCfg.icon} {project.projectType}</span>
                                )}
                            </div>
                        </div>

                        {project.tagline && (
                            <p style={{ fontSize: 14, color: "var(--muted)", margin: "0 0 8px", lineHeight: 1.5 }}>
                                {project.tagline}
                            </p>
                        )}

                        {/* Meta chips */}
                        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                            <span style={{ fontSize: 11, color: "var(--muted)" }}>
                                {new Date(project.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                            </span>
                            {project.domain && (
                                <span style={{ fontSize: 11, color: "var(--muted)", textTransform: "capitalize" }}>
                                    · {project.domain.replace(/_/g, " ")}
                                </span>
                            )}
                            {project.difficulty && (
                                <span style={{ fontSize: 10, padding: "2px 7px", borderRadius: 4, border: "0.5px solid var(--border)", color: "var(--muted)" }}>
                                    {project.difficulty}
                                </span>
                            )}
                            {project.estimatedDuration && (
                                <span style={{ fontSize: 10, padding: "2px 7px", borderRadius: 4, border: "0.5px solid var(--border)", color: "var(--muted)" }}>
                                    {project.estimatedDuration.replace(/_/g, " ")}
                                </span>
                            )}
                        </div>
                    </div>

                    {/* ── BODY ── */}
                    <div className="pd-layout" style={{ display: "flex", gap: 20, alignItems: "flex-start" }}>

                        {/* ══ MAIN ══ */}
                        <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 14 }}>

                            {/* About */}
                            <Card label="About">
                                <p style={{ fontSize: 13, color: "var(--muted)", lineHeight: 1.7, margin: 0 }}>{project.description}</p>
                                {project.vision && (
                                    <Divider>
                                        <p style={{ fontSize: 10, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 6 }}>Vision</p>
                                        <p style={{ fontSize: 12, color: "var(--muted)", lineHeight: 1.6, margin: 0, fontStyle: "italic" }}>{project.vision}</p>
                                    </Divider>
                                )}
                                {project.buildGoal && (
                                    <Divider>
                                        <p style={{ fontSize: 10, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 6 }}>Build goal</p>
                                        <p style={{ fontSize: 12, color: "var(--text)", lineHeight: 1.6, margin: 0 }}>{project.buildGoal}</p>
                                    </Divider>
                                )}
                            </Card>

                            {/* What's happening */}
                            <ActivitySection
                                updates={project.updates}
                                milestones={project.milestones}
                                milestoneProgress={milestoneProgress}
                                daysSinceUpdate={daysSinceUpdate}
                                accentHex={accentHex}
                                isInsider={isInsider}
                            />

                            {/* Tech stack */}
                            {project.techStack.length > 0 && (
                                <Card label="Tech stack">
                                    <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                                        {project.techStack.map(t => (
                                            <span key={t} className="pd-tag" style={{
                                                fontSize: 11, padding: "4px 10px", borderRadius: 6,
                                                border: "0.5px solid var(--border)", color: "var(--muted)", background: "var(--surface2)",
                                                transition: "all 0.12s", cursor: "default",
                                            }}>{t}</span>
                                        ))}
                                    </div>
                                </Card>
                            )}

                            {/* Open roles */}
                            {project.openRoles.length > 0 && project.hiringOpen && (
                                <Card label={`Open roles · ${project.openRoles.length}`}>
                                    <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
                                        {project.openRoles.map(r => (
                                            <span key={r} style={{
                                                fontSize: 12, padding: "5px 12px", borderRadius: 20,
                                                border: "0.5px solid rgba(55,138,221,0.3)",
                                                color: "#93c5fd", background: "rgba(55,138,221,0.06)",
                                            }}>{r}</span>
                                        ))}
                                    </div>
                                    {project.contributorExpectations && (
                                        <p style={{ fontSize: 12, color: "var(--muted)", marginTop: 10, lineHeight: 1.55 }}>
                                            {project.contributorExpectations}
                                        </p>
                                    )}
                                </Card>
                            )}

                            {/* Accordion: team + join requests */}
                            <AccordionSections
                                teams={project.teams}
                                isOwner={isOwner}
                                initialApplicants={project.applicants}
                                projectId={project.id}
                                projectTitle={project.title}
                            />

                            {/* Community */}
                            {project.communityGroupId && (
                                <Link href={`/community/${project.communityGroupId}`} className="pd-comm" style={{
                                    display: "flex", alignItems: "center", justifyContent: "space-between",
                                    padding: "14px 16px", borderRadius: 10,
                                    border: "0.5px solid var(--border)", background: "var(--surface)",
                                    textDecoration: "none", transition: "border-color 0.15s",
                                }}>
                                    <div>
                                        <p style={{ fontSize: 13, fontWeight: 500, color: "var(--text)", margin: 0, marginBottom: 2 }}>Project community</p>
                                        <p style={{ fontSize: 11, color: "var(--muted)", margin: 0 }}>Open group chat →</p>
                                    </div>
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--muted)" strokeWidth="1.5">
                                        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                                    </svg>
                                </Link>
                            )}

                            {/* Member badge */}
                            {isMember && !isOwner && (
                                <div className="pd-member" style={{
                                    display: "flex", alignItems: "center", gap: 10,
                                    padding: "12px 16px", borderRadius: 10,
                                    border: "0.5px solid rgba(34,197,94,0.25)", background: "rgba(34,197,94,0.05)",
                                    transition: "border-color 0.15s",
                                }}>
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12" /></svg>
                                    <span style={{ fontSize: 12, color: "#22c55e", fontWeight: 500 }}>You&apos;re a team member</span>
                                    <Link href={`/projects/${project.id}/board`} style={{ fontSize: 12, color: "var(--accent)", textDecoration: "none", marginLeft: "auto" }}>
                                        View board →
                                    </Link>
                                </div>
                            )}

                            {/* Join CTA */}
                            {!isOwner && !isMember && (
                                <div style={{ padding: "18px 16px", borderRadius: 10, border: "0.5px solid var(--border)", background: "var(--surface)" }}>
                                    {project.status === "OPEN" && project.hiringOpen ? (
                                        <>
                                            <p style={{ fontSize: 14, fontWeight: 500, color: "var(--text)", margin: "0 0 4px" }}>
                                                {hasApplied ? "Application sent" : "Join this project"}
                                            </p>
                                            <p style={{ fontSize: 12, color: "var(--muted)", lineHeight: 1.5, margin: "0 0 12px" }}>
                                                {hasApplied
                                                    ? "Your request is pending review by the project owner."
                                                    : "Send a message to the owner explaining what you bring."}
                                            </p>
                                            {!hasApplied
                                                ? <JoinRequestButton projectId={project.id} projectTitle={project.title} />
                                                : (
                                                    <div style={{ padding: "10px 14px", borderRadius: 8, border: "0.5px solid var(--border)", background: "var(--surface2)", textAlign: "center", fontSize: 12, color: "var(--muted)" }}>
                                                        Pending review ···
                                                    </div>
                                                )
                                            }
                                        </>
                                    ) : (
                                        <div style={{ textAlign: "center", padding: "6px 0" }}>
                                            <p style={{ fontSize: 13, fontWeight: 500, color: "var(--muted)", margin: "0 0 4px" }}>Not accepting members</p>
                                            <p style={{ fontSize: 12, color: "var(--muted)", margin: 0 }}>
                                                This project is currently {project.status.toLowerCase()} and not accepting contributors.
                                            </p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* ══ SIDEBAR ══ */}
                        <div className="pd-sidebar" style={{ width: 224, flexShrink: 0, position: "sticky", top: 20, display: "flex", flexDirection: "column", gap: 12 }}>

                            {/* Save button — mobile-visible in sidebar */}
                            <div className="pd-mobile-only" style={{ display: "flex" }}>
                                <SaveProjectButton
                                    projectId={project.id}
                                    initialSaved={initialSaved}
                                />
                            </div>

                            {/* Overview */}
                            <SideCard label="Overview">
                                <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
                                    {[
                                        { label: "Status", val: statusCfg.label, color: statusCfg.color },
                                        { label: "Phase", val: phaseCfg?.label ?? "—", color: phaseCfg?.color },
                                        { label: "Type", val: project.projectType ?? "—", color: categoryCfg?.color },
                                        { label: "Difficulty", val: project.difficulty ?? "—", color: undefined },
                                        { label: "Duration", val: project.estimatedDuration?.replace(/_/g, " ") ?? "—", color: undefined },
                                        { label: "Team", val: `${project.teams.length}${project.maxMembers ? `/${project.maxMembers}` : ""}`, color: undefined },
                                        { label: "Applied", val: String(project.applicants.length), color: undefined },
                                    ].map(({ label, val, color }) => (
                                        <div key={label} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                                            <span style={{ fontSize: 11, color: "var(--muted)" }}>{label}</span>
                                            <span style={{ fontSize: 11, fontWeight: 500, color: color ?? "var(--text)", textAlign: "right", maxWidth: 110, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{val}</span>
                                        </div>
                                    ))}
                                    {isOwner && pendingCount > 0 && (
                                        <div style={{ marginTop: 4, padding: "7px 10px", borderRadius: 7, background: "rgba(251,146,60,0.08)", border: "0.5px solid rgba(251,146,60,0.25)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                                            <span style={{ fontSize: 11, color: "#fb923c" }}>{pendingCount} pending</span>
                                            <span style={{ fontSize: 9, color: "#fb923c", opacity: 0.7 }}>review ↓</span>
                                        </div>
                                    )}

                                    {/* Save action row inside overview card */}
                                    <div style={{ marginTop: 4, paddingTop: 10, borderTop: "0.5px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                                        <span style={{ fontSize: 11, color: "var(--muted)" }}>Saved</span>
                                        <SaveProjectButton
                                            projectId={project.id}
                                            initialSaved={initialSaved}
                                        />
                                    </div>
                                </div>
                            </SideCard>

                            {/* Milestone progress */}
                            {milestoneProgress !== null && (
                                <SideCard label="Progress">
                                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                                        <span style={{ fontSize: 10, color: "var(--muted)" }}>Overall</span>
                                        <span style={{ fontSize: 11, fontWeight: 600, color: "var(--text)" }}>{milestoneProgress}%</span>
                                    </div>
                                    <div style={{ height: 4, background: "var(--surface2)", borderRadius: 3, overflow: "hidden", marginBottom: 10 }}>
                                        <div style={{ height: "100%", width: `${milestoneProgress}%`, background: milestoneProgress >= 75 ? "#22c55e" : milestoneProgress >= 40 ? "#378ADD" : accentHex, borderRadius: 3, transition: "width 0.5s ease" }} />
                                    </div>
                                    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                                        {project.milestones.slice(0, 4).map(m => (
                                            <div key={m.id} style={{ display: "flex", alignItems: "center", gap: 7 }}>
                                                <div style={{ width: 6, height: 6, borderRadius: "50%", flexShrink: 0, background: m.status === "COMPLETED" ? "#22c55e" : m.status === "ACTIVE" ? accentHex : "var(--border)", boxShadow: m.status === "ACTIVE" ? `0 0 4px ${accentHex}88` : "none" }} />
                                                <span style={{ fontSize: 10, flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", color: m.status === "COMPLETED" ? "var(--muted)" : "var(--text)", textDecoration: m.status === "COMPLETED" ? "line-through" : "none" }}>
                                                    {m.title}
                                                </span>
                                                <span style={{ fontSize: 9, color: "var(--muted)", flexShrink: 0 }}>{m.progress}%</span>
                                            </div>
                                        ))}
                                    </div>
                                </SideCard>
                            )}

                            {/* Team */}
                            {project.teams.length > 0 && (
                                <SideCard label={`Team · ${project.teams.length}`}>
                                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                                        {project.teams.slice(0, 5).map(t => (
                                            <div key={t.id} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                                <div style={{ width: 28, height: 28, borderRadius: "50%", overflow: "hidden", border: "1.5px solid var(--border)", background: "var(--surface2)", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                                                    {t.user.image
                                                        ? <Image src={t.user.image} alt={t.user.username ?? ""} width={28} height={28} style={{ objectFit: "cover", width: "100%", height: "100%" }} />
                                                        : <span style={{ fontSize: 11, fontWeight: 700, color: "var(--text)" }}>{(t.user.name ?? t.user.username ?? "?").charAt(0).toUpperCase()}</span>
                                                    }
                                                </div>
                                                <div style={{ flex: 1, minWidth: 0 }}>
                                                    <p style={{ fontSize: 11, color: "var(--text)", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                                        {t.user.name ?? t.user.username}
                                                    </p>
                                                    <p style={{ fontSize: 9, color: "var(--muted)", margin: 0, textTransform: "capitalize" }}>{t.role}</p>
                                                </div>
                                                {t.permissionLevel === "OWNER" && (
                                                    <span style={{ fontSize: 8, color: "#378ADD", fontWeight: 700, flexShrink: 0 }}>OWNER</span>
                                                )}
                                            </div>
                                        ))}
                                        {project.teams.length > 5 && (
                                            <p style={{ fontSize: 10, color: "var(--muted)", margin: 0 }}>+{project.teams.length - 5} more members</p>
                                        )}
                                    </div>
                                </SideCard>
                            )}

                            {/* Links + ID */}
                            <SideCard label="Links">
                                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                                    {project.liveUrl && (
                                        <a href={project.liveUrl} target="_blank" rel="noopener noreferrer" style={{ fontSize: 12, color: "var(--accent)", textDecoration: "none" }}>↗ Live project</a>
                                    )}
                                    {project.repoUrl && (
                                        <a href={project.repoUrl} target="_blank" rel="noopener noreferrer" style={{ fontSize: 12, color: "var(--accent)", textDecoration: "none" }}>↗ Repository</a>
                                    )}
                                    {!project.liveUrl && !project.repoUrl && (
                                        <span style={{ fontSize: 11, color: "var(--muted)" }}>No links added</span>
                                    )}
                                    <div style={{ paddingTop: 8, borderTop: "0.5px solid var(--border)" }}>
                                        <p style={{ fontSize: 9, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 6 }}>Project ID</p>
                                        <CopyButton text={project.id} displayText={project.id.slice(0, 8).toUpperCase()} />
                                    </div>
                                </div>
                            </SideCard>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}

// ─── Shared layout sub-components ────────────────────────────────────────────

function Card({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <div style={{ padding: "16px", borderRadius: 10, border: "0.5px solid var(--border)", background: "var(--surface)" }}>
            <p style={{ fontSize: 10, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 12 }}>{label}</p>
            {children}
        </div>
    );
}

function SideCard({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <div style={{ padding: "14px 16px", borderRadius: 10, border: "0.5px solid var(--border)", background: "var(--surface)" }}>
            <p style={{ fontSize: 10, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 12 }}>{label}</p>
            {children}
        </div>
    );
}

function Divider({ children }: { children: React.ReactNode }) {
    return (
        <div style={{ marginTop: 12, paddingTop: 12, borderTop: "0.5px solid var(--border)" }}>
            {children}
        </div>
    );
}

// ─── Activity section ─────────────────────────────────────────────────────────

type UpdateItem = { id: string; title: string; content: string; createdAt: Date };
type MilestoneItem = { id: string; title: string; status: string; progress: number; dueDate: Date | null };

function ActivitySection({ updates, milestones, milestoneProgress, daysSinceUpdate, accentHex, isInsider }: {
    updates: UpdateItem[];
    milestones: MilestoneItem[];
    milestoneProgress: number | null;
    daysSinceUpdate: number;
    accentHex: string;
    isInsider: boolean;
}) {
    const pulseColor = daysSinceUpdate < 7 ? "#22c55e" : daysSinceUpdate < 30 ? "#facc15" : "#fb923c";
    const pulseText = daysSinceUpdate < 1 ? "Active today" : daysSinceUpdate < 7 ? "Active this week" : daysSinceUpdate < 30 ? "Stable" : "Inactive";
    const hasContent = updates.length > 0 || milestones.length > 0;

    if (!hasContent && !isInsider) return null;

    return (
        <div style={{ padding: "16px", borderRadius: 10, border: "0.5px solid var(--border)", background: "var(--surface)" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
                <p style={{ fontSize: 10, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.08em", margin: 0 }}>What&apos;s happening</p>
                <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                    <span style={{ width: 6, height: 6, borderRadius: "50%", background: pulseColor, boxShadow: `0 0 6px ${pulseColor}88`, flexShrink: 0 }} />
                    <span style={{ fontSize: 10, color: "var(--muted)" }}>{pulseText}</span>
                </div>
            </div>

            {updates.length > 0 && (
                <div style={{ marginBottom: milestones.length > 0 ? 14 : 0 }}>
                    <p style={{ fontSize: 10, color: "var(--muted)", fontWeight: 500, marginBottom: 8 }}>Recent updates</p>
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                        {updates.map(u => (
                            <div key={u.id} style={{ padding: "10px 12px", borderRadius: 8, border: "0.5px solid var(--border)", background: "var(--surface2)" }}>
                                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
                                    <p style={{ fontSize: 12, fontWeight: 500, color: "var(--text)", margin: 0 }}>{u.title}</p>
                                    <span style={{ fontSize: 10, color: "var(--muted)", flexShrink: 0, marginLeft: 8 }}>
                                        {new Date(u.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
                                    </span>
                                </div>
                                <p style={{ fontSize: 11, color: "var(--muted)", margin: 0, lineHeight: 1.5 }}>
                                    {u.content.length > 140 ? u.content.slice(0, 137) + "…" : u.content}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {milestones.length > 0 && (
                <div>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                        <p style={{ fontSize: 10, color: "var(--muted)", fontWeight: 500, margin: 0 }}>Milestones</p>
                        {milestoneProgress !== null && (
                            <span style={{ fontSize: 10, color: "var(--text)", fontWeight: 600 }}>{milestoneProgress}%</span>
                        )}
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
                        {milestones.map(m => (
                            <div key={m.id} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                <div style={{ width: 7, height: 7, borderRadius: "50%", flexShrink: 0, background: m.status === "COMPLETED" ? "#22c55e" : m.status === "ACTIVE" ? accentHex : "var(--border)", boxShadow: m.status === "ACTIVE" ? `0 0 5px ${accentHex}88` : "none" }} />
                                <span style={{ fontSize: 12, flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", color: m.status === "COMPLETED" ? "var(--muted)" : "var(--text)", textDecoration: m.status === "COMPLETED" ? "line-through" : "none" }}>
                                    {m.title}
                                </span>
                                <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
                                    <div style={{ width: 48, height: 3, background: "var(--surface2)", borderRadius: 2, overflow: "hidden" }}>
                                        <div style={{ height: "100%", width: `${m.progress}%`, background: m.status === "COMPLETED" ? "#22c55e" : accentHex, borderRadius: 2 }} />
                                    </div>
                                    {m.dueDate && (
                                        <span style={{ fontSize: 9, color: new Date(m.dueDate) < new Date() && m.status !== "COMPLETED" ? "#ef4444" : "var(--muted)" }}>
                                            {new Date(m.dueDate).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
                                        </span>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {!hasContent && isInsider && (
                <p style={{ fontSize: 12, color: "var(--muted)", margin: 0, fontStyle: "italic" }}>
                    No updates or milestones yet. Add them from the project board.
                </p>
            )}
        </div>
    );
}