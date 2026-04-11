"use client";

import { useTheme } from "@/lib/theme";

interface NavbarProps {
    minimal?: boolean; // true = onboarding (no nav links)
}

export default function Navbar({ minimal = false }: NavbarProps) {
    const { theme, toggle } = useTheme();

    return (
        <nav style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "0 2rem",
            height: "54px",
            borderBottom: "0.5px solid var(--border)",
            background: "var(--bg)",
        }}>
            <Logo />
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                {!minimal && (
                    <div style={{ display: "flex", gap: "4px" }}>
                        {["Dashboard", "Projects", "Learn"].map(link => (
                            <a key={link} href={`/${link.toLowerCase()}`} style={{
                                padding: "6px 12px",
                                borderRadius: "7px",
                                fontSize: "13px",
                                color: "var(--muted)",
                                textDecoration: "none",
                                transition: "color 0.15s",
                            }}
                                onMouseEnter={e => (e.currentTarget.style.color = "var(--text)")}
                                onMouseLeave={e => (e.currentTarget.style.color = "var(--muted)")}
                            >
                                {link}
                            </a>
                        ))}
                    </div>
                )}
                <ThemeToggle theme={theme} toggle={toggle} />
            </div>
        </nav>
    );
}

export function Logo() {
    return (
        <div style={{ display: "flex", alignItems: "flex-start", gap: "4px" }}>
            {/* SAN with rule below */}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start" }}>
                <span style={{ fontSize: "15px", fontWeight: 600, letterSpacing: "0.04em", color: "var(--text)", lineHeight: 1 }}>
                    SAN
                </span>
                <div style={{ width: "100%", height: "2px", background: "var(--text)", marginTop: "3px" }} />
            </div>
            {/* CO with rule above */}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start" }}>
                <div style={{ width: "140%", height: "2px", background: "var(--text)", marginBottom: "3px" }} />
                <span style={{ fontSize: "15px", fontWeight: 600, letterSpacing: "0.04em", color: "var(--text)", lineHeight: 1 }}>
                    CO
                </span>
            </div>
            <span style={{ fontSize: "12px", color: "var(--muted)", fontWeight: 400, alignSelf: "center", marginLeft: "6px" }}>
                devs
            </span>
        </div>
    );
}

export function ThemeToggle({ theme, toggle }: { theme: string; toggle: () => void }) {
    return (
        <button onClick={toggle} style={{
            width: "34px", height: "34px", borderRadius: "8px",
            border: "0.5px solid var(--border)", background: "transparent",
            color: "var(--text)", cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center",
            transition: "background 0.15s",
        }}>
            {theme === "dark" ? (
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <circle cx="12" cy="12" r="5" />
                    <line x1="12" y1="1" x2="12" y2="3" /><line x1="12" y1="21" x2="12" y2="23" />
                    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" /><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                    <line x1="1" y1="12" x2="3" y2="12" /><line x1="21" y1="12" x2="23" y2="12" />
                    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" /><line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
                </svg>
            ) : (
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                </svg>
            )}
        </button>
    );
}