"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

const ROLES = ["Full-stack Developer", "Content Writer", "Community Manager"];
const EXPERIENCE_LEVELS = ["Less than 1 year", "1–2 years", "2–4 years", "4+ years"];
const TERMS = [
    "I am applying in good faith and the information I've provided is accurate.",
    "I understand this is an early-stage startup and roles may be part-time or unpaid initially.",
    "I am willing to commit to a minimum of 3 months if accepted.",
    "I understand that SancoDevs may contact me at the email address I've provided.",
];

export default function CareerApplyForm() {
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
    const [resumeFile, setResumeFile] = useState<File | null>(null);
    const [resumeUploading, setResumeUploading] = useState(false);
    const [resumeUrl, setResumeUrl] = useState("");

    async function handleResumeChange(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        if (!file) return;
        if (file.size > 5 * 1024 * 1024) {
            setError("Resume must be under 5MB."); return;
        }
        setResumeFile(file);
        setResumeUploading(true);
        setError("");
        try {
            const fd = new FormData();
            fd.append("resume", file);
            const res = await fetch("/api/upload/resume", { method: "POST", body: fd });
            const data = await res.json();
            if (!res.ok) { setError(data.error ?? "Upload failed."); setResumeFile(null); }
            else setResumeUrl(data.url);
        } catch {
            setError("Failed to upload resume.");
            setResumeFile(null);
        }
        setResumeUploading(false);
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError("");
        if (!agreed) { setError("Please agree to the terms to continue."); return; }
        if (resumeUploading) { setError("Please wait for resume to finish uploading."); return; }
        setState("loading");
        try {
            const res = await fetch("/api/careers/apply", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name, email, role, experience, why, github, portfolio, agreed, resumeUrl: resumeUrl || null }),
            });
            if (res.ok) setState("sent");
            else { const d = await res.json(); setError(d.error ?? "Something went wrong."); setState("idle"); }
        } catch {
            setError("Failed to submit. Please email us directly at sanansari0305@gmail.com");
            setState("idle");
        }
    }

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
                        We&apos;ve received your application for{" "}
                        <strong style={{ color: "var(--text)" }}>{role}</strong>.
                        We&apos;ll reach out at <strong style={{ color: "var(--text)" }}>{email}</strong> if there&apos;s a fit.
                    </p>
                    <Link href="/" style={{
                        display: "inline-block", padding: "9px 20px", borderRadius: "8px",
                        fontSize: "13px", background: "var(--accent)", color: "var(--bg)",
                        textDecoration: "none", fontWeight: 500,
                    }}>Back to SancoDevs</Link>
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
                <Section title="Personal info">
                    <Field label="Full name *">
                        <input className="form-input" type="text" value={name} required placeholder="Your full name" onChange={e => setName(e.target.value)} />
                    </Field>
                    <Field label="Email address *">
                        <input className="form-input" type="email" value={email} required placeholder="you@example.com" onChange={e => setEmail(e.target.value)} />
                    </Field>
                </Section>

                {/* Role */}
                <Section title="Role & experience">
                    <Field label="Role applying for *">
                        <select id="role-select" title="Role applying for" aria-label="Role applying for" value={role} onChange={e => setRole(e.target.value)} className="form-select">
                            {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                        </select>
                    </Field>
                    <Field label="Years of experience *">
                        <select id="experience-select" title="Years of experience" aria-label="Years of experience" value={experience} onChange={e => setExperience(e.target.value)} className="form-select">
                            {EXPERIENCE_LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
                        </select>
                    </Field>
                    <Field label="Why do you want to join SancoDevs? *">
                        <textarea
                            className="form-input" value={why} required rows={5}
                            placeholder="Tell us what excites you about this role..."
                            onChange={e => setWhy(e.target.value)}
                            style={{ resize: "vertical" }}
                        />
                    </Field>
                </Section>

                {/* Resume */}
                <Section title="Resume *">
                    <div style={{
                        border: `0.5px dashed ${resumeFile ? "var(--accent)" : "var(--border)"}`,
                        borderRadius: "8px", padding: "1.25rem",
                        textAlign: "center", transition: "border-color 0.15s",
                        background: "var(--bg)",
                    }}>
                        {resumeFile ? (
                            <div>
                                <p style={{ fontSize: "13px", color: "var(--text)", marginBottom: "4px" }}>
                                    {resumeUploading ? "Uploading..." : "✓ " + resumeFile.name}
                                </p>
                                {!resumeUploading && (
                                    <button type="button" onClick={() => { setResumeFile(null); setResumeUrl(""); }}
                                        style={{ fontSize: "11px", color: "var(--muted)", background: "none", border: "none", cursor: "pointer" }}>
                                        Remove
                                    </button>
                                )}
                            </div>
                        ) : (
                            <label htmlFor="resume-upload" style={{ cursor: "pointer" }}>
                                <div style={{ fontSize: "22px", marginBottom: "6px" }}>📄</div>
                                <p style={{ fontSize: "13px", color: "var(--text)", marginBottom: "3px" }}>
                                    Click to upload resume
                                </p>
                                <p style={{ fontSize: "11px", color: "var(--muted)" }}>PDF or Word · Max 5MB</p>
                                <input
                                    id="resume-upload"
                                    type="file"
                                    accept=".pdf,.doc,.docx"
                                    onChange={handleResumeChange}
                                    style={{ display: "none" }}
                                />
                            </label>
                        )}
                    </div>
                </Section>

                {/* Links */}
                <Section title="Links (optional)">
                    <Field label="GitHub profile">
                        <input className="form-input" type="url" value={github} placeholder="https://github.com/username" onChange={e => setGithub(e.target.value)} />
                    </Field>
                    <Field label="Portfolio / website">
                        <input className="form-input" type="url" value={portfolio} placeholder="https://yoursite.com" onChange={e => setPortfolio(e.target.value)} />
                    </Field>
                </Section>

                {/* Terms */}
                <Section title="Terms & criteria">
                    <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "1.25rem" }}>
                        {TERMS.map((term, i) => (
                            <div key={i} style={{ display: "flex", gap: "10px", alignItems: "flex-start" }}>
                                <div style={{ width: "5px", height: "5px", borderRadius: "50%", background: "var(--muted)", marginTop: "7px", flexShrink: 0 }} />
                                <p style={{ fontSize: "12px", color: "var(--muted)", lineHeight: 1.6 }}>{term}</p>
                            </div>
                        ))}
                    </div>
                    <label style={{ display: "flex", alignItems: "flex-start", gap: "10px", cursor: "pointer" }}>
                        <input type="checkbox" checked={agreed} onChange={e => setAgreed(e.target.checked)} style={{ marginTop: "2px", flexShrink: 0 }} />
                        <span style={{ fontSize: "13px", color: "var(--text)", lineHeight: 1.6 }}>
                            I have read and agree to the above terms and criteria.
                        </span>
                    </label>
                </Section>

                {error && (
                    <p style={{ fontSize: "12px", color: "#e24b4a", padding: "10px 14px", borderRadius: "8px", border: "0.5px solid #e24b4a" }}>
                        {error}
                    </p>
                )}

                <button type="submit" disabled={state === "loading" || resumeUploading} style={{
                    padding: "11px", borderRadius: "8px", fontSize: "14px",
                    fontWeight: 500, background: "var(--accent)", color: "var(--bg)",
                    border: "none", cursor: (state === "loading" || resumeUploading) ? "not-allowed" : "pointer",
                    opacity: (state === "loading" || resumeUploading) ? 0.6 : 1,
                }}>
                    {state === "loading" ? "Submitting..." : resumeUploading ? "Uploading resume..." : "Submit application"}
                </button>
            </form>
        </div>
    );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <div style={{ padding: "1.25rem 1.5rem", borderRadius: "10px", border: "0.5px solid var(--border)", background: "var(--surface)" }}>
            <p style={{ fontSize: "11px", color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "1rem" }}>{title}</p>
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>{children}</div>
        </div>
    );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <div>
            <label style={{ fontSize: "12px", color: "var(--muted)", display: "block", marginBottom: "5px" }}>{label}</label>
            {children}
        </div>
    );
}