"use client";

import type { ActivityBucket } from "../types/reliability.types";

interface ReliabilityTooltipProps {
    bucket: ActivityBucket;
}

export default function ReliabilityTooltip({ bucket }: ReliabilityTooltipProps) {
    return (
        <div
            style={{
                position: "absolute",
                bottom: "calc(100% + 6px)",
                left: "50%",
                transform: "translateX(-50%)",
                background: "var(--surface2)",
                border: "0.5px solid var(--border)",
                borderRadius: "6px",
                padding: "6px 8px",
                zIndex: 10,
                whiteSpace: "nowrap",
                pointerEvents: "none",
                fontSize: "10px",
                color: "var(--text)",
                animation: "reliabilityFadeIn 0.1s ease both",
            }}
        >
            <p style={{ margin: "0 0 3px", fontSize: "9px", color: "var(--muted)" }}>
                {bucket.period}
            </p>
            {bucket.done > 0 && (
                <p style={{ margin: "1px 0", color: "#22c55e" }}>{bucket.done} done</p>
            )}
            {bucket.late > 0 && (
                <p style={{ margin: "1px 0", color: "#fb923c" }}>{bucket.late} late</p>
            )}
            {bucket.missed > 0 && (
                <p style={{ margin: "1px 0", color: "#ef4444" }}>{bucket.missed} missed</p>
            )}
        </div>
    );
}