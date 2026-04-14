"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

const ROLES = [
    "Full-stack Developer",
    "Content Writer",
    "Community Manager",
];

const EXPERIENCE_LEVELS = [
    "Less than 1 year",
    "1–2 years",
    "2–4 years",
    "4+ years",
];

const TERMS = [
    "I am applying in good faith and the information I've provided is accurate.",
    "I understand this is an early-stage startup and roles may be part-time or unpaid initially.",
    "I am willing to commit to a minimum of 3 months if accepted.",
    "I understand that SancoDevs may contact me at the email address I've provided.",
];

export default function CareerApplyPage() {
    const searchParams = useSearchParams();
    const [state, setState] = useState<"idle" | "loading" | "sent" | "error">("idle");
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [role, setRole] = useState(searchParams.get("role") ?? ROLES[0]);
    const [experience, setExperience] = useState(EXPERIENCE_LEVELS[0]);
    const [why, setWhy] = useState("");
    const [github, setGithub] = useState("");
    const [portfolio, setPortfolio] = useState("");
    const [agreed, setAgreed] = useState(false);
    const [error, setError] = useState("");

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError("");
        if (!agreed) { setError("Please agree to the terms to continue."); return; }
        setState("loading");
        try {
            const res = await fetch("/api/careers/apply", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name, email, role, experience, why, github, portfolio, agreed }),
            });
            if (res.ok) setState("sent");
            else { const d = await res.json(); setError(d.error ?? "Something went wrong."); setState("idle"); }
        } catch {
            setError("Failed to submit. Please email us directly at sanansari0305@gmail.com");
            setState("idle");
        }
    }

    const inputStyle: React.CSSProperties = {
        width: "100%", padding: "9px 12px", borderRadius: "8px",
        border: "0.5px solid var(--border)", background: "var(--bg)",
        color: "var(--text)", fontSize: "13px", outline: "none",
        transition: "border-color 0.15s", boxSizing: "border-box",
        fontFamily: "inherit",
    };

    const selectStyle: React.CSSProperties = {
        ...inputStyle,
        cursor: "pointer", appearance: "none",
    };

    if (state === "sent") {
        return (
            <div style={{ minHeight: "80vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "2rem" }}>
                <div style={{
                    maxWidth: "480px", width: "100%", textAlign: "center",
                    padding: "3rem 2rem", borderRadius: "14px",
                    border: "0.5px solid var(--border)", background: "var(--surface)",
                    animation: "fadeUp 0.4s ease",
                }}>
                    <div style={{ fontSize: "40px", marginBottom: "1.25rem" }}>🎉</div>
                    <div style={{ width: "24px", height: "2px", background: "var(--accent)", margin: "0 auto 1.25rem" }} />
                    <h1 style={{ fontSize: "20px", fontWeight: 500, color: "var(--text)", marginBottom: "10px" }}>
                        Thank you for applying
                    </h1>
                    <p style={{ fontSize: "13px", color: "var(--muted)", lineHeight: 1.75, marginBottom: "1.5rem" }}>
                        We&apos;ve received your application for <strong style={{ color: "var(--text)" }}>{role}</strong>.
                        We review every application personally and will reach out to you at{" "}
                        <strong style={{ color: "var(--text)" }}>{email}  </strong> if there&apos;s a strong fit.
                        This usually takes up to a week.
                    </p>
                    <p style={{ fontSize: "12px", color: "var(--muted)", marginBottom: "1.5rem" }}>
                        A confirmation email has been sent to your inbox.
                    </p>
                    <Link href="/" style={{
                        display: "inline-block", padding: "9px 20px", borderRadius: "8px",
                        fontSize: "13px", background: "var(--accent)", color: "var(--bg)",
                        textDecoration: "none", fontWeight: 500,
                    }}>
                        Back to SancoDevs
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div style={{ maxWidth: "600px", margin: "0 auto", padding: "4rem 2rem 5rem" }}>
            <Link href="/careers" style={{ fontSize: "12px", color: "var(--muted)", textDecoration: "none", display: "block", marginBottom: "2rem" }}>
                ← Back to careers
            </Link>

            <div style={{ width: "24px", height: "2px", background: "var(--accent)", marginBottom: "1rem" }} />
            <h1 style={{ fontSize: "22px", fontWeight: 500, color: "var(--text)", marginBottom: "6px" }}>Apply to SancoDevs</h1>
            <p style={{ fontSize: "13px", color: "var(--muted)", marginBottom: "2rem", lineHeight: 1.6 }}>
                Fill in the details below. We read every application personally.
            </p>

            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>

                {/* Personal info */}
                <div style={{
                    padding: "1.25rem 1.5rem", borderRadius: "10px",
                    border: "0.5px solid var(--border)", background: "var(--surface)",
                }}>
                    <p style={{ fontSize: "12px", color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "1rem" }}>
                        Personal info
                    </p>
                    <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                        {[
                            { label: "Full name *", type: "text", value: name, setter: setName, placeholder: "Your full name" },
                            { label: "Email address *", type: "email", value: email, setter: setEmail, placeholder: "you@example.com" },
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
                    </div>
                </div>

                {/* Role details */}
                <div style={{
                    padding: "1.25rem 1.5rem", borderRadius: "10px",
                    border: "0.5px solid var(--border)", background: "var(--surface)",
                }}>
                    <p style={{ fontSize: "12px", color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "1rem" }}>
                        Role & experience
                    </p>
                    <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                        <div>
                            <label style={{ fontSize: "12px", color: "var(--muted)", display: "block", marginBottom: "5px" }}>Role applying for *</label>
                            <select value={role} onChange={e => setRole(e.target.value)} style={selectStyle}
                                onFocus={e => (e.currentTarget.style.borderColor = "var(--accent)")}
                                onBlur={e => (e.currentTarget.style.borderColor = "var(--border)")}
                            >
                                {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                            </select>
                        </div>
                        <div>
                            <label style={{ fontSize: "12px", color: "var(--muted)", display: "block", marginBottom: "5px" }}>Years of experience *</label>
                            <select value={experience} onChange={e => setExperience(e.target.value)} style={selectStyle}
                                onFocus={e => (e.currentTarget.style.borderColor = "var(--accent)")}
                                onBlur={e => (e.currentTarget.style.borderColor = "var(--border)")}
                            >
                                {EXPERIENCE_LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
                            </select>
                        </div>
                        <div>
                            <label style={{ fontSize: "12px", color: "var(--muted)", display: "block", marginBottom: "5px" }}>
                                Why do you want to join SancoDevs? *
                            </label>
                            <textarea
                                value={why} required rows={5}
                                placeholder="Tell us what excites you about this role and what you'd bring to the team..."
                                onChange={e => setWhy(e.target.value)}
                                style={{ ...inputStyle, resize: "vertical" }}
                                onFocus={e => (e.currentTarget.style.borderColor = "var(--accent)")}
                                onBlur={e => (e.currentTarget.style.borderColor = "var(--border)")}
                            />
                        </div>
                    </div>
                </div>

                {/* Links */}
                <div style={{
                    padding: "1.25rem 1.5rem", borderRadius: "10px",
                    border: "0.5px solid var(--border)", background: "var(--surface)",
                }}>
                    <p style={{ fontSize: "12px", color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "1rem" }}>
                        Links <span style={{ fontWeight: 400, textTransform: "none", letterSpacing: 0 }}>(optional but recommended)</span>
                    </p>
                    <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                        {[
                            { label: "GitHub profile", value: github, setter: setGithub, placeholder: "https://github.com/username" },
                            { label: "Portfolio / website", value: portfolio, setter: setPortfolio, placeholder: "https://yoursite.com" },
                        ].map(f => (
                            <div key={f.label}>
                                <label style={{ fontSize: "12px", color: "var(--muted)", display: "block", marginBottom: "5px" }}>{f.label}</label>
                                <input
                                    type="url" value={f.value} placeholder={f.placeholder}
                                    onChange={e => f.setter(e.target.value)}
                                    style={inputStyle}
                                    onFocus={e => (e.currentTarget.style.borderColor = "var(--accent)")}
                                    onBlur={e => (e.currentTarget.style.borderColor = "var(--border)")}
                                />
                            </div>
                        ))}
                    </div>
                </div>

                {/* Terms */}
                <div style={{
                    padding: "1.25rem 1.5rem", borderRadius: "10px",
                    border: "0.5px solid var(--border)", background: "var(--surface)",
                }}>
                    <p style={{ fontSize: "12px", color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "1rem" }}>
                        Terms & criteria
                    </p>
                    <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "1.25rem" }}>
                        {TERMS.map((term, i) => (
                            <div key={i} style={{ display: "flex", gap: "10px", alignItems: "flex-start" }}>
                                <div style={{
                                    width: "5px", height: "5px", borderRadius: "50%",
                                    background: "var(--muted)", marginTop: "7px", flexShrink: 0,
                                }} />
                                <p style={{ fontSize: "12px", color: "var(--muted)", lineHeight: 1.6 }}>{term}</p>
                            </div>
                        ))}
                    </div>
                    <label style={{ display: "flex", alignItems: "flex-start", gap: "10px", cursor: "pointer" }}>
                        <input
                            type="checkbox" checked={agreed} onChange={e => setAgreed(e.target.checked)}
                            style={{ marginTop: "2px", flexShrink: 0, cursor: "pointer" }}
                        />
                        <span style={{ fontSize: "13px", color: "var(--text)", lineHeight: 1.6 }}>
                            I have read and agree to the above terms and criteria.
                        </span>
                    </label>
                </div>

                {error && (
                    <p style={{ fontSize: "12px", color: "#e24b4a", padding: "10px 14px", borderRadius: "8px", border: "0.5px solid #e24b4a", background: "var(--surface)" }}>
                        {error}
                    </p>
                )}

                <button
                    type="submit"
                    disabled={state === "loading"}
                    style={{
                        padding: "11px", borderRadius: "8px", fontSize: "14px",
                        fontWeight: 500, background: "var(--accent)", color: "var(--bg)",
                        border: "none", cursor: state === "loading" ? "not-allowed" : "pointer",
                        opacity: state === "loading" ? 0.6 : 1, transition: "opacity 0.15s",
                    }}
                >
                    {state === "loading" ? "Submitting..." : "Submit application"}
                </button>
            </form>
        </div>
    );
}