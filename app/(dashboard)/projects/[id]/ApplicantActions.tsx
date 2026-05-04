"use client";

import { useState } from "react";

interface Props {
    applicationId: string;
    userId: string;
    projectId: string;
    currentStatus: string;
    userName: string;
    userEmail: string;
    projectTitle: string;
    onResponded?: () => void; // ← NEW: called after accept or reject so parent can remove the row
}

export default function ApplicantActions({
    applicationId,
    userId,
    projectId,
    currentStatus,
    userName,
    userEmail,
    projectTitle,
    onResponded,
}: Props) {
    const [status, setStatus] = useState(currentStatus);
    const [loading, setLoading] = useState<"accept" | "reject" | null>(null);

    async function respond(action: "accept" | "reject") {
        setLoading(action);
        const res = await fetch("/api/projects/applications", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                applicationId,
                action,
                userId,
                projectId,
                userName,
                userEmail,
                projectTitle,
            }),
        });

        if (res.ok) {
            setStatus(action === "accept" ? "ACCEPTED" : "REJECTED");
            // Remove row from parent after short delay so user sees the feedback
            setTimeout(() => onResponded?.(), 600);
        }

        setLoading(null);
    }

    // Already responded — show brief status badge (will disappear when row is removed)
    if (status === "ACCEPTED") {
        return (
            <span style={{
                fontSize: "11px", padding: "4px 10px", borderRadius: "6px",
                background: "rgba(34,197,94,0.1)", color: "#22c55e",
                border: "0.5px solid rgba(34,197,94,0.25)",
                fontWeight: 500, flexShrink: 0,
            }}>
                Accepted
            </span>
        );
    }

    if (status === "REJECTED") {
        return (
            <span style={{
                fontSize: "11px", padding: "4px 10px", borderRadius: "6px",
                background: "rgba(239,68,68,0.08)", color: "#ef4444",
                border: "0.5px solid rgba(239,68,68,0.2)",
                fontWeight: 500, flexShrink: 0,
            }}>
                Rejected
            </span>
        );
    }

    return (
        <div style={{ display: "flex", gap: "6px", flexShrink: 0 }}>
            <button
                onClick={() => respond("reject")}
                disabled={loading !== null}
                style={{
                    padding: "5px 12px", borderRadius: "7px", fontSize: "12px",
                    border: "0.5px solid var(--border)", background: "transparent",
                    color: "var(--muted)", cursor: "pointer",
                    opacity: loading !== null ? 0.5 : 1,
                    transition: "all 0.15s ease",
                }}
            >
                {loading === "reject" ? "···" : "Reject"}
            </button>
            <button
                onClick={() => respond("accept")}
                disabled={loading !== null}
                style={{
                    padding: "5px 12px", borderRadius: "7px", fontSize: "12px",
                    border: "none", background: "var(--accent)",
                    color: "var(--bg)", cursor: "pointer", fontWeight: 500,
                    opacity: loading !== null ? 0.5 : 1,
                    transition: "all 0.15s ease",
                }}
            >
                {loading === "accept" ? "···" : "Accept"}
            </button>
        </div>
    );
}