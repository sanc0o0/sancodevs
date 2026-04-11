"use client";

import { MeshGradient } from "@paper-design/shaders-react";
import { useTheme } from "@/lib/theme";
import Link from "next/link";

export default function HeroBackground() {
    const { theme } = useTheme();
    const isDark = theme === "dark";

    const darkColors = ["#0a0a0a", "#111111", "#1a1a1a", "#2a2a2a"];
    const lightColors = ["#ebebeb", "#d8d8d8", "#f5f5f5", "#ffffff"];

    return (
        <>
            {/* Hero */}
            <section className="relative flex-1 flex flex-col items-center justify-center text-center px-8 py-32 overflow-hidden min-h-[90vh]" style={{ background: isDark ? "#0a0a0a" : "#ebebeb" }}>
                {/* Animated background */}
                <MeshGradient
                    className="absolute inset-0 w-full h-full"
                    colors={isDark ? darkColors : lightColors}
                    speed={0.4}
                />

                {/* Subtle vignette overlay */}
                <div
                    className="absolute inset-0 pointer-events-none"
                    style={{
                        background: isDark
                            ? "radial-gradient(ellipse at center, transparent 40%, #0a0a0a 100%)"
                            : "radial-gradient(ellipse at center, transparent 40%, #ebebeb 100%)",
                    }}
                />

                {/* Content */}
                <div className="relative z-10 flex flex-col items-center gap-6 max-w-2xl">
                    <div style={{ width: "28px", height: "2px", background: "var(--accent)" }} />

                    <h1
                        className="font-montserrat leading-tight"
                        style={{ fontSize: "clamp(36px, 6vw, 58px)", fontWeight: 500, color: "var(--text)" }}
                    >
                        Learn to build.<br />
                        Ship real projects.<br />
                        Grow as a dev.
                    </h1>

                    <p style={{ fontSize: "15px", color: "var(--muted)", maxWidth: "420px", lineHeight: 1.75 }}>
                        SancoDevs gives you a guided path, real project experience,
                        and accountability — not just tutorials.
                    </p>

                    <div className="flex gap-3 flex-wrap justify-center mt-2">
                        <Link
                            href="/signup"
                            className="font-montserrat transition-opacity hover:opacity-80"
                            style={{
                                padding: "10px 24px", borderRadius: "8px",
                                fontSize: "14px", fontWeight: 500,
                                background: "var(--accent)", color: "var(--bg)",
                                textDecoration: "none",
                            }}
                        >
                            Get started free
                        </Link>
                        <Link
                            href="/login"
                            className="transition-colors hover:opacity-80"
                            style={{
                                padding: "10px 24px", borderRadius: "8px",
                                fontSize: "14px",
                                border: "0.5px solid var(--border)",
                                color: "var(--muted)", textDecoration: "none",
                            }}
                        >
                            Sign in
                        </Link>
                    </div>
                </div>
            </section>

            {/* Features */}
            <section className="px-8 py-20" style={{ background: "var(--bg)" }}>
                <div className="max-w-5xl mx-auto">
                    <div className="grid gap-3" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))" }}>
                        {[
                            {
                                title: "Guided learning paths",
                                desc: "Tell us what you know and what you want to build. We generate a step-by-step path tailored to you.",
                                accent: true,
                            },
                            {
                                title: "Real project accountability",
                                desc: "Commit to a project — solo or with a team. Once you start, you finish. No demo projects, no excuses.",
                                accent: false,
                            },
                            {
                                title: "Git & open source skills",
                                desc: "Learn the workflows real teams use: branching, PRs, code reviews, and contributing to open source.",
                                accent: true,
                            },
                        ].map((f, i) => (
                            <div
                                key={i}
                                className="rounded-xl p-6 transition-colors"
                                style={{
                                    border: "0.5px solid var(--border)",
                                    background: "var(--surface)",
                                }}
                            >
                                {f.accent && (
                                    <div style={{ width: "20px", height: "2px", background: "var(--accent)", marginBottom: "1rem" }} />
                                )}
                                <h3
                                    className="font-montserrat mb-2"
                                    style={{ fontSize: "14px", fontWeight: 500, color: "var(--text)" }}
                                >
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