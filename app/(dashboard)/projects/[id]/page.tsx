import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import JoinRequestButton from "./JoinRequestButton";
import ProjectStatusControl from "../ProjectStatusControl";
import CopyButton from "./CopyButton";
import AccordionSections from "./AccordionSections";

export default async function ProjectDetailPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const session = await getServerSession(authOptions);
    if (!session) redirect("/login");

    const { id } = await params;

    const project = await prisma.project.findUnique({
        where: { id },
        include: {
            applicants: {
                include: { user: { select: { id: true, name: true, email: true, image: true } } },
                orderBy: { createdAt: "desc" },
            },
            teams: {
                include: { user: { select: { id: true, name: true, image: true } } },
            },
        },
    });

    if (!project) notFound();

    const isOwner = project.createdBy === session.user.id;
    const hasApplied = project.applicants.some(a => a.userId === session.user.id);
    const isTeamMember = project.teams.some(t => t.userId === session.user.id);

    const STATUS_COLORS: Record<string, string> = {
        OPEN: "#22c55e", IN_PROGRESS: "#378ADD", CLOSED: "#666",
        COMPLETED: "#639922", TERMINATED: "#e24b4a",
    };

    return (
        /*
            max-w-5xl + mx-auto: content is nicely centered on wide screens,
            fills the space on tablet, and is full-width on mobile.
            p-5 md:p-8 gives breathing room.
        */
        <div className="w-full mx-auto p-5 md:p-8">

            {/* Top nav */}
            <div className="flex items-center justify-between flex-wrap gap-3 mb-6">
                <Link href="/projects" className="text-xs text-[var(--muted)] hover:text-[var(--text)] no-underline transition-colors">
                    ← Back to projects
                </Link>
                <Link
                    href={`/projects/${project.id}/board`}
                    className="px-3 py-1.5 text-xs rounded-lg border border-[var(--border)] text-[var(--muted)] hover:border-[var(--accent)] hover:text-[var(--text)] transition-colors no-underline"
                >
                    View board →
                </Link>
            </div>

            {/* Header */}
            <div className="mb-8">
                <div className="w-7 h-0.5 bg-[var(--accent)] mb-4" />
                <div className="flex items-start justify-between flex-wrap gap-4">
                    <div>
                        <div className="flex items-center gap-2.5 mb-1.5 flex-wrap">
                            <h1 className="text-xl font-medium text-[var(--text)]">{project.title}</h1>
                            <span style={{
                                fontSize: "10px", padding: "3px 10px", borderRadius: "20px",
                                border: `0.5px solid ${STATUS_COLORS[project.status] ?? "#666"}`,
                                color: STATUS_COLORS[project.status] ?? "#666",
                                textTransform: "uppercase", letterSpacing: "0.04em",
                            }}>{project.status}</span>
                        </div>
                        <p className="text-xs text-[var(--muted)]">
                            Created {new Date(project.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}
                        </p>
                    </div>
                    {isOwner && (
                        <ProjectStatusControl projectId={project.id} currentStatus={project.status} />
                    )}
                </div>
            </div>

            {/*
                Two-column layout:
                - Mobile:  stacked (main content first, Details below)
                - Desktop: [main flex-1] | [details sidebar w-56 sticky]
            */}
            <div className="flex flex-col md:flex-row gap-5 md:gap-7 items-start">

                {/* ── MAIN CONTENT ── */}
                <div className="flex flex-col gap-4 w-full min-w-0 flex-1">

                    {/* About */}
                    <div className="p-5 rounded-xl border border-[var(--border)] bg-[var(--surface)]">
                        <p className="text-xs font-medium text-[var(--text)] mb-2.5">About</p>
                        <p className="text-sm text-[var(--muted)] leading-relaxed">{project.description}</p>
                    </div>

                    {/* Tech stack — shown if present */}
                    {project.techStack && project.techStack.length > 0 && (
                        <div className="p-5 rounded-xl border border-[var(--border)] bg-[var(--surface)]">
                            <p className="text-xs font-medium text-[var(--text)] mb-3">Tech stack</p>
                            <div className="flex flex-wrap gap-2">
                                {project.techStack.map((t: string) => (
                                    <span key={t} className="text-[10px] px-2.5 py-1 rounded-lg border border-[var(--border)] text-[var(--muted)] bg-[var(--surface2)]">
                                        {t}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Team + Join requests — accordion (only one open at a time) */}
                    <AccordionSections
                        teams={project.teams}
                        isOwner={isOwner}
                        initialApplicants={project.applicants}
                        projectId={project.id}
                        projectTitle={project.title}
                    />

                    {/* Community link */}
                    {project.communityGroupId && (
                        <Link
                            href={`/community/${project.communityGroupId}`}
                            className="flex items-center justify-between p-4 rounded-xl border border-[var(--border)] bg-[var(--surface)] no-underline hover:border-[var(--muted)] transition-colors"
                        >
                            <div>
                                <p className="text-sm font-medium text-[var(--text)] mb-0.5">Project community</p>
                                <p className="text-xs text-[var(--muted)]">Open group chat →</p>
                            </div>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--muted)" strokeWidth="1.5">
                                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                            </svg>
                        </Link>
                    )}

                    {/* Join CTA */}
                    {!isOwner && !isTeamMember && (
                        <div className="p-5 rounded-xl border border-[var(--border)] bg-[var(--surface)]">
                            {project.status === "OPEN" ? (
                                <>
                                    <p className="text-sm font-medium text-[var(--text)] mb-1.5">
                                        {hasApplied ? "Request sent" : "Join this project"}
                                    </p>
                                    <p className="text-xs text-[var(--muted)] leading-relaxed mb-3">
                                        {hasApplied ? "Your request is pending review." : "Send a request to collaborate."}
                                    </p>
                                    {!hasApplied
                                        ? <JoinRequestButton projectId={project.id} projectTitle={project.title} />
                                        : <div className="py-2 px-3 rounded-lg text-xs border border-[var(--border)] text-[var(--muted)] bg-[var(--surface2)] text-center">Pending ···</div>
                                    }
                                </>
                            ) : (
                                <div className="text-center">
                                    <p className="text-sm font-medium text-[var(--muted)] mb-1.5">
                                        {project.status === "TERMINATED" ? "Project terminated" : "Not accepting members"}
                                    </p>
                                    <p className="text-xs text-[var(--muted)] leading-relaxed">
                                        This project is {project.status.toLowerCase()} and not accepting new contributors.
                                    </p>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* ── DETAILS SIDEBAR ── sticky on desktop, full-width on mobile ── */}
                <div className="w-full md:w-56 md:flex-shrink-0 md:sticky md:top-6">
                    <div className="p-5 rounded-xl border border-[var(--border)] bg-[var(--surface)]">
                        <p className="text-xs font-medium text-[var(--text)] mb-3">Details</p>
                        <div className="flex flex-col gap-2.5">
                            {[
                                { label: "Status", value: project.status },
                                { label: "Difficulty", value: project.difficulty ?? "—" },
                                { label: "Type", value: project.projectType ?? "—" },
                                { label: "Time", value: project.estimatedDuration ?? "—" },
                                { label: "Applicants", value: String(project.applicants.length) },
                                { label: "Team size", value: String(project.teams.length) },
                            ].map(d => (
                                <div key={d.label} className="flex items-center justify-between gap-2">
                                    <span className="text-xs text-[var(--muted)]">{d.label}</span>
                                    <span className="text-xs text-[var(--text)] font-medium text-right truncate max-w-[120px]">{d.value}</span>
                                </div>
                            ))}

                            {/* External links */}
                            {(project.liveUrl || project.repoUrl) && (
                                <div className="border-t border-[var(--border)] pt-2.5 mt-1 flex flex-col gap-1.5">
                                    {project.liveUrl && (
                                        <a href={project.liveUrl} target="_blank" rel="noopener noreferrer"
                                            className="text-xs text-[var(--accent)] no-underline hover:underline truncate">
                                            ↗ Live project
                                        </a>
                                    )}
                                    {project.repoUrl && (
                                        <a href={project.repoUrl} target="_blank" rel="noopener noreferrer"
                                            className="text-xs text-[var(--accent)] no-underline hover:underline truncate">
                                            ↗ Repository
                                        </a>
                                    )}
                                </div>
                            )}

                            <div className="border-t border-[var(--border)] pt-2.5 mt-1">
                                <p className="text-[10px] text-[var(--muted)] mb-1.5 uppercase tracking-wider">Project ID</p>
                                <CopyButton text={project.id} displayText={project.id.slice(0, 8).toUpperCase()} />
                            </div>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}