export default function WorkspacePage() {
    return (
        <div style={{
            padding: "2rem",
            display: "flex",
            flexDirection: "column",
            gap: "1rem",
        }}>
            <div>
                <h1 style={{ fontSize: "24px", fontWeight: 600 }}>
                    Workspace
                </h1>
                <p style={{ color: "var(--muted)" }}>
                    Manage your projects, tasks, and collaborations.
                </p>
            </div>

            <div style={{
                border: "0.5px solid var(--border)",
                borderRadius: 12,
                padding: "1rem",
                background: "var(--surface)",
            }}>
                Coming soon.
            </div>
        </div>
    );
}