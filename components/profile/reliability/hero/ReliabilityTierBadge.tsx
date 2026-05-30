"use client";

interface ReliabilityTierBadgeProps {
    label: string;
    color: string;
    score: number | null;
    confidence: "none" | "low" | "medium" | "high";
}

export default function ReliabilityTierBadge({
    label, color, score, confidence,
}: ReliabilityTierBadgeProps) {
    const showEarlySignal = confidence === "low";

    return (
        <div>
            <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "3px" }}>
                <span style={{ fontSize: "13px", fontWeight: 500, color }}>
                    {showEarlySignal ? "Early signal" : label}
                </span>
                {score !== null && !showEarlySignal && (
                    <span style={{ fontSize: "11px", color: "var(--muted)" }}>
                        {score}/100
                    </span>
                )}
                {showEarlySignal && (
                    <span style={{ fontSize: "9px", color: "var(--muted)", padding: "1px 6px", borderRadius: "20px", border: "0.5px solid var(--border)", background: "var(--surface2)" }}>
                        low confidence
                    </span>
                )}
            </div>
        </div>
    );
}