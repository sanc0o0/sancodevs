import type {
    ActivityBucket,
    ReliabilityStats,
    ReliabilityTrendSignals,
    ReliabilityTimelineEvent,
    ReliabilityVisibility,
} from "./reliability.types";

export interface ReliabilityApiResponse {
    summary: {
        score: number | null;
        tier: string;
        trend: ReliabilityTrendSignals;
        confidence: "none" | "low" | "medium" | "high";
        totalTrackedTasks: number;
        inactive: boolean;
    };
    stats: ReliabilityStats;
    activity: {
        weekly: ActivityBucket[];
        monthly: ActivityBucket[];
        yearly: ActivityBucket[];
    };
    timeline: ReliabilityTimelineEvent[];
    visibility: ReliabilityVisibility;
}