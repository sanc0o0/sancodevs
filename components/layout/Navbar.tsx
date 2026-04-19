"use client";

import Link from "next/link";
import { useTheme } from "@/lib/theme";
import { useSession, signOut } from "next-auth/react";
import { useState } from "react";
import NotificationBell from "./NotificationBell";

interface NavbarProps { 
    minimal?: boolean;
    hideAuth?: boolean;

}

export default function Navbar({ minimal = false, hideAuth = false }: NavbarProps) {
    const { theme, toggle } = useTheme();
    const { data: session } = useSession();
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [dropdownOpen, setDropdownOpen] = useState(false);

    const navLinks = session
        ? [
            { label: "Dashboard", href: "/dashboard" },
            { label: "Learn", href: "/learn" },
            { label: "Projects", href: "/projects" },
            { label: "Community", href: "/community" },
            { label: "Profile", href: "/profile" },
            { label: "Settings", href: "/settings" },
        ]
        : [
            { label: "Sign in", href: "/login" },
            { label: "Get started", href: "/signup" },
        ];

    return (
        <>
            <nav style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                padding: "0 1.25rem", height: "60px",
                borderBottom: "0.5px solid var(--border)",
                background: "var(--bg)", flexShrink: 0,
                position: "relative", zIndex: 50,
            }}>
                <Link href="/" style={{ textDecoration: "none" }}><Logo /></Link>

                {/* Right */}
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    {/* Theme toggle — desktop only */}
                    <div className="hidden-mobile">
                        <ThemeToggle theme={theme} toggle={toggle} />
                    </div>

                    {/* NOT logged in — show auth buttons on desktop */}
                    {!minimal && !session && !hideAuth && (
                        <div className="hidden-mobile" style={{ display: "flex", gap: "6px" }}>
                            <Link href="/login" style={{
                                padding: "6px 14px", borderRadius: "7px", fontSize: "13px",
                                border: "0.5px solid var(--border)", color: "var(--muted)",
                                textDecoration: "none",
                            }}>Sign in</Link>
                            <Link href="/signup" style={{
                                padding: "6px 14px", borderRadius: "7px", fontSize: "13px",
                                background: "var(--accent)", color: "var(--bg)",
                                textDecoration: "none", fontWeight: 500,
                            }}>Get started</Link>
                        </div>
                    )}

                    {/* Logged in — avatar + dropdown only (no separate nav links) */}
                    {!minimal && session && (
                        <div className="hidden-mobile" style={{  display: "flex", alignItems: "center", gap: "8px" }}>
                            <NotificationBell/>
                            <button onClick={() => setDropdownOpen(o => !o)} style={{
                                width: "32px", height: "32px", borderRadius: "50%",
                                border: "0.5px solid var(--border)", background: "var(--surface2)",
                                cursor: "pointer", overflow: "hidden", padding: 0,
                                display: "flex", alignItems: "center", justifyContent: "center",
                            }}>
                                {session.user?.image
                                    ? <img src={session.user.image} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                                    : <span style={{ fontSize: "12px", fontWeight: 500, color: "var(--text)" }}>{session.user?.name?.charAt(0).toUpperCase()}</span>
                                }
                            </button>

                            {dropdownOpen && (
                                <>
                                    <div onClick={() => setDropdownOpen(false)} style={{ position: "fixed", inset: 0, zIndex: 40 }} />
                                    <div style={{
                                        position: "absolute", right: 0, top: "calc(100% + 8px)",
                                        width: "210px", borderRadius: "10px",
                                        border: "0.5px solid var(--border)", background: "var(--surface)",
                                        zIndex: 50, overflow: "hidden",
                                        animation: "fadeIn 0.12s ease",
                                    }}>
                                        <div style={{ padding: "12px 14px", borderBottom: "0.5px solid var(--border)" }}>
                                            <p style={{ fontSize: "13px", fontWeight: 500, color: "var(--text)", marginBottom: "2px" }}>{session.user?.name}</p>
                                            <p style={{ fontSize: "11px", color: "var(--muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{session.user?.email}</p>
                                        </div>
                                        {[
                                            { label: "Dashboard", href: "/dashboard" },
                                            { label: "Learn", href: "/learn" },
                                            { label: "Projects", href: "/projects" },
                                            { label: "Community", href: "/community" },
                                            { label: "Profile", href: "/profile" },
                                            { label: "Settings", href: "/settings" },
                                        ].map(item => (
                                            <Link key={item.href} href={item.href}
                                                onClick={() => setDropdownOpen(false)}
                                                className="dropdown-item"
                                                style={{
                                                    display: "block", padding: "9px 14px",
                                                    fontSize: "13px", color: "var(--muted)",
                                                    textDecoration: "none",
                                                    borderBottom: "0.5px solid var(--border)",
                                                }}
                                            >{item.label}</Link>
                                        ))}
                                        <button
                                            onClick={() => { setDropdownOpen(false); signOut({ callbackUrl: "/" }); }}
                                            className="dropdown-item"
                                            style={{
                                                display: "block", width: "100%", textAlign: "left",
                                                padding: "9px 14px", fontSize: "13px", color: "#e24b4a",
                                                background: "transparent", border: "none", cursor: "pointer",
                                            }}
                                        >Sign out</button>
                                    </div>
                                </>
                            )}
                        </div>
                    )}

                    {/* Mobile hamburger */}
                    {!minimal && (
                        <div className="flex items-center gap-2">
                            <NotificationBell /> 
                            <button
                                onClick={() => setDrawerOpen(true)}
                                className="show-mobile"
                                title="Open navigation menu"
                                aria-label="Open navigation menu"
                                style={{
                                    width: "34px", height: "34px", borderRadius: "8px",
                                    border: "0.5px solid var(--border)", background: "transparent",
                                    color: "var(--text)", cursor: "pointer",
                                    display: "none", alignItems: "center", justifyContent: "center",
                                }}>
                                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                    <line x1="3" y1="6" x2="21" y2="6" />
                                    <line x1="3" y1="12" x2="21" y2="12" />
                                    <line x1="3" y1="18" x2="21" y2="18" />
                                </svg>
                            </button>
                        </div>

                    )}
                </div>
            </nav>

            {/* Drawer backdrop */}
            {drawerOpen && (
                <div onClick={() => setDrawerOpen(false)} style={{
                    position: "fixed", inset: 0, zIndex: 60,
                    background: "rgba(0,0,0,0.5)", animation: "fadeIn 0.2s ease",
                }} />
            )}

            {/* Mobile drawer */}
            <div style={{
                position: "fixed", top: 0, left: 0, bottom: 0, width: "260px",
                zIndex: 70, background: "var(--bg)",
                borderRight: "0.5px solid var(--border)",
                display: "flex", flexDirection: "column",
                transform: drawerOpen ? "translateX(0)" : "translateX(-100%)",
                transition: "transform 0.25s cubic-bezier(0.4,0,0.2,1)",
            }}>
                <div style={{
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                    padding: "0 1.25rem", height: "54px",
                    borderBottom: "0.5px solid var(--border)", flexShrink: 0,
                }}>
                    <Logo />
                    <button
                        onClick={() => setDrawerOpen(false)}
                        title="Close navigation menu"
                        aria-label="Close navigation menu"
                        style={{
                            width: "32px", height: "32px", borderRadius: "8px",
                            border: "0.5px solid var(--border)", background: "transparent",
                            color: "var(--text)", cursor: "pointer",
                            display: "flex", alignItems: "center", justifyContent: "center",
                        }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                            <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                    </button>
                </div>

                {session && (
                    <div style={{
                        padding: "1rem 1.25rem",
                        borderBottom: "0.5px solid var(--border)",
                        display: "flex", alignItems: "center", gap: "10px",
                    }}>
                        <div style={{
                            width: "36px", height: "36px", borderRadius: "50%",
                            border: "0.5px solid var(--border)", overflow: "hidden",
                            flexShrink: 0, background: "var(--surface2)",
                            display: "flex", alignItems: "center", justifyContent: "center",
                        }}>
                            {session.user?.image
                                ? <img src={session.user.image} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                                : <span style={{ fontSize: "13px", fontWeight: 500, color: "var(--text)" }}>{session.user?.name?.charAt(0).toUpperCase()}</span>
                            }
                        </div>
                        <div style={{ overflow: "hidden" }}>
                            <p style={{ fontSize: "13px", fontWeight: 500, color: "var(--text)", marginBottom: "2px" }}>{session.user?.name}</p>
                            <p style={{ fontSize: "11px", color: "var(--muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{session.user?.email}</p>
                        </div>
                    </div>
                )}

                <nav style={{ flex: 1, padding: "0.75rem", display: "flex", flexDirection: "column", gap: "2px", overflowY: "auto" }}>
                    {navLinks.map(item => (
                        <Link key={item.href} href={item.href}
                            onClick={() => setDrawerOpen(false)}
                            className="drawer-link"
                            style={{
                                display: "block", padding: "10px 12px", borderRadius: "8px",
                                fontSize: "14px", color: "var(--muted)", textDecoration: "none",
                            }}
                        >{item.label}</Link>
                    ))}
                </nav>

                <div style={{ padding: "0.75rem", borderTop: "0.5px solid var(--border)", display: "flex", flexDirection: "column", gap: "6px" }}>
                    <div style={{
                        display: "flex", alignItems: "center", justifyContent: "space-between",
                        padding: "8px 12px", borderRadius: "8px",
                        border: "0.5px solid var(--border)", background: "var(--surface)",
                    }}>
                        <span style={{ fontSize: "13px", color: "var(--muted)" }}>{theme === "dark" ? "Dark mode" : "Light mode"}</span>
                        <ThemeToggle theme={theme} toggle={toggle} />
                    </div>
                    {session && (
                        <button
                            onClick={() => { setDrawerOpen(false); signOut({ callbackUrl: "/" }); }}
                            style={{
                                width: "100%", padding: "10px 12px", borderRadius: "8px",
                                fontSize: "13px", color: "var(--muted)", background: "transparent",
                                border: "0.5px solid var(--border)", cursor: "pointer", textAlign: "left",
                            }}
                        >Sign out</button>
                    )}
                </div>
            </div>
        </>
    );
}

export function Logo() {
    return (
        <div style={{ fontFamily: 'Inter', display: "flex", alignItems: "flex-start" }}>
            {/* SAN with rule below */}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: "2px", margin: "0" }}>
                <span style={{ margin: "0px", fontSize: "18px", fontWeight: 600, letterSpacing: "0.2em", color: "var(--text)", lineHeight: 1 }}>
                    SAN
                </span>
                <div style={{ width: "90%", height: "3px", background: "var(--text)", margin: "0px" }} />
            </div>
            {/* CO with rule above */}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: "4px", margin: "0", marginTop: "2px" }}>
                <div style={{ width: "100%", height: "3px", background: "var(--text)" }} />
                <span style={{ fontSize: "18px", fontWeight: 600, letterSpacing: "0.2em", color: "var(--text)", lineHeight: 1 }}>
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
            {theme === "dark"
                ? <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="12" r="5" /><line x1="12" y1="1" x2="12" y2="3" /><line x1="12" y1="21" x2="12" y2="23" /><line x1="4.22" y1="4.22" x2="5.64" y2="5.64" /><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" /><line x1="1" y1="12" x2="3" y2="12" /><line x1="21" y1="12" x2="23" y2="12" /><line x1="4.22" y1="19.78" x2="5.64" y2="18.36" /><line x1="18.36" y1="5.64" x2="19.78" y2="4.22" /></svg>
                : <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" /></svg>
            }
        </button>
    );
}