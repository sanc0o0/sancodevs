export type ReliabilityTier =
    | "Excellent"
    | "Good"
    | "Fair"
    | "At risk"
    | "Inconsistent"
    | "New";

export type ReliabilityEventType =
    | "COMPLETED"
    | "LATE"
    | "MISSED"
    | "REJECTED"
    | "REVIEWED";

export type Timeframe = "weekly" | "monthly" | "yearly";

export interface ActivityBucket {
    period: string;
    done: number;
    late: number;
    missed: number;
}

export interface ReliabilityTierConfig {
    label: ReliabilityTier;
    color: string;
    behavior: string;
    min: number;
}

export interface ReliabilityStats {
    reliabilityScore: number | null;
    onTimeRate: number;
    tasksCompleted: number;
    tasksLate: number;
    tasksMissed: number;
    tasksRejected: number;
    totalTaskVolume: number;
    consistencyStreak: number;
}

export interface ReliabilityTrendSignals {
    improving: boolean;
    declining: boolean;
    stable: boolean;
    label: string | null;
}

export interface ReliabilityTimelineEvent {
    id: string;
    eventType: ReliabilityEventType;
    scoreDelta: number;
    taskTitle: string | null;
    projectLabel: string | null;
    occurredAt: string;
    isPublic: boolean;
}

export interface ReliabilitySummary {
    score: number | null;
    tier: ReliabilityTier;
    trend: ReliabilityTrendSignals;
    confidence: "none" | "low" | "medium" | "high";
    totalTrackedTasks: number;
    inactive: boolean;
}

export interface ReliabilityVisibility {
    isVisible: boolean;
    isOwner: boolean;
    isRestricted: boolean;
}