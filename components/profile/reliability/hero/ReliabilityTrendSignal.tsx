"use client";

import type { ReliabilityTrendSignals } from "../types/reliability.types";

interface ReliabilityTrendSignalProps {
    trend: ReliabilityTrendSignals;
}

export default function ReliabilityTrendSignal({ trend }: ReliabilityTrendSignalProps) {
    if (!trend.label) return null;

    const color = trend.improving
        ? "#22c55e"
        : trend.declining
            ? "#ef4444"
            : "var(--muted)";

    return (
        <p style={{ fontSize: "10px", margin: "4px 0 0", lineHeight: 1.4 }}>
            <span style={{ color }}>{trend.label}</span>
        </p>
    );
}