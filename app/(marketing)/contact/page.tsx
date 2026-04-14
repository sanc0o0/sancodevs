"use client";

import PageHero from "@/components/marketing/PageHero";
import { useState } from "react";

export default function ContactPage() {
    const [state, setState] = useState<"idle" | "loading" | "sent" | "error">("idle");
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [message, setMessage] = useState("");

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setState("loading");
        try {
            const res = await fetch("/api/contact", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name, email, message }),
            });
            if (res.ok) setState("sent");
            else setState("error");
        } catch {
            setState("error");
        }
    }

    const inputStyle: React.CSSProperties = {
        width: "100%", padding: "9px 12px", borderRadius: "8px",
        border: "0.5px solid var(--border)", background: "var(--bg)",
        color: "var(--text)", fontSize: "13px", outline: "none",
        transition: "border-color 0.15s", boxSizing: "border-box",
        fontFamily: "inherit",
    };

    return (
        <>
            <PageHero
                title="Get in touch."
                sub="Have a question, suggestion, or just want to say hello? We'd love to hear from you."
            />
            <div style={{ maxWidth: "560px", margin: "0 auto", padding: "0 2rem 5rem" }}>
                {state === "sent" ? (
                    <div style={{
                        padding: "2.5rem", borderRadius: "12px",
                        border: "0.5px solid var(--border)", background: "var(--surface)",
                        textAlign: "center", animation: "fadeUp 0.3s ease",
                    }}>
                        <div style={{ fontSize: "32px", marginBottom: "1rem" }}>✉️</div>
                        <div style={{ width: "24px", height: "2px", background: "var(--accent)", margin: "0 auto 1rem" }} />
                        <p style={{ fontSize: "16px", fontWeight: 500, color: "var(--text)", marginBottom: "6px" }}>
                            Message sent
                        </p>
                        <p style={{ fontSize: "13px", color: "var(--muted)", lineHeight: 1.7 }}>
                            We&apos;ll get back to you within a day or two. Check your inbox — we also sent you a confirmation.
                        </p>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} style={{
                        display: "flex", flexDirection: "column", gap: "14px",
                        padding: "1.75rem", borderRadius: "12px",
                        border: "0.5px solid var(--border)", background: "var(--surface)",
                    }}>
                        <div style={{ width: "24px", height: "2px", background: "var(--accent)" }} />

                        {[
                            { label: "Name", type: "text", value: name, setter: setName, placeholder: "Your name" },
                            { label: "Email", type: "email", value: email, setter: setEmail, placeholder: "you@example.com" },
                        ].map(f => (
                            <div key={f.label}>
                                <label style={{ fontSize: "12px", color: "var(--muted)", display: "block", marginBottom: "5px" }}>
                                    {f.label}
                                </label>
                                <input
                                    type={f.type} value={f.value} required placeholder={f.placeholder}
                                    onChange={e => f.setter(e.target.value)}
                                    style={inputStyle}
                                    onFocus={e => (e.currentTarget.style.borderColor = "var(--accent)")}
                                    onBlur={e => (e.currentTarget.style.borderColor = "var(--border)")}
                                />
                            </div>
                        ))}

                        <div>
                            <label style={{ fontSize: "12px", color: "var(--muted)", display: "block", marginBottom: "5px" }}>
                                Message
                            </label>
                            <textarea
                                value={message} required placeholder="What's on your mind?"
                                onChange={e => setMessage(e.target.value)}
                                rows={5}
                                style={{ ...inputStyle, resize: "vertical" }}
                                onFocus={e => (e.currentTarget.style.borderColor = "var(--accent)")}
                                onBlur={e => (e.currentTarget.style.borderColor = "var(--border)")}
                            />
                        </div>

                        {state === "error" && (
                            <p style={{ fontSize: "12px", color: "#e24b4a" }}>
                                Something went wrong. Please try emailing us directly at sanansari0305@gmail.com
                            </p>
                        )}

                        <button
                            type="submit"
                            disabled={state === "loading"}
                            style={{
                                padding: "10px", borderRadius: "8px", fontSize: "13px",
                                fontWeight: 500, background: "var(--accent)", color: "var(--bg)",
                                border: "none", cursor: state === "loading" ? "not-allowed" : "pointer",
                                opacity: state === "loading" ? 0.6 : 1, transition: "opacity 0.15s",
                            }}
                        >
                            {state === "loading" ? "Sending..." : "Send message"}
                        </button>
                    </form>
                )}

                <div style={{ marginTop: "1.25rem", display: "flex", flexDirection: "column", gap: "8px" }}>
                    {[
                        { label: "General", value: "sanansari0305@gmail.com" },
                        { label: "Support", value: "sanansari0305@gmail.com" },
                    ].map(c => (
                        <div key={c.label} style={{
                            display: "flex", justifyContent: "space-between", alignItems: "center",
                            padding: "10px 14px", borderRadius: "8px",
                            border: "0.5px solid var(--border)", background: "var(--surface)",
                        }}>
                            <span style={{ fontSize: "12px", color: "var(--muted)" }}>{c.label}</span>
                            <a href={`mailto:${c.value}`} style={{ fontSize: "13px", color: "var(--text)", textDecoration: "none" }}>
                                {c.value}
                            </a>
                        </div>
                    ))}
                </div>
            </div>
        </>
    );
}