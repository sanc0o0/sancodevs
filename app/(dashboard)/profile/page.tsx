import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { PATHS } from "@/lib/path";
import Link from "next/link";

export default async function ProfilePage() {
    const session = await getServerSession(authOptions);
    if (!session) redirect("/login");

    const [onboarding, progress, applications, notifications] = await Promise.all([
        prisma.userOnboarding.findUnique({ where: { userId: session.user.id } }),
        prisma.userProgress.findMany({ where: { userId: session.user.id }, orderBy: { completedAt: "desc" } }),
        prisma.projectApplication.findMany({ where: { userId: session.user.id } }),
        prisma.notification.findMany({ where: { userId: session.user.id }, orderBy: { createdAt: "desc" }, take: 10 }),
    ]);

    const path = onboarding ? PATHS[onboarding.pathId] : null;
    const totalModules = path?.modules.length ?? 0;
    const completedModules = progress.length;
    const percent = totalModules > 0 ? Math.round((completedModules / totalModules) * 100) : 0;

    const initials = session.user.name
        ?.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2) ?? "?";

    return (
        <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "1rem", maxWidth: "1100px" }}>

            {/* Two column layout on desktop */}
            <div className="profile-grid" style={{ display: "grid", gridTemplateColumns: "minmax(0,1.5fr) minmax(0,1fr)", gap: "1rem", alignItems: "start" }}>

                {/* LEFT COLUMN */}
                <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>

                    {/* Header */}
                    <div style={{ marginBottom: "0.5rem" }}>
                        <div style={{ width: "28px", height: "2px", background: "var(--accent)", marginBottom: "1rem" }} />
                        <h1 style={{ fontSize: "21px", fontWeight: 500, color: "var(--text)" }}>Profile</h1>
                    </div>

                    {/* User card */}
                    <div style={{
                        border: "0.5px solid var(--border)", borderRadius: "11px",
                        background: "var(--surface)", padding: "1.25rem",
                        display: "flex", alignItems: "center", gap: "1rem",
                        flexWrap: "wrap",
                    }}>
                        {session.user.image ? (
                            <img src={session.user.image} alt={session.user.name ?? ""}
                                style={{ width: "44px", height: "44px", borderRadius: "50%", objectFit: "cover", flexShrink: 0 }}
                            />
                        ) : (
                            <div style={{
                                width: "44px", height: "44px", borderRadius: "50%",
                                background: "var(--surface2)", border: "0.5px solid var(--border)",
                                display: "flex", alignItems: "center", justifyContent: "center",
                                fontSize: "15px", fontWeight: 500, color: "var(--text)", flexShrink: 0,
                            }}>
                                {initials}
                            </div>
                        )}
                        <div style={{ flex: 1, minWidth: 0 }}>
                            <p style={{ fontSize: "14px", fontWeight: 500, color: "var(--text)", marginBottom: "2px" }}>
                                {session.user.name}
                            </p>
                            <p style={{
                                fontSize: "12px", color: "var(--muted)",
                                overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                            }}>
                                {session.user.email}
                            </p>
                        </div>
                        {/* Badge — contained, no overflow */}
                        <span style={{
                            fontSize: "10px", padding: "3px 8px", borderRadius: "20px",
                            border: "0.5px solid var(--border)", color: "var(--muted)",
                            whiteSpace: "nowrap", flexShrink: 0,
                            letterSpacing: "0.04em", textTransform: "uppercase",
                        }}>
                            {session.user.role ?? "USER"}
                        </span>
                    </div>

                    {/* Stats */}
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "8px" }}>
                        {[
                            { label: "Modules done", value: completedModules },
                            { label: "Path progress", value: `${percent}%` },
                            { label: "Applications", value: applications.length },
                        ].map(stat => (
                            <div key={stat.label} style={{
                                padding: "1rem 0.75rem", borderRadius: "9px",
                                border: "0.5px solid var(--border)", background: "var(--surface)",
                                textAlign: "center",
                            }}>
                                <p style={{ fontSize: "20px", fontWeight: 500, color: "var(--text)", marginBottom: "4px" }}>
                                    {stat.value}
                                </p>
                                <p style={{ fontSize: "11px", color: "var(--muted)", lineHeight: 1.4 }}>{stat.label}</p>
                            </div>
                        ))}
                    </div>

                    {/* Current path */}
                    {path && (
                        <div style={{
                            border: "0.5px solid var(--border)", borderRadius: "11px",
                            background: "var(--surface)", overflow: "hidden",
                        }}>
                            <div style={{ padding: "0.875rem 1.25rem", borderBottom: "0.5px solid var(--border)" }}>
                                <p style={{ fontSize: "12px", fontWeight: 500, color: "var(--text)" }}>Current path</p>
                            </div>
                            <div style={{ padding: "1rem 1.25rem" }}>
                                <p style={{ fontSize: "14px", color: "var(--text)", marginBottom: "10px" }}>{path.label}</p>
                                <div style={{ height: "3px", background: "var(--border)", borderRadius: "2px", marginBottom: "6px" }}>
                                    <div style={{
                                        height: "3px", background: "var(--accent)",
                                        borderRadius: "2px", width: `${percent}%`, transition: "width 0.4s ease",
                                    }} />
                                </div>
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                    <p style={{ fontSize: "11px", color: "var(--muted)" }}>
                                        {completedModules} of {totalModules} modules complete
                                    </p>
                                    <Link href="/learn" style={{
                                        fontSize: "11px", color: "var(--muted)", textDecoration: "none",
                                    }}>
                                        Continue →
                                    </Link>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Skills */}
                    {onboarding?.skills && onboarding.skills.length > 0 && (
                        <div style={{
                            border: "0.5px solid var(--border)", borderRadius: "11px",
                            background: "var(--surface)", padding: "1.125rem 1.25rem",
                        }}>
                            <p style={{ fontSize: "12px", fontWeight: 500, color: "var(--text)", marginBottom: "10px" }}>
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

                    {/* Completed modules */}
                    {progress.length > 0 && path && (
                        <div style={{
                            border: "0.5px solid var(--border)", borderRadius: "11px",
                            background: "var(--surface)", overflow: "hidden",
                        }}>
                            <div style={{ padding: "0.875rem 1.25rem", borderBottom: "0.5px solid var(--border)" }}>
                                <p style={{ fontSize: "12px", fontWeight: 500, color: "var(--text)" }}>Completed modules</p>
                            </div>
                            {progress.map((p, i) => {
                                const mod = path.modules[p.moduleIndex];
                                return mod ? (
                                    <div key={i} style={{
                                        display: "flex", alignItems: "center", gap: "10px",
                                        padding: "0.75rem 1.25rem",
                                        borderBottom: i < progress.length - 1 ? "0.5px solid var(--border)" : "none",
                                    }}>
                                        <div style={{
                                            width: "20px", height: "20px", borderRadius: "50%",
                                            background: "var(--accent)", flexShrink: 0,
                                            display: "flex", alignItems: "center", justifyContent: "center",
                                        }}>
                                            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="var(--bg)" strokeWidth="3">
                                                <path d="M20 6L9 17l-5-5" />
                                            </svg>
                                        </div>
                                        <div style={{ flex: 1 }}>
                                            <p style={{ fontSize: "13px", color: "var(--text)" }}>{mod.title}</p>
                                            <p style={{ fontSize: "11px", color: "var(--muted)" }}>{mod.sub}</p>
                                        </div>
                                        <span style={{ fontSize: "10px", color: "var(--muted)" }}>
                                            {new Date(p.completedAt).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
                                        </span>
                                    </div>
                                ) : null;
                            })}
                        </div>
                    )}
                </div>

                {/* RIGHT COLUMN — activity feed */}
                <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                    <div style={{ marginBottom: "0.5rem" }}>
                        <p style={{ fontSize: "21px", fontWeight: 500, color: "var(--text)", marginTop: "3.5rem" }}>
                            Activity
                        </p>
                    </div>

                    {/* Quick actions */}
                    <div style={{
                        border: "0.5px solid var(--border)", borderRadius: "11px",
                        background: "var(--surface)", overflow: "hidden",
                    }}>
                        <div style={{ padding: "0.875rem 1.25rem", borderBottom: "0.5px solid var(--border)" }}>
                            <p style={{ fontSize: "12px", fontWeight: 500, color: "var(--text)" }}>Quick actions</p>
                        </div>
                        {[
                            { label: "Continue learning", href: "/learn", icon: "→" },
                            { label: "Browse projects", href: "/projects", icon: "▣" },
                            { label: "Create a project", href: "/projects/new", icon: "+" },
                        ].map((action, i, arr) => (
                            <Link key={action.href} href={action.href} style={{
                                display: "flex", alignItems: "center", justifyContent: "space-between",
                                padding: "0.75rem 1.25rem", textDecoration: "none",
                                borderBottom: i < arr.length - 1 ? "0.5px solid var(--border)" : "none",
                                transition: "background 0.1s",
                            }}
                                className="dropdown-item"
                            >
                                <span style={{ fontSize: "13px", color: "var(--muted)" }}>{action.label}</span>
                                <span style={{ fontSize: "13px", color: "var(--muted)" }}>{action.icon}</span>
                            </Link>
                        ))}
                    </div>

                    {/* Notifications / recent activity */}
                    <div style={{
                        border: "0.5px solid var(--border)", borderRadius: "11px",
                        background: "var(--surface)", overflow: "hidden",
                    }}>
                        <div style={{ padding: "0.875rem 1.25rem", borderBottom: "0.5px solid var(--border)" }}>
                            <p style={{ fontSize: "12px", fontWeight: 500, color: "var(--text)" }}>Recent notifications</p>
                        </div>
                        {notifications.length === 0 ? (
                            <div style={{ padding: "1.5rem 1.25rem", textAlign: "center" }}>
                                <p style={{ fontSize: "13px", color: "var(--muted)" }}>No activity yet</p>
                            </div>
                        ) : (
                            notifications.map((n, i) => (
                                <div key={n.id} style={{
                                    padding: "0.75rem 1.25rem",
                                    borderBottom: i < notifications.length - 1 ? "0.5px solid var(--border)" : "none",
                                    background: n.read ? "transparent" : "var(--surface2)",
                                }}>
                                    <p style={{ fontSize: "12px", fontWeight: 500, color: "var(--text)", marginBottom: "2px" }}>{n.title}</p>
                                    <p style={{ fontSize: "11px", color: "var(--muted)", lineHeight: 1.5 }}>{n.body}</p>
                                    <p style={{ fontSize: "10px", color: "var(--muted)", marginTop: "4px" }}>
                                        {new Date(n.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
                                    </p>
                                </div>
                            ))
                        )}
                    </div>

                    {/* Path goal */}
                    {onboarding && (
                        <div style={{
                            padding: "1.125rem 1.25rem", borderRadius: "11px",
                            border: "0.5px solid var(--border)", background: "var(--surface)",
                        }}>
                            <p style={{ fontSize: "12px", fontWeight: 500, color: "var(--text)", marginBottom: "6px" }}>
                                Learning goal
                            </p>
                            <p style={{ fontSize: "13px", color: "var(--muted)", lineHeight: 1.6 }}>
                                {onboarding.goal.charAt(0).toUpperCase() + onboarding.goal.slice(1).replace(/([A-Z])/g, ' $1')}
                            </p>
                            <div style={{ marginTop: "10px" }}>
                                <Link href="/onboarding" style={{
                                    fontSize: "11px", color: "var(--muted)", textDecoration: "none",
                                }}>
                                    Change path →
                                </Link>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}