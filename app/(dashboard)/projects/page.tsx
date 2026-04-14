import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import ProjectStatusControl from "./ProjectStatusControl";

export default async function ProjectsPage() {
    const session = await getServerSession(authOptions);
    if (!session) redirect("/login");

    const projects = await prisma.project.findMany({
        orderBy: { createdAt: "desc" },
        include: { _count: { select: { applicants: true } } },
    });

    const STATUS_COLORS: Record<string, string> = {
        OPEN: "#22c55e",
        IN_PROGRESS: "#378ADD",
        CLOSED: "#666",
        COMPLETED: "#639922",
        TERMINATED: "#e24b4a",
    };

    return (
        <div style={{ maxWidth: "780px" }}>
            <div style={{ width: "28px", height: "2px", background: "var(--accent)", marginBottom: "1rem" }} />
            <div style={{
                display: "flex", alignItems: "flex-end",
                justifyContent: "space-between", marginBottom: "2rem",
                flexWrap: "wrap", gap: "10px",
            }}>
                <div>
                    <h1 style={{ fontSize: "21px", fontWeight: 500, color: "var(--text)", marginBottom: "4px" }}>
                        Projects
                    </h1>
                    <p style={{ fontSize: "13px", color: "var(--muted)" }}>
                        Commit to a project. Ship it. No half-finished demos.
                    </p>
                </div>
                <Link href="/projects/new" style={{
                    padding: "8px 16px", borderRadius: "7px", fontSize: "13px",
                    background: "var(--accent)", color: "var(--bg)",
                    fontWeight: 500, textDecoration: "none",
                    display: "inline-flex", alignItems: "center", gap: "6px",
                }}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
                    </svg>
                    New project
                </Link>
            </div>

            {projects.length === 0 ? (
                <div style={{
                    padding: "3rem", borderRadius: "11px",
                    border: "0.5px solid var(--border)", background: "var(--surface)",
                    textAlign: "center",
                }}>
                    <div style={{ width: "28px", height: "2px", background: "var(--border)", margin: "0 auto 1rem" }} />
                    <p style={{ fontSize: "14px", fontWeight: 500, color: "var(--text)", marginBottom: "6px" }}>
                        No projects yet
                    </p>
                    <p style={{ fontSize: "13px", color: "var(--muted)" }}>Be the first to create one.</p>
                </div>
            ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                    {projects.map(p => {
                        const isOwner = p.createdBy === session.user.id;
                        const statusColor = STATUS_COLORS[p.status] ?? "#666";
                        return (
                            <div key={p.id} style={{
                                padding: "1.125rem 1.375rem", borderRadius: "10px",
                                border: "0.5px solid var(--border)", background: "var(--surface)",
                            }}>
                                {/* Header row */}
                                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "1rem", flexWrap: "wrap", marginBottom: "8px" }}>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px", flexWrap: "wrap" }}>
                                            <p style={{ fontSize: "14px", fontWeight: 500, color: "var(--text)" }}>{p.title}</p>
                                            <span style={{
                                                fontSize: "10px", padding: "2px 8px", borderRadius: "20px",
                                                border: `0.5px solid ${statusColor}`,
                                                color: statusColor,
                                                textTransform: "uppercase", letterSpacing: "0.04em",
                                            }}>
                                                {p.status}
                                            </span>
                                        </div>
                                        <p style={{ fontSize: "12px", color: "var(--muted)", lineHeight: 1.5 }}>
                                            {p.description}
                                        </p>
                                    </div>
                                </div>

                                {/* Footer row */}
                                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "8px" }}>
                                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                                        <span style={{ fontSize: "11px", color: "var(--muted)" }}>
                                            {p._count.applicants} applicant{p._count.applicants !== 1 ? "s" : ""}
                                        </span>
                                        {isOwner && (
                                            <span style={{
                                                fontSize: "10px", padding: "2px 7px", borderRadius: "4px",
                                                background: "var(--surface2)", border: "0.5px solid var(--border)",
                                                color: "var(--muted)",
                                            }}>
                                                Your project
                                            </span>
                                        )}
                                    </div>
                                    <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                                        {isOwner && (
                                            <ProjectStatusControl
                                                projectId={p.id}
                                                currentStatus={p.status}
                                            />
                                        )}
                                        <Link href={`/projects/${p.id}`} style={{
                                            padding: "6px 14px", borderRadius: "7px", fontSize: "12px",
                                            border: "0.5px solid var(--border)", color: "var(--muted)",
                                            textDecoration: "none",
                                        }}>
                                            View →
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}