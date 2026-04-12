import PageHero from "@/components/marketing/PageHero";

const cookies = [
    { name: "next-auth.session-token", purpose: "Keeps you signed in", duration: "30 days", type: "Essential" },
    { name: "next-auth.csrf-token", purpose: "Security — prevents cross-site request forgery", duration: "Session", type: "Essential" },
    { name: "sanco-theme", purpose: "Remembers your light/dark mode preference", duration: "1 year", type: "Preference" },
];

export default function CookiesPage() {
    return (
        <>
            <PageHero
                title="Cookie policy"
                sub="We use a small number of cookies to make SancoDevs work. Here's exactly what they are and why."
            />
            <div style={{ maxWidth: "720px", margin: "0 auto", padding: "0 2rem 5rem" }}>
                <div style={{
                    border: "0.5px solid var(--border)", borderRadius: "11px",
                    background: "var(--surface)", overflow: "hidden", marginBottom: "2rem",
                }}>
                    {/* Table header */}
                    <div style={{
                        display: "grid", gridTemplateColumns: "2fr 2fr 1fr 1fr",
                        padding: "10px 1.25rem",
                        borderBottom: "0.5px solid var(--border)",
                        background: "var(--surface2)",
                    }}>
                        {["Name", "Purpose", "Duration", "Type"].map(h => (
                            <p key={h} style={{ fontSize: "11px", color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.04em" }}>{h}</p>
                        ))}
                    </div>
                    {cookies.map((c, i) => (
                        <div key={i} style={{
                            display: "grid", gridTemplateColumns: "2fr 2fr 1fr 1fr",
                            padding: "12px 1.25rem", gap: "0.5rem",
                            borderBottom: i < cookies.length - 1 ? "0.5px solid var(--border)" : "none",
                            alignItems: "start",
                        }}>
                            <p style={{ fontSize: "12px", color: "var(--text)", fontFamily: "monospace", wordBreak: "break-all" }}>{c.name}</p>
                            <p style={{ fontSize: "12px", color: "var(--muted)", lineHeight: 1.5 }}>{c.purpose}</p>
                            <p style={{ fontSize: "12px", color: "var(--muted)" }}>{c.duration}</p>
                            <span style={{
                                fontSize: "10px", padding: "2px 8px", borderRadius: "4px",
                                border: "0.5px solid var(--border)", color: "var(--muted)",
                                display: "inline-block", whiteSpace: "nowrap",
                            }}>{c.type}</span>
                        </div>
                    ))}
                </div>

                <div style={{ padding: "1.25rem 1.5rem", borderRadius: "10px", border: "0.5px solid var(--border)", background: "var(--surface)" }}>
                    <p style={{ fontSize: "13px", fontWeight: 500, color: "var(--text)", marginBottom: "6px" }}>We don&apos;t use tracking or advertising cookies</p>
                    <p style={{ fontSize: "13px", color: "var(--muted)", lineHeight: 1.7 }}>
                        All cookies on SancoDevs are either essential for the platform to function or store your personal preferences. We have no advertising partners and do not track you across other websites.
                    </p>
                </div>
            </div>
        </>
    );
}