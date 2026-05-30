"use client";

import type { Timeframe } from "../types/reliability.types";

const OPTIONS: { id: Timeframe; label: string }[] = [
    { id: "weekly", label: "Week" },
    { id: "monthly", label: "Month" },
    { id: "yearly", label: "Year" },
];

interface ReliabilityTimeframeSwitcherProps {
    value: Timeframe;
    onChange: (t: Timeframe) => void;
}

export default function ReliabilityTimeframeSwitcher({
    value, onChange,
}: ReliabilityTimeframeSwitcherProps) {
    return (
        <div
            style={{
                display: "flex",
                border: "0.5px solid var(--border)",
                borderRadius: "6px",
                overflow: "hidden",
            }}
        >
            {OPTIONS.map((opt, i) => (
                <button
                    key={opt.id}
                    onClick={() => onChange(opt.id)}
                    style={{
                        padding: "3px 9px",
                        fontSize: "10px",
                        background: value === opt.id ? "var(--surface2)" : "transparent",
                        color: value === opt.id ? "var(--text)" : "var(--muted)",
                        border: "none",
                        borderRight: i < OPTIONS.length - 1 ? "0.5px solid var(--border)" : "none",
                        cursor: "pointer",
                        transition: "background 0.1s, color 0.1s",
                    }}
                >
                    {opt.label}
                </button>
            ))}
        </div>
    );
}