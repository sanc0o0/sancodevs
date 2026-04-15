"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function CreateGroupButton() {
    const router = useRouter();
    const [open, setOpen] = useState(false);
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [emails, setEmails] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError(""); setLoading(true);
        try {
            const res = await fetch("/api/community/groups", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name, description,
                    emails: emails.split(",").map(e => e.trim()).filter(Boolean),
                }),
            });
            if (res.ok) {
                const data = await res.json();
                setOpen(false); setName(""); setDescription(""); setEmails("");
                router.push(`/community/${data.id}`);
            } else {
                const d = await res.json(); setError(d.error ?? "Failed.");
            }
        } catch { setError("Something went wrong."); }
        setLoading(false);
    }

    if (!open) {
        return (
            <button onClick={() => setOpen(true)} style={{
                padding: "8px 16px", borderRadius: "7px", fontSize: "13px",
                background: "var(--accent)", color: "var(--bg)",
                fontWeight: 500, border: "none", cursor: "pointer",
                display: "inline-flex", alignItems: "center", gap: "6px",
            }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
                </svg>
                New group
            </button>
        );
    }

    return (
        <div style={{
            position: "fixed", inset: 0, zIndex: 80,
            background: "rgba(0,0,0,0.5)",
            display: "flex", alignItems: "center", justifyContent: "center",
            padding: "1rem",
        }}>
            <div style={{
                width: "100%", maxWidth: "480px", borderRadius: "14px",
                border: "0.5px solid var(--border)", background: "var(--surface)",
                padding: "2rem", animation: "fadeUp 0.2s ease",
            }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
                    <h2 style={{ fontSize: "17px", fontWeight: 500, color: "var(--text)" }}>Create a group</h2>
                    <button onClick={() => setOpen(false)} style={{ background: "none", border: "none", color: "var(--muted)", cursor: "pointer", fontSize: "18px" }}>×</button>
                </div>
                <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                    {[
                        { label: "Group name *", value: name, setter: setName, placeholder: "e.g. Next.js builders", type: "text", required: true },
                        { label: "Description", value: description, setter: setDescription, placeholder: "What's this group about?", type: "text", required: false },
                    ].map(f => (
                        <div key={f.label}>
                            <label style={{ fontSize: "12px", color: "var(--muted)", display: "block", marginBottom: "5px" }}>{f.label}</label>
                            <input
                                className="form-input" type={f.type} value={f.value} required={f.required}
                                placeholder={f.placeholder} onChange={e => f.setter(e.target.value)}
                            />
                        </div>
                    ))}
                    <div>
                        <label style={{ fontSize: "12px", color: "var(--muted)", display: "block", marginBottom: "5px" }}>
                            Invite members by email (comma separated)
                        </label>
                        <textarea
                            className="form-input" value={emails} rows={2}
                            placeholder="friend@example.com, colleague@example.com"
                            onChange={e => setEmails(e.target.value)}
                            style={{ resize: "none" }}
                        />
                    </div>
                    {error && <p style={{ fontSize: "12px", color: "#e24b4a" }}>{error}</p>}
                    <div style={{ display: "flex", gap: "8px", marginTop: "4px" }}>
                        <button type="button" onClick={() => setOpen(false)} style={{
                            flex: 1, padding: "9px", borderRadius: "8px", fontSize: "13px",
                            border: "0.5px solid var(--border)", background: "transparent", color: "var(--muted)", cursor: "pointer",
                        }}>Cancel</button>
                        <button type="submit" disabled={loading} style={{
                            flex: 1, padding: "9px", borderRadius: "8px", fontSize: "13px",
                            fontWeight: 500, background: "var(--accent)", color: "var(--bg)",
                            border: "none", cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.6 : 1,
                        }}>
                            {loading ? "Creating..." : "Create group"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}