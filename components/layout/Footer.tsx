"use client";

import Link from "next/link";
import { Logo } from "@/components/layout/Navbar";

const columns = [
    {
        heading: "Product",
        links: [
            { label: "Dashboard", href: "/dashboard" },
            { label: "Learn", href: "/learn" },
            { label: "Projects", href: "/projects" },
            { label: "Profile", href: "/profile" },
        ],
    },
    {
        heading: "Company",
        links: [
            { label: "About", href: "/about" },
            { label: "Blog", href: "/blog" },
            { label: "Careers", href: "/careers" },
            { label: "Contact", href: "/contact" },
        ],
    },
    {
        heading: "Legal",
        links: [
            { label: "Privacy", href: "/privacy" },
            { label: "Terms", href: "/terms" },
            { label: "Cookies", href: "/cookies" },
        ],
    },
];

export default function Footer() {
    return (
        <footer style={{
            borderTop: "0.5px solid var(--border)",
            background: "var(--bg)",
            padding: "3rem 2rem 2rem",
            marginTop: "auto",
        }}>
            <div style={{
                maxWidth: "1100px", margin: "0 auto",
                display: "flex", alignItems: "flex-start",
                justifyContent: "space-between", flexWrap: "wrap", gap: "2.5rem",
            }}>
                <div style={{ maxWidth: "220px" }}>
                    <Link href="/" style={{ textDecoration: "none" }}><Logo /></Link>
                    <p style={{ fontSize: "12px", color: "var(--muted)", marginTop: "12px", lineHeight: 1.7 }}>
                        Learn by building. Ship real projects.<br />Grow as a developer.
                    </p>
                    <div style={{ display: "flex", gap: "8px", marginTop: "14px" }}>
                        {[
                            { href: "https://github.com/sancodevs", icon: <svg width="15" height="15" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.3 3.438 9.8 8.205 11.387.6.113.82-.258.82-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0 1 12 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.63-5.37-12-12-12z" /></svg> },
                            { href: "https://twitter.com/sancodevs", icon: <svg width="15" height="15" fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" /></svg> },
                        ].map((s, i) => (
                            <a key={i} href={s.href} target="_blank" rel="noopener noreferrer" style={{
                                width: "30px", height: "30px", borderRadius: "7px",
                                border: "0.5px solid var(--border)", background: "var(--surface)",
                                display: "flex", alignItems: "center", justifyContent: "center",
                                color: "var(--muted)", textDecoration: "none", transition: "all 0.15s",
                            }}
                                onMouseEnter={e => { e.currentTarget.style.color = "var(--text)"; e.currentTarget.style.borderColor = "var(--accent)"; }}
                                onMouseLeave={e => { e.currentTarget.style.color = "var(--muted)"; e.currentTarget.style.borderColor = "var(--border)"; }}
                            >{s.icon}</a>
                        ))}
                    </div>
                </div>

                <div style={{ display: "flex", gap: "3rem", flexWrap: "wrap" }}>
                    {columns.map(col => (
                        <div key={col.heading}>
                            <p style={{ fontSize: "11px", color: "var(--muted)", letterSpacing: "0.06em", marginBottom: "12px", textTransform: "uppercase" }}>
                                {col.heading}
                            </p>
                            {col.links.map(link => (
                                <Link key={link.label} href={link.href} style={{
                                    display: "block", fontSize: "13px", color: "var(--muted)",
                                    textDecoration: "none", marginBottom: "8px", transition: "color 0.15s",
                                }}
                                    onMouseEnter={e => (e.currentTarget.style.color = "var(--text)")}
                                    onMouseLeave={e => (e.currentTarget.style.color = "var(--muted)")}
                                >{link.label}</Link>
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
                <p style={{ fontSize: "11px", color: "var(--muted)" }}>© {new Date().getFullYear()} SancoDevs. All rights reserved.</p>
                <p style={{ fontSize: "11px", color: "var(--muted)" }}>Built by developers, for developers.</p>
            </div>
        </footer>
    );
}