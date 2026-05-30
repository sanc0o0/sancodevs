"use client";

import ReliabilityScoreRing from "../hero/ReliabilityScoreRing";
import ReliabilityInsightRow from "./ReliabilityInsightRow";
import { computeReliabilityTier } from "../utils/computeReliabilityTier";
import type { ReliabilityStats } from "../types/reliability.types";

interface ReliabilityInsightsProps {
    stats: ReliabilityStats;
}

export default function ReliabilityInsights({ stats }: ReliabilityInsightsProps) {
    const tier = computeReliabilityTier(stats.reliabilityScore);

    return (
        <div
            style={{
                padding: "0 16px 16px",
                display: "flex",
                gap: "12px",
                alignItems: "flex-start",
            }}
        >
            {/* Score ring */}
            <div
                style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: "4px",
                    flexShrink: 0,
                }}
            >
                <ReliabilityScoreRing
                    score={stats.reliabilityScore}
                    color={tier.color}
                    size={64}
                    strokeWidth={3}
                />
                <span
                    style={{
                        fontSize: "9px",
                        color: "var(--muted)",
                        textTransform: "uppercase",
                        letterSpacing: "0.06em",
                    }}
                >
                    Score
                </span>
            </div>

            {/* Rows */}
            <div
                style={{
                    flex: 1,
                    display: "flex",
                    flexDirection: "column",
                    gap: "8px",
                    paddingTop: "4px",
                }}
            >
                <ReliabilityInsightRow
                    color="#22c55e"
                    icon={
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="1.5">
                            <polyline points="9 11 12 14 22 4" />
                            <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
                        </svg>
                    }
                    label="Completed on time"
                    value={stats.tasksCompleted}
                />
                <ReliabilityInsightRow
                    color="#fb923c"
                    icon={
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#fb923c" strokeWidth="1.5">
                            <circle cx="12" cy="12" r="10" />
                            <line x1="12" y1="8" x2="12" y2="12" />
                            <line x1="12" y1="16" x2="12.01" y2="16" />
                        </svg>
                    }
                    label="Submitted late"
                    value={stats.tasksLate}
                />
                <ReliabilityInsightRow
                    color={stats.tasksMissed > 0 ? "#ef4444" : "var(--muted)"}
                    icon={
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none"
                            stroke={stats.tasksMissed > 0 ? "#ef4444" : "var(--muted)"}
                            strokeWidth="1.5">
                            <line x1="18" y1="6" x2="6" y2="18" />
                            <line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                    }
                    label="Missed"
                    value={stats.tasksMissed}
                />
            </div>
        </div>
    );
}