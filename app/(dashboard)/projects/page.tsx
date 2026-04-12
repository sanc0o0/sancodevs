import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";

export default async function ProjectsPage() {
    const session = await getServerSession(authOptions);
    if (!session) redirect("/login");

    const projects = await prisma.project.findMany({
        orderBy: { createdAt: "desc" },
        take: 20,
    });

    return (
        <div style={{ maxWidth: "780px" }}>
            <div style={{ width: "28px", height: "2px", background: "var(--accent)", marginBottom: "1rem" }} />
            <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: "2rem" }}>
                <div>
                    <h1 style={{ fontSize: "21px", fontWeight: 500, color: "var(--text)", marginBottom: "4px" }}>
                        Projects
                    </h1>
                    <p style={{ fontSize: "13px", color: "var(--muted)" }}>
                        Commit to a project. Ship it. No half-finished demos.
                    </p>
                </div>
                <CreateProjectButton />
            </div>

            {projects.length === 0 ? (
                <EmptyState />
            ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                    {projects.map(p => (
                        <div key={p.id} style={{
                            padding: "1.125rem 1.375rem", borderRadius: "10px",
                            border: "0.5px solid var(--border)", background: "var(--surface)",
                            display: "flex", alignItems: "center", justifyContent: "space-between",
                            gap: "1rem",
                        }}>
                            <div style={{ flex: 1 }}>
                                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                                    <p style={{ fontSize: "14px", fontWeight: 500, color: "var(--text)" }}>
                                        {p.title}
                                    </p>
                                    <span style={{
                                        fontSize: "10px", padding: "2px 7px", borderRadius: "20px",
                                        border: "0.5px solid var(--border)", color: "var(--muted)",
                                        textTransform: "uppercase", letterSpacing: "0.04em",
                                    }}>
                                        {p.status}
                                    </span>
                                </div>
                                <p style={{ fontSize: "12px", color: "var(--muted)", lineHeight: 1.5 }}>
                                    {p.description}
                                </p>
                            </div>
                            <ApplyButton projectId={p.id} />
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

function EmptyState() {
    return (
        <div style={{
            padding: "3rem", borderRadius: "11px",
            border: "0.5px solid var(--border)", background: "var(--surface)",
            textAlign: "center",
        }}>
            <div style={{ width: "28px", height: "2px", background: "var(--border)", margin: "0 auto 1rem" }} />
            <p style={{ fontSize: "14px", fontWeight: 500, color: "var(--text)", marginBottom: "6px" }}>
                No projects yet
            </p>
            <p style={{ fontSize: "13px", color: "var(--muted)" }}>
                Be the first to create one.
            </p>
        </div>
    );
}

function CreateProjectButton() {
    return (
        <a href="/projects/new" style={{
            padding: "8px 16px", borderRadius: "7px", fontSize: "13px",
            background: "var(--accent)", color: "var(--bg)",
            fontWeight: 500, textDecoration: "none",
            display: "inline-flex", alignItems: "center", gap: "6px",
        }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            New project
        </a>
    );
}

function ApplyButton({ projectId }: { projectId: string }) {
    return (
        <a href={`/projects/${projectId}`} style={{
            padding: "7px 14px", borderRadius: "7px", fontSize: "12px",
            border: "0.5px solid var(--border)", color: "var(--muted)",
            textDecoration: "none", whiteSpace: "nowrap", transition: "all 0.15s",
            background: "transparent",
        }}>
            View →
        </a>
    );
}