"use client";

import { useState } from "react";
import ReliabilityHero from "./reliability/hero/ReliabilityHero";
import ReliabilityTab from "./reliability/ReliabilityTab";
import { useReliabilityData } from "./reliability/hooks/useReliabilityData";
import { useReliabilityTrend } from "./reliability/hooks/useReliabilityTrend";
import { computeReliabilityTier } from "./reliability/utils/computeReliabilityTier";
import { computeConfidence } from "./reliability/utils/computeReliabilityTier";

interface ReliabilityCardProps {
    userId: string;
    isOwner: boolean;
}

export default function ReliabilityCard({ userId, isOwner }: ReliabilityCardProps) {
    const [expanded, setExpanded] = useState(false);

    const { data, loading, error, refetch } = useReliabilityData(userId, expanded);

    // Derive display values — fall back gracefully before data loads
    const score = data?.summary.score ?? null;
    const confidence = data ? computeConfidence(data.summary.totalTrackedTasks) : "none";
    const tier = computeReliabilityTier(score);

    const weeklyBuckets = data?.activity.weekly ?? [];
    const trend = useReliabilityTrend(weeklyBuckets);

    const isNewUser = !loading && data !== null && data.summary.totalTrackedTasks === 0;

    return (
        <div
            style={{
                border: "0.5px solid var(--border)",
                borderRadius: "10px",
                background: "var(--surface)",
                overflow: "hidden",
                fontFamily: "var(--font-body)",
            }}
        >
            {/* Level 1 — always visible, no fetch needed */}
            <ReliabilityHero
                score={score}
                confidence={confidence}
                trend={trend}
                behavior={tier.behavior}
                expanded={expanded}
                isNewUser={isNewUser}
                onToggle={() => setExpanded((e) => !e)}
            />

            {/* Level 2 — lazy, only mounts on first expand */}
            {expanded && (
                <div style={{ borderTop: "0.5px solid var(--border)" }}>
                    <ReliabilityTab
                        data={data}
                        loading={loading}
                        error={error}
                        isOwner={isOwner}
                        onRetry={refetch}
                    />
                </div>
            )}

            <style>{`
        @keyframes reliabilityFadeIn {
          from { opacity: 0; transform: translateY(4px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
        </div>
    );
}