import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { redirect, notFound } from "next/navigation";
import { PATHS } from "@/lib/path";
import { CONTENT } from "@/lib/content";
import Link from "next/link";
import ModuleActions from "./ModuleActions";
import type { ContentSection } from "@/lib/content";

export default async function ModulePage({
    params,
}: {
    params: Promise<{ moduleId: string }>;
}) {
    const session = await getServerSession(authOptions);
    if (!session) redirect("/login");

    const onboarding = await prisma.userOnboarding.findUnique({
        where: { userId: session.user.id },
    });
    if (!onboarding) redirect("/onboarding");

    const { moduleId } = await params;

    let resolvedPathId: string;
    let moduleIndex: number;

    const lastHyphen = moduleId.lastIndexOf("-");

    if (lastHyphen === -1) {
        // Plain number like "1" — use user's onboarding path
        moduleIndex = parseInt(moduleId);
        if (isNaN(moduleIndex)) notFound();
        resolvedPathId = onboarding.pathId;
    } else {
        // Format: "pathId-moduleIndex" like "webapp-0"
        resolvedPathId = moduleId.slice(0, lastHyphen);
        moduleIndex = parseInt(moduleId.slice(lastHyphen + 1));
        if (isNaN(moduleIndex)) notFound();
        // If pathId not found in PATHS, fall back to onboarding path
        if (!PATHS[resolvedPathId]) {
            resolvedPathId = onboarding.pathId;
        }
    }

    const path = PATHS[resolvedPathId];
    if (!path) notFound();

    const mod = path.modules[moduleIndex];
    if (!mod) notFound();

    const progress = await prisma.userProgress.findMany({
        where: { userId: session.user.id, pathId: resolvedPathId },
    });

    const completedIndexes = new Set(progress.map(p => p.moduleIndex));
    const isDone = completedIndexes.has(moduleIndex);
    const isLocked = moduleIndex > completedIndexes.size;

    if (isLocked) redirect("/learn");

    const pathContent = CONTENT[resolvedPathId] ?? [];
    const content = pathContent.find(c => c.moduleIndex === moduleIndex);

    return (
        <div style={{ maxWidth: "720px", padding: "20px" }}>
            {/* Breadcrumb */}
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "2rem" }}>
                <Link
                    href="/learn"
                    style={{ fontSize: "12px", color: "var(--muted)", textDecoration: "none" }}
                >
                    {path.label}
                </Link>
                <span style={{ fontSize: "12px", color: "var(--muted)" }}>→</span>
                <span style={{ fontSize: "12px", color: "var(--text)" }}>Module {moduleIndex + 1}</span>
            </div>

            {/* Progress bar */}
            <div style={{
                height: "2px", background: "var(--border)", borderRadius: "1px",
                marginBottom: "2rem", overflow: "hidden",
            }}>
                <div style={{
                    height: "2px", background: "var(--accent)", borderRadius: "1px",
                    width: `${((moduleIndex + (isDone ? 1 : 0)) / path.modules.length) * 100}%`,
                    transition: "width 0.4s ease",
                }} />
            </div>

            {/* Header */}
            <div style={{ marginBottom: "2.5rem" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
                    {content && <span style={{ fontSize: "28px" }}>{content.emoji}</span>}
                    <div>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                            <span style={{
                                fontSize: "10px", padding: "2px 8px", borderRadius: "4px",
                                border: "0.5px solid var(--border)", color: "var(--muted)",
                                textTransform: "uppercase", letterSpacing: "0.04em",
                            }}>Module {moduleIndex + 1} of {path.modules.length}</span>
                            <span style={{
                                fontSize: "10px", padding: "2px 8px", borderRadius: "4px",
                                background: "var(--surface2)", border: "0.5px solid var(--border)",
                                color: "var(--muted)",
                            }}>{mod.duration}</span>
                            {isDone && (
                                <span style={{
                                    fontSize: "10px", padding: "2px 8px", borderRadius: "4px",
                                    border: "0.5px solid var(--accent)", color: "var(--text)",
                                }}>✓ Complete</span>
                            )}
                        </div>
                        <h1 style={{ fontSize: "24px", fontWeight: 500, color: "var(--text)" }}>
                            {content?.title ?? mod.title}
                        </h1>
                    </div>
                </div>
            </div>

            {/* Content sections */}
            {content ? (
                <div style={{ display: "flex", flexDirection: "column", gap: "16px", marginBottom: "2rem" }}>
                    {content.sections.map((section, i) => (
                        <SectionCard key={i} section={section} index={i} />
                    ))}
                </div>
            ) : (
                <div style={{
                    padding: "2rem", borderRadius: "11px",
                    border: "0.5px solid var(--border)", background: "var(--surface)",
                    marginBottom: "2rem",
                }}>
                    <p style={{ fontSize: "13px", color: "var(--muted)" }}>
                        Content for this module is coming soon.
                    </p>
                </div>
            )}

            {/* Module navigation */}
            <ModuleActions
                moduleId={moduleId}
                moduleIndex={moduleIndex}
                pathId={resolvedPathId}
                totalModules={path.modules.length}
                alreadyCompleted={isDone}
                hasContent={!!content}
            />
        </div>
    );
}

function SectionCard({ section, index }: { section: ContentSection; index: number }) {
    const colors: Record<ContentSection["type"], { bg: string; accent: string; label: string }> = {
        concept: { bg: "var(--surface)", accent: "var(--accent)", label: "Concept" },
        why: { bg: "var(--surface)", accent: "#639922", label: "Why it matters" },
        analogy: { bg: "var(--surface)", accent: "#BA7517", label: "Think of it like..." },
        keypoints: { bg: "var(--surface)", accent: "var(--accent)", label: "Key points" },
        visual: { bg: "var(--surface2)", accent: "#378ADD", label: "Visual" },
        exercise: { bg: "var(--surface)", accent: "#7F77DD", label: "Exercise" },
    };

    const config = colors[section.type];

    return (
        <div style={{
            borderRadius: "11px", border: "0.5px solid var(--border)",
            background: config.bg, overflow: "hidden",
            animation: `fadeUp 0.4s ease ${index * 0.06}s both`,
        }}>
            <div style={{
                display: "flex", alignItems: "center", gap: "8px",
                padding: "12px 1.375rem",
                borderBottom: "0.5px solid var(--border)",
            }}>
                <div style={{ width: "3px", height: "16px", background: config.accent, borderRadius: "2px" }} />
                <span style={{ fontSize: "11px", color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                    {config.label}
                </span>
                <span style={{ fontSize: "13px", fontWeight: 500, color: "var(--text)" }}>
                    {section.title}
                </span>
            </div>

            <div style={{ padding: "1.25rem 1.375rem" }}>
                {section.body && !section.code && (
                    <p style={{ fontSize: "14px", color: "var(--muted)", lineHeight: 1.85 }}>
                        {section.body}
                    </p>
                )}

                {section.code && (
                    <div>
                        {section.body && (
                            <p style={{ fontSize: "14px", color: "var(--muted)", lineHeight: 1.85, marginBottom: "1rem" }}>
                                {section.body}
                            </p>
                        )}
                        <pre style={{
                            background: "var(--bg)", border: "0.5px solid var(--border)",
                            borderRadius: "8px", padding: "1rem",
                            fontSize: "12px", color: "var(--text)", lineHeight: 1.7,
                            overflowX: "auto", margin: 0,
                        }}>
                            <code>{section.code}</code>
                        </pre>
                    </div>
                )}

                {section.points && (
                    <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                        {section.points.map((point: string, i: number) => {
                            const colonIndex = point.indexOf(": ");
                            const hasColon = colonIndex !== -1;
                            const bold = hasColon ? point.slice(0, colonIndex) : "";
                            const rest = hasColon ? point.slice(colonIndex + 2) : point;
                            return (
                                <div key={i} style={{ display: "flex", gap: "10px", alignItems: "flex-start" }}>
                                    <div style={{
                                        width: "20px", height: "20px", borderRadius: "50%",
                                        background: "var(--surface2)", border: "0.5px solid var(--border)",
                                        display: "flex", alignItems: "center", justifyContent: "center",
                                        fontSize: "10px", color: "var(--muted)", flexShrink: 0, marginTop: "2px",
                                    }}>{i + 1}</div>
                                    <p style={{ fontSize: "13px", color: "var(--muted)", lineHeight: 1.7 }}>
                                        {hasColon ? (
                                            <>
                                                <strong style={{ color: "var(--text)", fontWeight: 500 }}>{bold}</strong>
                                                {": " + rest}
                                            </>
                                        ) : point}
                                    </p>
                                </div>
                            );
                        })}
                    </div>
                )}

                {section.exercise && (
                    <div>
                        <p style={{ fontSize: "14px", color: "var(--muted)", lineHeight: 1.7, marginBottom: "1.25rem" }}>
                            {section.exercise.prompt}
                        </p>
                        <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginBottom: "1.25rem" }}>
                            {section.exercise.steps.map((step: string, i: number) => {
                                const isCommand = step.startsWith("Run:");
                                const command = isCommand ? step.replace("Run: ", "") : "";
                                return (
                                    <div key={i} style={{ display: "flex", gap: "10px", alignItems: "flex-start" }}>
                                        <div style={{
                                            width: "22px", height: "22px", borderRadius: "50%",
                                            border: "0.5px solid #7F77DD",
                                            display: "flex", alignItems: "center", justifyContent: "center",
                                            fontSize: "10px", color: "#7F77DD",
                                            flexShrink: 0, marginTop: "1px",
                                        }}>{i + 1}</div>
                                        <p style={{ fontSize: "13px", color: "var(--muted)", lineHeight: 1.7 }}>
                                            {isCommand ? (
                                                <>
                                                    Run:{" "}
                                                    <code style={{
                                                        background: "var(--bg)", border: "0.5px solid var(--border)",
                                                        borderRadius: "4px", padding: "1px 6px",
                                                        fontSize: "12px", color: "var(--text)",
                                                    }}>{command}</code>
                                                </>
                                            ) : step}
                                        </p>
                                    </div>
                                );
                            })}
                        </div>
                        <div style={{
                            padding: "10px 14px", borderRadius: "8px",
                            border: "0.5px solid #7F77DD", background: "var(--bg)",
                        }}>
                            <p style={{ fontSize: "11px", color: "#7F77DD", marginBottom: "3px", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                                ✓ Checkpoint
                            </p>
                            <p style={{ fontSize: "13px", color: "var(--text)", lineHeight: 1.6 }}>
                                {section.exercise.checkpoint}
                            </p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}