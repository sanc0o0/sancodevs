"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function BlockButton({ targetUserId, isBlocked }: { targetUserId: string; isBlocked: boolean }) {
    const router = useRouter();
    const [blocked, setBlocked] = useState(isBlocked);
    const [confirming, setConfirming] = useState(false);
    const [acting, setActing] = useState(false);

    async function block() {
        setActing(true);
        const res = await fetch("/api/friends/block", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ targetId: targetUserId }),
        });
        if (res.ok) {
            setBlocked(true);
            setConfirming(false);
            router.refresh();
        }
        setActing(false);
    }

    async function unblock() {
        setActing(true);
        const res = await fetch("/api/friends/block", {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ targetId: targetUserId }),
        });
        if (res.ok) {
            setBlocked(false);
            router.refresh();
        }
        setActing(false);
    }

    if (blocked) {
        return (
            <button
                onClick={unblock}
                disabled={acting}
                aria-label="Unblock user"
                className="text-xs px-3 py-1.5 rounded-lg border border-red-500/30 text-red-400 bg-transparent cursor-pointer hover:bg-red-500/10 transition-colors disabled:opacity-50"
            >
                {acting ? "..." : "Unblock"}
            </button>
        );
    }

    if (confirming) {
        return (
            <div className="flex flex-col gap-1">
                <p className="text-[10px] text-[var(--muted)]">Block this user?</p>
                <div className="flex gap-1">
                    <button
                        onClick={block}
                        disabled={acting}
                        className="flex-1 text-xs py-1 rounded-lg bg-red-500 text-white border-none cursor-pointer disabled:opacity-50"
                    >
                        {acting ? "..." : "Yes"}
                    </button>
                    <button
                        onClick={() => setConfirming(false)}
                        className="flex-1 text-xs py-1 rounded-lg border border-[var(--border)] bg-transparent text-[var(--muted)] cursor-pointer"
                    >
                        No
                    </button>
                </div>
            </div>
        );
    }

    return (
        <button
            onClick={() => setConfirming(true)}
            aria-label="Block user"
            className="text-xs px-3 py-1.5 rounded-lg border border-[var(--border)] text-[var(--muted)] bg-transparent cursor-pointer hover:border-red-500/50 hover:text-red-400 transition-colors"
        >
            Block
        </button>
    );
}