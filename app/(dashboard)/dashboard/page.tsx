import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function DashboardPage() {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) redirect("/login");

    // Resolve viewer by email
    const user = await prisma.user.findUnique({
        where: { email: session.user.email },
        select: { id: true, name: true, username: true, image: true, createdAt: true },
    });
    if (!user) redirect("/login");

    const now = new Date();
    const hour = now.getHours();
    const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
    const firstName = user.name?.split(" ")[0] ?? user.username;

    // ── Fetch what we need for the overview ───────────────────────────────────

    const [
        // Projects user owns
        ownedProjects,
        // Projects user joined
        joinedTeams,
        // Pending applicants on owned projects
        pendingApplications,
        // Tasks assigned to user
        assignedTasks,
        // Unread notifications
        unreadNotifications,
        // Saved projects count
        savedCount,
        // Recent project updates on projects user is part of
        recentUpdates,
        // Suggested open projects (not joined, not owned, hiring)
        suggestedProjects,
    ] = await Promise.all([
        prisma.project.findMany({
            where: { createdBy: user.id, status: { not: "ARCHIVED" } },
            select: { id: true, title: true, status: true, phase: true, hiringOpen: true, _count: { select: { teams: true, applicants: true } } },
            orderBy: { updatedAt: "desc" },
            take: 4,
        }),
        prisma.teamMember.findMany({
            where: { userId: user.id, active: true },
            include: { project: { select: { id: true, title: true, status: true, phase: true, createdBy: true } } },
            orderBy: { joinedAt: "desc" },
            take: 4,
        }),
        prisma.projectApplication.count({
            where: {
                project: { createdBy: user.id },
                status: "PENDING",
            },
        }),
        prisma.projectTask.findMany({
            where: { assignedTo: user.id, status: { in: ["TODO", "IN_PROGRESS"] } },
            include: { project: { select: { id: true, title: true } } },
            orderBy: { dueDate: "asc" },
            take: 5,
        }),
        prisma.notification.count({
            where: { userId: user.id, read: false },
        }),
        prisma.savedProject.count({ where: { userId: user.id } }),
        prisma.projectUpdate.findMany({
            where: {
                project: {
                    OR: [
                        { createdBy: user.id },
                        { teams: { some: { userId: user.id, active: true } } },
                    ],
                },
                isPublic: true,
            },
            include: { project: { select: { id: true, title: true } } },
            orderBy: { createdAt: "desc" },
            take: 5,
        }),
        prisma.project.findMany({
            where: {
                status: "OPEN",
                hiringOpen: true,
                visibility: "PUBLIC",
                createdBy: { not: user.id },
                teams: { none: { userId: user.id } },
                applicants: { none: { userId: user.id } },
            },
            select: { id: true, title: true, tagline: true, domain: true, difficulty: true, projectType: true, _count: { select: { teams: true } } },
            orderBy: { createdAt: "desc" },
            take: 4,
        }),
    ]);

    // Overdue tasks
    const overdueTasks = assignedTasks.filter(t => t.dueDate && t.dueDate < now);
    const dueSoonTasks = assignedTasks.filter(t => {
        if (!t.dueDate || t.dueDate < now) return false;
        const diff = (t.dueDate.getTime() - now.getTime()) / 86400000;
        return diff <= 3;
    });

    // Joined projects (exclude owned)
    const joinedProjects = joinedTeams.filter(t => t.project.createdBy !== user.id);

    const STATUS_COLOR: Record<string, string> = {
        OPEN: "#22c55e", IN_PROGRESS: "#378ADD", PAUSED: "#facc15",
        COMPLETED: "#86efac", TERMINATED: "#e24b4a", ARCHIVED: "#666", DRAFT: "#666",
    };

    const PHASE_LABEL: Record<string, string> = {
        IDEA: "Idea", PLANNING: "Planning", BUILDING: "Building", TESTING: "Testing", LAUNCHED: "Launched",
    };

    const DOMAIN_LABEL: Record<string, string> = {
        web_dev: "Web Dev", ai_ml: "AI / ML", game_dev: "Game Dev",
        cybersecurity: "Cybersecurity", devops: "DevOps", mobile: "Mobile", data: "Data",
    };

    const daysSince = (d: Date) => Math.floor((now.getTime() - d.getTime()) / 86400000);
    const timeAgo = (d: Date) => {
        const mins = Math.floor((now.getTime() - d.getTime()) / 60000);
        if (mins < 60) return `${mins}m ago`;
        const hrs = Math.floor(mins / 60);
        if (hrs < 24) return `${hrs}h ago`;
        return `${Math.floor(hrs / 24)}d ago`;
    };

    const memberSince = daysSince(user.createdAt);

    return (
        <>
            <style>{`
                .db-wrap { width: 100%; padding: 24px 20px 60px; margin: 0 auto; }
                .db-grid { display: grid; grid-template-columns: 1fr 320px; gap: 20px; align-items: start; }
                .db-card { border: 0.5px solid var(--border); border-radius: 10px; background: var(--surface); overflow: hidden; }
                .db-card-header { padding: 11px 16px; border-bottom: 0.5px solid var(--border); display: flex; align-items: center; justify-content: space-between; }
                .db-card-body { padding: 14px 16px; }
                .db-row:hover { background: var(--surface2) !important; }
                .db-row { transition: background 0.12s; }
                .db-stat:hover { border-color: var(--accent) !important; }
                .db-quick-link:hover { border-color: var(--accent) !important; }
                .db-alert-pill:hover { opacity: 0.8; }
                @media (max-width: 860px) { .db-grid { grid-template-columns: 1fr; } }

            `}</style>

            <div className="db-wrap">

                {/* ── Welcome ── */}
                <div style={{ marginBottom: 24 }}>
                    <h1 style={{ fontSize: 20, fontWeight: 600, color: "var(--text)", margin: "0 0 4px" }}>
                        {greeting}, {firstName}.
                    </h1>
                    <p style={{ fontSize: 13, color: "var(--muted)", margin: 0 }}>
                        {memberSince < 7
                            ? "Welcome to Sancodevs — here's your builder overview."
                            : "Here's what's happening across your projects today."
                        }
                    </p>
                </div>

                {/* ── Alert bar — only if urgent items ── */}
                {(overdueTasks.length > 0 || pendingApplications > 0 || unreadNotifications > 0) && (
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 20 }}>
                        {overdueTasks.length > 0 && (
                            <AlertPill href="/workspace?tab=tasks" color="#ef4444" bg="rgba(239,68,68,0.08)" border="rgba(239,68,68,0.25)">
                                ⚠ {overdueTasks.length} overdue task{overdueTasks.length > 1 ? "s" : ""}
                            </AlertPill>
                        )}
                        {pendingApplications > 0 && (
                            <AlertPill href="/workspace?tab=created" color="#fb923c" bg="rgba(251,146,60,0.08)" border="rgba(251,146,60,0.25)">
                                {pendingApplications} pending application{pendingApplications > 1 ? "s" : ""} to review
                            </AlertPill>
                        )}
                        {unreadNotifications > 0 && (
                            <AlertPill href="/notifications" color="#378ADD" bg="rgba(55,138,221,0.08)" border="rgba(55,138,221,0.2)">
                                {unreadNotifications} unread notification{unreadNotifications > 1 ? "s" : ""}
                            </AlertPill>
                        )}
                    </div>
                )}

                {/* ── Quick stats ── */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10, marginBottom: 20 }}>
                    {[
                        { label: "Projects owned", val: ownedProjects.length, href: "/workspace?tab=created" },
                        { label: "Projects joined", val: joinedProjects.length, href: "/workspace?tab=joined" },
                        { label: "Active tasks", val: assignedTasks.length, href: "/workspace?tab=tasks" },
                        { label: "Saved", val: savedCount, href: "/workspace?tab=saved" },
                    ].map(s => (
                        <Link key={s.label} href={s.href} style={{ textDecoration: "none" }}>
                            <div className="db-stat" style={{ padding: "14px 12px", borderRadius: 10, border: "0.5px solid var(--border)", background: "var(--surface)", textAlign: "center", transition: "border-color 0.15s" }}>
                                <p style={{ fontSize: 22, fontWeight: 700, color: "var(--text)", margin: "0 0 3px" }}>{s.val}</p>
                                <p style={{ fontSize: 10, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.06em", margin: 0 }}>{s.label}</p>
                            </div>
                        </Link>
                    ))}
                </div>

                <div className="db-grid">

                    {/* ══ LEFT COLUMN ══ */}
                    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

                        {/* Continue working on */}
                        {assignedTasks.length > 0 && (
                            <div className="db-card">
                                <div className="db-card-header">
                                    <SectionLabel>Continue working on</SectionLabel>
                                    <Link href="/workspace?tab=tasks" style={{ fontSize: 11, color: "var(--accent)", textDecoration: "none" }}>View all →</Link>
                                </div>
                                <div>
                                    {assignedTasks.map((task, i) => {
                                        const overdue = task.dueDate && task.dueDate < now;
                                        const soon = !overdue && task.dueDate && (task.dueDate.getTime() - now.getTime()) / 86400000 <= 3;
                                        return (
                                            <Link key={task.id} href={`/projects/${task.projectId}/board`} style={{ textDecoration: "none" }}>
                                                <div className="db-row" style={{ display: "flex", alignItems: "center", gap: 12, padding: "11px 16px", borderBottom: i < assignedTasks.length - 1 ? "0.5px solid var(--border)" : "none" }}>
                                                    <div style={{ width: 7, height: 7, borderRadius: "50%", flexShrink: 0, background: task.status === "IN_PROGRESS" ? "#378ADD" : "var(--border)" }} />
                                                    <div style={{ flex: 1, minWidth: 0 }}>
                                                        <p style={{ fontSize: 13, color: "var(--text)", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{task.title}</p>
                                                        <p style={{ fontSize: 10, color: "var(--muted)", margin: "2px 0 0" }}>{task.project.title}</p>
                                                    </div>
                                                    <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
                                                        <span style={{ fontSize: 9, fontWeight: 600, padding: "2px 7px", borderRadius: 4, textTransform: "uppercase", background: task.status === "IN_PROGRESS" ? "rgba(55,138,221,0.1)" : "var(--surface2)", color: task.status === "IN_PROGRESS" ? "#378ADD" : "var(--muted)" }}>
                                                            {task.status.replace("_", " ")}
                                                        </span>
                                                        {task.dueDate && (
                                                            <span style={{ fontSize: 10, color: overdue ? "#ef4444" : soon ? "#fb923c" : "var(--muted)" }}>
                                                                {overdue ? "⚠ " : ""}{task.dueDate.toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </Link>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {/* Your projects */}
                        {(ownedProjects.length > 0 || joinedProjects.length > 0) && (
                            <div className="db-card">
                                <div className="db-card-header">
                                    <SectionLabel>Your projects</SectionLabel>
                                    <Link href="/workspace" style={{ fontSize: 11, color: "var(--accent)", textDecoration: "none" }}>Workspace →</Link>
                                </div>
                                <div>
                                    {[
                                        ...ownedProjects.map(p => ({ id: p.id, title: p.title, status: p.status, phase: p.phase, isOwner: true, meta: `${p._count.teams} member${p._count.teams !== 1 ? "s" : ""} · ${p._count.applicants} applicant${p._count.applicants !== 1 ? "s" : ""}` })),
                                        ...joinedProjects.map(t => ({ id: t.project.id, title: t.project.title, status: t.project.status, phase: t.project.phase, isOwner: false, meta: `${t.role}` })),
                                    ].slice(0, 6).map((p, i, arr) => (
                                        <Link key={`${p.id}-${p.isOwner}`} href={`/projects/${p.id}`} style={{ textDecoration: "none" }}>
                                            <div className="db-row" style={{ display: "flex", alignItems: "center", gap: 12, padding: "11px 16px", borderBottom: i < arr.length - 1 ? "0.5px solid var(--border)" : "none" }}>
                                                <span style={{ width: 7, height: 7, borderRadius: "50%", background: STATUS_COLOR[p.status] ?? "#666", flexShrink: 0 }} />
                                                <div style={{ flex: 1, minWidth: 0 }}>
                                                    <p style={{ fontSize: 13, color: "var(--text)", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.title}</p>
                                                    <p style={{ fontSize: 10, color: "var(--muted)", margin: "2px 0 0", textTransform: "capitalize" }}>{p.meta}</p>
                                                </div>
                                                <div style={{ display: "flex", gap: 6, alignItems: "center", flexShrink: 0 }}>
                                                    {p.isOwner && <span style={{ fontSize: 9, padding: "1px 6px", borderRadius: 4, background: "rgba(55,138,221,0.1)", color: "#378ADD", border: "0.5px solid rgba(55,138,221,0.2)" }}>Owner</span>}
                                                    <span style={{ fontSize: 10, color: "var(--muted)" }}>{PHASE_LABEL[p.phase] ?? p.phase}</span>
                                                </div>
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Recent updates from your projects */}
                        {recentUpdates.length > 0 && (
                            <div className="db-card">
                                <div className="db-card-header">
                                    <SectionLabel>Recent updates</SectionLabel>
                                </div>
                                <div>
                                    {recentUpdates.map((u, i) => (
                                        <Link key={u.id} href={`/projects/${u.projectId}`} style={{ textDecoration: "none" }}>
                                            <div className="db-row" style={{ padding: "11px 16px", borderBottom: i < recentUpdates.length - 1 ? "0.5px solid var(--border)" : "none" }}>
                                                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, marginBottom: 3 }}>
                                                    <p style={{ fontSize: 12, fontWeight: 500, color: "var(--text)", margin: 0 }}>{u.title}</p>
                                                    <span style={{ fontSize: 10, color: "var(--muted)", flexShrink: 0 }}>{timeAgo(u.createdAt)}</span>
                                                </div>
                                                <p style={{ fontSize: 11, color: "var(--muted)", margin: 0 }}>
                                                    {u.project.title} · {u.content.slice(0, 80)}{u.content.length > 80 ? "…" : ""}
                                                </p>
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Empty state — brand new user */}
                        {ownedProjects.length === 0 && joinedProjects.length === 0 && assignedTasks.length === 0 && (
                            <div style={{ padding: "36px 24px", borderRadius: 10, border: "0.5px dashed var(--border)", textAlign: "center" }}>
                                <p style={{ fontSize: 15, fontWeight: 500, color: "var(--text)", marginBottom: 6 }}>You&apos;re all set up</p>
                                <p style={{ fontSize: 13, color: "var(--muted)", marginBottom: 20, lineHeight: 1.6 }}>
                                    Start by browsing projects to join, or create your own.
                                </p>
                                <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
                                    <Link href="/projects" style={{ padding: "8px 18px", borderRadius: 8, fontSize: 13, fontWeight: 500, background: "var(--accent)", color: "var(--bg)", textDecoration: "none" }}>
                                        Browse projects
                                    </Link>
                                    <Link href="/projects/new" style={{ padding: "8px 18px", borderRadius: 8, fontSize: 13, border: "0.5px solid var(--border)", color: "var(--muted)", textDecoration: "none" }}>
                                        Create a project
                                    </Link>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* ══ RIGHT COLUMN ══ */}
                    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>

                        {/* Due soon */}
                        {dueSoonTasks.length > 0 && (
                            <div className="db-card">
                                <div className="db-card-header">
                                    <SectionLabel>Due soon</SectionLabel>
                                </div>
                                <div className="db-card-body" style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                                    {dueSoonTasks.map(task => {
                                        const daysLeft = Math.ceil((task.dueDate!.getTime() - now.getTime()) / 86400000);
                                        return (
                                            <Link key={task.id} href={`/projects/${task.projectId}/board`} style={{ textDecoration: "none" }}>
                                                <div style={{ padding: "9px 11px", borderRadius: 8, border: "0.5px solid rgba(251,146,60,0.3)", background: "rgba(251,146,60,0.05)", transition: "border-color 0.15s" }}>
                                                    <p style={{ fontSize: 12, color: "var(--text)", margin: "0 0 2px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{task.title}</p>
                                                    <p style={{ fontSize: 10, color: "#fb923c", margin: 0 }}>
                                                        {daysLeft === 1 ? "Due tomorrow" : `Due in ${daysLeft} days`}
                                                    </p>
                                                </div>
                                            </Link>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {/* Pending applications to review */}
                        {pendingApplications > 0 && (
                            <div className="db-card">
                                <div className="db-card-header">
                                    <SectionLabel>Needs your attention</SectionLabel>
                                </div>
                                <div className="db-card-body">
                                    <Link href="/workspace?tab=created" style={{ textDecoration: "none" }}>
                                        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", borderRadius: 8, border: "0.5px solid rgba(251,146,60,0.3)", background: "rgba(251,146,60,0.06)" }}>
                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fb923c" strokeWidth="1.5" strokeLinecap="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>
                                            <div>
                                                <p style={{ fontSize: 12, color: "var(--text)", margin: 0 }}>{pendingApplications} join request{pendingApplications > 1 ? "s" : ""}</p>
                                                <p style={{ fontSize: 10, color: "var(--muted)", margin: "1px 0 0" }}>Waiting for your review</p>
                                            </div>
                                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--muted)" strokeWidth="2" strokeLinecap="round" style={{ marginLeft: "auto" }}><polyline points="9 18 15 12 9 6" /></svg>
                                        </div>
                                    </Link>
                                </div>
                            </div>
                        )}

                        {/* Suggested projects */}
                        {suggestedProjects.length > 0 && (
                            <div className="db-card">
                                <div className="db-card-header">
                                    <SectionLabel>Recommended for you</SectionLabel>
                                    <Link href="/projects" style={{ fontSize: 11, color: "var(--accent)", textDecoration: "none" }}>Browse all →</Link>
                                </div>
                                <div style={{ display: "flex", flexDirection: "column" }}>
                                    {suggestedProjects.map((p, i) => (
                                        <Link key={p.id} href={`/projects/${p.id}`} style={{ textDecoration: "none" }}>
                                            <div className="db-row" style={{ padding: "11px 14px", borderBottom: i < suggestedProjects.length - 1 ? "0.5px solid var(--border)" : "none" }}>
                                                <p style={{ fontSize: 13, color: "var(--text)", margin: "0 0 3px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.title}</p>
                                                <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
                                                    {p.domain && <span style={{ fontSize: 9, color: "var(--muted)", textTransform: "capitalize" }}>{DOMAIN_LABEL[p.domain] ?? p.domain}</span>}
                                                    {p.projectType && <span style={{ fontSize: 9, color: "var(--muted)" }}>· {p.projectType}</span>}
                                                    <span style={{ fontSize: 9, color: "var(--muted)" }}>· {p._count.teams} member{p._count.teams !== 1 ? "s" : ""}</span>
                                                </div>
                                                {p.tagline && <p style={{ fontSize: 11, color: "var(--muted)", margin: "4px 0 0", lineHeight: 1.5, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.tagline}</p>}
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Quick links */}
                        <div className="db-card">
                            <div className="db-card-header"><SectionLabel>Quick access</SectionLabel></div>
                            <div className="db-card-body" style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                                {[
                                    { label: "Create a project", href: "/projects/new", icon: "+" },
                                    { label: "Browse projects", href: "/projects", icon: "◈" },
                                    { label: "Your workspace", href: "/workspace", icon: "◇" },
                                    { label: "Community", href: "/community", icon: "⬡" },
                                    { label: "View your profile", href: "/profile", icon: "○" },
                                ].map(item => (
                                    <Link key={item.href} href={item.href} style={{ textDecoration: "none" }}>
                                        <div className="db-quick-link" style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 10px", borderRadius: 7, border: "0.5px solid var(--border)", background: "var(--surface2)", transition: "border-color 0.15s" }}>
                                            <span style={{ fontSize: 12, color: "var(--muted)", width: 16, textAlign: "center", flexShrink: 0 }}>{item.icon}</span>
                                            <span style={{ fontSize: 12, color: "var(--text)" }}>{item.label}</span>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function SectionLabel({ children }: { children: React.ReactNode }) {
    return <p style={{ fontSize: 10, fontWeight: 500, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.08em", margin: 0 }}>{children}</p>;
}

function AlertPill({ href, color, bg, border, children }: { href: string; color: string; bg: string; border: string; children: React.ReactNode }) {
    return (
        <Link href={href} style={{ textDecoration: "none" }}>
            <div className="db-alert-pill" style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "6px 12px", borderRadius: 7, background: bg, border: `0.5px solid ${border}`, fontSize: 12, color, cursor: "pointer", transition: "opacity 0.15s" }}>
                {children}
            </div>
        </Link>
    );
}