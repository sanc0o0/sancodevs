"use client";

import { useState, useEffect } from "react";
import AchievementGrid from "./AchievementGrid";
import AchievementShareModal from "./AchievementShareModal";
import type { AchievementDefinition, UserAchievement, AchievementsApiResponse } from "./achievements.types";
import type { AchievementTheme } from "./achievements.types";
import { THEME_CONFIG, ACHIEVEMENT_CATALOG } from "./achievements.utils";

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function AchievementsSkeleton() {
    return (
        <>
            <style>{`
        @keyframes skelPulse { 0%,100%{opacity:1} 50%{opacity:.4} }
        .ach-skel { animation: skelPulse 1.6s ease-in-out infinite; background: var(--surface2); border-radius: 8px; }
      `}</style>
            <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
                {/* Stats row */}
                <div style={{ display: "flex", gap: 10 }}>
                    {[1, 2, 3].map(i => (
                        <div key={i} className="ach-skel" style={{ flex: 1, height: 64, borderRadius: 10 }} />
                    ))}
                </div>
                {/* Filter bar */}
                <div className="ach-skel" style={{ height: 38, borderRadius: 9 }} />
                {/* Cards */}
                {[1, 2].map(g => (
                    <div key={g}>
                        <div className="ach-skel" style={{ height: 16, width: 100, marginBottom: 12 }} />
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px,1fr))", gap: 10 }}>
                            {[1, 2, 3].map(i => (
                                <div key={i} className="ach-skel" style={{ height: 140, borderRadius: 12 }} />
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </>
    );
}

// ─── Filter bar ───────────────────────────────────────────────────────────────

const FILTERS: Array<{ id: AchievementTheme | "all"; label: string }> = [
    { id: "all", label: "All" },
    { id: "contributions", label: "Contributions" },
    { id: "projects", label: "Projects" },
    { id: "reputation", label: "Reputation" },
    { id: "community", label: "Community" },
    { id: "onboarding", label: "Onboarding" },
    { id: "special", label: "Special" },
];

// ─── Empty state ──────────────────────────────────────────────────────────────

function EmptyState({ isOwner }: { isOwner: boolean }) {
    return (
        <div
            style={{
                padding: "56px 24px",
                borderRadius: 12,
                border: "0.5px dashed var(--border)",
                background: "var(--surface)",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 12,
                textAlign: "center",
            }}
        >
            <div
                style={{
                    width: 48,
                    height: 48,
                    borderRadius: 12,
                    background: "var(--surface2)",
                    border: "0.5px solid var(--border)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 20,
                    marginBottom: 4,
                }}
            >
                ✦
            </div>
            <p style={{ fontSize: 14, fontWeight: 600, color: "var(--text)", margin: 0 }}>
                No achievements yet
            </p>
            <p style={{ fontSize: 12, color: "var(--muted)", margin: 0, maxWidth: 320, lineHeight: 1.7 }}>
                {isOwner
                    ? "Start contributing to unlock your builder journey. Complete tasks, join projects, and build your reputation."
                    : "This builder hasn't earned any achievements yet."}
            </p>
        </div>
    );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

interface AchievementTabProps {
    subjectId: string;
    isOwner: boolean;
    username: string;
}

export default function AchievementTab({ subjectId, isOwner, username }: AchievementTabProps) {
    const [data, setData] = useState<AchievementsApiResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);
    const [filterTheme, setFilterTheme] = useState<AchievementTheme | "all">("all");
    const [shareTarget, setShareTarget] = useState<AchievementDefinition | null>(null);

    useEffect(() => {
        const controller = new AbortController();

        async function fetchAchievements() {
            setLoading(true);
            setError(false);
            try {
                const r = await fetch(`/api/users/${subjectId}/achievements`, {
                    signal: controller.signal,
                });
                if (!r.ok) throw new Error("Failed");
                const d = await r.json();
                setData(d);
            } catch (err: unknown) {
                if (err instanceof Error && err.name === "AbortError") return;
                setError(true);
            } finally {
                setLoading(false);
            }
        }

        fetchAchievements();
        return () => controller.abort();
    }, [subjectId]);

    if (loading) return <AchievementsSkeleton />;

    if (error) {
        return (
            <div style={{ padding: "32px 20px", borderRadius: 10, border: "0.5px solid rgba(226,75,74,0.2)", background: "rgba(226,75,74,0.04)", display: "flex", flexDirection: "column", alignItems: "center", gap: 10, textAlign: "center" }}>
                <p style={{ fontSize: 13, color: "var(--muted)", margin: 0 }}>Failed to load achievements.</p>
                <button
                    onClick={() => { setError(false); setLoading(true); }}
                    style={{ padding: "6px 16px", borderRadius: 8, fontSize: 12, border: "0.5px solid var(--border)", background: "transparent", color: "var(--text)", cursor: "pointer" }}
                >
                    Retry
                </button>
            </div>
        );
    }

    // Build earnedMap from API response
    const earnedMap: Record<string, UserAchievement> = {};
    if (data?.earned) {
        for (const ua of data.earned) {
            earnedMap[ua.achievementKey] = ua;
        }
    }

    const totalCatalog = ACHIEVEMENT_CATALOG.length;
    const earnedCount = data?.earnedCount ?? 0;
    const totalPoints = data?.earned?.reduce((sum, ua) => {
        // look up points from catalog
        const def = ACHIEVEMENT_CATALOG.find((a) => a.key === ua.achievementKey);
        return sum + (def?.points ?? 0);
    }, 0) ?? 0;

    const hasEarned = earnedCount > 0;

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

            {/* Share modal */}
            {shareTarget && (
                <AchievementShareModal
                    definition={shareTarget}
                    username={username}
                    onClose={() => setShareTarget(null)}
                />
            )}

            {/* Stats row */}
            <div style={{ display: "flex", gap: 10 }}>
                {[
                    { value: earnedCount, label: "Earned", color: "var(--text)" },
                    { value: totalCatalog, label: "Available", color: "var(--muted)" },
                    { value: totalPoints, label: "Points", color: "#fbbf24" },
                ].map(({ value, label, color }) => (
                    <div
                        key={label}
                        style={{
                            flex: 1,
                            padding: "12px 10px",
                            borderRadius: 10,
                            border: "0.5px solid var(--border)",
                            background: "var(--surface)",
                            textAlign: "center",
                        }}
                    >
                        <p style={{ fontSize: 20, fontWeight: 700, color, margin: 0, lineHeight: 1 }}>
                            {value}
                        </p>
                        <p style={{ fontSize: 9, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.05em", marginTop: 4 }}>
                            {label}
                        </p>
                    </div>
                ))}
            </div>

            {/* Progress bar */}
            <div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                    <p style={{ fontSize: 10, color: "var(--muted)", margin: 0, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                        Builder journey
                    </p>
                    <p style={{ fontSize: 10, color: "var(--muted)", margin: 0 }}>
                        {Math.round((earnedCount / totalCatalog) * 100)}%
                    </p>
                </div>
                <div style={{ height: 4, borderRadius: 2, background: "var(--surface2)", overflow: "hidden" }}>
                    <div
                        style={{
                            height: "100%",
                            borderRadius: 2,
                            background: `linear-gradient(90deg, #60a5fa, #a78bfa)`,
                            width: `${(earnedCount / totalCatalog) * 100}%`,
                            transition: "width 0.6s ease",
                        }}
                    />
                </div>
            </div>

            {/* Filter bar */}
            <div
                style={{
                    display: "flex",
                    gap: 4,
                    overflowX: "auto",
                    scrollbarWidth: "none",
                    paddingBottom: 2,
                }}
            >
                {FILTERS.map((f) => {
                    const isActive = filterTheme === f.id;
                    const themeColor = f.id !== "all" ? THEME_CONFIG[f.id as AchievementTheme].color : "var(--text)";
                    return (
                        <button
                            key={f.id}
                            onClick={() => setFilterTheme(f.id)}
                            style={{
                                flexShrink: 0,
                                padding: "5px 12px",
                                borderRadius: 7,
                                fontSize: 11,
                                cursor: "pointer",
                                border: `0.5px solid ${isActive ? (f.id !== "all" ? THEME_CONFIG[f.id as AchievementTheme].color + "60" : "var(--accent)") : "var(--border)"}`,
                                background: isActive ? (f.id !== "all" ? THEME_CONFIG[f.id as AchievementTheme].bg : "var(--surface2)") : "transparent",
                                color: isActive ? themeColor : "var(--muted)",
                                fontFamily: "inherit",
                                fontWeight: isActive ? 500 : 400,
                                transition: "all 0.12s",
                                whiteSpace: "nowrap",
                            }}
                        >
                            {f.label}
                        </button>
                    );
                })}
            </div>

            {/* Grid or empty */}
            {!hasEarned && filterTheme === "all" ? (
                <EmptyState isOwner={isOwner} />
            ) : (
                <AchievementGrid
                    earnedMap={earnedMap}
                    onShare={setShareTarget}
                    filterTheme={filterTheme}
                />
            )}
        </div>
    );
}