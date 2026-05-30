"use client";

interface ReliabilityInsightRowProps {
    icon: React.ReactNode;
    label: string;
    value: number;
    color: string;
}

export default function ReliabilityInsightRow({
    icon, label, value, color,
}: ReliabilityInsightRowProps) {
    return (
        <div style={{ display: "flex", alignItems: "center", gap: "7px" }}>
            <span style={{ flexShrink: 0 }}>{icon}</span>
            <span style={{ fontSize: "11px", color: "var(--muted)", flex: 1 }}>{label}</span>
            <span
                style={{
                    fontSize: "12px",
                    fontWeight: 500,
                    color: value === 0 ? "var(--muted)" : color,
                }}
            >
                {value}
            </span>
        </div>
    );
}