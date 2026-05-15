import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import ProfileCard from "@/components/profile/ProfileCard";
import ReliabilityCard from "@/components/profile/ReliabilityCard";
import { getReliabilityTier } from "@/lib/scoring";
import AddFriendButton from "./AddFriendButton";
import BlockButton from "./BlockButton";

// Next.js 15+: params is a Promise — must be awaited
export default async function UserProfilePage({
    params,
}: {
    params: Promise<{ userId: string }>;
}) {
    const { userId } = await params;

    const session = await getServerSession(authOptions);
    if (!session) redirect("/login");

    // Viewing own profile → redirect to /profile
    if (userId === session.user.id) redirect("/profile");

    // Guard against undefined/empty userId before hitting DB
    if (!userId) redirect("/dashboard");

    const user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
            stats: true,
            onboarding: true,
            teams: {
                include: {
                    project: { select: { id: true, title: true, status: true } },
                },
                orderBy: { id: "desc" },
                take: 10,
            },
            assignedTasks: {
                where: { status: { in: ["TODO", "IN_PROGRESS", "SUBMITTED"] } },
                include: { project: { select: { id: true, title: true } } },
                orderBy: { dueDate: "asc" },
                take: 5,
            },
        },
    });

    if (!user) redirect("/dashboard");

    // Check if viewer has blocked this user (or vice versa)
    const blockRecord = await prisma.block.findFirst({
        where: {
            OR: [
                { blockerId: session.user.id, blockedId: userId },
                { blockerId: userId, blockedId: session.user.id },
            ],
        },
        select: { blockerId: true },
    });
    const viewerHasBlocked = blockRecord?.blockerId === session.user.id;

    const stats = user.stats;
    const ob = user.onboarding;
    const score = stats?.reliabilityScore ?? 100;
    const totalTerminal = stats
        ? stats.tasksCompleted + stats.tasksLate + stats.tasksMissed + stats.tasksRejected
        : 0;

    const cardProjects = user.teams.map(t => ({
        id: t.project.id,
        title: t.project.title,
        status: t.project.status,
        role: t.role,
    }));

    const reliabilityData = {
        reliabilityScore: stats?.reliabilityScore ?? 100,
        onTimeRate: stats?.onTimeRate ?? 100,
        tasksCompleted: stats?.tasksCompleted ?? 0,
        tasksLate: stats?.tasksLate ?? 0,
        tasksMissed: stats?.tasksMissed ?? 0,
        tasksRejected: stats?.tasksRejected ?? 0,
    };

    const domainLabel = ob?.domain?.replace(/_/g, " ") ?? null;
    const roleLabel = ob?.role?.replace(/_/g, " ") ?? null;
    const expLabel = ob?.experienceLevel
        ? ob.experienceLevel.charAt(0) + ob.experienceLevel.slice(1).toLowerCase()
        : null;
    const availLabel = ob?.availability
        ? (({ WEEKEND: "Weekends only", LIGHT: "Light — 1–2 hrs/day", MODERATE: "Moderate — 3–5 hrs/day", FULLTIME: "Full-time" }) as Record<string, string>)[ob.availability] ?? ob.availability
        : null;
    const missionLabel = ob?.mission
        ? (({ JOIN_PROJECT: "Looking to join projects", START_PROJECT: "Building my own project", FIND_TEAM: "Finding a team" }) as Record<string, string>)[ob.mission] ?? ob.mission
        : null;

    const STATUS_COLORS: Record<string, string> = {
        OPEN: "#22c55e", IN_PROGRESS: "#378ADD", CLOSED: "#666",
        COMPLETED: "#639922", TERMINATED: "#e24b4a",
    };

    return (
        <>
            <style>{`
                .user-prof-wrap  { width: 100%; margin: 0 auto; padding: 20px 16px 60px; }
                .user-prof-grid  { display: grid; grid-template-columns: 320px 1fr; gap: 16px; align-items: start; }
                .user-prof-left  { display: flex; flex-direction: column; gap: 12px; }
                .user-prof-right { display: flex; flex-direction: column; gap: 12px; min-width: 0; }
                @media (max-width: 880px) {
                    .user-prof-grid { grid-template-columns: 1fr; }
                }
            `}</style>

            <div className="user-prof-wrap">

                <div className="user-prof-grid">

                    {/* ══ LEFT COLUMN ══ */}
                    <div className="user-prof-left">

                        {/* ProfileCard — visitor perspective, no edit options */}
                        <ProfileCard
                            name={user.name ?? "Builder"}
                            email={user.email}
                            image={user.image}
                            role={roleLabel}
                            domain={domainLabel}
                            experienceLevel={ob?.experienceLevel ?? null}
                            availability={availLabel}
                            mission={missionLabel}
                            location={null}
                            timezone={null}
                            projects={cardProjects}
                            reliabilityScore={score}
                            builderScore={ob?.builderScore}
                            isOwner={false}
                        />

                        {/* Social action buttons */}
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                            <AddFriendButton targetUserId={userId} />
                            <BlockButton targetUserId={userId} isBlocked={viewerHasBlocked} />
                        </div>

                        {/* Builder identity */}
                        {ob && (
                            <Section label="Builder identity">
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
                            </Section>
                        )}

                        {/* Achievements */}
                        <Section label="Achievements">
                            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                                {totalTerminal >= 1 && <Badge label="First task" />}
                                {(stats?.tasksCompleted ?? 0) >= 10 && <Badge label="10 tasks done" />}
                                {(stats?.tasksCompleted ?? 0) >= 30 && <Badge label="30 tasks done" />}
                                {(stats?.tasksMissed ?? 0) === 0 && totalTerminal >= 5 && <Badge label="Zero missed" />}
                                {score >= 90 && totalTerminal >= 5 && <Badge label="Top performer" />}
                                {user.teams.length >= 3 && <Badge label="Multi-project" />}
                                {totalTerminal === 0 && (
                                    <p style={{ fontSize: 11, color: "var(--muted)", fontStyle: "italic", margin: 0 }}>
                                        No achievements yet.
                                    </p>
                                )}
                            </div>
                        </Section>

                    </div>

                    {/* ══ RIGHT COLUMN ══ */}
                    <div className="user-prof-right">

                        <ReliabilityCard data={reliabilityData} />

                        {/* Project history */}
                        {user.teams.length > 0 && (
                            <Section label={`Project history (${user.teams.length})`}>
                                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                                    {user.teams.map(t => (
                                        <Link key={t.id} href={`/projects/${t.project.id}`} style={{ textDecoration: "none" }}>
                                            <div className="card-hover" style={{
                                                display: "flex", alignItems: "center",
                                                justifyContent: "space-between", gap: 10,
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
                                                <span style={{ fontSize: 9, fontWeight: 600, flexShrink: 0, textTransform: "uppercase", color: STATUS_COLORS[t.project.status] ?? "#666" }}>
                                                    {t.project.status.replace("_", " ")}
                                                </span>
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            </Section>
                        )}

                        {/* Team reputation */}
                        <Section label="Team reputation">
                            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
                                {["Communication", "Execution", "Ownership"].map(r => (
                                    <div key={r} style={{ padding: "10px 8px", borderRadius: 8, border: "0.5px solid var(--border)", background: "var(--surface2)", textAlign: "center" }}>
                                        <p style={{ fontSize: 15, fontWeight: 700, color: "var(--muted)", margin: 0 }}>—</p>
                                        <p style={{ fontSize: 9, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.05em", marginTop: 3 }}>{r}</p>
                                    </div>
                                ))}
                            </div>
                        </Section>

                        {user.teams.length === 0 && (
                            <div style={{ padding: "32px 20px", borderRadius: 10, border: "0.5px dashed var(--border)", display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
                                <p style={{ fontSize: 13, color: "var(--muted)" }}>No project activity yet.</p>
                            </div>
                        )}

                    </div>
                </div>
            </div>
        </>
    );
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function Section({ label, children }: { label: string; children: React.ReactNode }) {
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
        <span style={{ fontSize: 11, padding: "4px 10px", borderRadius: 6, border: "0.5px solid var(--border)", color: "var(--text)", background: "var(--surface2)" }}>
            {label}
        </span>
    );
}