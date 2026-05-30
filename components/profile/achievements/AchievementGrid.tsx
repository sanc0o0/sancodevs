"use client";

import AchievementCard from "./AchievementCard";
import type { AchievementDefinition, UserAchievement } from "./achievements.types";
import { ACHIEVEMENT_CATALOG, THEME_CONFIG } from "./achievements.utils";
import type { AchievementTheme } from "./achievements.types";

interface AchievementGridProps {
    earnedMap: Record<string, UserAchievement>; // key → UserAchievement
    onShare: (definition: AchievementDefinition) => void;
    filterTheme: AchievementTheme | "all";
}

// Theme display order
const THEME_ORDER: AchievementTheme[] = [
    "onboarding",
    "contributions",
    "projects",
    "reputation",
    "community",
    "special",
];

export default function AchievementGrid({ earnedMap, onShare, filterTheme }: AchievementGridProps) {
    const catalog = filterTheme === "all"
        ? ACHIEVEMENT_CATALOG
        : ACHIEVEMENT_CATALOG.filter((a) => a.theme === filterTheme);

    // Group by theme
    const grouped: Partial<Record<AchievementTheme, typeof catalog>> = {};
    for (const def of catalog) {
        if (!grouped[def.theme]) grouped[def.theme] = [];
        grouped[def.theme]!.push(def);
    }

    const themes = filterTheme === "all"
        ? THEME_ORDER.filter((t) => grouped[t]?.length)
        : ([filterTheme] as AchievementTheme[]);

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
            {themes.map((theme) => {
                const defs = grouped[theme] ?? [];
                if (!defs.length) return null;

                const themeConfig = THEME_CONFIG[theme];

                // Sort: earned first, then locked
                const sorted = [...defs].sort((a, b) => {
                    const aEarned = !!earnedMap[a.key];
                    const bEarned = !!earnedMap[b.key];
                    if (aEarned && !bEarned) return -1;
                    if (!aEarned && bEarned) return 1;
                    return 0;
                });

                const earnedCount = sorted.filter((d) => !!earnedMap[d.key]).length;

                return (
                    <div key={theme}>
                        {/* Category header */}
                        <div
                            style={{
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "space-between",
                                marginBottom: 12,
                            }}
                        >
                            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                <div
                                    style={{
                                        width: 3,
                                        height: 14,
                                        borderRadius: 2,
                                        background: themeConfig.color,
                                    }}
                                />
                                <p
                                    style={{
                                        fontSize: 11,
                                        fontWeight: 500,
                                        color: themeConfig.color,
                                        textTransform: "uppercase",
                                        letterSpacing: "0.08em",
                                        margin: 0,
                                    }}
                                >
                                    {themeConfig.label}
                                </p>
                            </div>
                            <span style={{ fontSize: 10, color: "var(--muted)" }}>
                                {earnedCount} / {defs.length}
                            </span>
                        </div>

                        {/* Grid */}
                        <div
                            style={{
                                display: "grid",
                                gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
                                gap: 10,
                            }}
                        >
                            {sorted.map((def) => (
                                <AchievementCard
                                    key={def.key}
                                    definition={def}
                                    earned={earnedMap[def.key] ?? null}
                                    onShare={onShare}
                                />
                            ))}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}