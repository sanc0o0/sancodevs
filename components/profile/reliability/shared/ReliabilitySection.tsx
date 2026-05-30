"use client";

interface ReliabilitySectionProps {
    label: string;
    children: React.ReactNode;
    action?: React.ReactNode;
}

export default function ReliabilitySection({
    label, children, action,
}: ReliabilitySectionProps) {
    return (
        <div style={{ padding: "14px 16px 0" }}>
            <div
                style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    marginBottom: "12px",
                }}
            >
                <p
                    style={{
                        fontSize: "10px",
                        fontWeight: 500,
                        color: "var(--muted)",
                        textTransform: "uppercase",
                        letterSpacing: "0.08em",
                        margin: 0,
                    }}
                >
                    {label}
                </p>
                {action && <div>{action}</div>}
            </div>
            {children}
        </div>
    );
}