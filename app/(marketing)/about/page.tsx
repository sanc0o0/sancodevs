import PageHero from "@/components/marketing/PageHero";

const values = [
    { title: "Learn by doing", desc: "We believe the fastest way to grow as a developer is to build real things — not watch tutorials or read docs in isolation. Every path on SancoDevs ends in a shipped project." },
    { title: "Accountability matters", desc: "Most learning fails because there's no consequence for quitting. We change that. When you commit to a project on SancoDevs, you're accountable to yourself and your team." },
    { title: "Open source mindset", desc: "The best developers contribute to the community. We teach Git, PRs, and open source workflows from day one because these are the skills that get you hired." },
    { title: "Built for beginners", desc: "SancoDevs is for developers who are learning — not experts showing off. Every path starts from where you are and takes you somewhere real." },
];

const team = [
    { name: "Sana Ansari", role: "Founder & Developer", init: "SA" },
];

export default function AboutPage() {
    return (
        <>
            <PageHero
                title="Built for developers who are still figuring it out."
                sub="SancoDevs exists because most learning platforms teach you concepts — not how to actually build and ship software. We're changing that."
            />

            <div style={{ maxWidth: "720px", margin: "0 auto", padding: "0 2rem 5rem" }}>
                {/* Mission */}
                <div style={{
                    border: "0.5px solid var(--border)", borderRadius: "12px",
                    background: "var(--surface)", padding: "2rem", marginBottom: "3rem",
                }}>
                    <p style={{ fontSize: "11px", color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "1rem" }}>Mission</p>
                    <p style={{ fontSize: "16px", color: "var(--text)", lineHeight: 1.8, fontWeight: 400 }}>
                        To help every developer — regardless of background — build real projects,
                        develop professional habits, and grow with confidence.
                    </p>
                </div>

                {/* Values */}
                <p style={{ fontSize: "11px", color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "1rem" }}>
                    What we believe
                </p>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "10px", marginBottom: "3rem" }}>
                    {values.map((v, i) => (
                        <div key={i} style={{
                            padding: "1.25rem", borderRadius: "10px",
                            border: "0.5px solid var(--border)", background: "var(--surface)",
                        }}>
                            <div style={{ width: "16px", height: "2px", background: "var(--accent)", marginBottom: "10px" }} />
                            <p style={{ fontSize: "13px", fontWeight: 500, color: "var(--text)", marginBottom: "6px" }}>{v.title}</p>
                            <p style={{ fontSize: "12px", color: "var(--muted)", lineHeight: 1.7 }}>{v.desc}</p>
                        </div>
                    ))}
                </div>

                {/* Team */}
                <p style={{ fontSize: "11px", color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "1rem" }}>
                    Team
                </p>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "10px" }}>
                    {team.map((m, i) => (
                        <div key={i} style={{
                            display: "flex", alignItems: "center", gap: "12px",
                            padding: "1rem 1.25rem", borderRadius: "10px",
                            border: "0.5px solid var(--border)", background: "var(--surface)",
                            minWidth: "200px",
                        }}>
                            <div style={{
                                width: "40px", height: "40px", borderRadius: "50%",
                                background: "var(--surface2)", border: "0.5px solid var(--border)",
                                display: "flex", alignItems: "center", justifyContent: "center",
                                fontSize: "13px", fontWeight: 500, color: "var(--text)", flexShrink: 0,
                            }}>{m.init}</div>
                            <div>
                                <p style={{ fontSize: "13px", fontWeight: 500, color: "var(--text)", marginBottom: "2px" }}>{m.name}</p>
                                <p style={{ fontSize: "11px", color: "var(--muted)" }}>{m.role}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </>
    );
}