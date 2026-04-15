"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function JoinGroupButton({ groupId, groupName }: { groupId: string; groupName: string }) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);

    async function join() {
        setLoading(true);
        await fetch("/api/community/groups/join", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ groupId }),
        });
        setLoading(false);
        router.refresh();
    }

    return (
        <button onClick={join} disabled={loading} style={{
            padding: "7px 16px", borderRadius: "7px", fontSize: "12px",
            border: "0.5px solid var(--border)", background: "var(--surface2)",
            color: "var(--muted)", cursor: loading ? "not-allowed" : "pointer",
            opacity: loading ? 0.6 : 1, whiteSpace: "nowrap",
        }}>
            {loading ? "..." : "Join"}
        </button>
    );
}