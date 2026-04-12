"use client";

import { MeshGradient } from "@paper-design/shaders-react";
import { useTheme } from "@/lib/theme";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function HeroBackground() {
    const { theme } = useTheme();
    const isDark = theme === "dark";
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        const t = setTimeout(() => setVisible(true), 100);
        return () => clearTimeout(t);
    }, []);

    const darkColors = ["#0a0a0a", "#111111", "#1a1a1a", "#2a2a2a"];
    const lightColors = ["#ebebeb", "#d8d8d8", "#f5f5f5", "#ffffff"];

    return (
        <>
            <section style={{ position: "relative", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", padding: "clamp(4rem, 10vw, 8rem) 1.5rem", minHeight: "90vh", overflow: "hidden" }}>
                <MeshGradient
                    className="absolute inset-0 w-full h-full"
                    colors={isDark ? darkColors : lightColors}
                    speed={0.4}
                    backgroundColor={isDark ? "#0a0a0a" : "#ebebeb"}
                />
                <div style={{
                    position: "absolute", inset: 0, pointerEvents: "none",
                    background: isDark
                        ? "radial-gradient(ellipse at center, transparent 40%, #0a0a0a 100%)"
                        : "radial-gradient(ellipse at center, transparent 40%, #ebebeb 100%)",
                }} />

                <div style={{
                    position: "relative", zIndex: 10,
                    display: "flex", flexDirection: "column", alignItems: "center", gap: "1.5rem",
                    maxWidth: "640px", width: "100%",
                    opacity: visible ? 1 : 0,
                    transform: visible ? "translateY(0)" : "translateY(16px)",
                    transition: "opacity 0.7s ease, transform 0.7s ease",
                }}>
                    <div style={{ width: "28px", height: "2px", background: "var(--accent)" }} />

                    <h1 style={{
                        fontSize: "clamp(28px, 6vw, 56px)",
                        fontWeight: 500, color: "var(--text)", lineHeight: 1.15,
                    }}>
                        Learn to build.<br />
                        Ship real projects.<br />
                        Grow as a dev.
                    </h1>

                    <p style={{
                        fontSize: "clamp(13px, 2vw, 15px)",
                        color: "var(--muted)", maxWidth: "400px", lineHeight: 1.75,
                        opacity: visible ? 1 : 0,
                        transition: "opacity 0.7s ease 0.3s",
                    }}>
                        SancoDevs gives you a guided path, real project experience,
                        and accountability — not just tutorials.
                    </p>

                    <div style={{
                        display: "flex", gap: "10px", flexWrap: "wrap", justifyContent: "center",
                        opacity: visible ? 1 : 0,
                        transition: "opacity 0.7s ease 0.5s",
                    }}>
                        <Link href="/signup" style={{
                            padding: "10px 24px", borderRadius: "8px", fontSize: "14px",
                            background: "var(--accent)", color: "var(--bg)",
                            fontWeight: 500, textDecoration: "none",
                            transition: "opacity 0.15s",
                        }}
                            onMouseEnter={e => (e.currentTarget.style.opacity = "0.82")}
                            onMouseLeave={e => (e.currentTarget.style.opacity = "1")}
                        >
                            Get started free
                        </Link>
                        <Link href="/login" style={{
                            padding: "10px 24px", borderRadius: "8px", fontSize: "14px",
                            border: "0.5px solid var(--border)", color: "var(--muted)",
                            textDecoration: "none", transition: "color 0.5",
                        }}
                            onMouseEnter={e => (e.currentTarget.style.color = "var(--text)")}
                            onMouseLeave={e => (e.currentTarget.style.color = "var(--muted)")}
                        >
                            Sign in
                        </Link>
                    </div>
                </div>
            </section>

            {/* Features */}
            <section style={{ padding: "clamp(3rem, 6vw, 5rem) 1.5rem", background: "var(--bg)" }}>
                <div style={{ maxWidth: "960px", margin: "0 auto" }}>
                    <div style={{
                        display: "grid", gap: "10px",
                        gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
                    }}>
                        {[
                            { title: "Guided learning paths", desc: "Tell us what you know and what you want to build. We map out exactly what to learn and in what order.", delay: "0s" },
                            { title: "Real project accountability", desc: "Commit to a project — solo or with a team. Once you start, you finish. No demo projects, no excuses.", delay: "0.1s" },
                            { title: "Git & open source skills", desc: "Learn the workflows real teams use: branching, PRs, code reviews, and contributing to open source.", delay: "0.2s" },
                        ].map((f, i) => (
                            <div key={i} style={{
                                padding: "1.5rem", borderRadius: "11px",
                                border: "0.5px solid var(--border)", background: "var(--surface)",
                                transition: "border-color 0.2s, transform 0.2s",
                                animation: `fadeUp 0.5s ease ${f.delay} both`,
                                cursor: "default",
                            }}
                                onMouseEnter={e => {
                                    (e.currentTarget as HTMLDivElement).style.borderColor = "var(--accent)";
                                    (e.currentTarget as HTMLDivElement).style.transform = "translateY(-2px)";
                                }}
                                onMouseLeave={e => {
                                    (e.currentTarget as HTMLDivElement).style.borderColor = "var(--border)";
                                    (e.currentTarget as HTMLDivElement).style.transform = "translateY(0)";
                                }}
                            >
                                <div style={{ width: "20px", height: "2px", background: "var(--accent)", marginBottom: "1rem" }} />
                                <h3 style={{ fontSize: "14px", fontWeight: 500, color: "var(--text)", marginBottom: "8px" }}>
                                    {f.title}
                                </h3>
                                <p style={{ fontSize: "13px", color: "var(--muted)", lineHeight: 1.7 }}>
                                    {f.desc}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>
        </>
    );
}