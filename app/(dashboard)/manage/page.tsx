export default function ManagePage() {
    return (
        <div style={{
            display: "flex", flexDirection: "column", alignItems: "center",
            justifyContent: "center", minHeight: "60vh", gap: 12, textAlign: "center",
            padding: 24,
        }}>
            <div style={{
                width: 44, height: 44, borderRadius: 12,
                background: "var(--surface2)", border: "0.5px solid var(--border)",
                display: "flex", alignItems: "center", justifyContent: "center",
                marginBottom: 4,
            }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--muted)" strokeWidth="1.5" strokeLinecap="round">
                    <path d="M12 2a10 10 0 0 1 10 10" /><circle cx="12" cy="12" r="10" /><path d="M12 8v4l3 3" />
                </svg>
            </div>
            <p style={{ fontSize: 15, fontWeight: 600, color: "var(--text)", margin: 0 }}>
                Manage
            </p>
            <p style={{ fontSize: 13, color: "var(--muted)", margin: 0, maxWidth: 320, lineHeight: 1.6 }}>
                Project management tools are coming soon. You&apos;ll be able to manage applications, tasks, and team settings from here.
            </p>
            <div style={{
                marginTop: 8, padding: "5px 14px", borderRadius: 20,
                border: "0.5px dashed var(--border)", fontSize: 10,
                color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.08em",
            }}>
                Coming soon
            </div>
        </div>
    );
}