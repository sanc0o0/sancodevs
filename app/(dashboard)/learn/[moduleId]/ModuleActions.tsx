"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Props {
    moduleIndex: number;
    pathId: string;
    isDone: boolean;
    nextIndex: number | null;
    prevIndex: number | null;
}

export default function ModuleActions({ moduleIndex, pathId, isDone, nextIndex, prevIndex }: Props) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [done, setDone] = useState(isDone);

    async function markComplete() {
        setLoading(true);
        await fetch("/api/progress", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ pathId, moduleIndex }),
        });
        setDone(true);
        setLoading(false);
        router.refresh();
    }

    return (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "10px" }}>
            {/* Prev */}
            <div>
                {prevIndex !== null && (
                    <button
                        onClick={() => router.push(`/learn/${prevIndex}`)}
                        style={{
                            padding: "8px 16px", borderRadius: "7px", fontSize: "13px",
                            border: "0.5px solid var(--border)", background: "transparent",
                            color: "var(--muted)", cursor: "pointer",
                        }}
                    >
                        ← Previous
                    </button>
                )}
            </div>

            {/* Mark complete + next */}
            <div style={{ display: "flex", gap: "8px" }}>
                {!done && (
                    <button
                        onClick={markComplete}
                        disabled={loading}
                        style={{
                            padding: "8px 18px", borderRadius: "7px", fontSize: "13px",
                            border: "0.5px solid var(--accent)", background: "var(--accent)",
                            color: "var(--bg)", fontWeight: 500,
                            cursor: loading ? "not-allowed" : "pointer",
                            opacity: loading ? 0.6 : 1,
                        }}
                    >
                        {loading ? "Saving..." : "Mark as complete"}
                    </button>
                )}
                {done && nextIndex !== null && (
                    <button
                        onClick={() => router.push(`/learn/${nextIndex}`)}
                        style={{
                            padding: "8px 18px", borderRadius: "7px", fontSize: "13px",
                            border: "0.5px solid var(--accent)", background: "var(--accent)",
                            color: "var(--bg)", fontWeight: 500, cursor: "pointer",
                        }}
                    >
                        Next module →
                    </button>
                )}
                {done && nextIndex === null && (
                    <button
                        onClick={() => router.push("/dashboard")}
                        style={{
                            padding: "8px 18px", borderRadius: "7px", fontSize: "13px",
                            border: "0.5px solid var(--accent)", background: "var(--accent)",
                            color: "var(--bg)", fontWeight: 500, cursor: "pointer",
                        }}
                    >
                        Path complete →
                    </button>
                )}
            </div>
        </div>
    );
}