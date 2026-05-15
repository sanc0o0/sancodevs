"use client";

import { useMemo } from "react";

// ─── TYPES ────────────────────────────────────────────────────────────────────

export interface ReliabilityData {
    reliabilityScore: number | null; // 0-100, null for new users
    onTimeRate: number;
    tasksCompleted: number;
    tasksLate: number;
    tasksMissed: number;
    tasksRejected: number;
    // Optional: per-week activity for the bar graph
    // Each entry = { week: "Week 1", done: 3, late: 1, missed: 0 }
    weeklyActivity?: { week: string; done: number; late: number; missed: number }[];
}

// ─── HELPERS ─────────────────────────────────────────────────────────────────

function getReliabilityTier(score: number | null): { label: string; color: string; description: string } {
    if (score === null) {
        return {
            label: "New",
            color: "#64748b",
            description: "No execution history yet",
        };
    }
    if (score >= 90) {
        return { 
            label: "Excellent", 
            color: "#22c55e", 
            description: "Consistently delivers on time" 
        };
    }
    if (score >= 75) {
        return { 
            label: "Good", 
            color: "#86efac", 
            description: "Reliable with minor delays" 
        };
    }
    if (score >= 55) {
        return { 
            label: "Fair", 
            color: "#facc15", 
            description: "Occasional misses or delays" 
        };
    }
    if (score >= 35) {
        return { 
            label: "Inconsistent", 
            color: "#fb923c", 
            description: "Frequent delays or missed tasks" 
        };
    }
    return { 
        label: "At risk", 
        color: "#ef4444", 
        description: "Multiple missed deadlines" 
    };
}

// Generate placeholder weekly data from totals when no real data provided
function generateWeeklyFromTotals(
    done: number,
    late: number,
    missed: number
): { week: string; done: number; late: number; missed: number }[] {
    const total = done + late + missed;
    if (total === 0) return Array.from({ length: 8 }, (_, i) => ({ week: `W${i + 1}`, done: 0, late: 0, missed: 0 }));

    // Distribute tasks roughly across 8 weeks
    const weeks = 8;
    const result = Array.from({ length: weeks }, (_, i) => ({ week: `W${i + 1}`, done: 0, late: 0, missed: 0 }));
    let remaining = { done, late, missed };

    for (let w = weeks - 1; w >= 0 && (remaining.done + remaining.late + remaining.missed > 0); w--) {
        const chunk = Math.ceil((remaining.done + remaining.late + remaining.missed) / (w + 1));
        let left = chunk;
        const d = Math.min(remaining.done, left); remaining.done -= d; left -= d;
        const l = Math.min(remaining.late, left); remaining.late -= l; left -= l;
        const m = Math.min(remaining.missed, left); remaining.missed -= m;
        result[w] = { ...result[w], done: d, late: l, missed: m };
    }
    return result;
}

// ─── BAR GRAPH ───────────────────────────────────────────────────────────────

function BarGraph({ data }: { data: { week: string; done: number; late: number; missed: number }[] }) {
    const maxVal = Math.max(...data.map(d => d.done + d.late + d.missed), 1);

    return (
        <div>
            {/* Bars */}
            <div style={{ display: "flex", alignItems: "flex-end", gap: 6, height: 80, marginBottom: 6 }}>
                {data.map((d, i) => {
                    const total = d.done + d.late + d.missed;
                    const height = total === 0 ? 4 : Math.max(6, Math.round((total / maxVal) * 76));
                    const donePct = total > 0 ? (d.done / total) * 100 : 0;
                    const latePct = total > 0 ? (d.late / total) * 100 : 0;
                    const missedPct = total > 0 ? (d.missed / total) * 100 : 0;

                    return (
                        <div
                            key={i}
                            title={`${d.week}: ${d.done} done, ${d.late} late, ${d.missed} missed`}
                            style={{
                                flex: 1,
                                height: height,
                                borderRadius: 4,
                                overflow: "hidden",
                                display: "flex",
                                flexDirection: "column-reverse",
                                cursor: "default",
                                minWidth: 0,
                                background: total === 0 ? "var(--border)" : "transparent",
                            }}
                        >
                            {total > 0 && (
                                <>
                                    <div style={{ height: `${donePct}%`, background: "#22c55e", minHeight: donePct > 0 ? 2 : 0 }} />
                                    <div style={{ height: `${latePct}%`, background: "#fb923c", minHeight: latePct > 0 ? 2 : 0 }} />
                                    <div style={{ height: `${missedPct}%`, background: "#ef4444", minHeight: missedPct > 0 ? 2 : 0 }} />
                                </>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Week labels */}
            <div style={{ display: "flex", gap: 6 }}>
                {data.map((d, i) => (
                    <div key={i} style={{ flex: 1, textAlign: "center", fontSize: 8, color: "var(--muted)", minWidth: 0, overflow: "hidden" }}>
                        {d.week}
                    </div>
                ))}
            </div>

            {/* Legend */}
            <div style={{ display: "flex", gap: 14, marginTop: 10 }}>
                {[
                    { color: "#22c55e", label: "Done" },
                    { color: "#fb923c", label: "Late" },
                    { color: "#ef4444", label: "Missed" },
                ].map(l => (
                    <div key={l.label} style={{ display: "flex", alignItems: "center", gap: 5 }}>
                        <span style={{ width: 8, height: 8, borderRadius: 2, background: l.color, flexShrink: 0 }} />
                        <span style={{ fontSize: 10, color: "var(--muted)" }}>{l.label}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}

// ─── SCORE RING ───────────────────────────────────────────────────────────────

function ScoreRing({ score, color, size = 88 }: { score: number | null; color: string; size?: number }) {
    const R = (size / 2) - 8;
    const C = 2 * Math.PI * R;
    const safescore = score ?? 0;
    const offset = C - (safescore / 100) * C;

    return (
        <div style={{ position: "relative", width: size, height: size, flexShrink: 0 }}>
            <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
                <circle cx={size / 2} cy={size / 2} r={R} fill="none" stroke="var(--surface2)" strokeWidth="6" />
                <circle
                    cx={size / 2} cy={size / 2} r={R} fill="none"
                    stroke={color} strokeWidth="6" strokeLinecap="round"
                    strokeDasharray={C} strokeDashoffset={offset}
                    transform={`rotate(-90 ${size / 2} ${size / 2})`}
                />
            </svg>
            <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
                <span style={{ fontSize: size > 80 ? 18 : 14, fontWeight: 700, color: "var(--text)", lineHeight: 1 }}>{score === null ? "-" : score}</span>
                <span style={{ fontSize: 7, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.06em", marginTop: 1 }}>/100</span>
            </div>
        </div>
    );
}

// ─── RATE BAR ─────────────────────────────────────────────────────────────────

function RateBar({ label, value, color }: { label: string; value: number; color: string }) {
    return (
        <div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                <span style={{ fontSize: 11, color: "var(--muted)" }}>{label}</span>
                <span style={{ fontSize: 11, fontWeight: 600, color }}>{value}%</span>
            </div>
            <div style={{ height: 4, background: "var(--surface2)", borderRadius: 3, overflow: "hidden" }}>
                <div style={{ height: "100%", width: `${value}%`, background: color, borderRadius: 3, transition: "width 0.6s ease" }} />
            </div>
        </div>
    );
}

// ─── STAT PILL ────────────────────────────────────────────────────────────────

function StatPill({ value, label, color }: { value: number; label: string; color: string }) {
    return (
        <div style={{
            flex: 1,
            textAlign: "center",
            padding: "10px 6px",
            borderRadius: 8,
            border: "0.5px solid var(--border)",
            background: "var(--surface2)",
            minWidth: 0,
        }}>
            <div style={{ fontSize: 18, fontWeight: 700, color: value === 0 ? "var(--muted)" : color, lineHeight: 1 }}>{value}</div>
            <div style={{ fontSize: 9, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.05em", marginTop: 3 }}>{label}</div>
        </div>
    );
}

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────

export default function ReliabilityCard({ data }: { data: ReliabilityData }) {
    const tier = getReliabilityTier(data.reliabilityScore);
    const total = data.tasksCompleted + data.tasksLate + data.tasksMissed + data.tasksRejected;

    const weeklyData = useMemo(
        () => data.weeklyActivity ?? generateWeeklyFromTotals(data.tasksCompleted, data.tasksLate, data.tasksMissed),
        [data]
    );

    const completionRate = total > 0
        ? Math.round(((data.tasksCompleted + data.tasksLate) / total) * 100)
        : 100;

    return (
        <div style={{
            border: "0.5px solid var(--border)",
            borderRadius: 12,
            background: "var(--surface)",
            overflow: "hidden",
            fontFamily: "var(--font-body)",
            width: "100%",
        }}>

            {/* ── HEADER ── */}
            <div style={{ padding: "14px 18px", borderBottom: "0.5px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div>
                    <p style={{ fontSize: 11, fontWeight: 500, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.08em", margin: 0, marginBottom: 2 }}>
                        Reliability
                    </p>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <span style={{ fontSize: 13, fontWeight: 600, color: tier.color }}>{tier.label}</span>
                        <span style={{ fontSize: 11, color: "var(--muted)" }}>— {tier.description}</span>
                    </div>
                </div>
                {total === 0 && (
                    <span style={{ fontSize: 10, color: "var(--muted)", fontStyle: "italic" }}>No tasks yet</span>
                )}
            </div>

            <div style={{ padding: "16px 18px", display: "flex", flexDirection: "column", gap: 16 }}>

                {/* ── SCORE ROW ── */}
                <div style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
                    <ScoreRing score={data.reliabilityScore} color={tier.color} size={90} />

                    <div style={{ flex: 1, minWidth: 160, display: "flex", flexDirection: "column", gap: 10 }}>
                        <RateBar label="Reliability score" value={data.reliabilityScore ?? 0} color={tier.color} />
                        <RateBar label="On-time rate" value={data.onTimeRate} color="#22c55e" />
                        <RateBar label="Completion rate" value={completionRate} color="#60a5fa" />
                    </div>
                </div>

                {/* ── 4 STAT PILLS ── */}
                <div style={{ display: "flex", gap: 6 }}>
                    <StatPill value={data.tasksCompleted} label="Done" color="#22c55e" />
                    <StatPill value={data.tasksLate} label="Late" color="#fb923c" />
                    <StatPill value={data.tasksMissed} label="Missed" color="#ef4444" />
                    <StatPill value={data.tasksRejected} label="Rejected" color="#f59e0b" />
                </div>

                {/* ── DIVIDER ── */}
                <div style={{ height: "0.5px", background: "var(--border)" }} />

                {/* ── ACTIVITY BAR GRAPH ── */}
                <div>
                    <p style={{ fontSize: 10, fontWeight: 500, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 12 }}>
                        Task activity
                        <span style={{ fontWeight: 400, marginLeft: 8, textTransform: "none", letterSpacing: 0 }}>
                            ({total} total tasks)
                        </span>
                    </p>
                    <BarGraph data={weeklyData} />
                </div>

                {/* ── RANKING TABLE ── */}
                <div>
                    <p style={{ fontSize: 10, fontWeight: 500, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 10 }}>
                        Score breakdown
                    </p>

                    {/* Table header */}
                    <div style={{ display: "grid", gridTemplateColumns: "auto 1fr auto auto", gap: "6px 12px", alignItems: "center", marginBottom: 6, padding: "0 2px" }}>
                        <span style={{ fontSize: 9, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.07em" }}>#</span>
                        <span style={{ fontSize: 9, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.07em" }}>Metric</span>
                        <span style={{ fontSize: 9, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.07em" }}>Score</span>
                        <span style={{ fontSize: 9, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.07em" }}>Weight</span>
                    </div>

                    {/* Table rows */}
                    {[
                        { rank: 1, label: "Tasks completed on time", score: `${data.tasksCompleted}`, pct: data.onTimeRate, color: "#22c55e", weight: "1.0×" },
                        { rank: 2, label: "Late submissions", score: `${data.tasksLate}`, pct: null, color: "#fb923c", weight: "0.6×" },
                        { rank: 3, label: "Missed deadlines", score: `${data.tasksMissed}`, pct: null, color: "#ef4444", weight: "0.0×" },
                        { rank: 4, label: "Rejected submissions", score: `${data.tasksRejected}`, pct: null, color: "#f59e0b", weight: "0.2×" },
                    ].map((row, i, arr) => (
                        <div
                            key={row.rank}
                            style={{
                                display: "grid",
                                gridTemplateColumns: "auto 1fr auto auto",
                                gap: "6px 12px",
                                alignItems: "center",
                                padding: "9px 2px",
                                borderBottom: i < arr.length - 1 ? "0.5px solid var(--border)" : "none",
                            }}
                        >
                            <span style={{ fontSize: 11, color: "var(--muted)", width: 14, textAlign: "center" }}>{row.rank}</span>
                            <span style={{ fontSize: 12, color: "var(--text)" }}>{row.label}</span>
                            <span style={{ fontSize: 12, fontWeight: 600, color: row.color, textAlign: "right", whiteSpace: "nowrap" }}>
                                {row.pct !== null ? `${row.pct}%` : row.score}
                            </span>
                            <span style={{ fontSize: 10, color: "var(--muted)", textAlign: "right" }}>{row.weight}</span>
                        </div>
                    ))}
                </div>

                {/* ── FORMULA NOTE ── */}
                <div style={{ padding: "10px 12px", borderRadius: 8, border: "0.5px solid var(--border)", background: "var(--surface2)" }}>
                    <p style={{ fontSize: 10, color: "var(--muted)", margin: 0, lineHeight: 1.6 }}>
                        <span style={{ color: "var(--text)", fontWeight: 500 }}>Formula: </span>
                        (done × 1.0 + late × 0.6 + rejected × 0.2) ÷ total × 100
                        &nbsp;·&nbsp; New contributors receive a score after completing enough tracked work.
                    </p>
                </div>

            </div>
        </div>
    );
}