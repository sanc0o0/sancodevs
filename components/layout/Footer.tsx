"use client";

import { Logo } from "@/components/layout/Navbar";

export default function Footer() {
    return (
        <footer style={{
            borderTop: "0.5px solid var(--border)",
            background: "var(--bg)",
            padding: "2.5rem 2rem",
            marginTop: "auto",
        }}>
            <div style={{
                maxWidth: "1100px", margin: "0 auto",
                display: "flex", alignItems: "flex-start",
                justifyContent: "space-between", flexWrap: "wrap", gap: "2rem",
            }}>
                <div>
                    <Logo />
                    <p style={{
                        fontSize: "12px", color: "var(--muted)",
                        marginTop: "10px", maxWidth: "220px", lineHeight: 1.6,
                    }}>
                        Learn by building. Ship real projects. Grow as a developer.
                    </p>
                </div>

                <div style={{ display: "flex", gap: "3rem", flexWrap: "wrap" }}>
                    {[
                        {
                            heading: "Product",
                            links: ["Dashboard", "Learn", "Projects", "Profile"],
                        },
                        {
                            heading: "Company",
                            links: ["About", "Blog", "Careers", "Contact"],
                        },
                        {
                            heading: "Legal",
                            links: ["Privacy", "Terms", "Cookies"],
                        },
                    ].map(col => (
                        <div key={col.heading}>
                            <p style={{
                                fontSize: "11px", color: "var(--muted)",
                                letterSpacing: "0.06em", marginBottom: "10px",
                                textTransform: "uppercase",
                            }}>
                                {col.heading}
                            </p>
                            {col.links.map(link => (
                                <a key={link} href="#" style={{
                                    display: "block", fontSize: "13px",
                                    color: "var(--muted)", textDecoration: "none",
                                    marginBottom: "7px", transition: "color 0.15s",
                                }}
                                    onMouseEnter={e => (e.currentTarget.style.color = "var(--text)")}
                                    onMouseLeave={e => (e.currentTarget.style.color = "var(--muted)")}
                                >
                                    {link}
                                </a>
                            ))}
                        </div>
                    ))}
                </div>
            </div>

            <div style={{
                maxWidth: "1100px", margin: "2rem auto 0",
                borderTop: "0.5px solid var(--border)", paddingTop: "1.25rem",
                display: "flex", justifyContent: "space-between", alignItems: "center",
                flexWrap: "wrap", gap: "8px",
            }}>
                <p style={{ fontSize: "11px", color: "var(--muted)" }}>
                    © {new Date().getFullYear()} SancoDevs. All rights reserved.
                </p>
                <p style={{ fontSize: "11px", color: "var(--muted)" }}>
                    Built by developers, for developers.
                </p>
            </div>
        </footer>
    );
}