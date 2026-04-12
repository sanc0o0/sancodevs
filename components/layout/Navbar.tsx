"use client";

import Link from "next/link";
import { useTheme } from "@/lib/theme";
import { useSession, signOut } from "next-auth/react";
import { useState } from "react";

interface NavbarProps {
    minimal?: boolean;
}

export default function Navbar({ minimal = false }: NavbarProps) {
    const { theme, toggle } = useTheme();
    const { data: session } = useSession();
    const [menuOpen, setMenuOpen] = useState(false);
    const [dropdownOpen, setDropdownOpen] = useState(false);

    return (
        <nav style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            padding: "0 1.5rem", height: "54px",
            borderBottom: "0.5px solid var(--border)",
            background: "var(--bg)", flexShrink: 0,
            position: "relative", zIndex: 50,
        }}>
            {/* Logo */}
            <Link href="/" style={{ textDecoration: "none", flexShrink: 0 }}>
                <Logo />
            </Link>

            {/* Desktop nav */}
            {!minimal && (
                <div className="hidden-mobile" style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                    {session && (
                        <>
                            {[
                                { label: "Dashboard", href: "/dashboard" },
                                { label: "Learn", href: "/learn" },
                                { label: "Projects", href: "/projects" },
                            ].map(item => (
                                <Link key={item.href} href={item.href} style={{
                                    padding: "6px 12px", borderRadius: "7px",
                                    fontSize: "13px", color: "var(--muted)",
                                    textDecoration: "none", transition: "color 0.15s",
                                }}
                                    onMouseEnter={e => (e.currentTarget.style.color = "var(--text)")}
                                    onMouseLeave={e => (e.currentTarget.style.color = "var(--muted)")}
                                >
                                    {item.label}
                                </Link>
                            ))}
                        </>
                    )}
                </div>
            )}

            {/* Right side */}
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <ThemeToggle theme={theme} toggle={toggle} />

                {!minimal && !session && (
                    <div className="hidden-mobile" style={{ display: "flex", gap: "6px" }}>
                        <Link href="/login" style={{
                            padding: "6px 14px", borderRadius: "7px", fontSize: "13px",
                            border: "0.5px solid var(--border)", color: "var(--muted)",
                            textDecoration: "none",
                        }}>
                            Sign in
                        </Link>
                        <Link href="/signup" style={{
                            padding: "6px 14px", borderRadius: "7px", fontSize: "13px",
                            background: "var(--accent)", color: "var(--bg)",
                            textDecoration: "none", fontWeight: 500,
                        }}>
                            Get started
                        </Link>
                    </div>
                )}

                {/* Profile dropdown */}
                {!minimal && session && (
                    <div style={{ position: "relative" }}>
                        <button
                            onClick={() => setDropdownOpen(o => !o)}
                            style={{
                                width: "32px", height: "32px", borderRadius: "50%",
                                border: "0.5px solid var(--border)", background: "var(--surface2)",
                                cursor: "pointer", overflow: "hidden",
                                display: "flex", alignItems: "center", justifyContent: "center",
                                padding: 0,
                            }}
                        >
                            {session.user?.image ? (
                                <img src={session.user.image} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                            ) : (
                                <span style={{ fontSize: "12px", fontWeight: 500, color: "var(--text)" }}>
                                    {session.user?.name?.charAt(0).toUpperCase()}
                                </span>
                            )}
                        </button>

                        {dropdownOpen && (
                            <>
                                {/* Backdrop */}
                                <div
                                    onClick={() => setDropdownOpen(false)}
                                    style={{ position: "fixed", inset: 0, zIndex: 40 }}
                                />
                                {/* Dropdown */}
                                <div style={{
                                    position: "absolute", right: 0, top: "calc(100% + 8px)",
                                    width: "200px", borderRadius: "10px",
                                    border: "0.5px solid var(--border)", background: "var(--surface)",
                                    zIndex: 50, overflow: "hidden",
                                    animation: "fadeIn 0.1s ease",
                                }}>
                                    <div style={{ padding: "12px 14px", borderBottom: "0.5px solid var(--border)" }}>
                                        <p style={{ fontSize: "13px", fontWeight: 500, color: "var(--text)", marginBottom: "2px" }}>
                                            {session.user?.name}
                                        </p>
                                        <p style={{ fontSize: "11px", color: "var(--muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                            {session.user?.email}
                                        </p>
                                    </div>
                                    {[
                                        { label: "Profile", href: "/profile" },
                                        { label: "Dashboard", href: "/dashboard" },
                                        { label: "Learn", href: "/learn" },
                                    ].map(item => (
                                        <Link key={item.href} href={item.href}
                                            onClick={() => setDropdownOpen(false)}
                                            style={{
                                                display: "block", padding: "9px 14px",
                                                fontSize: "13px", color: "var(--muted)",
                                                textDecoration: "none", transition: "background 0.1s",
                                                borderBottom: "0.5px solid var(--border)",
                                            }}
                                            onMouseEnter={e => {
                                                e.currentTarget.style.background = "var(--surface2)";
                                                e.currentTarget.style.color = "var(--text)";
                                            }}
                                            onMouseLeave={e => {
                                                e.currentTarget.style.background = "transparent";
                                                e.currentTarget.style.color = "var(--muted)";
                                            }}
                                        >
                                            {item.label}
                                        </Link>
                                    ))}
                                    <button
                                        onClick={() => { setDropdownOpen(false); signOut({ callbackUrl: "/" }); }}
                                        style={{
                                            display: "block", width: "100%", textAlign: "left",
                                            padding: "9px 14px", fontSize: "13px",
                                            color: "var(--muted)", background: "transparent",
                                            border: "none", cursor: "pointer", transition: "background 0.1s",
                                        }}
                                        onMouseEnter={e => {
                                            e.currentTarget.style.background = "var(--surface2)";
                                            e.currentTarget.style.color = "var(--text)";
                                        }}
                                        onMouseLeave={e => {
                                            e.currentTarget.style.background = "transparent";
                                            e.currentTarget.style.color = "var(--muted)";
                                        }}
                                    >
                                        Sign out
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                )}

                {/* Mobile hamburger */}
                {!minimal && (
                    <button
                        className="show-mobile"
                        onClick={() => setMenuOpen(o => !o)}
                        style={{
                            display: "none", width: "34px", height: "34px",
                            borderRadius: "8px", border: "0.5px solid var(--border)",
                            background: "transparent", color: "var(--text)",
                            cursor: "pointer", alignItems: "center", justifyContent: "center",
                        }}
                    >
                        {menuOpen ? (
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                            </svg>
                        ) : (
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                <line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" />
                            </svg>
                        )}
                    </button>
                )}
            </div>

            {/* Mobile menu */}
            {!minimal && menuOpen && (
                <div style={{
                    position: "absolute", top: "54px", left: 0, right: 0,
                    background: "var(--bg)", borderBottom: "0.5px solid var(--border)",
                    padding: "1rem 1.5rem", zIndex: 50,
                    display: "flex", flexDirection: "column", gap: "4px",
                    animation: "slideDown 0.15s ease",
                }}>
                    {session ? (
                        <>
                            {[
                                { label: "Dashboard", href: "/dashboard" },
                                { label: "Learn", href: "/learn" },
                                { label: "Projects", href: "/projects" },
                                { label: "Profile", href: "/profile" },
                            ].map(item => (
                                <Link key={item.href} href={item.href}
                                    onClick={() => setMenuOpen(false)}
                                    style={{
                                        padding: "10px 12px", borderRadius: "7px",
                                        fontSize: "14px", color: "var(--muted)",
                                        textDecoration: "none",
                                    }}
                                >
                                    {item.label}
                                </Link>
                            ))}
                            <button
                                onClick={() => signOut({ callbackUrl: "/" })}
                                style={{
                                    padding: "10px 12px", borderRadius: "7px",
                                    fontSize: "14px", color: "var(--muted)",
                                    background: "transparent", border: "none",
                                    textAlign: "left", cursor: "pointer",
                                }}
                            >
                                Sign out
                            </button>
                        </>
                    ) : (
                        <>
                            <Link href="/login" onClick={() => setMenuOpen(false)} style={{ padding: "10px 12px", fontSize: "14px", color: "var(--muted)", textDecoration: "none" }}>Sign in</Link>
                            <Link href="/signup" onClick={() => setMenuOpen(false)} style={{ padding: "10px 12px", fontSize: "14px", color: "var(--text)", textDecoration: "none", fontWeight: 500 }}>Get started</Link>
                        </>
                    )}
                </div>
            )}
        </nav>
    );
}

export function Logo() {
    return (
        <div style={{ fontFamily: 'Inter', display: "flex", alignItems: "flex-start" }}>
            {/* SAN with rule below */}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: "2px", margin: "0" }}>
                <span style={{ margin: "0px", fontSize: "20px", fontWeight: 600, letterSpacing: "0.2em", color: "var(--text)", lineHeight: 1 }}>
                    SAN
                </span>
                <div style={{ width: "90%", height: "3px", background: "var(--text)", margin: "0px" }} />
            </div>
            {/* CO with rule above */}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: "4px", margin: "0", marginTop: "2px" }}>
                <div style={{ width: "100%", height: "3px", background: "var(--text)" }} />
                <span style={{ fontSize: "20px", fontWeight: 600, letterSpacing: "0.2em", color: "var(--text)", lineHeight: 1 }}>
                    CO
                </span>
            </div>
            <span style={{ fontSize: "15px", color: "var(--muted)", fontWeight: 400, alignSelf: "end", margin: "0 0 -3px 6px" }}>
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