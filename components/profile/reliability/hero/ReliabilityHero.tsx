"use client";

import ReliabilityScoreRing from "./ReliabilityScoreRing";
import ReliabilityTierBadge from "./ReliabilityTierBadge";
import ReliabilityTrendSignal from "./ReliabilityTrendSignal";
import type { ReliabilityTrendSignals } from "../types/reliability.types";
import { computeReliabilityTier } from "../utils/computeReliabilityTier";

interface ReliabilityHeroProps {
    score: number | null;
    confidence: "none" | "low" | "medium" | "high";
    trend: ReliabilityTrendSignals;
    behavior: string;
    expanded: boolean;
    isNewUser: boolean;
    onToggle: () => void;
}

export default function ReliabilityHero({
    score,
    confidence,
    trend,
    behavior,
    expanded,
    isNewUser,
    onToggle,
}: ReliabilityHeroProps) {
    const tier = computeReliabilityTier(score);

    return (
        <div
            style={{
                padding: "14px 16px",
                display: "flex",
                alignItems: "center",
                gap: "14px",
            }}
        >
            <ReliabilityScoreRing score={score} color={tier.color} size={52} strokeWidth={3} />

            <div style={{ flex: 1, minWidth: 0 }}>
                <ReliabilityTierBadge
                    label={tier.label}
                    color={tier.color}
                    score={score}
                    confidence={confidence}
                />
                <p
                    style={{
                        fontSize: "11px",
                        color: "var(--muted)",
                        lineHeight: 1.4,
                        margin: 0,
                    }}
                >
                    {behavior}
                </p>
                <ReliabilityTrendSignal trend={trend} />
            </div>

            <button
                onClick={onToggle}
                style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "4px",
                    fontSize: "10px",
                    color: "var(--muted)",
                    background: "transparent",
                    border: "0.5px solid var(--border)",
                    borderRadius: "6px",
                    padding: "5px 9px",
                    cursor: "pointer",
                    flexShrink: 0,
                    whiteSpace: "nowrap",
                }}
            >
                {expanded ? "Hide" : isNewUser ? "Learn more" : "Details"}
                <svg
                    width="10" height="10" viewBox="0 0 24 24"
                    fill="none" stroke="currentColor" strokeWidth="1.5"
                    style={{
                        transform: expanded ? "rotate(180deg)" : "rotate(0deg)",
                        transition: "transform 0.2s",
                    }}
                >
                    <polyline points="6 9 12 15 18 9" />
                </svg>
            </button>
        </div>
    );
}``