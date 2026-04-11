import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { PATHS } from "@/lib/path";
import Link from "next/link";

export default async function LearnPage() {
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
    const completedIndexes = new Set(progress.map(p => p.moduleIndex));

    return (
        <div style={{ maxWidth: "700px" }}>
            <div style={{ width: "28px", height: "2px", background: "var(--accent)", marginBottom: "1rem" }} />
            <h1 style={{ fontSize: "21px", fontWeight: 500, color: "var(--text)", marginBottom: "4px" }}>
                {path.label}
            </h1>
            <p style={{ fontSize: "13px", color: "var(--muted)", marginBottom: "2rem" }}>
                {completedIndexes.size} of {path.modules.length} modules complete
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {path.modules.map((mod, i) => {
                    const done = completedIndexes.has(i);
                    const locked = i > completedIndexes.size;
                    return (
                        <Link key={i} href={locked ? "#" : `/learn/${i}`} style={{
                            display: "flex", alignItems: "center", gap: "14px",
                            padding: "1.125rem 1.375rem", borderRadius: "10px",
                            border: `0.5px solid ${done ? "var(--accent)" : "var(--border)"}`,
                            background: "var(--surface)", textDecoration: "none",
                            opacity: locked ? 0.45 : 1,
                            cursor: locked ? "not-allowed" : "pointer",
                            transition: "border-color 0.15s",
                        }}>
                            <div style={{
                                width: "32px", height: "32px", borderRadius: "50%", flexShrink: 0,
                                border: `0.5px solid ${done ? "var(--accent)" : "var(--border)"}`,
                                background: done ? "var(--accent)" : "var(--surface2)",
                                display: "flex", alignItems: "center", justifyContent: "center",
                            }}>
                                {done ? (
                                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--bg)" strokeWidth="2.5">
                                        <path d="M20 6L9 17l-5-5" />
                                    </svg>
                                ) : (
                                    <span style={{ fontSize: "12px", color: "var(--muted)", fontWeight: 500 }}>{i + 1}</span>
                                )}
                            </div>
                            <div style={{ flex: 1 }}>
                                <p style={{ fontSize: "14px", fontWeight: 500, color: "var(--text)", marginBottom: "3px" }}>
                                    {mod.title}
                                </p>
                                <p style={{ fontSize: "12px", color: "var(--muted)" }}>{mod.sub}</p>
                            </div>
                            <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "4px" }}>
                                <span style={{
                                    fontSize: "11px", padding: "2px 8px", borderRadius: "4px",
                                    background: "var(--surface2)", border: "0.5px solid var(--border)",
                                    color: "var(--muted)",
                                }}>
                                    {mod.duration}
                                </span>
                                {done && (
                                    <span style={{ fontSize: "11px", color: "var(--muted)" }}>Completed</span>
                                )}
                                {!done && !locked && (
                                    <span style={{ fontSize: "11px", color: "var(--text)" }}>Start →</span>
                                )}
                                {locked && (
                                    <span style={{ fontSize: "11px", color: "var(--muted)" }}>Locked</span>
                                )}
                            </div>
                        </Link>
                    );
                })}
            </div>
        </div>
    );
}