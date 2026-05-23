// app/(dashboard)/user/[userId]/page.tsx
//
// URL format: /user/username  (NO @ prefix — @ conflicts with Next.js parallel routes)
// Legacy:     /user/uuid      → redirects to /user/username
//
// Viewer always resolved by EMAIL for OAuth safety.

import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import ProfileCard from "@/components/profile/ProfileCard";
import ReliabilityCard from "@/components/profile/ReliabilityCard";
import AddFriendButton from "./AddFriendButton";
import BlockButton from "./BlockButton";

// UUID regex — if param looks like this it's a UUID, otherwise treat as username
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function UserProfilePage({
    params,
}: {
    params: Promise<{ userId: string }>;
}) {
    const { userId: rawParam } = await params;

    const session = await getServerSession(authOptions);
    if (!session?.user?.email) redirect("/login");

    // ── Viewer: always by email ───────────────────────────────────────────────
    const viewer = await prisma.user.findUnique({
        where: { email: session.user.email },
        select: { id: true },
    });
    if (!viewer) redirect("/login");

    // ── Resolve subject ───────────────────────────────────────────────────────
    // Strip leading @ if someone still arrives with it (old links, bookmarks)
    const cleanParam = rawParam.startsWith("@") ? rawParam.slice(1) : rawParam;
    const isUuid = UUID_RE.test(cleanParam);

    const subject = await prisma.user.findUnique({
        where: isUuid ? { id: cleanParam } : { username: cleanParam },
        include: {
            stats: true,
            onboarding: true,
            preferences: true,
            teams: {
                where: { active: true },
                include: { project: { select: { id: true, title: true, status: true } } },
                orderBy: { joinedAt: "desc" },
                take: 10,
            },
            assignedTasks: {
                where: { status: { in: ["TODO", "IN_PROGRESS"] } },
                include: { project: { select: { id: true, title: true } } },
                orderBy: { dueDate: "asc" },
                take: 5,
            },
        },
    });

    if (!subject) notFound();

    // UUID → canonical /user/username (no @)
    if (isUuid && subject.username) {
        redirect(`/user/${subject.username}`);
    }

    // Strip @ from URL if someone bookmarked /user/@username
    if (rawParam.startsWith("@")) {
        redirect(`/user/${subject.username}`);
    }

    // isOwner: compare real DB ids
    const isOwner = subject.id === viewer.id;

    // ── Block check ───────────────────────────────────────────────────────────
    let viewerHasBlocked = false;
    if (!isOwner) {
        const block = await prisma.block.findFirst({
            where: {
                OR: [
                    { blockerId: viewer.id, blockedId: subject.id },
                    { blockerId: subject.id, blockedId: viewer.id },
                ],
            },
            select: { blockerId: true },
        });
        viewerHasBlocked = block?.blockerId === viewer.id;
    }

    // ── Derived data ──────────────────────────────────────────────────────────
    const ob = subject.onboarding;
    const stats = subject.stats;

    const reliabilityScore = stats?.reliabilityScore ?? null;
    const totalTerminal = stats
        ? stats.tasksCompleted + stats.tasksLate + stats.tasksMissed + stats.tasksRejected
        : 0;

    const cardProjects = subject.teams.map(t => ({
        id: t.project.id,
        title: t.project.title,
        status: t.project.status,
        role: t.role,
    }));

    const reliabilityData = {
        reliabilityScore: reliabilityScore,
        onTimeRate: stats?.onTimeRate != null ? stats.onTimeRate : 100,
        tasksCompleted: stats?.tasksCompleted ?? 0,
        tasksLate: stats?.tasksLate ?? 0,
        tasksMissed: stats?.tasksMissed ?? 0,
        tasksRejected: stats?.tasksRejected ?? 0,
    };

    const domainLabel = ob?.domain?.replace(/_/g, " ") ?? null;
    const roleLabel = ob?.role?.replace(/_/g, " ") ?? null;
    const expLabel = ob?.experienceLevel ?? null;
    const availLabel = ob?.availability
        ? (({
            WEEKEND: "Weekends only",
            LIGHT: "Light — 1–2 hrs/day",
            MODERATE: "Moderate — 3–5 hrs/day",
            FULLTIME: "Full-time",
        }) as Record<string, string>)[ob.availability] ?? ob.availability
        : null;
    const missionLabel = ob?.mission
        ? (({
            JOIN_PROJECT: "Looking to join projects",
            START_PROJECT: "Building my own project",
            FIND_TEAM: "Finding a team",
        }) as Record<string, string>)[ob.mission] ?? ob.mission
        : null;

    const STATUS_COLORS: Record<string, string> = {
        OPEN: "#22c55e", IN_PROGRESS: "#378ADD", PAUSED: "#facc15",
        CLOSED: "#666", COMPLETED: "#86efac", TERMINATED: "#e24b4a", ARCHIVED: "#666",
    };

    return (
        <>
            <style>{`
                .up-wrap  { width: 100%; padding: 20px 16px 60px; }
                .up-grid  { display: grid; grid-template-columns: 300px 1fr; gap: 16px; align-items: start; }
                .up-left  { display: flex; flex-direction: column; gap: 12px; }
                .up-right { display: flex; flex-direction: column; gap: 12px; min-width: 0; }
                .up-card:hover { border-color: var(--accent) !important; }
                @media (max-width: 880px) { .up-grid { grid-template-columns: 1fr; } }
            `}</style>

            <div className="up-wrap">
                <div className="up-grid">

                    {/* ══ LEFT ══ */}
                    <div className="up-left">
                        <ProfileCard
                            name={subject.name ?? "Builder"}
                            username={subject.username}
                            email={subject.email}
                            image={subject.image}
                            bannerImage={subject.bannerImage ?? null}
                            bio={subject.bio ?? null}
                            role={roleLabel}
                            domain={domainLabel}
                            experienceLevel={expLabel}
                            availability={availLabel}
                            mission={missionLabel}
                            prefTechs={subject.preferences?.prefTechs ?? []}
                            prefTopics={subject.preferences?.prefTopics ?? []}
                            projects={cardProjects}
                            reliabilityScore={reliabilityScore}
                            builderScore={ob?.builderScore ?? 0}
                            isOwner={isOwner}
                        />

                        {!isOwner && (
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                                <AddFriendButton targetUserId={subject.id} />
                                <BlockButton targetUserId={subject.id} isBlocked={viewerHasBlocked} />
                            </div>
                        )}

                        <Section label="Builder identity">
                            {ob ? (
                                <>
                                    <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                                        {[
                                            { text: domainLabel, strong: true },
                                            { text: roleLabel, strong: true },
                                            { text: expLabel ? expLabel.charAt(0) + expLabel.slice(1).toLowerCase() : null, strong: false },
                                            { text: availLabel, strong: false },
                                            ...(ob.goals ?? []).map(g => ({ text: g.replace(/_/g, " "), strong: false })),
                                        ].filter(x => x.text).map((x, i) => (
                                            <span key={i} style={{
                                                fontSize: 11, padding: "4px 10px", borderRadius: 6,
                                                border: "0.5px solid var(--border)",
                                                color: x.strong ? "var(--text)" : "var(--muted)",
                                                background: x.strong ? "var(--surface2)" : "transparent",
                                                textTransform: "capitalize",
                                            }}>{x.text}</span>
                                        ))}
                                    </div>
                                    {isOwner && (
                                        <div style={{ marginTop: 10 }}>
                                            <Link href="/onboarding" style={{ fontSize: 11, color: "var(--muted)", textDecoration: "none" }}>
                                                Update onboarding →
                                            </Link>
                                        </div>
                                    )}
                                </>
                            ) : isOwner ? (
                                <div>
                                    <p style={{ fontSize: 12, color: "var(--muted)", marginBottom: 8 }}>
                                        Complete onboarding to set your builder identity.
                                    </p>
                                    <Link href="/onboarding" style={{ fontSize: 11, color: "var(--accent)", textDecoration: "none" }}>
                                        Complete setup →
                                    </Link>
                                </div>
                            ) : (
                                <p style={{ fontSize: 12, color: "var(--muted)", margin: 0, fontStyle: "italic" }}>No identity set yet.</p>
                            )}
                        </Section>

                        <Section label="Achievements">
                            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                                {totalTerminal >= 1 && <Badge label="First task" />}
                                {(stats?.tasksCompleted ?? 0) >= 10 && <Badge label="10 tasks done" />}
                                {(stats?.tasksCompleted ?? 0) >= 30 && <Badge label="30 tasks done" />}
                                {(stats?.tasksMissed ?? 0) === 0 && totalTerminal >= 5 && <Badge label="Zero missed" />}
                                {(reliabilityScore ?? 0) >= 90 && totalTerminal >= 5 && <Badge label="Top performer" />}
                                {subject.teams.length >= 3 && <Badge label="Multi-project" />}
                                {totalTerminal === 0 && (
                                    <p style={{ fontSize: 11, color: "var(--muted)", fontStyle: "italic", margin: 0 }}>
                                        {isOwner ? "Complete tasks to earn badges." : "No achievements yet."}
                                    </p>
                                )}
                            </div>
                            {isOwner && <Placeholder label="team leader · fast reviewer · consistency streak" />}
                        </Section>
                    </div>

                    {/* ══ RIGHT ══ */}
                    <div className="up-right">
                        <ReliabilityCard data={reliabilityData} />

                        {isOwner && subject.assignedTasks.length > 0 && (
                            <Section label="Active tasks">
                                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                                    {subject.assignedTasks.map(task => {
                                        const overdue = task.dueDate && new Date(task.dueDate) < new Date();
                                        return (
                                            <Link key={task.id} href={`/projects/${task.projectId}/board`} style={{ textDecoration: "none" }}>
                                                <div className="up-card" style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 12px", borderRadius: 8, border: "0.5px solid var(--border)", background: "var(--surface2)", transition: "border-color 0.15s" }}>
                                                    <span style={{ fontSize: 9, fontWeight: 600, padding: "2px 7px", borderRadius: 4, textTransform: "uppercase", flexShrink: 0, background: task.status === "IN_PROGRESS" ? "rgba(55,138,221,0.1)" : "var(--surface)", color: task.status === "IN_PROGRESS" ? "#378ADD" : "var(--muted)" }}>
                                                        {task.status.replace("_", " ")}
                                                    </span>
                                                    <span style={{ fontSize: 12, color: "var(--text)", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{task.title}</span>
                                                    <span style={{ fontSize: 10, color: "var(--muted)", flexShrink: 0, maxWidth: 110, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{task.project.title}</span>
                                                    {task.dueDate && (
                                                        <span style={{ fontSize: 10, color: overdue ? "#ef4444" : "var(--muted)", flexShrink: 0 }}>
                                                            {overdue ? "⚠ " : ""}{new Date(task.dueDate).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
                                                        </span>
                                                    )}
                                                </div>
                                            </Link>
                                        );
                                    })}
                                </div>
                            </Section>
                        )}

                        {subject.teams.length > 0 && (
                            <Section label={`Project history (${subject.teams.length})`}>
                                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                                    {subject.teams.map(t => (
                                        <Link key={t.id} href={`/projects/${t.project.id}`} style={{ textDecoration: "none" }}>
                                            <div className="up-card" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, padding: "10px 14px", borderRadius: 8, border: "0.5px solid var(--border)", background: "var(--surface2)", transition: "border-color 0.15s" }}>
                                                <div style={{ flex: 1, minWidth: 0 }}>
                                                    <p style={{ fontSize: 12, fontWeight: 500, color: "var(--text)", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{t.project.title}</p>
                                                    <p style={{ fontSize: 10, color: "var(--muted)", marginTop: 2, textTransform: "uppercase", letterSpacing: "0.04em" }}>{t.role}</p>
                                                </div>
                                                <span style={{ fontSize: 9, fontWeight: 600, flexShrink: 0, textTransform: "uppercase", color: STATUS_COLORS[t.project.status] ?? "#666" }}>
                                                    {t.project.status.replace("_", " ")}
                                                </span>
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                                {isOwner && <Placeholder label="contribution % · owner feedback · demo links" />}
                            </Section>
                        )}

                        <Section label="Team reputation">
                            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8, marginBottom: isOwner ? 10 : 0 }}>
                                {["Communication", "Execution", "Ownership"].map(r => (
                                    <div key={r} style={{ padding: "10px 8px", borderRadius: 8, border: "0.5px solid var(--border)", background: "var(--surface2)", textAlign: "center" }}>
                                        <p style={{ fontSize: 15, fontWeight: 700, color: "var(--muted)", margin: 0 }}>—</p>
                                        <p style={{ fontSize: 9, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.05em", marginTop: 3 }}>{r}</p>
                                    </div>
                                ))}
                            </div>
                            {isOwner && <Placeholder label="structured ratings from teammates · project owner feedback" />}
                        </Section>

                        {isOwner && (
                            <>
                                <Section label="Contribution timeline">
                                    <Placeholder label="activity graph · task streaks · reviews done · teams formed" />
                                </Section>
                                <Section label="Links">
                                    <Placeholder label="GitHub · LinkedIn · portfolio · Twitter/X" />
                                </Section>
                            </>
                        )}

                        {subject.teams.length === 0 && subject.assignedTasks.length === 0 && (
                            <div style={{ padding: "32px 20px", borderRadius: 10, border: "0.5px dashed var(--border)", display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
                                <p style={{ fontSize: 13, color: "var(--muted)" }}>No project activity yet.</p>
                                {isOwner && (
                                    <Link href="/projects" style={{ fontSize: 12, color: "var(--accent)", textDecoration: "none" }}>
                                        Browse projects →
                                    </Link>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <div style={{ border: "0.5px solid var(--border)", borderRadius: 10, background: "var(--surface)", overflow: "hidden" }}>
            <div style={{ padding: "11px 16px", borderBottom: "0.5px solid var(--border)" }}>
                <p style={{ fontSize: 10, fontWeight: 500, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.08em", margin: 0 }}>{label}</p>
            </div>
            <div style={{ padding: "14px 16px" }}>{children}</div>
        </div>
    );
}

function Badge({ label }: { label: string }) {
    return (
        <span style={{ fontSize: 11, padding: "4px 10px", borderRadius: 6, border: "0.5px solid var(--border)", color: "var(--text)", background: "var(--surface2)" }}>
            {label}
        </span>
    );
}

function Placeholder({ label }: { label: string }) {
    return (
        <div style={{ padding: "9px 12px", borderRadius: 7, border: "0.5px dashed var(--border)", background: "var(--surface2)", marginTop: 8 }}>
            <p style={{ fontSize: 10, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.07em", margin: 0 }}>
                Coming soon — {label}
            </p>
        </div>
    );
}