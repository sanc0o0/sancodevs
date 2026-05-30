"use client";

const LEGEND = [
    { color: "#22c55e", label: "Done" },
    { color: "#fb923c", label: "Late" },
    { color: "#ef4444", label: "Missed" },
];

export default function ReliabilityActivityLegend() {
    return (
        <div style={{ display: "flex", gap: "12px", marginBottom: "16px" }}>
            {LEGEND.map((l) => (
                <div key={l.label} style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                    <span
                        style={{
                            width: "7px",
                            height: "7px",
                            borderRadius: "2px",
                            background: l.color,
                            flexShrink: 0,
                        }}
                    />
                    <span style={{ fontSize: "10px", color: "var(--muted)" }}>{l.label}</span>
                </div>
            ))}
        </div>
    );
}