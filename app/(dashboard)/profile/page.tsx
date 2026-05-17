import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import ProfileCard from "@/components/profile/ProfileCard";
import ReliabilityCard from "@/components/profile/ReliabilityCard";

export default async function ProfilePage() {
    const session = await getServerSession(authOptions);
    if (!session) redirect("/login");

    const user = await prisma.user.findUnique({
        where: { id: session.user.id },
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

    if (!user) redirect("/login");

    const stats = user.stats;
    const ob = user.onboarding;

    const score = stats?.reliabilityScore ?? null;
    const totalTerminal = stats
        ? stats.tasksCompleted + stats.tasksLate + stats.tasksMissed + stats.tasksRejected
        : 0;

    // ── Onboarding labels ─────────────────────────────────────────────────────
    const domainLabel = ob?.domain?.replace(/_/g, " ") ?? null;
    const roleLabel = ob?.role?.replace(/_/g, " ") ?? null;
    const expLabel = ob?.experienceLevel
        ? ob.experienceLevel.charAt(0) + ob.experienceLevel.slice(1).toLowerCase()
        : null;
    const availLabel = ob?.availability
        ? ({
            WEEKEND: "Weekends only",
            LIGHT: "Light — 1–2 hrs/day",
            MODERATE: "Moderate — 3–5 hrs/day",
            FULLTIME: "Full-time",
        } as Record<string, string>)[ob.availability] ?? ob.availability
        : null;
    const missionLabel = ob?.mission
        ? ({
            JOIN_PROJECT: "Looking to join projects",
            START_PROJECT: "Building my own project",
            FIND_TEAM: "Finding a team",
        } as Record<string, string>)[ob.mission] ?? ob.mission
        : null;

    // ── ProfileCard data ──────────────────────────────────────────────────────
    const cardProjects = user.teams.map(t => ({
        id: t.project.id,
        title: t.project.title,
        status: t.project.status,
        role: t.role,
    }));

    // ── ReliabilityCard data ──────────────────────────────────────────────────
    const reliabilityData = {
        reliabilityScore: stats?.reliabilityScore ?? null,
        onTimeRate: stats?.onTimeRate ?? 100,
        tasksCompleted: stats?.tasksCompleted ?? 0,
        tasksLate: stats?.tasksLate ?? 0,
        tasksMissed: stats?.tasksMissed ?? 0,
        tasksRejected: stats?.tasksRejected ?? 0,
    };

    const STATUS_COLORS: Record<string, string> = {
        OPEN: "#22c55e",
        IN_PROGRESS: "#378ADD",
        PAUSED: "#facc15",
        CLOSED: "#666",
        COMPLETED: "#86efac",
        TERMINATED: "#e24b4a",
        ARCHIVED: "#666",
    };

    return (
        <>
            <style>{`
                .prof-wrap  { width: 100%; margin: 0 auto; padding: 20px 16px 60px; }
                .prof-grid  { display: grid; grid-template-columns: 300px 1fr; gap: 16px; align-items: start; }
                .prof-left  { position: sticky; top: 16px; display: flex; flex-direction: column; gap: 12px; }
                .prof-right { display: flex; flex-direction: column; gap: 12px; min-width: 0; }
                @media (max-width: 860px) {
                    .prof-grid { grid-template-columns: 1fr; }
                    .prof-left { position: static; }
                }
            `}</style>

            <div className="prof-wrap">
                <div className="prof-grid">

                    {/* ══ LEFT ══ */}
                    <div className="prof-left">
                        <ProfileCard
                            // identity
                            name={user.name ?? "Builder"}
                            username={user.username}
                            email={user.email}
                            image={user.image}
                            bannerImage={user.bannerImage}
                            bio={user.bio}
                            // onboarding
                            role={roleLabel}
                            domain={domainLabel}
                            experienceLevel={ob?.experienceLevel ?? null}
                            availability={availLabel}
                            mission={missionLabel}
                            // preferences
                            prefTechs={user.preferences?.prefTechs ?? []}
                            prefTopics={user.preferences?.prefTopics ?? []}
                            // projects
                            projects={cardProjects}
                            // trust
                            reliabilityScore={score}
                            builderScore={ob?.builderScore ?? 0}
                            isOwner={true}
                        />

                        {/* Builder identity section */}
                        <ProfileSection label="Builder identity">
                            {ob ? (
                                <>
                                    <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                                        {[
                                            { text: domainLabel, strong: true },
                                            { text: roleLabel, strong: true },
                                            { text: expLabel, strong: false },
                                            { text: availLabel, strong: false },
                                            ...(ob.goals ?? []).map(g => ({ text: g.replace(/_/g, " "), strong: false })),
                                        ].filter(x => x.text).map((x, i) => (
                                            <span key={i} style={{
                                                fontSize: 11, padding: "4px 10px", borderRadius: 6,
                                                border: "0.5px solid var(--border)",
                                                color: x.strong ? "var(--text)" : "var(--muted)",
                                                background: x.strong ? "var(--surface2)" : "transparent",
                                                textTransform: "capitalize",
                                            }}>
                                                {x.text}
                                            </span>
                                        ))}
                                    </div>
                                    <div style={{ marginTop: 10 }}>
                                        <Link href="/onboarding" style={{ fontSize: 11, color: "var(--muted)", textDecoration: "none" }} className="link-hover">
                                            Update onboarding →
                                        </Link>
                                    </div>
                                </>
                            ) : (
                                <div>
                                    <p style={{ fontSize: 12, color: "var(--muted)", marginBottom: 8 }}>
                                        Complete onboarding to set your builder identity.
                                    </p>
                                    <Link href="/onboarding" style={{ fontSize: 11, color: "var(--accent)", textDecoration: "none" }}>
                                        Complete setup →
                                    </Link>
                                </div>
                            )}
                        </ProfileSection>

                        {/* Achievements */}
                        <ProfileSection label="Achievements">
                            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                                {totalTerminal >= 1 && <Badge label="First task" />}
                                {(stats?.tasksCompleted ?? 0) >= 10 && <Badge label="10 tasks done" />}
                                {(stats?.tasksCompleted ?? 0) >= 30 && <Badge label="30 tasks done" />}
                                {(stats?.tasksMissed ?? 0) === 0 && totalTerminal >= 5 && <Badge label="Zero missed" />}
                                {(score ?? 0) >= 90 && totalTerminal >= 5 && <Badge label="Top performer" />}
                                {user.teams.length >= 3 && <Badge label="Multi-project" />}
                                {totalTerminal === 0 && (
                                    <p style={{ fontSize: 11, color: "var(--muted)", fontStyle: "italic", margin: 0 }}>
                                        Complete tasks to earn badges.
                                    </p>
                                )}
                            </div>
                            <Placeholder label="team leader · fast reviewer · consistency streak" />
                        </ProfileSection>
                    </div>

                    {/* ══ RIGHT ══ */}
                    <div className="prof-right">
                        <ReliabilityCard data={reliabilityData} />

                        {/* Active tasks */}
                        {user.assignedTasks.length > 0 && (
                            <ProfileSection label="Active tasks">
                                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                                    {user.assignedTasks.map(task => {
                                        const overdue = task.dueDate && new Date(task.dueDate) < new Date();
                                        return (
                                            <Link key={task.id} href={`/projects/${task.projectId}/board`} style={{ textDecoration: "none" }}>
                                                <div className="card-hover" style={{
                                                    display: "flex", alignItems: "center", gap: 10,
                                                    padding: "9px 12px", borderRadius: 8,
                                                    border: "0.5px solid var(--border)", background: "var(--surface2)",
                                                }}>
                                                    <span style={{
                                                        fontSize: 9, fontWeight: 600, padding: "2px 7px",
                                                        borderRadius: 4, textTransform: "uppercase", flexShrink: 0,
                                                        background: task.status === "IN_PROGRESS" ? "rgba(55,138,221,0.1)" : "var(--surface)",
                                                        color: task.status === "IN_PROGRESS" ? "#378ADD" : "var(--muted)",
                                                    }}>
                                                        {task.status.replace("_", " ")}
                                                    </span>
                                                    <span style={{ fontSize: 12, color: "var(--text)", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                                        {task.title}
                                                    </span>
                                                    <span style={{ fontSize: 10, color: "var(--muted)", flexShrink: 0, maxWidth: 110, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                                        {task.project.title}
                                                    </span>
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
                            </ProfileSection>
                        )}

                        {/* Project history */}
                        {user.teams.length > 0 && (
                            <ProfileSection label={`Project history (${user.teams.length})`}>
                                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                                    {user.teams.map(t => (
                                        <Link key={t.id} href={`/projects/${t.project.id}`} style={{ textDecoration: "none" }}>
                                            <div className="card-hover" style={{
                                                display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10,
                                                padding: "10px 14px", borderRadius: 8,
                                                border: "0.5px solid var(--border)", background: "var(--surface2)",
                                            }}>
                                                <div style={{ flex: 1, minWidth: 0 }}>
                                                    <p style={{ fontSize: 12, fontWeight: 500, color: "var(--text)", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                                        {t.project.title}
                                                    </p>
                                                    <p style={{ fontSize: 10, color: "var(--muted)", marginTop: 2, textTransform: "uppercase", letterSpacing: "0.04em" }}>
                                                        {t.role}
                                                    </p>
                                                </div>
                                                <span style={{
                                                    fontSize: 9, fontWeight: 600, flexShrink: 0, textTransform: "uppercase",
                                                    color: STATUS_COLORS[t.project.status] ?? "#666",
                                                }}>
                                                    {t.project.status.replace("_", " ")}
                                                </span>
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                                <Placeholder label="contribution % · owner feedback · demo links" />
                            </ProfileSection>
                        )}

                        <ProfileSection label="Contribution timeline">
                            <Placeholder label="activity graph · task streaks · reviews done · teams formed" />
                        </ProfileSection>

                        <ProfileSection label="Team reputation">
                            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8, marginBottom: 10 }}>
                                {["Communication", "Execution", "Ownership"].map(r => (
                                    <div key={r} style={{ padding: "10px 8px", borderRadius: 8, border: "0.5px solid var(--border)", background: "var(--surface2)", textAlign: "center" }}>
                                        <p style={{ fontSize: 15, fontWeight: 700, color: "var(--muted)", margin: 0 }}>—</p>
                                        <p style={{ fontSize: 9, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.05em", marginTop: 3 }}>{r}</p>
                                    </div>
                                ))}
                            </div>
                            <Placeholder label="structured ratings from teammates · project owner feedback" />
                        </ProfileSection>

                        <ProfileSection label="Links">
                            <Placeholder label="GitHub · LinkedIn · portfolio · Twitter/X" />
                        </ProfileSection>

                        {user.teams.length === 0 && user.assignedTasks.length === 0 && (
                            <div style={{ padding: "32px 20px", borderRadius: 10, border: "0.5px dashed var(--border)", display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
                                <p style={{ fontSize: 13, color: "var(--muted)" }}>No project activity yet.</p>
                                <Link href="/projects" style={{ fontSize: 12, color: "var(--accent)", textDecoration: "none" }}>
                                    Browse projects →
                                </Link>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function ProfileSection({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <div style={{ border: "0.5px solid var(--border)", borderRadius: 10, background: "var(--surface)", overflow: "hidden" }}>
            <div style={{ padding: "11px 16px", borderBottom: "0.5px solid var(--border)" }}>
                <p style={{ fontSize: 10, fontWeight: 500, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.08em", margin: 0 }}>
                    {label}
                </p>
            </div>
            <div style={{ padding: "14px 16px" }}>{children}</div>
        </div>
    );
}

function Badge({ label }: { label: string }) {
    return (
        <span style={{
            fontSize: 11, padding: "4px 10px", borderRadius: 6,
            border: "0.5px solid var(--border)", color: "var(--text)", background: "var(--surface2)",
        }}>
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