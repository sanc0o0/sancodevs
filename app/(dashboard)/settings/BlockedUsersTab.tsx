"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface BlockedUser {
    id: string;
    name: string | null;
    email: string;
    image: string | null;
}

export default function BlockedUsersTab() {
    const [blocked, setBlocked] = useState<BlockedUser[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [unblocking, setUnblocking] = useState<string | null>(null);
    const [confirmId, setConfirmId] = useState<string | null>(null);

    useEffect(() => {
        fetch("/api/friends/blocked")
            .then(r => r.ok ? r.json() : [])
            .then(setBlocked)
            .catch(() => { })
            .finally(() => setLoading(false));
    }, []);

    async function unblock(targetId: string) {
        setUnblocking(targetId);
        const res = await fetch("/api/friends/block", {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ targetId }),
        });
        if (res.ok) {
            setBlocked(prev => prev.filter(u => u.id !== targetId));
            setConfirmId(null);
        }
        setUnblocking(null);
    }

    function getColor(name: string) {
        const colors = ["bg-orange-500", "bg-blue-500", "bg-green-500", "bg-purple-500", "bg-pink-500", "bg-teal-500"];
        return colors[(name.charCodeAt(0) + (name.charCodeAt(1) || 0)) % colors.length];
    }

    const filtered = blocked.filter(u =>
        u.name?.toLowerCase().includes(search.toLowerCase()) ||
        u.email.toLowerCase().includes(search.toLowerCase())
    );

    if (loading) return (
        <div className="flex flex-col gap-3">
            {[1, 2].map(i => <div key={i} className="h-14 rounded-xl bg-[var(--surface2)] animate-pulse" />)}
        </div>
    );

    return (
        <div>
            <p className="text-xs text-[var(--muted)] mb-4">
                Blocked users cannot message you, send friend requests, or view your profile.
            </p>

            {blocked.length > 0 && (
                <input
                    className="form-input text-sm mb-4"
                    type="text"
                    placeholder="Search blocked users..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    aria-label="Search blocked users"
                />
            )}

            {filtered.length === 0 ? (
                <div className="text-center py-10">
                    <p className="text-sm text-[var(--muted)]">
                        {blocked.length === 0 ? "No blocked users" : "No results"}
                    </p>
                </div>
            ) : (
                <div className="flex flex-col gap-2">
                    {filtered.map(u => (
                        <div key={u.id} className="flex items-center gap-3 p-3 rounded-xl border border-[var(--border)] bg-[var(--surface)]">
                            <Link href={`/user/${u.id}`} className="no-underline flex-shrink-0">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white overflow-hidden ${getColor(u.name ?? "?")}`}>
                                    {u.image
                                        ? <img src={u.image} alt="" className="w-full h-full object-cover" />
                                        : u.name?.charAt(0).toUpperCase()
                                    }
                                </div>
                            </Link>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-[var(--text)] truncate">{u.name ?? "Unknown"}</p>
                                <p className="text-[10px] text-[var(--muted)] truncate">{u.email}</p>
                            </div>

                            {confirmId === u.id ? (
                                <div className="flex gap-1.5 flex-shrink-0">
                                    <button
                                        onClick={() => unblock(u.id)}
                                        disabled={unblocking === u.id}
                                        aria-label="Confirm unblock"
                                        className="text-xs px-2.5 py-1.5 rounded-lg bg-[var(--accent)] text-[var(--bg)] border-none cursor-pointer font-medium disabled:opacity-50"
                                    >
                                        {unblocking === u.id ? "..." : "Confirm"}
                                    </button>
                                    <button
                                        onClick={() => setConfirmId(null)}
                                        className="text-xs px-2.5 py-1.5 rounded-lg border border-[var(--border)] text-[var(--muted)] bg-transparent cursor-pointer"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            ) : (
                                <button
                                    onClick={() => setConfirmId(u.id)}
                                    aria-label={`Unblock ${u.name}`}
                                    className="text-xs px-3 py-1.5 rounded-lg border border-[var(--border)] text-[var(--muted)] bg-transparent cursor-pointer hover:border-[var(--accent)] hover:text-[var(--text)] transition-colors flex-shrink-0"
                                >
                                    Unblock
                                </button>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}