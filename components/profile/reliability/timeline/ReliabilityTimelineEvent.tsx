"use client";

import type { ReliabilityTimelineEvent as TEvent } from "../types/reliability.types";
import { EVENT_TYPE_CONFIG } from "../utils/normalizeReliabilityEvents";

interface ReliabilityTimelineEventProps {
    event: TEvent;
}

function relativeTime(iso: string): string {
    const diff = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(diff / 60000);
    const hrs = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    if (mins < 1) return "Just now";
    if (mins < 60) return `${mins}m ago`;
    if (hrs < 24) return `${hrs}h ago`;
    if (days < 30) return `${days}d ago`;
    return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export default function ReliabilityTimelineEventRow({
    event,
}: ReliabilityTimelineEventProps) {
    const config = EVENT_TYPE_CONFIG[event.eventType];
    const showDelta =
        event.scoreDelta !== 0 && Math.abs(event.scoreDelta) > 0.05;

    return (
        <div
            style={{
                display: "flex",
                alignItems: "flex-start",
                gap: "10px",
                padding: "8px 0",
            }}
        >
            {/* Event dot */}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", paddingTop: "3px" }}>
                <span
                    style={{
                        width: "7px",
                        height: "7px",
                        borderRadius: "50%",
                        background: config?.color ?? "var(--muted)",
                        flexShrink: 0,
                    }}
                />
            </div>

            {/* Content */}
            <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "2px" }}>
                    <span style={{ fontSize: "11px", color: "var(--text)", fontWeight: 400 }}>
                        {config?.verb ?? event.eventType}
                    </span>
                    {showDelta && (
                        <span
                            style={{
                                fontSize: "10px",
                                color: event.scoreDelta > 0 ? "#22c55e" : "#ef4444",
                                fontWeight: 500,
                            }}
                        >
                            {event.scoreDelta > 0 ? "+" : ""}
                            {event.scoreDelta.toFixed(1)}
                        </span>
                    )}
                </div>

                {event.taskTitle && (
                    <p style={{ fontSize: "10px", color: "var(--muted)", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {event.taskTitle}
                        {event.projectLabel && (
                            <span style={{ marginLeft: "5px", opacity: 0.7 }}>· {event.projectLabel}</span>
                        )}
                    </p>
                )}
            </div>

            <span style={{ fontSize: "10px", color: "var(--muted)", flexShrink: 0, whiteSpace: "nowrap" }}>
                {relativeTime(event.occurredAt)}
            </span>
        </div>
    );
}