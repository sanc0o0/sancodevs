"use client";

import ReliabilityActivitySection from "./activity/ReliabilityActivitySection";
import ReliabilityInsights from "./insights/ReliabilityInsights";
import ReliabilityTimeline from "./timeline/ReliabilityTimeline";
import ReliabilityInfoDrawer from "./info/ReliabilityInfoDrawer";
import ReliabilityNewUserState from "./states/ReliabilityNewUserState";
import ReliabilityErrorState from "./states/ReliabilityErrorState";
import ReliabilitySkeleton from "./shared/ReliabilitySkeleton";
import type { ReliabilityApiResponse } from "./types/reliability.api.types";

interface ReliabilityTabProps {
    data: ReliabilityApiResponse | null;
    loading: boolean;
    error: string | null;
    isOwner: boolean;
    onRetry: () => void;
}

export default function ReliabilityTab({
    data, loading, error, isOwner, onRetry,
}: ReliabilityTabProps) {
    if (loading) return <ReliabilitySkeleton rows={5} />;
    if (error) return <ReliabilityErrorState onRetry={onRetry} />;
    if (!data || data.summary.totalTrackedTasks === 0) return <ReliabilityNewUserState />;

    return (
        <div
            style={{
                display: "flex",
                flexDirection: "column",
                gap: "0",
                animation: "reliabilityFadeIn 0.18s ease both",
            }}
        >
            {/* Activity graph with timeframe switcher */}
            <ReliabilityActivitySection activity={data.activity} />

            {/* Divider */}
            <div style={{ height: "0.5px", background: "var(--border)", margin: "0 16px" }} />

            {/* Score ring + insight rows */}
            <div style={{ padding: "14px 0 0" }}>
                <ReliabilityInsights stats={data.stats} />
            </div>

            {/* Divider */}
            <div style={{ height: "0.5px", background: "var(--border)", margin: "0 16px" }} />

            {/* Timeline — owner gets full history, public gets public events only */}
            <div style={{ padding: "14px 0 0" }}>
                <ReliabilityTimeline
                    events={data.timeline}
                    isOwner={isOwner}
                />
            </div>

            {/* How reliability is calculated */}
            <div style={{ height: "0.5px", background: "var(--border)", margin: "8px 16px" }} />
            <ReliabilityInfoDrawer />
        </div>
    );
}