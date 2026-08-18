"use client";

import { MeshGradient } from "@paper-design/shaders-react";
import { useTheme } from "@/lib/theme";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

export default function HeroBackground() {
    const { theme } = useTheme();
    const { data: session, status } = useSession();
    const isDark = theme === "dark";
    const [visible, setVisible] = useState(false);
    const [count, setCount] = useState(0);
    const countRef = useRef(0);

    useEffect(() => {
        const t = setTimeout(() => setVisible(true), 100);
        return () => clearTimeout(t);
    }, []);

    // Animated counter
    useEffect(() => {
        const target = 248;
        const step = Math.ceil(target / 60);
        const interval = setInterval(() => {
            countRef.current = Math.min(countRef.current + step, target);
            setCount(countRef.current);
            if (countRef.current >= target) clearInterval(interval);
        }, 24);
        return () => clearInterval(interval);
    }, []);

    const darkColors = ["#0a0a0a", "#111111", "#1a1a1a", "#2a2a2a"];
    const lightColors = ["#ebebeb", "#d8d8d8", "#f5f5f5", "#ffffff"];

    return (
        <>
            {/* Hero */}
            <section style={{
                position: "relative", display: "flex", flexDirection: "column",
                alignItems: "center", justifyContent: "center", textAlign: "center",
                padding: "clamp(5rem, 12vw, 4rem) 1.5rem clamp(4rem, 8vw, 5rem)",
                minHeight: "92vh", overflow: "hidden",
                background: isDark ? "#0a0a0a" : "#ebebeb" 
            }}>
                <MeshGradient
                    className="absolute inset-0 w-full h-full "
                    colors={isDark ? darkColors : lightColors}
                    speed={0.35}
                    
                />
                <div style={{
                    position: "absolute", inset: 0, pointerEvents: "none",
                    background: isDark
                        ? "radial-gradient(ellipse at center, transparent 30%, #0a0a0a 90%)"
                        : "radial-gradient(ellipse at center, transparent 30%, #ebebeb 90%)",
                }} />

                <div style={{
                    position: "relative", zIndex: 10,
                    display: "flex", flexDirection: "column", alignItems: "center", gap: "1.5rem",
                    maxWidth: "680px", width: "100%",
                    opacity: visible ? 1 : 0,
                    transform: visible ? "translateY(0)" : "translateY(20px)",
                    transition: "opacity 0.8s ease, transform 0.8s ease",
                }}>
                    <div style={{
                        display: "inline-flex", alignItems: "center", gap: "6px",
                        padding: "4px 12px", borderRadius: "20px",
                        border: "0.5px solid var(--border)", background: "var(--surface)",
                        fontSize: "11px", color: "var(--muted)",
                        opacity: visible ? 1 : 0,
                        transition: "opacity 0.6s ease 0.1s",
                    }}>
                        <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#22c55e", display: "inline-block" }} />
                        {count}+ developers building together right now
                    </div>

                    <div style={{ width: "28px", height: "2px", background: "var(--accent)" }} />

                    <h1 style={{
                        fontSize: "clamp(32px, 7vw, 64px)",
                        fontWeight: 500, color: "var(--text)", lineHeight: 1.1,
                        opacity: visible ? 1 : 0,
                        transition: "opacity 0.8s ease 0.15s",
                    }}>
                        Find your team.<br />
                        Build real projects.<br />
                        Own your reputation.
                    </h1>

                    <p style={{
                        fontSize: "clamp(13px, 2vw, 16px)",
                        color: "var(--muted)", maxWidth: "440px", lineHeight: 1.8,
                        opacity: visible ? 1 : 0,
                        transition: "opacity 0.8s ease 0.25s",
                    }}>
                        SancoDevs connects you with real projects and real teams. List or
                        join a project, build a developer profile that shows your work,
                        and manage everything from one workspace.
                    </p>

                    <div style={{
                        display: "flex", gap: "10px", flexWrap: "wrap", justifyContent: "center",
                        opacity: visible ? 1 : 0,
                        transition: "opacity 0.8s ease 0.35s",
                    }}>
                        {status === "loading" ? null : session ? (
                            <Link href="/dashboard" style={{
                                padding: "11px 28px", borderRadius: "8px", fontSize: "14px",
                                background: "var(--accent)", color: "var(--bg)",
                                fontWeight: 500, textDecoration: "none",
                            }}>
                                Go to dashboard →
                            </Link>
                        ) : (
                            <>
                                <Link href="/signup" style={{
                                    padding: "11px 28px", borderRadius: "8px", fontSize: "14px",
                                    background: "var(--accent)", color: "var(--bg)",
                                    fontWeight: 500, textDecoration: "none",
                                }}>
                                    Get started free
                                </Link>
                                <Link href="/login" style={{
                                    padding: "11px 28px", borderRadius: "8px", fontSize: "14px",
                                    border: "0.5px solid var(--border)", color: "var(--muted)",
                                    textDecoration: "none",
                                }}>
                                    Sign in
                                </Link>
                            </>
                        )}
                    </div>

                    {/* Stats row */}
                    <div style={{
                        display: "flex", gap: "2rem", flexWrap: "wrap", justifyContent: "center",
                        marginTop: "1rem", paddingTop: "1.5rem",
                        borderTop: "0.5px solid var(--border)", width: "100%",
                        opacity: visible ? 1 : 0,
                        transition: "opacity 0.8s ease 0.45s",
                    }}>
                        {[
                            { value: "50+", label: "Open projects" },
                            { value: "200+", label: "Developer profiles" },
                            { value: "100%", label: "Free to start" },
                        ].map((s, i) => (
                            <div key={i} style={{ textAlign: "center" }}>
                                <p style={{ fontSize: "22px", fontWeight: 500, color: "var(--text)", marginBottom: "3px" }}>{s.value}</p>
                                <p style={{ fontSize: "11px", color: "var(--muted)" }}>{s.label}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Features */}
            <section style={{ padding: "clamp(3rem, 6vw, 5rem) 1.5rem", background: "var(--bg)" }}>
                <div style={{ maxWidth: "960px", margin: "0 auto" }}>
                    <div style={{ textAlign: "center", marginBottom: "2.5rem" }}>
                        <div style={{ width: "28px", height: "2px", background: "var(--accent)", margin: "0 auto 1rem" }} />
                        <h2 style={{ fontSize: "clamp(20px, 4vw, 30px)", fontWeight: 500, color: "var(--text)", marginBottom: "8px" }}>
                            Everything you need to build with others
                        </h2>
                        <p style={{ fontSize: "14px", color: "var(--muted)", maxWidth: "420px", margin: "0 auto", lineHeight: 1.7 }}>
                            Not just another profile page. A real system for finding projects,
                            teammates, and getting things shipped.
                        </p>
                    </div>
                    <div style={{ display: "grid", gap: "10px", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))" }}>
                        {[
                            {
                                icon: "◈",
                                title: "Project listings",
                                desc: "Browse open projects looking for collaborators, or list your own. Filter by tech stack and the role you're looking to fill.",
                            },
                            {
                                icon: "▣",
                                title: "Real project collaboration",
                                desc: "Join a team, commit to your part, and ship together. No abandoned side projects real accountability with real people.",
                            },
                            {
                                icon: "⊕",
                                title: "Git workflows that matter",
                                desc: "Practice the workflows real teams use: branching, PRs, and reviews on actual projects with actual collaborators.",
                            },
                            {
                                icon: "⊞",
                                title: "One workspace for everything",
                                desc: "Manage your active projects, tasks, and team communication from a single, organized workspace.",
                            },
                            {
                                icon: "◎",
                                title: "Developer profile & reputation",
                                desc: "Build a profile that shows your tech stack, projects, and reliability tracked across communication, execution, and ownership.",
                            },
                            {
                                icon: "⊟",
                                title: "A real developer community",
                                desc: "Connect with other builders, form teams, and find people to collaborate with whatever you're working on.",
                            },
                        ].map((f, i) => (
                            <div key={i} className="card-hover" style={{
                                padding: "1.5rem", borderRadius: "11px",
                                border: "0.5px solid var(--border)", background: "var(--surface)",
                                animation: `fadeUp 0.5s ease ${i * 0.07}s both`,
                            }}>
                                <span style={{ fontSize: "18px", display: "block", marginBottom: "10px", color: "var(--muted)" }}>{f.icon}</span>
                                <p style={{ fontSize: "13px", fontWeight: 500, color: "var(--text)", marginBottom: "6px" }}>{f.title}</p>
                                <p style={{ fontSize: "12px", color: "var(--muted)", lineHeight: 1.7 }}>{f.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA bottom */}
            {!session && (
                <section style={{ padding: "4rem 1.5rem", background: "var(--bg)", textAlign: "center" }}>
                    <div style={{
                        maxWidth: "520px", margin: "0 auto",
                        padding: "2.5rem", borderRadius: "14px",
                        border: "0.5px solid var(--border)", background: "var(--surface)",
                    }}>
                        <div style={{ width: "24px", height: "2px", background: "var(--accent)", margin: "0 auto 1.25rem" }} />
                        <h2 style={{ fontSize: "22px", fontWeight: 500, color: "var(--text)", marginBottom: "8px" }}>
                            Ready to build with others?
                        </h2>
                        <p style={{ fontSize: "13px", color: "var(--muted)", lineHeight: 1.7, marginBottom: "1.5rem" }}>
                            Join SancoDevs for free. Set up your profile, find a project, and start collaborating with real developers.
                        </p>
                        <Link href="/signup" style={{
                            display: "inline-block", padding: "10px 28px", borderRadius: "8px",
                            fontSize: "14px", background: "var(--accent)", color: "var(--bg)",
                            fontWeight: 500, textDecoration: "none",
                        }}>
                            Create free account
                        </Link>
                    </div>
                </section>
            )}
        </>
    );
}