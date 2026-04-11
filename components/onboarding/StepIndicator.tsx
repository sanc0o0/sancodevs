interface Props {
    step: number;
    steps: string[];
}

export default function StepIndicator({ step, steps }: { step: number; steps: string[] }) {
    return (
        <div style={{ display: "flex", alignItems: "center", maxWidth: "600px", margin: "2rem auto 0", padding: "0 2rem" }}>
            {steps.map((label, i) => (
                <div key={i} style={{ display: "contents" }}>
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "5px" }}>
                        <div style={{
                            width: "7px", height: "7px", borderRadius: "50%",
                            background: i === step ? "var(--accent)" : i < step ? "var(--muted)" : "var(--border)",
                            transition: "background 0.2s",
                        }} />
                        <span style={{
                            fontSize: "11px",
                            color: i === step ? "var(--text)" : "var(--muted)",
                            whiteSpace: "nowrap",
                        }}>
                            {label}
                        </span>
                    </div>
                    {i < steps.length - 1 && (
                        <div style={{
                            flex: 1, height: "0.5px",
                            background: "var(--border)",
                            margin: "0 10px", marginBottom: "18px",
                        }} />
                    )}
                </div>
            ))}
        </div>
    );
}