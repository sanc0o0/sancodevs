"use client";

interface ReliabilityEmptyProps {
    icon?: React.ReactNode;
    title: string;
    subtitle?: string;
}

export default function ReliabilityEmpty({
    icon, title, subtitle,
}: ReliabilityEmptyProps) {
    return (
        <div
            style={{
                padding: "20px 16px",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "6px",
                textAlign: "center",
            }}
        >
            {icon && <span style={{ color: "var(--border)", marginBottom: "2px" }}>{icon}</span>}
            <p style={{ fontSize: "12px", fontWeight: 500, color: "var(--text)", margin: 0 }}>
                {title}
            </p>
            {subtitle && (
                <p style={{ fontSize: "11px", color: "var(--muted)", maxWidth: "220px", lineHeight: 1.5, margin: 0 }}>
                    {subtitle}
                </p>
            )}
        </div>
    );
}