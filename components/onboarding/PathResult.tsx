"use client";

import { useRouter } from "next/navigation";
import { PATHS } from "@/lib/path";

interface Props {
    goalId: string;
    skills: string[];
    onBack: () => void;
}

export default function PathResult({ goalId, skills, onBack }: Props) {
    const router = useRouter();
    const path = PATHS[goalId];
    const totalHrs = path.modules.reduce((a, m) => a + parseInt(m.duration), 0);

    async function handleStart() {
        await fetch("/api/onboarding", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ skills, goal: goalId, pathId: goalId }),
        });
        router.push("/dashboard");
    }

    return (
        <div>
            <div style={{ width: "28px", height: "2px", background: "var(--accent)", marginBottom: "1rem" }} />
            <h1 style={{ fontSize: "21px", fontWeight: 500, marginBottom: "5px", color: "var(--text)" }}>
                Your path is ready
            </h1>
            <p style={{ fontSize: "13px", color: "var(--muted)", marginBottom: "1.75rem", lineHeight: 1.6 }}>
                Tailored to what you know and where you want to go. Follow each module in order.
            </p>

            <div style={{ border: "0.5px solid var(--border)", borderRadius: "11px", background: "var(--surface)", overflow: "hidden", marginBottom: "1.75rem" }}>
                <div style={{ padding: "1rem 1.375rem", borderBottom: "0.5px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: "14px", fontWeight: 500, color: "var(--text)" }}>{path.label}</span>
                    <span style={{ fontSize: "11px", color: "var(--muted)", border: "0.5px solid var(--border)", borderRadius: "20px", padding: "2px 9px" }}>
                        {path.modules.length} modules · ~{totalHrs} hrs
                    </span>
                </div>
                {path.modules.map((mod, i) => (
                    <div key={i} style={{
                        display: "flex", alignItems: "center", gap: "11px",
                        padding: "0.8rem 1.375rem",
                        borderBottom: i < path.modules.length - 1 ? "0.5px solid var(--border)" : "none",
                    }}>
                        <div style={{
                            width: "22px", height: "22px", borderRadius: "50%",
                            border: "0.5px solid var(--border)", display: "flex",
                            alignItems: "center", justifyContent: "center",
                            fontSize: "10px", color: "var(--muted)", flexShrink: 0,
                        }}>
                            {i + 1}
                        </div>
                        <div style={{ flex: 1 }}>
                            <div style={{ fontSize: "12px", color: "var(--text)" }}>{mod.title}</div>
                            <div style={{ fontSize: "11px", color: "var(--muted)", marginTop: "2px" }}>{mod.sub}</div>
                        </div>
                        <div style={{
                            fontSize: "10px", padding: "2px 7px", borderRadius: "4px",
                            background: "var(--surface2)", border: "0.5px solid var(--border)",
                            color: "var(--muted)", whiteSpace: "nowrap",
                        }}>
                            {mod.duration}
                        </div>
                    </div>
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
                <button onClick={handleStart} style={{
                    padding: "8px 18px", borderRadius: "7px", fontSize: "13px",
                    border: "0.5px solid var(--accent)", background: "var(--accent)",
                    color: "var(--bg)", fontWeight: 500, cursor: "pointer",
                }}>
                    Start learning
                </button>
            </div>
        </div>
    );
}