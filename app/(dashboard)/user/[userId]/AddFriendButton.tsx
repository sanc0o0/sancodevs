"use client";

import { useState, useEffect } from "react";

type FriendState = "NONE" | "REQUESTED" | "PENDING_ACTION" | "ADDED" | "BLOCKED";

export default function AddFriendButton({ targetUserId }: { targetUserId: string }) {
    const [status, setStatus] = useState<FriendState>("NONE");
    const [loading, setLoading] = useState(true);
    const [acting, setActing] = useState(false);

    useEffect(() => {
        fetch(`/api/friends/status?userId=${targetUserId}`)
            .then(r => r.ok ? r.json() : { status: "NONE" })
            .then(d => setStatus(d.status))
            .catch(() => { })
            .finally(() => setLoading(false));
    }, [targetUserId]);

    async function sendRequest() {
        setActing(true);
        const res = await fetch("/api/friends/request", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ targetUserId }),
        });
        if (res.ok) setStatus("REQUESTED");
        setActing(false);
    }

    async function respond(action: "accept" | "reject") {
        setActing(true);
        const res = await fetch("/api/friends/respond", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ senderId: targetUserId, action }),
        });
        if (res.ok) {
            setStatus(action === "accept" ? "ADDED" : "NONE");
        }
        setActing(false);
    }

    if (loading) {
        return <div className="w-24 h-8 rounded-lg bg-[var(--surface2)] animate-pulse" />;
    }

    if (status === "ADDED") {
        return (
            <span className="text-xs px-3 py-1.5 rounded-lg border border-green-500/30 text-green-400 bg-green-500/10 font-medium">
                Friends ✓
            </span>
        );
    }

    if (status === "REQUESTED") {
        return (
            <span className="text-xs px-3 py-1.5 rounded-lg border border-[var(--border)] text-[var(--muted)] bg-[var(--surface2)]">
                Requested
            </span>
        );
    }

    // Receiver sees Accept / Reject
    if (status === "PENDING_ACTION") {
        return (
            <div className="flex gap-2">
                <button
                    onClick={() => respond("accept")}
                    disabled={acting}
                    aria-label="Accept friend request"
                    className="text-xs px-3 py-1.5 rounded-lg bg-[var(--accent)] text-[var(--bg)] border-none cursor-pointer font-medium disabled:opacity-60 hover:opacity-85 transition-opacity"
                >
                    {acting ? "..." : "Accept"}
                </button>
                <button
                    onClick={() => respond("reject")}
                    disabled={acting}
                    aria-label="Reject friend request"
                    className="text-xs px-3 py-1.5 rounded-lg border border-[var(--border)] text-[var(--muted)] bg-transparent cursor-pointer disabled:opacity-60"
                >
                    Reject
                </button>
            </div>
        );
    }

    if (status === "BLOCKED") return null;

    return (
        <button
            onClick={sendRequest}
            disabled={acting}
            aria-label="Send friend request"
            className="text-xs px-3 py-1.5 rounded-lg bg-[var(--accent)] text-[var(--bg)] border-none cursor-pointer font-medium disabled:opacity-60 hover:opacity-85 transition-opacity"
        >
            {acting ? "..." : "+ Add Friend"}
        </button>
    );
}