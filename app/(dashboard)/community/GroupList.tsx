"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type GroupSummary = {
    id: string;
    name: string;
    description: string | null;
    isPrivate: boolean;
    memberCount: number;
    muted: boolean;
    pinned: boolean;
    lastMessage: {
        senderName: string | null;
        content: string | null;
        createdAt: string;
    } | null;
};

type DiscoverGroup = {
    id: string;
    name: string;
    description: string | null;
    isPrivate: boolean;
    memberCount: number;
};

interface Props {
    groups: GroupSummary[];
    discoverGroups: DiscoverGroup[];
    activeGroupId: string | null;
    onSelectGroup: (id: string) => void;
    onGroupCreated: (g: GroupSummary) => void;
    currentUserId: string;
}

export default function GroupList({
    groups, discoverGroups, activeGroupId, onSelectGroup, onGroupCreated, currentUserId,
}: Props) {
    const router = useRouter();
    const [search, setSearch] = useState("");
    const [creating, setCreating] = useState(false);
    const [newName, setNewName] = useState("");
    const [newDesc, setNewDesc] = useState("");
    const [newPrivate, setNewPrivate] = useState(false);
    const [newEmails, setNewEmails] = useState("");
    const [saving, setSaving] = useState(false);
    const [tab, setTab] = useState<"chats" | "discover">("chats");

    const filtered = groups.filter(g =>
        g.name.toLowerCase().includes(search.toLowerCase())
    );

    const pinned = filtered.filter(g => g.pinned);
    const rest = filtered.filter(g => !g.pinned);

    async function createGroup(e: React.FormEvent) {
        e.preventDefault();
        if (!newName.trim()) return;
        setSaving(true);
        const res = await fetch("/api/community/groups", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                name: newName.trim(),
                description: newDesc.trim() || null,
                isPrivate: newPrivate,
                emails: newEmails.split(",").map(e => e.trim()).filter(Boolean),
            }),
        });
        if (res.ok) {
            const data = await res.json();
            onGroupCreated({
                id: data.id,
                name: data.name,
                description: data.description,
                isPrivate: data.isPrivate,
                memberCount: 1,
                muted: false,
                pinned: false,
                lastMessage: null,
            });
            setCreating(false);
            setNewName(""); setNewDesc(""); setNewPrivate(false); setNewEmails("");
        }
        setSaving(false);
    }

    async function joinGroup(groupId: string) {
        await fetch("/api/community/groups/join", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ groupId }),
        });
        router.refresh();
    }

    function timeAgo(iso: string) {
        const diff = Date.now() - new Date(iso).getTime();
        const mins = Math.floor(diff / 60000);
        if (mins < 1) return "now";
        if (mins < 60) return `${mins}m`;
        const hrs = Math.floor(mins / 60);
        if (hrs < 24) return `${hrs}h`;
        return `${Math.floor(hrs / 24)}d`;
    }

    function getInitial(name: string) {
        return name.charAt(0).toUpperCase();
    }

    function getAvatarColor(name: string) {
        const colors = ["bg-orange-500", "bg-blue-500", "bg-green-500", "bg-purple-500", "bg-pink-500", "bg-teal-500"];
        return colors[name.charCodeAt(0) % colors.length];
    }

    return (
        <div className="flex flex-col h-full">
            {/* Header */}
            <div className="flex-shrink-0 px-4 pt-4 pb-2">
                <div className="flex items-center justify-between mb-3">
                    <h2 className="text-base font-semibold text-[var(--text)]">Messages</h2>
                    <button
                        onClick={() => setCreating(true)}
                        className="w-7 h-7 rounded-lg flex items-center justify-center text-[var(--muted)] hover:text-[var(--text)] hover:bg-[var(--surface2)] transition-colors border-none bg-transparent cursor-pointer"
                        title="New group"
                    >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
                        </svg>
                    </button>
                </div>

                {/* Search */}
                <div className="relative mb-3">
                    <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--muted)]" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
                    </svg>
                    <input
                        type="text"
                        placeholder="Search"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        className="w-full pl-8 pr-3 py-1.5 text-sm bg-[var(--surface2)] rounded-lg border border-transparent focus:border-[var(--border)] outline-none text-[var(--text)] placeholder:text-[var(--muted)] transition-colors"
                    />
                </div>

                {/* Tabs */}
                <div className="flex gap-1">
                    {(["chats", "discover"] as const).map(t => (
                        <button key={t} onClick={() => setTab(t)} className={`flex-1 py-1 rounded-lg text-xs font-medium transition-colors border-none cursor-pointer capitalize
                            ${tab === t ? "bg-[var(--surface2)] text-[var(--text)]" : "bg-transparent text-[var(--muted)] hover:text-[var(--text)]"}`}>
                            {t}
                        </button>
                    ))}
                </div>
            </div>

            {/* Create group modal */}
            {creating && (
                <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
                    <div className="w-full max-w-sm bg-[var(--surface)] border border-[var(--border)] rounded-2xl overflow-hidden shadow-2xl">
                        <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border)]">
                            <p className="text-sm font-semibold text-[var(--text)]">New group</p>
                            <button onClick={() => setCreating(false)} className="text-[var(--muted)] hover:text-[var(--text)] bg-none border-none cursor-pointer text-xl leading-none">×</button>
                        </div>
                        <form onSubmit={createGroup} className="p-4 flex flex-col gap-3">
                            <div>
                                <label className="text-xs text-[var(--muted)] block mb-1">Group name *</label>
                                <input className="form-input text-sm" value={newName} onChange={e => setNewName(e.target.value)} placeholder="e.g. Next.js builders" required autoFocus />
                            </div>
                            <div>
                                <label className="text-xs text-[var(--muted)] block mb-1">Description</label>
                                <input className="form-input text-sm" value={newDesc} onChange={e => setNewDesc(e.target.value)} placeholder="What's this group about?" />
                            </div>
                            <div>
                                <label className="text-xs text-[var(--muted)] block mb-1">Invite by email (comma separated)</label>
                                <textarea className="form-input text-sm resize-none" rows={2} value={newEmails} onChange={e => setNewEmails(e.target.value)} placeholder="friend@example.com, other@example.com" />
                            </div>
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input type="checkbox" checked={newPrivate} onChange={e => setNewPrivate(e.target.checked)} />
                                <span className="text-xs text-[var(--text)]">Private group (requires approval to join)</span>
                            </label>
                            <div className="flex gap-2 pt-1">
                                <button type="button" onClick={() => setCreating(false)} className="flex-1 py-2 rounded-lg text-sm border border-[var(--border)] bg-transparent text-[var(--muted)] cursor-pointer">Cancel</button>
                                <button type="submit" disabled={saving || !newName.trim()} className="flex-1 py-2 rounded-lg text-sm bg-[var(--accent)] text-[var(--bg)] border-none cursor-pointer font-medium disabled:opacity-60">
                                    {saving ? "Creating..." : "Create"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Group list */}
            <div className="flex-1 overflow-y-auto">
                {tab === "chats" ? (
                    <>
                        {pinned.length > 0 && (
                            <div>
                                <p className="text-[10px] text-[var(--muted)] uppercase tracking-wider px-4 py-2">Pinned</p>
                                {pinned.map(g => <GroupRow key={g.id} group={g} active={activeGroupId === g.id} onSelect={() => onSelectGroup(g.id)} timeAgo={timeAgo} getInitial={getInitial} getAvatarColor={getAvatarColor} />)}
                            </div>
                        )}
                        {rest.length > 0 && (
                            <div>
                                {pinned.length > 0 && <p className="text-[10px] text-[var(--muted)] uppercase tracking-wider px-4 py-2">All groups</p>}
                                {rest.map(g => <GroupRow key={g.id} group={g} active={activeGroupId === g.id} onSelect={() => onSelectGroup(g.id)} timeAgo={timeAgo} getInitial={getInitial} getAvatarColor={getAvatarColor} />)}
                            </div>
                        )}
                        {filtered.length === 0 && (
                            <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                                <p className="text-sm text-[var(--muted)]">No groups yet</p>
                                <button onClick={() => setCreating(true)} className="mt-3 text-xs text-[var(--accent)] bg-none border-none cursor-pointer underline">Create one</button>
                            </div>
                        )}
                    </>
                ) : (
                    <div>
                        <p className="text-[10px] text-[var(--muted)] uppercase tracking-wider px-4 py-2">Discover public groups</p>
                        {discoverGroups.map(g => (
                            <div key={g.id} className="flex items-center gap-3 px-4 py-3 hover:bg-[var(--surface2)] transition-colors">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white flex-shrink-0 ${getAvatarColor(g.name)}`}>
                                    {getInitial(g.name)}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-[var(--text)] truncate">{g.name}</p>
                                    <p className="text-xs text-[var(--muted)]">{g.memberCount} members</p>
                                </div>
                                <button
                                    onClick={() => joinGroup(g.id)}
                                    className="text-xs px-3 py-1.5 rounded-lg bg-[var(--accent)] text-[var(--bg)] border-none cursor-pointer font-medium hover:opacity-85 flex-shrink-0"
                                >
                                    Join
                                </button>
                            </div>
                        ))}
                        {discoverGroups.length === 0 && (
                            <p className="text-sm text-[var(--muted)] text-center py-8">No public groups to discover</p>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

function GroupRow({ group, active, onSelect, timeAgo, getInitial, getAvatarColor }: {
    group: any; active: boolean; onSelect: () => void;
    timeAgo: (s: string) => string;
    getInitial: (s: string) => string;
    getAvatarColor: (s: string) => string;
}) {
    const preview = group.lastMessage
        ? `${group.lastMessage.senderName?.split(" ")[0] ?? ""}: ${group.lastMessage.content?.slice(0, 35) ?? "📎 Media"}${(group.lastMessage.content?.length ?? 0) > 35 ? "..." : ""}`
        : "No messages yet";

    return (
        <button
            onClick={onSelect}
            className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors border-none cursor-pointer
                ${active ? "bg-[var(--surface2)]" : "bg-transparent hover:bg-[var(--surface2)]/60"}`}
        >
            <div className="relative flex-shrink-0">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white ${getAvatarColor(group.name)}`}>
                    {getInitial(group.name)}
                </div>
                {group.muted && (
                    <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-[var(--surface)] border border-[var(--border)] flex items-center justify-center">
                        <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="var(--muted)" strokeWidth="2"><line x1="1" y1="1" x2="23" y2="23" /><path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6" /><path d="M17 16.95A7 7 0 0 1 5 12v-2m14 0v2a7 7 0 0 1-.11 1.23M12 19v3M8 19h8" /></svg>
                    </div>
                )}
            </div>
            <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-medium text-[var(--text)] truncate">{group.name}</p>
                    {group.lastMessage && (
                        <span className="text-[10px] text-[var(--muted)] flex-shrink-0">{timeAgo(group.lastMessage.createdAt)}</span>
                    )}
                </div>
                <p className="text-xs text-[var(--muted)] truncate mt-0.5">{preview}</p>
            </div>
        </button>
    );
}