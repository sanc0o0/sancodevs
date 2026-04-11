"use client";

import { useState } from "react";
import { SKILLS } from "@/lib/path";

interface Props {
    onNext: (skills: string[]) => void;
}

export default function SkillPicker({ onNext }: Props) {
    const [picked, setPicked] = useState<Set<string>>(new Set());

    function toggle(skill: string) {
        setPicked(prev => {
            const next = new Set(prev);
            next.has(skill) ? next.delete(skill) : next.add(skill);
            return next;
        });
    }

    return (
        <div>
            <div style={{ width: "28px", height: "2px", background: "var(--accent)", marginBottom: "1rem" }} />
            <h1 style={{ fontSize: "21px", fontWeight: 500, marginBottom: "5px", color: "var(--text)" }}>
                What do you already know?
            </h1>
            <p style={{ fontSize: "13px", color: "var(--muted)", marginBottom: "1.75rem", lineHeight: 1.6 }}>
                Pick everything you&apos;re comfortable with. Be honest — this shapes your learning path.
            </p>

            <div style={{ display: "flex", flexWrap: "wrap", gap: "7px", marginBottom: "1.75rem" }}>
                {SKILLS.map(skill => (
                    <button
                        key={skill}
                        onClick={() => toggle(skill)}
                        style={{
                            padding: "6px 13px", borderRadius: "7px", fontSize: "12px",
                            border: `0.5px solid ${picked.has(skill) ? "var(--accent)" : "var(--border)"}`,
                            background: picked.has(skill) ? "var(--surface2)" : "var(--surface)",
                            color: picked.has(skill) ? "var(--text)" : "var(--muted)",
                            cursor: "pointer", transition: "all 0.15s",
                        }}
                    >
                        {skill}
                    </button>
                ))}
            </div>

            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{ fontSize: "12px", color: "var(--muted)" }}>{picked.size} selected</span>
                <button
                    onClick={() => onNext(Array.from(picked))}
                    disabled={picked.size === 0}
                    style={{
                        padding: "8px 18px", borderRadius: "7px", fontSize: "13px",
                        border: "0.5px solid var(--accent)", background: "var(--accent)",
                        color: "var(--bg)", fontWeight: 500, cursor: picked.size === 0 ? "not-allowed" : "pointer",
                        opacity: picked.size === 0 ? 0.3 : 1, transition: "opacity 0.15s",
                    }}
                >
                    Continue
                </button>
            </div>
        </div>
    );
}