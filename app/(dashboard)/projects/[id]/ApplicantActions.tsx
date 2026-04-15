"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Props {
    applicationId: string;
    userId: string;
    projectId: string;
    currentStatus: string;
    userName: string;
    userEmail: string;
    projectTitle: string;
}

export default function ApplicantActions({ applicationId, userId, projectId, currentStatus, userName, projectTitle }: Props) {
    const router = useRouter();
    const [loading, setLoading] = useState<"accept" | "reject" | null>(null);
    const [rejectOpen, setRejectOpen] = useState(false);
    const [rejectMessage, setRejectMessage] = useState("");

    if (currentStatus === "ACCEPTED") {
        return <span style={{ fontSize: "11px", color: "#22c55e", padding: "4px 10px", borderRadius: "20px", border: "0.5px solid #22c55e" }}>Accepted</span>;
    }
    if (currentStatus === "REJECTED") {
        return <span style={{ fontSize: "11px", color: "#666", padding: "4px 10px", borderRadius: "20px", border: "0.5px solid var(--border)" }}>Rejected</span>;
    }

    async function handle(action: "accept" | "reject") {
        setLoading(action);
        await fetch("/api/projects/applications", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                applicationId, action, projectId, userId,
                message: action === "reject" ? rejectMessage : undefined,
                projectTitle, userName,
            }),
        });
        setLoading(null);
        setRejectOpen(false);
        router.refresh();
    }

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: "6px", alignItems: "flex-end" }}>
            <div style={{ display: "flex", gap: "6px" }}>
                <button
                    onClick={() => handle("accept")}
                    disabled={loading !== null}
                    style={{
                        padding: "6px 14px", borderRadius: "7px", fontSize: "12px",
                        background: "#22c55e", color: "#fff", border: "none",
                        cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.6 : 1,
                    }}
                >
                    {loading === "accept" ? "..." : "Accept"}
                </button>
                <button
                    onClick={() => setRejectOpen(o => !o)}
                    disabled={loading !== null}
                    style={{
                        padding: "6px 14px", borderRadius: "7px", fontSize: "12px",
                        border: "0.5px solid var(--border)", background: "transparent",
                        color: "var(--muted)", cursor: loading ? "not-allowed" : "pointer",
                    }}
                >
                    Reject
                </button>
            </div>
            {rejectOpen && (
                <div style={{ display: "flex", flexDirection: "column", gap: "6px", width: "100%" }}>
                    <textarea
                        value={rejectMessage}
                        onChange={e => setRejectMessage(e.target.value)}
                        placeholder="Optional message to the applicant..."
                        rows={2}
                        className="form-input"
                        style={{ resize: "none", fontSize: "12px" }}
                    />
                    <button
                        onClick={() => handle("reject")}
                        disabled={loading !== null}
                        style={{
                            padding: "6px", borderRadius: "7px", fontSize: "12px",
                            background: "#e24b4a", color: "#fff", border: "none",
                            cursor: loading ? "not-allowed" : "pointer",
                        }}
                    >
                        {loading === "reject" ? "..." : "Confirm rejection"}
                    </button>
                </div>
            )}
        </div>
    );
}