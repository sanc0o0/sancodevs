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
                padding: "clamp(5rem, 12vw, 4rem) 1.5rem clamp(4rem, 8vw, 7rem)",
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
                        {count}+ developers learning right now
                    </div>

                    <div style={{ width: "28px", height: "2px", background: "var(--accent)" }} />

                    <h1 style={{
                        fontSize: "clamp(32px, 7vw, 64px)",
                        fontWeight: 500, color: "var(--text)", lineHeight: 1.1,
                        opacity: visible ? 1 : 0,
                        transition: "opacity 0.8s ease 0.15s",
                    }}>
                        Learn to build.<br />
                        Ship real projects.<br />
                        Grow as a dev.
                    </h1>

                    <p style={{
                        fontSize: "clamp(13px, 2vw, 16px)",
                        color: "var(--muted)", maxWidth: "440px", lineHeight: 1.8,
                        opacity: visible ? 1 : 0,
                        transition: "opacity 0.8s ease 0.25s",
                    }}>
                        SancoDevs gives you a guided learning path, real project accountability,
                        and the Git skills that actually get you hired.
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
                            { value: "6", label: "Learning paths" },
                            { value: "36+", label: "Guided modules" },
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
                            Everything you need to actually ship
                        </h2>
                        <p style={{ fontSize: "14px", color: "var(--muted)", maxWidth: "420px", margin: "0 auto", lineHeight: 1.7 }}>
                            Not another tutorial platform. A system that takes you from beginner to builder.
                        </p>
                    </div>
                    <div style={{ display: "grid", gap: "10px", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))" }}>
                        {[
                            {
                                icon: "◈",
                                title: "Personalised learning paths",
                                desc: "Tell us what you know and what you want to build. We generate a step-by-step path tailored exactly to you — no guessing what to learn next.",
                            },
                            {
                                icon: "▣",
                                title: "Real project accountability",
                                desc: "Commit to a project — solo or with a team. Once you commit, you finish. No demo projects that never get deployed.",
                            },
                            {
                                icon: "⊕",
                                title: "Git & open source from day one",
                                desc: "Learn the workflows real teams use: branching, PRs, reviews, and contributing to open source. The skills that get you hired.",
                            },
                            {
                                icon: "⊞",
                                title: "Module-by-module guidance",
                                desc: "Each module has clear objectives, curated resources, and a completion checkpoint. No more rabbit holes or decision fatigue.",
                            },
                            {
                                icon: "◎",
                                title: "Track your progress",
                                desc: "See exactly where you are in your path, what you've completed, and what's next. Your progress is saved and never lost.",
                            },
                            {
                                icon: "⊟",
                                title: "Built for beginners",
                                desc: "Every path starts from where you are today. We don't assume prior knowledge — we build it with you, step by step.",
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
                            Ready to start building?
                        </h2>
                        <p style={{ fontSize: "13px", color: "var(--muted)", lineHeight: 1.7, marginBottom: "1.5rem" }}>
                            Join SancoDevs for free. Pick your path, commit to a project, and ship something real.
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