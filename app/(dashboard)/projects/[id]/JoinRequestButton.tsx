"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function JoinRequestButton({ projectId, projectTitle }: { projectId: string; projectTitle: string }) {
    const router = useRouter();
    const [open, setOpen] = useState(false);
    const [message, setMessage] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setLoading(true);
        setError("");
        try {
            const res = await fetch("/api/projects/apply", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ projectId, message }),
            });
            if (res.ok) { setOpen(false); router.refresh(); }
            else { const d = await res.json(); setError(d.error ?? "Failed to send request."); }
        } catch {
            setError("Something went wrong.");
        }
        setLoading(false);
    }

    if (!open) {
        return (
            <button onClick={() => setOpen(true)} style={{
                width: "100%", padding: "9px", borderRadius: "8px", fontSize: "13px",
                fontWeight: 500, background: "var(--accent)", color: "var(--bg)",
                border: "none", cursor: "pointer",
            }}>
                Request to join
            </button>
        );
    }

    return (
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            <textarea
                value={message}
                onChange={e => setMessage(e.target.value)}
                placeholder="Tell the owner why you want to join and what you bring to the project..."
                rows={3}
                className="form-input"
                style={{ resize: "none" }}
            />
            {error && <p style={{ fontSize: "12px", color: "#e24b4a" }}>{error}</p>}
            <div style={{ display: "flex", gap: "8px" }}>
                <button type="button" onClick={() => setOpen(false)} style={{
                    flex: 1, padding: "8px", borderRadius: "7px", fontSize: "13px",
                    border: "0.5px solid var(--border)", background: "transparent",
                    color: "var(--muted)", cursor: "pointer",
                }}>Cancel</button>
                <button type="submit" disabled={loading} style={{
                    flex: 1, padding: "8px", borderRadius: "7px", fontSize: "13px",
                    fontWeight: 500, background: "var(--accent)", color: "var(--bg)",
                    border: "none", cursor: loading ? "not-allowed" : "pointer",
                    opacity: loading ? 0.6 : 1,
                }}>
                    {loading ? "Sending..." : "Send request"}
                </button>
            </div>
        </form>
    );
}