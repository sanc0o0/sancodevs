"use client";

import { useState } from "react";
import type { ActivityBucket } from "../types/reliability.types";
import ReliabilityTooltip from "./ReliabilityTooltip";
import ReliabilityActivityLegend from "./ReliabilityActivityLegend";
import ReliabilityActivityEmptyState from "./ReliabilityActivityEmptyState";

interface ReliabilityActivityGraphProps {
    buckets: ActivityBucket[];
}

export default function ReliabilityActivityGraph({ buckets }: ReliabilityActivityGraphProps) {
    const [tooltip, setTooltip] = useState<number | null>(null);

    if (buckets.length === 0) return <ReliabilityActivityEmptyState />;

    const maxVal = Math.max(...buckets.map((b) => b.done + b.late + b.missed), 1);

    return (
        <div>
            <div
                style={{
                    display: "flex",
                    alignItems: "flex-end",
                    gap: "3px",
                    height: "72px",
                    marginBottom: "6px",
                    overflowX: "auto",
                    scrollbarWidth: "none",
                }}
            >
                {buckets.map((b, i) => {
                    const total = b.done + b.late + b.missed;
                    const h = total === 0
                        ? 4
                        : Math.max(6, Math.round((total / maxVal) * 68));
                    const donePct = total > 0 ? (b.done / total) * 100 : 0;
                    const latePct = total > 0 ? (b.late / total) * 100 : 0;
                    const missedPct = total > 0 ? (b.missed / total) * 100 : 0;

                    return (
                        <div
                            key={i}
                            style={{ position: "relative", flex: "1 0 auto", minWidth: "10px", maxWidth: "28px" }}
                            onMouseEnter={() => setTooltip(i)}
                            onMouseLeave={() => setTooltip(null)}
                        >
                            <div
                                style={{
                                    height: h,
                                    borderRadius: "3px",
                                    overflow: "hidden",
                                    display: "flex",
                                    flexDirection: "column-reverse",
                                    background: total === 0 ? "var(--border)" : "transparent",
                                    cursor: "default",
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

                            {tooltip === i && total > 0 && (
                                <ReliabilityTooltip bucket={b} />
                            )}
                        </div>
                    );
                })}
            </div>

            <ReliabilityActivityLegend />
        </div>
    );
}