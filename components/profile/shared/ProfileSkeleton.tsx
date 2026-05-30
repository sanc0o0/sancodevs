"use client";

// ─── Pulse animation ──────────────────────────────────────────────────────────

const pulseStyle = `
  @keyframes skelPulse {
    0%, 100% { opacity: 1; }
    50%       { opacity: 0.4; }
  }
  .skel { animation: skelPulse 1.6s ease-in-out infinite; background: var(--surface2); border-radius: 6px; }
`;

function Skel({ w, h, style }: { w?: string | number; h?: string | number; style?: React.CSSProperties }) {
    return (
        <div
            className="skel"
            style={{ width: w ?? "100%", height: h ?? 14, borderRadius: 6, ...style }}
        />
    );
}

// ─── Generic tab skeleton (used while dynamic import loads) ───────────────────

export function TabSkeleton() {
    return (
        <>
            <style>{pulseStyle}</style>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {/* Header bar */}
                <Skel h={40} style={{ borderRadius: 10 }} />
                {/* Card skeletons */}
                {[1, 2, 3].map((i) => (
                    <div
                        key={i}
                        style={{
                            border: "0.5px solid var(--border)",
                            borderRadius: 10,
                            background: "var(--surface)",
                            padding: 16,
                            display: "flex",
                            flexDirection: "column",
                            gap: 10,
                        }}
                    >
                        <Skel w="60%" h={14} />
                        <Skel w="40%" h={10} />
                        <Skel w="80%" h={10} />
                    </div>
                ))}
            </div>
        </>
    );
}

// ─── Overview-shaped skeleton ─────────────────────────────────────────────────

export function OverviewSkeleton() {
    return (
        <>
            <style>{pulseStyle}</style>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {/* Stats row */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
                    {[1, 2, 3].map((i) => (
                        <div
                            key={i}
                            style={{ border: "0.5px solid var(--border)", borderRadius: 10, background: "var(--surface)", padding: 16, display: "flex", flexDirection: "column", gap: 8 }}
                        >
                            <Skel w="50%" h={24} />
                            <Skel w="70%" h={10} />
                        </div>
                    ))}
                </div>
                {/* Section previews */}
                {[1, 2, 3].map((i) => (
                    <div
                        key={i}
                        style={{ border: "0.5px solid var(--border)", borderRadius: 10, background: "var(--surface)", padding: 16, display: "flex", flexDirection: "column", gap: 10 }}
                    >
                        <Skel w="30%" h={10} />
                        <Skel h={60} />
                    </div>
                ))}
            </div>
        </>
    );
}

// ─── Projects-shaped skeleton ─────────────────────────────────────────────────

export function ProjectsSkeleton() {
    return (
        <>
            <style>{pulseStyle}</style>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {[1, 2, 3].map((i) => (
                    <div
                        key={i}
                        style={{ border: "0.5px solid var(--border)", borderRadius: 10, background: "var(--surface)", padding: "12px 16px", display: "flex", alignItems: "center", gap: 12 }}
                    >
                        <Skel w={8} h={8} style={{ borderRadius: "50%", flexShrink: 0 }} />
                        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 6 }}>
                            <Skel w="55%" h={13} />
                            <Skel w="30%" h={10} />
                        </div>
                        <Skel w={50} h={18} style={{ borderRadius: 20 }} />
                    </div>
                ))}
            </div>
        </>
    );
}

// ─── Tasks-shaped skeleton ────────────────────────────────────────────────────

export function TasksSkeleton() {
    return (
        <>
            <style>{pulseStyle}</style>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {[1, 2, 3, 4].map((i) => (
                    <div
                        key={i}
                        style={{ border: "0.5px solid var(--border)", borderRadius: 10, background: "var(--surface)", padding: "10px 16px", display: "flex", alignItems: "center", gap: 12 }}
                    >
                        <Skel w={48} h={20} style={{ borderRadius: 4 }} />
                        <Skel w="45%" h={13} />
                        <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
                            <Skel w={70} h={10} />
                            <Skel w={40} h={10} />
                        </div>
                    </div>
                ))}
            </div>
        </>
    );
}

// ─── Reliability-shaped skeleton ──────────────────────────────────────────────

export function ReliabilitySkeleton() {
    return (
        <>
            <style>{pulseStyle}</style>
            <div style={{ border: "0.5px solid var(--border)", borderRadius: 10, background: "var(--surface)", padding: 24, display: "flex", flexDirection: "column", gap: 16 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                    <Skel w={72} h={72} style={{ borderRadius: "50%" }} />
                    <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 8 }}>
                        <Skel w="40%" h={20} />
                        <Skel w="60%" h={12} />
                    </div>
                </div>
                <Skel h={80} style={{ borderRadius: 8 }} />
            </div>
        </>
    );
}

// ─── Coming soon section ──────────────────────────────────────────────────────

export function ComingSoonTab({ label, description }: { label: string; description: string }) {
    return (
        <div
            style={{
                border: "0.5px dashed var(--border)",
                borderRadius: 12,
                background: "var(--surface)",
                padding: "48px 24px",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 10,
                textAlign: "center",
            }}
        >
            <div
                style={{
                    width: 40,
                    height: 40,
                    borderRadius: "50%",
                    background: "var(--surface2)",
                    border: "0.5px solid var(--border)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    marginBottom: 4,
                }}
            >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--muted)" strokeWidth="1.5" strokeLinecap="round">
                    <circle cx="12" cy="12" r="10" />
                    <path d="M12 8v4l3 3" />
                </svg>
            </div>
            <p style={{ fontSize: 13, fontWeight: 500, color: "var(--text)", margin: 0 }}>{label}</p>
            <p style={{ fontSize: 12, color: "var(--muted)", margin: 0, maxWidth: 340, lineHeight: 1.6 }}>
                {description}
            </p>
            <div
                style={{
                    marginTop: 8,
                    padding: "5px 14px",
                    borderRadius: 20,
                    border: "0.5px dashed var(--border)",
                    fontSize: 10,
                    color: "var(--muted)",
                    textTransform: "uppercase",
                    letterSpacing: "0.08em",
                }}
            >
                Coming soon
            </div>
        </div>
    );
}