"use client";

interface ReliabilityErrorStateProps {
    onRetry: () => void;
}

export default function ReliabilityErrorState({ onRetry }: ReliabilityErrorStateProps) {
    return (
        <div
            style={{
                padding: "20px 16px",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "8px",
                textAlign: "center",
            }}
        >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--muted)" strokeWidth="1.2">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <p style={{ fontSize: "11px", color: "var(--muted)", margin: 0 }}>
                Failed to load reliability data
            </p>
            <button
                onClick={onRetry}
                style={{
                    fontSize: "11px",
                    color: "var(--text)",
                    background: "transparent",
                    border: "0.5px solid var(--border)",
                    borderRadius: "6px",
                    padding: "5px 12px",
                    cursor: "pointer",
                    marginTop: "2px",
                }}
            >
                Retry
            </button>
        </div>
    );
}