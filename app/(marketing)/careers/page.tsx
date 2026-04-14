import PageHero from "@/components/marketing/PageHero";
import Link from "next/link";

const openRoles = [
    {
        title: "Full-stack Developer",
        type: "Part-time · Remote",
        desc: "Help build and improve the SancoDevs platform. Next.js, Prisma, PostgreSQL.",
        tags: ["Next.js", "TypeScript", "PostgreSQL"],
    },
    {
        title: "Content Writer",
        type: "Freelance · Remote",
        desc: "Write clear, engaging learning content for our module library.",
        tags: ["Technical writing", "Developer education"],
    },
    {
        title: "Community Manager",
        type: "Part-time · Remote",
        desc: "Help developers get unstuck and grow the SancoDevs community.",
        tags: ["Community", "Support", "Growth"],
    },
];

export default function CareersPage() {
    return (
        <>
            <PageHero
                title="Help us build the best place to learn development."
                sub="SancoDevs is early-stage and growing. We're looking for people who care about developer education and want to build something meaningful."
            />
            <div style={{ maxWidth: "720px", margin: "0 auto", padding: "0 2rem 5rem" }}>
                <p style={{
                    fontSize: "11px", color: "var(--muted)",
                    textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "1rem",
                }}>
                    Open roles
                </p>
                <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "3rem" }}>
                    {openRoles.map((role, i) => (
                        <div key={i} style={{
                            padding: "1.375rem 1.5rem", borderRadius: "11px",
                            border: "0.5px solid var(--border)", background: "var(--surface)",
                        }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "10px", marginBottom: "10px" }}>
                                <div>
                                    <p style={{ fontSize: "14px", fontWeight: 500, color: "var(--text)", marginBottom: "3px" }}>{role.title}</p>
                                    <p style={{ fontSize: "11px", color: "var(--muted)" }}>{role.type}</p>
                                </div>
                                <Link
                                    href={`/careers/apply?role=${encodeURIComponent(role.title)}`}
                                    className="card-hover"
                                    style={{
                                        padding: "7px 16px", borderRadius: "7px", fontSize: "12px",
                                        border: "0.5px solid var(--border)", color: "var(--muted)",
                                        textDecoration: "none", whiteSpace: "nowrap", flexShrink: 0,
                                        display: "inline-block",
                                    }}
                                >
                                    Apply →
                                </Link>
                            </div>
                            <p style={{ fontSize: "13px", color: "var(--muted)", lineHeight: 1.6, marginBottom: "10px" }}>{role.desc}</p>
                            <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                                {role.tags.map(tag => (
                                    <span key={tag} style={{
                                        fontSize: "10px", padding: "2px 8px", borderRadius: "4px",
                                        border: "0.5px solid var(--border)", color: "var(--muted)",
                                        background: "var(--surface2)",
                                    }}>{tag}</span>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>

                <div style={{
                    padding: "1.5rem", borderRadius: "11px",
                    border: "0.5px solid var(--border)", background: "var(--surface)",
                }}>
                    <p style={{ fontSize: "13px", fontWeight: 500, color: "var(--text)", marginBottom: "6px" }}>
                        Don&apos;t see your role?
                    </p>
                    <p style={{ fontSize: "13px", color: "var(--muted)", lineHeight: 1.6, marginBottom: "12px" }}>
                        We&apos;re always open to hearing from talented people. Tell us how you&apos;d contribute.
                    </p>
                    <Link href="/contact" style={{
                        display: "inline-block", padding: "8px 16px", borderRadius: "7px",
                        fontSize: "13px", background: "var(--accent)", color: "var(--bg)",
                        textDecoration: "none", fontWeight: 500,
                    }}>
                        Get in touch
                    </Link>
                </div>
            </div>
        </>
    );
}