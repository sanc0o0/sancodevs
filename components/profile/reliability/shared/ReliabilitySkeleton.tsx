"use client";

export default function ReliabilitySkeleton({
    rows = 4,
    height = 10,
}: {
    rows?: number;
    height?: number;
}) {
    const widths = [60, 40, 80, 50, 70, 45];
    return (
        <div style={{ padding: "16px", display: "flex", flexDirection: "column", gap: "10px" }}>
            {Array.from({ length: rows }).map((_, i) => (
                <div
                    key={i}
                    style={{
                        height: height,
                        borderRadius: "4px",
                        background: "var(--surface2)",
                        width: `${widths[i % widths.length]}%`,
                        opacity: 0.5,
                    }}
                />
            ))}
        </div>
    );
}