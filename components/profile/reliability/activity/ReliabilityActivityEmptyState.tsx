"use client";

export default function ReliabilityActivityEmptyState() {
    return (
        <div
            style={{
                padding: "16px 0 20px",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "6px",
            }}
        >
            {/* Ghosted placeholder bars */}
            <div
                style={{
                    display: "flex",
                    alignItems: "flex-end",
                    gap: "3px",
                    height: "36px",
                    opacity: 0.12,
                }}
            >
                {[3, 5, 4, 7, 5, 8, 4].map((h, i) => (
                    <div
                        key={i}
                        style={{
                            width: "14px",
                            height: `${h * 4}px`,
                            borderRadius: "3px",
                            background: "var(--muted)",
                        }}
                    />
                ))}
            </div>
            <p style={{ fontSize: "11px", color: "var(--muted)", margin: "4px 0 0" }}>
                No activity for this period
            </p>
        </div>
    );
}