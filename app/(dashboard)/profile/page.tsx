import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { PATHS } from "@/lib/path";

export default async function ProfilePage() {
    const session = await getServerSession(authOptions);
    if (!session) redirect("/login");

    const [onboarding, progress, applications] = await Promise.all([
        prisma.userOnboarding.findUnique({ where: { userId: session.user.id } }),
        prisma.userProgress.findMany({ where: { userId: session.user.id } }),
        prisma.application.findMany({ where: { userId: session.user.id } }),
    ]);

    const path = onboarding ? PATHS[onboarding.pathId] : null;
    const totalModules = path?.modules.length ?? 0;
    const completedModules = progress.length;
    const percent = totalModules > 0 ? Math.round((completedModules / totalModules) * 100) : 0;

    const initials = session.user.name
        ?.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2) ?? "?";

    return (
        <div style={{ maxWidth: "680px" }}>
            <div style={{ width: "28px", height: "2px", background: "var(--accent)", marginBottom: "1rem" }} />
            <h1 style={{ fontSize: "21px", fontWeight: 500, color: "var(--text)", marginBottom: "2rem" }}>
                Profile
            </h1>

            {/* User card */}
            <div style={{
                border: "0.5px solid var(--border)", borderRadius: "11px",
                background: "var(--surface)", padding: "1.5rem",
                display: "flex", alignItems: "center", gap: "1rem",
                marginBottom: "1rem",
            }}>
                {session.user.image ? (
                    <img src={session.user.image} alt={session.user.name ?? ""}
                        style={{ width: "48px", height: "48px", borderRadius: "50%", objectFit: "cover" }}
                    />
                ) : (
                    <div style={{
                        width: "48px", height: "48px", borderRadius: "50%",
                        background: "var(--surface2)", border: "0.5px solid var(--border)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: "16px", fontWeight: 500, color: "var(--text)",
                    }}>
                        {initials}
                    </div>
                )}
                <div>
                    <p style={{ fontSize: "15px", fontWeight: 500, color: "var(--text)", marginBottom: "2px" }}>
                        {session.user.name}
                    </p>
                    <p style={{ fontSize: "12px", color: "var(--muted)" }}>{session.user.email}</p>
                </div>
                <div style={{ marginLeft: "auto" }}>
                    <span style={{
                        fontSize: "11px", padding: "3px 10px", borderRadius: "20px",
                        border: "0.5px solid var(--border)", color: "var(--muted)",
                    }}>
                        {session.user.role ?? "USER"}
                    </span>
                </div>
            </div>

            {/* Stats row */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "8px", marginBottom: "1rem" }}>
                {[
                    { label: "Modules done", value: completedModules },
                    { label: "Path progress", value: `${percent}%` },
                    { label: "Applications", value: applications.length },
                ].map(stat => (
                    <div key={stat.label} style={{
                        padding: "1rem", borderRadius: "9px",
                        border: "0.5px solid var(--border)", background: "var(--surface)",
                        textAlign: "center",
                    }}>
                        <p style={{ fontSize: "22px", fontWeight: 500, color: "var(--text)", marginBottom: "4px" }}>
                            {stat.value}
                        </p>
                        <p style={{ fontSize: "11px", color: "var(--muted)" }}>{stat.label}</p>
                    </div>
                ))}
            </div>

            {/* Current path */}
            {path && (
                <div style={{
                    border: "0.5px solid var(--border)", borderRadius: "11px",
                    background: "var(--surface)", overflow: "hidden", marginBottom: "1rem",
                }}>
                    <div style={{ padding: "1rem 1.375rem", borderBottom: "0.5px solid var(--border)" }}>
                        <p style={{ fontSize: "13px", fontWeight: 500, color: "var(--text)" }}>Current path</p>
                    </div>
                    <div style={{ padding: "1rem 1.375rem" }}>
                        <p style={{ fontSize: "14px", color: "var(--text)", marginBottom: "10px" }}>{path.label}</p>
                        <div style={{ height: "3px", background: "var(--border)", borderRadius: "2px" }}>
                            <div style={{
                                height: "3px", background: "var(--accent)",
                                borderRadius: "2px", width: `${percent}%`,
                            }} />
                        </div>
                        <p style={{ fontSize: "11px", color: "var(--muted)", marginTop: "6px" }}>
                            {completedModules} of {totalModules} modules complete
                        </p>
                    </div>
                </div>
            )}

            {/* Skills */}
            {onboarding?.skills && onboarding.skills.length > 0 && (
                <div style={{
                    border: "0.5px solid var(--border)", borderRadius: "11px",
                    background: "var(--surface)", padding: "1.25rem 1.375rem",
                }}>
                    <p style={{ fontSize: "13px", fontWeight: 500, color: "var(--text)", marginBottom: "12px" }}>
                        Your skills
                    </p>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                        {onboarding.skills.map(skill => (
                            <span key={skill} style={{
                                padding: "4px 10px", borderRadius: "6px", fontSize: "12px",
                                border: "0.5px solid var(--border)", color: "var(--muted)",
                                background: "var(--surface2)",
                            }}>
                                {skill}
                            </span>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}