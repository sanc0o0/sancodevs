"use client";

import { useState } from "react";
import type { ReliabilityTimelineEvent } from "../types/reliability.types";
import ReliabilityTimelineEventRow from "./ReliabilityTimelineEvent";
import ReliabilityEmpty from "../shared/ReliabilityEmpty";
import ReliabilitySection from "../shared/ReliabilitySection";

interface ReliabilityTimelineProps {
    events: ReliabilityTimelineEvent[];
    isOwner: boolean;
}

const PAGE_SIZE = 8;

export default function ReliabilityTimeline({
    events,
    isOwner,
}: ReliabilityTimelineProps) {
    const [showing, setShowing] = useState(PAGE_SIZE);

    const visible = events.slice(0, showing);
    const hasMore = events.length > showing;

    if (events.length === 0) {
        return (
            <ReliabilitySection label="Recent activity">
                <ReliabilityEmpty
                    title="No events yet"
                    subtitle="Completed and missed tasks will appear here."
                />
            </ReliabilitySection>
        );
    }

    return (
        <ReliabilitySection label="Recent activity">
            <div
                style={{
                    display: "flex",
                    flexDirection: "column",
                }}
            >
                {visible.map((event, i) => (
                    <div
                        key={event.id}
                        style={{
                            borderBottom: i < visible.length - 1 ? "0.5px solid var(--border)" : "none",
                        }}
                    >
                        <ReliabilityTimelineEventRow event={event} />
                    </div>
                ))}
            </div>

            {hasMore && (
                <button
                    onClick={() => setShowing((s) => s + PAGE_SIZE)}
                    style={{
                        marginTop: "10px",
                        width: "100%",
                        padding: "7px",
                        fontSize: "11px",
                        color: "var(--muted)",
                        background: "transparent",
                        border: "0.5px solid var(--border)",
                        borderRadius: "6px",
                        cursor: "pointer",
                    }}
                >
                    Show {Math.min(PAGE_SIZE, events.length - showing)} more
                </button>
            )}
        </ReliabilitySection>
    );
}