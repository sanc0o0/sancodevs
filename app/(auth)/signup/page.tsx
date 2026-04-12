"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function SignupPage() {
    const router = useRouter();
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setLoading(true);
        setError("");
        const res = await fetch("/api/auth/register", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name, email, password }),
        });
        const data = await res.json();
        setLoading(false);
        if (!res.ok) setError(data.error || "Something went wrong.");
        else router.push("/login?registered=true");
    }

    const fields = [
        { label: "Name", type: "text", value: name, setter: setName, placeholder: "Your name" },
        { label: "Email", type: "email", value: email, setter: setEmail, placeholder: "you@example.com" },
        { label: "Password", type: "password", value: password, setter: setPassword, placeholder: "Min. 8 characters" },
    ];

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
                <div style={{ marginBottom: "1.75rem" }}>
                    <div style={{ width: "24px", height: "2px", background: "var(--accent)", marginBottom: "1rem" }} />
                    <h1 style={{ fontSize: "20px", fontWeight: 500, color: "var(--text)", marginBottom: "4px" }}>
                        Create account
                    </h1>
                    <p style={{ fontSize: "13px", color: "var(--muted)" }}>Join SancoDevs</p>
                </div>

                <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                    {fields.map(field => (
                        <div key={field.label}>
                            <label style={{ fontSize: "12px", color: "var(--muted)", display: "block", marginBottom: "5px" }}>
                                {field.label}
                            </label>
                            <input
                                type={field.type}
                                value={field.value}
                                onChange={e => field.setter(e.target.value)}
                                required
                                minLength={field.type === "password" ? 8 : undefined}
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
                        {loading ? "Creating account..." : "Create account"}
                    </button>
                </form>

                <p style={{ fontSize: "12px", color: "var(--muted)", textAlign: "center", marginTop: "1.25rem" }}>
                    Already have an account?{" "}
                    <Link href="/login" style={{ color: "var(--text)", textDecoration: "none", fontWeight: 500 }}>
                        Sign in
                    </Link>
                </p>
            </div>
        </div>
    );
}