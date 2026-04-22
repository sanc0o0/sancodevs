import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { PATHS } from "@/lib/path";
import Link from "next/link";

export default async function DashboardPage() {
    const session = await getServerSession(authOptions);
    if (!session) redirect("/login");

    const onboarding = await prisma.userOnboarding.findUnique({
        where: { userId: session.user.id },
    });

    if (!onboarding) redirect("/onboarding");

    const progress = await prisma.userProgress.findMany({
        where: { userId: session.user.id, pathId: onboarding.pathId },
    });

    const path = PATHS[onboarding.pathId];
    const completedCount = progress.length;
    const totalModules = path?.modules.length ?? 0;
    const percent = totalModules > 0 ? Math.round((completedCount / totalModules) * 100) : 0;
    const nextModuleIndex = completedCount < totalModules ? completedCount : null;

    return (
        <div
            style={{
                display: "grid",
                gridTemplateColumns: "1fr",
                gap: "1.25rem",
                maxWidth: "1100px",
                margin: "0 auto",
                padding: "20px",
            }}
            className="dashboard-grid"
        >

            {/* LEFT — existing content */}
            <div style={{ maxWidth: "100%" }}>
                {/* Header */}
                <div style={{ marginBottom: "2rem" }}>
                    <div style={{ width: "28px", height: "2px", background: "var(--accent)", marginBottom: "1rem" }} />
                    <h1 style={{ fontSize: "clamp(18px, 2vw, 21px)", fontWeight: 500, color: "var(--text)", marginBottom: "4px" }}>
                        Welcome back, {session.user.name?.split(" ")[0]}
                    </h1>
                    <p style={{ fontSize: "13px", color: "var(--muted)" }}>
                        {completedCount === 0
                            ? "You haven't started yet — let's fix that."
                            : `${completedCount} of ${totalModules} modules complete.`}
                    </p>
                </div>

                {/* Progress card */}
                <div style={{
                    border: "0.5px solid var(--border)", borderRadius: "11px",
                    background: "var(--surface)", padding: "clamp(1rem, 2vw, 1.5rem)",
                    marginBottom: "1.25rem",
                }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1rem" }}>
                        <div>
                            <p style={{ fontSize: "11px", color: "var(--muted)", marginBottom: "4px", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                                Current path
                            </p>
                            <p style={{ fontSize: "15px", fontWeight: 500, color: "var(--text)" }}>
                                {path?.label}
                            </p>
                        </div>
                        <span style={{
                            fontSize: "12px", padding: "3px 10px", borderRadius: "20px",
                            border: "0.5px solid var(--border)", color: "var(--muted)",
                        }}>
                            {percent}% done
                        </span>
                    </div>

                    {/* Progress bar */}
                    <div style={{
                        height: "3px", background: "var(--border)",
                        borderRadius: "2px", marginBottom: "1.25rem",
                    }}>
                        <div style={{
                            height: "3px", background: "var(--accent)",
                            borderRadius: "2px", width: `${percent}%`,
                            transition: "width 0.4s ease",
                        }} />
                    </div>

                    {nextModuleIndex !== null && (
                        <Link href={`/learn/${nextModuleIndex}`} style={{
                            display: "inline-flex", alignItems: "center", gap: "6px",
                            padding: "8px 16px", borderRadius: "7px", fontSize: "13px",
                            background: "var(--accent)", color: "var(--bg)",
                            fontWeight: 500, textDecoration: "none",
                        }}>
                            {completedCount === 0 ? "Start learning" : "Continue"}
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M5 12h14M12 5l7 7-7 7" />
                            </svg>
                        </Link>
                    )}

                    {nextModuleIndex === null && (
                        <p style={{ fontSize: "13px", color: "var(--muted)" }}>
                            Path complete — check Projects for your next challenge.
                        </p>
                    )}
                </div>

                {/* Module list */}
                <div style={{
                    border: "0.5px solid var(--border)", borderRadius: "11px",
                    background: "var(--surface)", overflow: "hidden",
                }}>
                    <div style={{
                        padding: "1rem 1.375rem",
                        borderBottom: "0.5px solid var(--border)",
                    }}>
                        <p style={{ fontSize: "13px", fontWeight: 500, color: "var(--text)" }}>
                            All modules
                        </p>
                    </div>
                    {path?.modules.map((mod, i) => {
                        const done = progress.some(p => p.moduleIndex === i);
                        const isCurrent = i === completedCount;
                        return (
                            <Link key={i} href={`/learn/${i}`} style={{
                                display: "flex", alignItems: "center", gap: "12px",
                                padding: "0.875rem 1.375rem",
                                borderBottom: i < path.modules.length - 1 ? "0.5px solid var(--border)" : "none",
                                textDecoration: "none",
                                background: isCurrent ? "var(--surface2)" : "transparent",
                                transition: "background 0.15s",
                            }}>
                                {/* Status dot */}
                                <div style={{
                                    width: "22px", height: "22px", borderRadius: "50%",
                                    border: `0.5px solid ${done ? "var(--accent)" : "var(--border)"}`,
                                    background: done ? "var(--accent)" : "transparent",
                                    display: "flex", alignItems: "center", justifyContent: "center",
                                    flexShrink: 0,
                                }}>
                                    {done && (
                                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="var(--bg)" strokeWidth="3">
                                            <path d="M20 6L9 17l-5-5" />
                                        </svg>
                                    )}
                                    {!done && (
                                        <span style={{ fontSize: "10px", color: "var(--muted)" }}>{i + 1}</span>
                                    )}
                                </div>
                                <div style={{ flex: 1 }}>
                                    <p style={{ fontSize: "13px", color: done ? "var(--muted)" : "var(--text)", marginBottom: "2px" }}>
                                        {mod.title}
                                    </p>
                                    <p style={{ fontSize: "11px", color: "var(--muted)" }}>{mod.sub}</p>
                                </div>
                                <span style={{
                                    fontSize: "11px", padding: "2px 8px", borderRadius: "4px",
                                    background: "var(--surface2)", border: "0.5px solid var(--border)",
                                    color: "var(--muted)",
                                }}>
                                    {mod.duration}
                                </span>
                            </Link>
                        );
                    })}
                </div>
            </div>

            {/* RIGHT — activity */}
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem", width: "100%" }}>
                <div style={{ border: "0.5px solid var(--border)", borderRadius: "11px", background: "var(--surface)", overflow: "hidden" }}>
                    <div style={{ padding: "0.875rem 1.25rem", borderBottom: "0.5px solid var(--border)" }}>
                        <p style={{ fontSize: "12px", fontWeight: 500, color: "var(--text)" }}>Quick actions</p>
                    </div>
                    {[
                        { label: "Continue learning", href: "/learn", sub: path?.label ?? "No path selected" },
                        { label: "Browse projects", href: "/projects", sub: "Find something to build" },
                        { label: "Community", href: "/community", sub: "Talk to other devs" },
                    ].map((a, i, arr) => (
                        <Link key={a.href} href={a.href} style={{
                            display: "block", padding: "0.875rem 1.25rem", textDecoration: "none",
                            borderBottom: i < arr.length - 1 ? "0.5px solid var(--border)" : "none",
                            transition: "background 0.1s",
                        }} className="dropdown-item">
                            <p style={{ fontSize: "13px", color: "var(--text)", marginBottom: "2px" }}>{a.label}</p>
                            <p style={{ fontSize: "11px", color: "var(--muted)" }}>{a.sub}</p>
                        </Link>
                    ))}
                </div>

                <div style={{ border: "0.5px solid var(--border)", borderRadius: "11px", background: "var(--surface)", padding: "1.25rem" }}>
                    <p style={{ fontSize: "12px", fontWeight: 500, color: "var(--text)", marginBottom: "10px" }}>Your stats</p>
                    {[
                        { label: "Modules done", value: completedCount },
                        { label: "Total modules", value: totalModules },
                        { label: "Completion", value: `${percent}%` },
                    ].map(s => (
                        <div key={s.label} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: "0.5px solid var(--border)" }}>
                            <span style={{ fontSize: "12px", color: "var(--muted)" }}>{s.label}</span>
                            <span style={{ fontSize: "12px", color: "var(--text)", fontWeight: 500 }}>{s.value}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}