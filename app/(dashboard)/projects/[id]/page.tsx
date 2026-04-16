import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import JoinRequestButton from "./JoinRequestButton";
import ProjectStatusControl from "../ProjectStatusControl";

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
        <div style={{ maxWidth: "780px" }}>
            <div className="flex items-center justify-between flex-wrap gap-3 mb-6">

                {/* Left: Back */}
                <Link
                    href="/projects"
                    className="text-xs text-[var(--muted)] hover:text-[var(--text)] no-underline transition-colors"
                >
                    ← Back to projects
                </Link>

                {/* Right: Actions */}
                <div className="flex items-center gap-2">
                    <Link
                        href={`/projects/${project.id}/board`}
                        className="px-3 py-1.5 text-xs rounded-lg border border-[var(--border)] text-[var(--muted)] hover:border-[var(--accent)] hover:text-[var(--text)] transition-colors no-underline"
                    >
                        View board →
                    </Link>
                </div>

            </div>

            {/* Header */}
            <div style={{ marginBottom: "2rem" }}>
                <div style={{ width: "28px", height: "2px", background: "var(--accent)", marginBottom: "1rem" }} />
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: "1rem" }}>
                    <div>
                        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "6px", flexWrap: "wrap" }}>
                            <h1 style={{ fontSize: "22px", fontWeight: 500, color: "var(--text)" }}>{project.title}</h1>
                            <span style={{
                                fontSize: "10px", padding: "3px 10px", borderRadius: "20px",
                                border: `0.5px solid ${STATUS_COLORS[project.status] ?? "#666"}`,
                                color: STATUS_COLORS[project.status] ?? "#666",
                                textTransform: "uppercase", letterSpacing: "0.04em",
                            }}>{project.status}</span>
                        </div>
                        <p style={{ fontSize: "13px", color: "var(--muted)" }}>
                            Created {new Date(project.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}
                        </p>
                    </div>
                    {isOwner && (
                        <ProjectStatusControl projectId={project.id} currentStatus={project.status} />
                    )}
                </div>
            </div>

            <div className="project-grid" style={{
                display: "grid",
                gridTemplateColumns: "minmax(0, 1.5fr) minmax(0, 280px)",
                gap: "1rem", alignItems: "start",
            }}>

                {/* Left */}
                <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>

                    {/* Description */}
                    <div style={{ padding: "1.375rem", borderRadius: "11px", border: "0.5px solid var(--border)", background: "var(--surface)" }}>
                        <p style={{ fontSize: "12px", fontWeight: 500, color: "var(--text)", marginBottom: "10px" }}>About</p>
                        <p style={{ fontSize: "14px", color: "var(--muted)", lineHeight: 1.8 }}>{project.description}</p>
                    </div>

                    {/* Team members */}
                    {project.teams.length > 0 && (
                        <div style={{ padding: "1.375rem", borderRadius: "11px", border: "0.5px solid var(--border)", background: "var(--surface)" }}>
                            <p style={{ fontSize: "12px", fontWeight: 500, color: "var(--text)", marginBottom: "12px" }}>
                                Team ({project.teams.length})
                            </p>
                            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                                {project.teams.map(t => (
                                    <div key={t.id} style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                                        <div style={{
                                            width: "32px", height: "32px", borderRadius: "50%",
                                            background: "var(--surface2)", border: "0.5px solid var(--border)",
                                            overflow: "hidden", flexShrink: 0,
                                            display: "flex", alignItems: "center", justifyContent: "center",
                                        }}>
                                            {t.user.image
                                                ? <img src={t.user.image} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                                                : <span style={{ fontSize: "11px", color: "var(--text)" }}>{t.user.name?.charAt(0)}</span>
                                            }
                                        </div>
                                        <div>
                                            <p style={{ fontSize: "13px", color: "var(--text)" }}>{t.user.name}</p>
                                            <p style={{ fontSize: "11px", color: "var(--muted)" }}>{t.role}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Owner: applicants list */}
                    {isOwner && project.applicants.length > 0 && (
                        <div style={{ borderRadius: "11px", border: "0.5px solid var(--border)", background: "var(--surface)", overflow: "hidden" }}>
                            <div style={{ padding: "1rem 1.375rem", borderBottom: "0.5px solid var(--border)" }}>
                                <p style={{ fontSize: "12px", fontWeight: 500, color: "var(--text)" }}>
                                    Join requests ({project.applicants.length})
                                </p>
                            </div>
                            {project.applicants.map((a, i) => (
                                <ApplicantRow
                                    key={a.id}
                                    applicant={a}
                                    isLast={i === project.applicants.length - 1}
                                    projectId={project.id}
                                    projectTitle={project.title}
                                />
                            ))}
                        </div>
                    )}
                </div>

                {/* Right sidebar */}
                <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                    
                    {project.communityGroupId && (
                        <Link href={`/community/${project.communityGroupId}`} style={{
                            display: "flex", alignItems: "center", justifyContent: "space-between",
                            padding: "1rem 1.25rem", borderRadius: "10px",
                            border: "0.5px solid var(--border)", background: "var(--surface)",
                            textDecoration: "none",
                        }}>
                            <div>
                                <p style={{ fontSize: "13px", fontWeight: 500, color: "var(--text)", marginBottom: "2px" }}>
                                    Project community
                                </p>
                                <p style={{ fontSize: "11px", color: "var(--muted)" }}>
                                    Open group chat →
                                </p>
                            </div>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--muted)" strokeWidth="1.5">
                                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                            </svg>
                        </Link>
                    )}

                    {/* Join CTA */}
                    {!isOwner && !isTeamMember && (
                        <div style={{ padding: "1.25rem", borderRadius: "11px", border: "0.5px solid var(--border)", background: "var(--surface)" }}>
                            {project.status === "OPEN" ? (
                                <>
                                    <p style={{ fontSize: "13px", fontWeight: 500, color: "var(--text)", marginBottom: "6px" }}>
                                        {hasApplied ? "Request sent" : "Join this project"}
                                    </p>
                                    <p style={{ fontSize: "12px", color: "var(--muted)", lineHeight: 1.6, marginBottom: "12px" }}>
                                        {hasApplied ? "Your request is pending review." : "Send a request to collaborate."}
                                    </p>
                                    {!hasApplied
                                        ? <JoinRequestButton projectId={project.id} projectTitle={project.title} />
                                        : <div style={{ padding: "8px 12px", borderRadius: "7px", fontSize: "12px", border: "0.5px solid var(--border)", color: "var(--muted)", background: "var(--surface2)", textAlign: "center" }}>Pending ···</div>
                                    }
                                </>
                            ) : (
                                <div style={{ textAlign: "center" }}>
                                    <p style={{ fontSize: "13px", fontWeight: 500, color: "var(--muted)", marginBottom: "6px" }}>
                                        {project.status === "TERMINATED" ? "Project terminated" : "Not accepting members"}
                                    </p>
                                    <p style={{ fontSize: "12px", color: "var(--muted)", lineHeight: 1.6 }}>
                                        This project is {project.status.toLowerCase()} and not accepting new contributors.
                                    </p>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Project info */}
                    <div style={{ padding: "1.25rem", borderRadius: "11px", border: "0.5px solid var(--border)", background: "var(--surface)" }}>
                        <p style={{ fontSize: "12px", fontWeight: 500, color: "var(--text)", marginBottom: "12px" }}>Details</p>
                        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                            {[
                                { label: "Status", value: project.status },
                                { label: "Applicants", value: String(project.applicants.length) },
                                { label: "Team size", value: String(project.teams.length) },
                            ].map(d => (
                                <div key={d.label} style={{ display: "flex", justifyContent: "space-between" }}>
                                    <span style={{ fontSize: "12px", color: "var(--muted)" }}>{d.label}</span>
                                    <span style={{ fontSize: "12px", color: "var(--text)", fontWeight: 500 }}>{d.value}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function ApplicantRow({ applicant, isLast, projectId, projectTitle }: {
    applicant: {
        id: string; userId: string; message: string | null; status: string; createdAt: Date;
        user: { id: string; name: string | null; email: string; image: string | null };
    };
    isLast: boolean;
    projectId: string;
    projectTitle: string;
}) {
    return (
        <div style={{
            padding: "1rem 1.375rem",
            borderBottom: isLast ? "none" : "0.5px solid var(--border)",
            display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap",
        }}>
            <div style={{
                width: "36px", height: "36px", borderRadius: "50%",
                background: "var(--surface2)", border: "0.5px solid var(--border)",
                overflow: "hidden", flexShrink: 0,
                display: "flex", alignItems: "center", justifyContent: "center",
            }}>
                {applicant.user.image
                    ? <img src={applicant.user.image} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    : <span style={{ fontSize: "12px", color: "var(--text)" }}>{applicant.user.name?.charAt(0)}</span>
                }
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: "13px", color: "var(--text)", marginBottom: "2px" }}>{applicant.user.name}</p>
                <p style={{ fontSize: "11px", color: "var(--muted)" }}>{applicant.user.email}</p>
                {applicant.message && (
                    <p style={{ fontSize: "12px", color: "var(--muted)", marginTop: "4px", lineHeight: 1.5 }}>
                        &quot;{applicant.message}&quot;
                    </p>
                )}
            </div>
            <ApplicantActions
                applicationId={applicant.id}
                userId={applicant.userId}
                projectId={projectId}
                currentStatus={applicant.status}
                userName={applicant.user.name ?? "Someone"}
                userEmail={applicant.user.email}
                projectTitle={projectTitle}
            />
        </div>
    );
}

import ApplicantActions from "./ApplicantActions";