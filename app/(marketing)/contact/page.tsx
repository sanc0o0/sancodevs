"use client";

import PageHero from "@/components/marketing/PageHero";
import { useState } from "react";

export default function ContactPage() {
    const [sent, setSent] = useState(false);
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [message, setMessage] = useState("");

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setSent(true);
    }

    const inputStyle = {
        width: "100%", padding: "9px 12px", borderRadius: "8px",
        border: "0.5px solid var(--border)", background: "var(--bg)",
        color: "var(--text)", fontSize: "13px", outline: "none",
        transition: "border-color 0.15s", boxSizing: "border-box" as const,
    };

    return (
        <>
            <PageHero
                title="Get in touch."
                sub="Have a question, suggestion, or just want to say hello? We'd love to hear from you."
            />
            <div style={{ maxWidth: "560px", margin: "0 auto", padding: "0 2rem 5rem" }}>
                {sent ? (
                    <div style={{
                        padding: "2rem", borderRadius: "12px",
                        border: "0.5px solid var(--border)", background: "var(--surface)",
                        textAlign: "center",
                    }}>
                        <div style={{ width: "28px", height: "2px", background: "var(--accent)", margin: "0 auto 1rem" }} />
                        <p style={{ fontSize: "15px", fontWeight: 500, color: "var(--text)", marginBottom: "6px" }}>Message sent</p>
                        <p style={{ fontSize: "13px", color: "var(--muted)" }}>We&apos;ll get back to you within a day or two.</p>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} style={{
                        display: "flex", flexDirection: "column", gap: "12px",
                        padding: "1.75rem", borderRadius: "12px",
                        border: "0.5px solid var(--border)", background: "var(--surface)",
                    }}>
                        {[
                            { label: "Name", type: "text", value: name, setter: setName, placeholder: "Your name" },
                            { label: "Email", type: "email", value: email, setter: setEmail, placeholder: "you@example.com" },
                        ].map(f => (
                            <div key={f.label}>
                                <label style={{ fontSize: "12px", color: "var(--muted)", display: "block", marginBottom: "5px" }}>{f.label}</label>
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
                            <label style={{ fontSize: "12px", color: "var(--muted)", display: "block", marginBottom: "5px" }}>Message</label>
                            <textarea
                                value={message} required placeholder="What's on your mind?"
                                onChange={e => setMessage(e.target.value)}
                                rows={5}
                                style={{ ...inputStyle, resize: "vertical" }}
                                onFocus={e => (e.currentTarget.style.borderColor = "var(--accent)")}
                                onBlur={e => (e.currentTarget.style.borderColor = "var(--border)")}
                            />
                        </div>
                        <button type="submit" style={{
                            padding: "9px", borderRadius: "8px", fontSize: "13px",
                            fontWeight: 500, background: "var(--accent)", color: "var(--bg)",
                            border: "none", cursor: "pointer", marginTop: "4px",
                        }}>
                            Send message
                        </button>
                    </form>
                )}

                <div style={{ marginTop: "2rem", display: "flex", flexDirection: "column", gap: "8px" }}>
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
                            <a href={`mailto:${c.value}`} style={{ fontSize: "13px", color: "var(--text)", textDecoration: "none" }}>{c.value}</a>
                        </div>
                    ))}
                </div>
            </div>
        </>
    );
}