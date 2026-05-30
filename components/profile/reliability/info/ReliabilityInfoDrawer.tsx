"use client";

import { useState } from "react";

function InfoRule({
    color, label, effect,
}: {
    color: string;
    label: string;
    effect: string;
}) {
    return (
        <div style={{ display: "flex", alignItems: "flex-start", gap: "8px" }}>
            <span
                style={{
                    width: "6px",
                    height: "6px",
                    borderRadius: "50%",
                    background: color,
                    flexShrink: 0,
                    marginTop: "3px",
                }}
            />
            <div>
                <span style={{ fontSize: "11px", color: "var(--text)" }}>{label}</span>
                <span style={{ fontSize: "10px", color: "var(--muted)", marginLeft: "6px" }}>
                    — {effect}
                </span>
            </div>
        </div>
    );
}

export default function ReliabilityInfoDrawer() {
    const [open, setOpen] = useState(false);

    return (
        <div style={{ padding: "0 16px 16px" }}>
            <button
                onClick={() => setOpen((o) => !o)}
                style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "5px",
                    fontSize: "11px",
                    color: "var(--muted)",
                    background: "transparent",
                    border: "none",
                    cursor: "pointer",
                    padding: 0,
                }}
            >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="16" x2="12" y2="12" />
                    <line x1="12" y1="8" x2="12.01" y2="8" />
                </svg>
                How reliability is calculated
                <svg
                    width="10" height="10" viewBox="0 0 24 24"
                    fill="none" stroke="currentColor" strokeWidth="1.5"
                    style={{
                        transform: open ? "rotate(180deg)" : "rotate(0deg)",
                        transition: "transform 0.15s",
                    }}
                >
                    <polyline points="6 9 12 15 18 9" />
                </svg>
            </button>

            {open && (
                <div
                    style={{
                        marginTop: "10px",
                        padding: "12px 14px",
                        borderRadius: "8px",
                        border: "0.5px solid var(--border)",
                        background: "var(--surface2)",
                        animation: "reliabilityFadeIn 0.15s ease both",
                    }}
                >
                    <p
                        style={{
                            fontSize: "11px",
                            color: "var(--text)",
                            fontWeight: 500,
                            margin: "0 0 8px",
                        }}
                    >
                        Reliability increases when work is completed consistently and on time.
                    </p>

                    <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                        <InfoRule color="#22c55e" label="Completed on time" effect="Full contribution to score" />
                        <InfoRule color="#fb923c" label="Submitted late" effect="Partial contribution (0.6×)" />
                        <InfoRule color="#f59e0b" label="Rejected" effect="Minor contribution (0.2×)" />
                        <InfoRule color="#ef4444" label="Missed deadline" effect="No contribution — impacts heavily" />
                    </div>

                    <p
                        style={{
                            fontSize: "10px",
                            color: "var(--muted)",
                            marginTop: "10px",
                            lineHeight: 1.5,
                            margin: "10px 0 0",
                        }}
                    >
                        A score appears after completing at least 3 tracked tasks.
                        Early scores have higher variance. Volume is taken into account —
                        a large history produces more stable signals.
                    </p>
                </div>
            )}
        </div>
    );
}