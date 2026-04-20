"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface Friend {
    id: string;
    name: string | null;
    email: string;
    image: string | null;
    friendshipId: string;
}

export default function FriendsTab() {
    const [friends, setFriends] = useState<Friend[]>([]);
    const [loading, setLoading] = useState(true);
    const [removing, setRemoving] = useState<string | null>(null);
    const [blocking, setBlocking] = useState<string | null>(null);

    useEffect(() => {
        fetch("/api/friends/list")
            .then(r => r.ok ? r.json() : [])
            .then(setFriends)
            .catch(() => { })
            .finally(() => setLoading(false));
    }, []);

    async function removeFriend(friendId: string) {
        setRemoving(friendId);
        const res = await fetch("/api/friends/list", {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ friendId }),
        });
        if (res.ok) setFriends(prev => prev.filter(f => f.id !== friendId));
        setRemoving(null);
    }

    async function blockUser(friendId: string) {
        setBlocking(friendId);
        const res = await fetch("/api/friends/block", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ targetId: friendId }),
        });
        if (res.ok) setFriends(prev => prev.filter(f => f.id !== friendId));
        setBlocking(null);
    }

    function getColor(name: string) {
        const colors = ["bg-orange-500", "bg-blue-500", "bg-green-500", "bg-purple-500", "bg-pink-500", "bg-teal-500"];
        return colors[(name.charCodeAt(0) + (name.charCodeAt(1) || 0)) % colors.length];
    }

    if (loading) return (
        <div className="flex flex-col gap-3">
            {[1, 2, 3].map(i => (
                <div key={i} className="h-16 rounded-xl bg-[var(--surface2)] animate-pulse" />
            ))}
        </div>
    );

    if (friends.length === 0) return (
        <div className="text-center py-12">
            <p className="text-sm text-[var(--muted)]">No friends yet</p>
            <p className="text-xs text-[var(--muted)] mt-1">Visit someone&apos;s profile to send a friend request</p>
        </div>
    );

    return (
        <div className="flex flex-col gap-2">
            <p className="text-xs text-[var(--muted)] mb-2">{friends.length} friend{friends.length !== 1 ? "s" : ""} — visible only to you</p>
            {friends.map(f => (
                <div key={f.id} className="flex items-center gap-3 p-3 rounded-xl border border-[var(--border)] bg-[var(--surface)]">
                    <Link href={`/user/${f.id}`} className="no-underline flex-shrink-0">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white overflow-hidden ${getColor(f.name ?? "?")}`}>
                            {f.image
                                ? <img src={f.image} alt="" className="w-full h-full object-cover" />
                                : f.name?.charAt(0).toUpperCase()
                            }
                        </div>
                    </Link>
                    <div className="flex-1 min-w-0">
                        <Link href={`/user/${f.id}`} className="no-underline">
                            <p className="text-sm font-medium text-[var(--text)] truncate hover:underline">{f.name}</p>
                        </Link>
                        <p className="text-[10px] text-[var(--muted)] truncate">{f.email}</p>
                    </div>
                    <div className="flex gap-2 flex-shrink-0">
                        <button
                            onClick={() => removeFriend(f.id)}
                            disabled={removing === f.id}
                            aria-label={`Remove ${f.name} as friend`}
                            className="text-xs px-2.5 py-1.5 rounded-lg border border-[var(--border)] text-[var(--muted)] bg-transparent cursor-pointer hover:border-[var(--text)] hover:text-[var(--text)] transition-colors disabled:opacity-50"
                        >
                            {removing === f.id ? "..." : "Remove"}
                        </button>
                        <button
                            onClick={() => blockUser(f.id)}
                            disabled={blocking === f.id}
                            aria-label={`Block ${f.name}`}
                            className="text-xs px-2.5 py-1.5 rounded-lg border border-red-500/20 text-red-400 bg-transparent cursor-pointer hover:bg-red-500/10 transition-colors disabled:opacity-50"
                        >
                            {blocking === f.id ? "..." : "Block"}
                        </button>
                    </div>
                </div>
            ))}
        </div>
    );
}