"use client";

import { useSearchParams } from "next/navigation";
import { useState } from "react";
import Link from "next/link";

export default function VerifyEmailPage() {
    const params = useSearchParams();
    const status = params.get("status");
    const email = params.get("email") || "";
    const [sending, setSending] = useState(false);
    const [message, setMessage] = useState("");

    async function resend() {
        if (!email) return;
        setSending(true);
        setMessage("");
        const res = await fetch("/api/auth/resend-verification", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email }),
        });
        const data = await res.json();
        setSending(false);
        setMessage(res.ok ? "Verification email sent. Check your inbox." : data.error || "Something went wrong.");
    }

    const heading = status === "expired" ? "Link expired" : status === "invalid" ? "Invalid link" : "Check your email";
    const body =
        status === "expired"
            ? "That verification link has expired. Send yourself a new one below."
            : status === "invalid"
                ? "That verification link isn't valid. Request a new one below."
                : `We sent a verification link to ${email || "your email"}. Click it to activate your account.`;

    return (
        <div style={{
            minHeight: "100vh", display: "flex", alignItems: "center",
            justifyContent: "center", background: "var(--bg)", padding: "1.5rem",
        }}>
            <div style={{
                width: "100%", maxWidth: "400px",
                border: "0.5px solid var(--border)", borderRadius: "14px",
                background: "var(--surface)", padding: "2rem", textAlign: "center",
            }}>
                <div style={{ width: "24px", height: "2px", background: "var(--accent)", margin: "0 auto 1rem" }} />
                <h1 style={{ fontSize: "20px", fontWeight: 500, color: "var(--text)", marginBottom: "8px" }}>
                    {heading}
                </h1>
                <p style={{ fontSize: "13px", color: "var(--muted)", lineHeight: 1.6, marginBottom: "1.25rem" }}>
                    {body}
                </p>

                <button
                    onClick={resend}
                    disabled={sending || !email}
                    style={{
                        width: "100%", padding: "9px", borderRadius: "8px",
                        fontSize: "13px", fontWeight: 500,
                        background: "var(--accent)", color: "var(--bg)",
                        border: "none", cursor: sending ? "not-allowed" : "pointer",
                        opacity: sending || !email ? 0.6 : 1,
                    }}
                >
                    {sending ? "Sending..." : "Resend verification email"}
                </button>

                {message && (
                    <p style={{ fontSize: "12px", color: "var(--muted)", marginTop: "12px" }}>{message}</p>
                )}

                <p style={{ fontSize: "12px", color: "var(--muted)", marginTop: "1.25rem" }}>
                    <Link href="/login" style={{ color: "var(--text)", textDecoration: "none", fontWeight: 500 }}>
                        Back to sign in
                    </Link>
                </p>
            </div>
        </div>
    );
}