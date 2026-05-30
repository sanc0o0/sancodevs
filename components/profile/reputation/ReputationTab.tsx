"use client";

import { ComingSoonTab } from "@/components/profile/shared/ProfileSkeleton";

export default function ReputationTab() {
    return (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {/* Placeholder grid — matches final layout shape */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
                {["Communication", "Execution", "Ownership"].map((r) => (
                    <div
                        key={r}
                        style={{
                            padding: "16px 12px",
                            borderRadius: 10,
                            border: "0.5px solid var(--border)",
                            background: "var(--surface)",
                            textAlign: "center",
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            gap: 6,
                        }}
                    >
                        <p style={{ fontSize: 22, fontWeight: 700, color: "var(--muted)", margin: 0 }}>—</p>
                        <p
                            style={{
                                fontSize: 9,
                                color: "var(--muted)",
                                textTransform: "uppercase",
                                letterSpacing: "0.06em",
                                margin: 0,
                            }}
                        >
                            {r}
                        </p>
                    </div>
                ))}
            </div>

            <ComingSoonTab
                label="Team reputation"
                description="Structured ratings from teammates and project owners will appear here once the peer review system launches."
            />
        </div>
    );
}