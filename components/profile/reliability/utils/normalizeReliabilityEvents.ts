import type { ReliabilityTimelineEvent, ReliabilityEventType } from "../types/reliability.types";

interface DbReliabilityEvent {
    id: string;
    eventType: string;
    scoreDelta: number;
    taskTitle: string | null;
    projectLabel: string | null;
    occurredAt: Date | string;
    isPublic: boolean;
}

export function normalizeReliabilityEvents(
    events: DbReliabilityEvent[],
    isOwner: boolean
): ReliabilityTimelineEvent[] {
    return events
        .filter((e) => isOwner || e.isPublic)
        .map((e) => ({
            id: e.id,
            eventType: e.eventType as ReliabilityEventType,
            scoreDelta: e.scoreDelta,
            taskTitle: e.taskTitle,
            projectLabel: e.projectLabel,
            occurredAt: new Date(e.occurredAt).toISOString(),
            isPublic: e.isPublic,
        }));
}

export const EVENT_TYPE_CONFIG: Record<
    ReliabilityEventType,
    { label: string; color: string; verb: string }
> = {
    COMPLETED: { label: "Completed", color: "#22c55e", verb: "Completed task" },
    LATE: { label: "Late", color: "#fb923c", verb: "Submitted late" },
    MISSED: { label: "Missed", color: "#ef4444", verb: "Missed deadline" },
    REJECTED: { label: "Rejected", color: "#f59e0b", verb: "Submission rejected" },
    REVIEWED: { label: "Reviewed", color: "#60a5fa", verb: "Work reviewed" },
};