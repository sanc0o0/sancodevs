"use client";

interface ReliabilityScoreRingProps {
    score: number | null;
    color: string;
    size?: number;
    strokeWidth?: number;
}

export default function ReliabilityScoreRing({
    score,
    color,
    size = 80,
    strokeWidth = 4,
}: ReliabilityScoreRingProps) {
    const R = size / 2 - strokeWidth - 1;
    const C = 2 * Math.PI * R;
    const pct = score ?? 0;
    const offset = C - (pct / 100) * C;

    return (
        <div style={{ position: "relative", width: size, height: size, flexShrink: 0 }}>
            <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
                {/* Track */}
                <circle
                    cx={size / 2} cy={size / 2} r={R}
                    fill="none" stroke="var(--surface2)" strokeWidth={strokeWidth}
                />
                {/* Progress */}
                <circle
                    cx={size / 2} cy={size / 2} r={R}
                    fill="none"
                    stroke={color}
                    strokeWidth={strokeWidth}
                    strokeLinecap="round"
                    strokeDasharray={C}
                    strokeDashoffset={offset}
                    transform={`rotate(-90 ${size / 2} ${size / 2})`}
                    style={{ transition: "stroke-dashoffset 0.6s ease" }}
                />
            </svg>
            <div
                style={{
                    position: "absolute",
                    inset: 0,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                }}
            >
                <span
                    style={{
                        fontSize: size > 60 ? 14 : 11,
                        fontWeight: 600,
                        color: "var(--text)",
                        lineHeight: 1,
                    }}
                >
                    {score === null ? "—" : score}
                </span>
            </div>
        </div>
    );
}