"use client";

import { useState } from "react";
import { GOALS } from "@/lib/path";

interface Props {
    onNext: (goalId: string) => void;
    onBack: () => void;
}

export default function GoalPicker({ onNext, onBack }: Props) {
    const [selected, setSelected] = useState<string | null>(null);

    return (
        <div>
            <div style={{ width: "28px", height: "2px", background: "var(--accent)", marginBottom: "1rem" }} />
            <h1 style={{ fontSize: "21px", fontWeight: 500, marginBottom: "5px", color: "var(--text)" }}>
                What do you want to build?
            </h1>
            <p style={{ fontSize: "13px", color: "var(--muted)", marginBottom: "1.75rem", lineHeight: 1.6 }}>
                Pick your main goal. We&apos;ll map out exactly what to learn and in what order.
            </p>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "9px", marginBottom: "1.75rem" }}>
                {GOALS.map(goal => (
                    <button
                        key={goal.id}
                        onClick={() => setSelected(goal.id)}
                        style={{
                            padding: "1rem", borderRadius: "10px", textAlign: "left",
                            border: `0.5px solid ${selected === goal.id ? "var(--accent)" : "var(--border)"}`,
                            background: selected === goal.id ? "var(--surface2)" : "var(--surface)",
                            cursor: "pointer", transition: "all 0.15s",
                        }}
                    >
                        <div style={{ fontSize: "14px", marginBottom: "7px" }}>{goal.icon}</div>
                        <div style={{ fontSize: "13px", fontWeight: 500, color: "var(--text)", marginBottom: "2px" }}>
                            {goal.title}
                        </div>
                        <div style={{ fontSize: "11px", color: "var(--muted)", lineHeight: 1.5 }}>
                            {goal.desc}
                        </div>
                    </button>
                ))}
            </div>

            <div style={{ display: "flex", justifyContent: "space-between" }}>
                <button onClick={onBack} style={{
                    padding: "8px 18px", borderRadius: "7px", fontSize: "13px",
                    border: "0.5px solid var(--border)", background: "transparent",
                    color: "var(--muted)", cursor: "pointer",
                }}>
                    Back
                </button>
                <button
                    onClick={() => selected && onNext(selected)}
                    disabled={!selected}
                    style={{
                        padding: "8px 18px", borderRadius: "7px", fontSize: "13px",
                        border: "0.5px solid var(--accent)", background: "var(--accent)",
                        color: "var(--bg)", fontWeight: 500,
                        cursor: !selected ? "not-allowed" : "pointer",
                        opacity: !selected ? 0.3 : 1, transition: "opacity 0.15s",
                    }}
                >
                    Generate my path
                </button>
            </div>
        </div>
    );
}