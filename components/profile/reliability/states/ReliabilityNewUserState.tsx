"use client";

export default function ReliabilityNewUserState() {
    return (
        <div
            style={{
                padding: "24px 16px",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "8px",
                textAlign: "center",
            }}
        >
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="var(--border)" strokeWidth="1.2">
                <path d="M12 20h9" />
                <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
            </svg>
            <p style={{ fontSize: "12px", fontWeight: 500, color: "var(--text)", margin: 0 }}>
                No reliability history yet
            </p>
            <p
                style={{
                    fontSize: "11px",
                    color: "var(--muted)",
                    maxWidth: "220px",
                    lineHeight: 1.5,
                    margin: 0,
                }}
            >
                Reliability is built by completing tasks consistently.
                Join a project and start contributing.
            </p>
        </div>
    );
}