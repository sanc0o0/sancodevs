"use client";

import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useMemo, useState } from "react";

function useIsWebView() {
    const isWebView = useMemo(() => {
        if (typeof navigator === "undefined") return false;
        const ua = navigator.userAgent;
        return (
            /Instagram|FBAN|FBAV|Twitter|Line|WhatsApp|Snapchat|GSA|musical_ly/.test(ua) ||
            (/iPhone|iPod|iPad/.test(ua) && !/Safari/.test(ua)) ||
            (/Android/.test(ua) && /wv/.test(ua))
        );
    }, []);
    return isWebView;
}

export default function LoginPage() {
    const router = useRouter();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const isWebView = useIsWebView();

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setLoading(true);
        setError("");
        const res = await signIn("credentials", { email, password, redirect: false });
        setLoading(false);
        if (res?.error) setError("Invalid email or password.");
        else router.push("/dashboard");
    }

    return (
        <div style={{
            minHeight: "100vh", display: "flex", alignItems: "center",
            justifyContent: "center", background: "var(--bg)", padding: "1.5rem",
        }}>
            <div style={{
                width: "100%", maxWidth: "400px",
                border: "0.5px solid var(--border)", borderRadius: "14px",
                background: "var(--surface)", padding: "2rem",
                animation: "fadeUp 0.4s ease both",
            }}>
                {/* Header */}
                <div style={{ marginBottom: "1.75rem" }}>
                    <div style={{ width: "24px", height: "2px", background: "var(--accent)", marginBottom: "1rem" }} />
                    <h1 style={{ fontSize: "20px", fontWeight: 500, color: "var(--text)", marginBottom: "4px" }}>
                        Welcome back
                    </h1>
                    <p style={{ fontSize: "13px", color: "var(--muted)" }}>
                        Sign in to SancoDevs
                    </p>
                </div>

                {/* WebView warning */}
                {isWebView && (
                    <div style={{
                        padding: "10px 14px", borderRadius: "8px", marginBottom: "1.25rem",
                        border: "0.5px solid var(--border)", background: "var(--surface2)",
                    }}>
                        <p style={{ fontSize: "12px", color: "var(--muted)", lineHeight: 1.6 }}>
                            You&apos;re in an in-app browser. Open in{" "}
                            <strong style={{ color: "var(--text)" }}>Chrome or Safari</strong>{" "}
                            for Google sign-in to work.
                        </p>
                    </div>
                )}

                {/* OAuth */}
                <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginBottom: "1.25rem" }}>
                    {[
                        {
                            provider: "github",
                            label: "Continue with GitHub",
                            icon: <svg style={{ width: 16, height: 16, flexShrink: 0 }} fill="currentColor" viewBox="0 0 24 24"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.3 3.438 9.8 8.205 11.387.6.113.82-.258.82-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0 1 12 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.63-5.37-12-12-12z" /></svg>,
                        },
                        {
                            provider: "google",
                            label: "Continue with Google",
                            icon: <svg style={{ width: 16, height: 16, flexShrink: 0 }} viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" /><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" /><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" /><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" /></svg>,
                        },
                    ].map(({ provider, label, icon }) => (
                        <button
                            key={provider}
                            onClick={() => signIn(provider, { callbackUrl: "/dashboard" })}
                            style={{
                                display: "flex", alignItems: "center", justifyContent: "center",
                                gap: "10px", width: "100%", padding: "9px 16px",
                                borderRadius: "8px", fontSize: "13px",
                                border: "0.5px solid var(--border)", background: "var(--surface2)",
                                color: "var(--text)", cursor: "pointer", transition: "border-color 0.15s",
                            }}
                            onMouseEnter={e => (e.currentTarget.style.borderColor = "var(--accent)")}
                            onMouseLeave={e => (e.currentTarget.style.borderColor = "var(--border)")}
                        >
                            {icon}
                            {label}
                        </button>
                    ))}
                </div>

                {/* Divider */}
                <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "1.25rem" }}>
                    <div style={{ flex: 1, height: "0.5px", background: "var(--border)" }} />
                    <span style={{ fontSize: "11px", color: "var(--muted)" }}>or</span>
                    <div style={{ flex: 1, height: "0.5px", background: "var(--border)" }} />
                </div>

                {/* Credentials form */}
                <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                    {[
                        { label: "Email", type: "email", value: email, setter: setEmail, placeholder: "you@example.com" },
                        { label: "Password", type: "password", value: password, setter: setPassword, placeholder: "••••••••" },
                    ].map(field => (
                        <div key={field.label}>
                            <label style={{ fontSize: "12px", color: "var(--muted)", display: "block", marginBottom: "5px" }}>
                                {field.label}
                            </label>
                            <input
                                type={field.type}
                                value={field.value}
                                onChange={e => field.setter(e.target.value)}
                                required
                                placeholder={field.placeholder}
                                style={{
                                    width: "100%", padding: "9px 12px", borderRadius: "8px",
                                    border: "0.5px solid var(--border)", background: "var(--bg)",
                                    color: "var(--text)", fontSize: "13px", outline: "none",
                                    transition: "border-color 0.15s", boxSizing: "border-box",
                                }}
                                onFocus={e => (e.currentTarget.style.borderColor = "var(--accent)")}
                                onBlur={e => (e.currentTarget.style.borderColor = "var(--border)")}
                            />
                        </div>
                    ))}

                    {error && (
                        <p style={{ fontSize: "12px", color: "#e24b4a" }}>{error}</p>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        style={{
                            width: "100%", padding: "9px", borderRadius: "8px",
                            fontSize: "13px", fontWeight: 500,
                            background: "var(--accent)", color: "var(--bg)",
                            border: "none", cursor: loading ? "not-allowed" : "pointer",
                            opacity: loading ? 0.6 : 1, transition: "opacity 0.15s",
                            marginTop: "4px",
                        }}
                    >
                        {loading ? "Signing in..." : "Sign in"}
                    </button>
                </form>

                <p style={{ fontSize: "12px", color: "var(--muted)", textAlign: "center", marginTop: "1.25rem" }}>
                    Don&apos;t have an account?{" "}
                    <Link href="/signup" style={{ color: "var(--text)", textDecoration: "none", fontWeight: 500 }}>
                        Sign up
                    </Link>
                </p>
            </div>
        </div>
    );
}