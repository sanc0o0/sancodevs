"use client";

import { useState } from "react";

type GroupSummary = {
    id: string;
    name: string;
    description: string | null;
    isPrivate: boolean;
    memberCount: number;
    muted: boolean;
    pinned: boolean;
    role: "ADMIN" | "MEMBER";
    lastMessage: { senderName: string | null; content: string | null; createdAt: string } | null;
};

type RequestSummary = {
    groupId: string;
    status: "PENDING" | "INVITED";
    group: { id: string; name: string; description: string | null; isPrivate: boolean; memberCount: number };
};

type DiscoverGroup = {
    id: string; name: string; description: string | null; isPrivate: boolean; memberCount: number;
};

interface Props {
    groups: GroupSummary[];
    requests: RequestSummary[];
    discoverGroups: DiscoverGroup[];
    activeGroupId: string | null;
    onSelectGroup: (id: string) => void;
    onGroupCreated: (g: GroupSummary) => void;
    onRequestResponded: (groupId: string) => void;
    currentUserId: string;
    initialTab?: "chats" | "requests" | "discover";
}

export default function GroupList({
    groups, requests, discoverGroups, activeGroupId,
    onSelectGroup, onGroupCreated, onRequestResponded, currentUserId, initialTab
}: Props) {
    const [search, setSearch] = useState("");
    const [tab, setTab] = useState<"chats" | "requests" | "discover">(initialTab ?? "chats");    const [creating, setCreating] = useState(false);
    const [newName, setNewName] = useState("");
    const [newDesc, setNewDesc] = useState("");
    const [newPrivate, setNewPrivate] = useState(true);
    const [newEmails, setNewEmails] = useState("");
    const [saving, setSaving] = useState(false);
    const [createError, setCreateError] = useState("");
    const [joiningId, setJoiningId] = useState<string | null>(null);
    const [joinedIds, setJoinedIds] = useState<Set<string>>(new Set());
    const [respondingId, setRespondingId] = useState<string | null>(null);

    const filtered = groups.filter(g =>
        g.name.toLowerCase().includes(search.toLowerCase())
    );
    const pinned = filtered.filter(g => g.pinned);
    const rest = filtered.filter(g => !g.pinned);

    function getColor(name: string) {
        const colors = ["bg-orange-500", "bg-blue-500", "bg-green-500", "bg-purple-500", "bg-pink-500", "bg-teal-500"];
        return colors[(name.charCodeAt(0) + (name.charCodeAt(1) || 0)) % colors.length];
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

    async function createGroup(e: React.FormEvent) {
        e.preventDefault();
        if (!newName.trim()) return;
        setSaving(true);
        setCreateError("");
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
                id: data.id, name: data.name, description: data.description,
                isPrivate: data.isPrivate, memberCount: 1,
                muted: false, pinned: false, role: "ADMIN", lastMessage: null,
            });
            setCreating(false);
            setNewName(""); setNewDesc(""); setNewEmails(""); setNewPrivate(true);
        } else {
            const d = await res.json();
            setCreateError(d.error ?? "Failed.");
        }
        setSaving(false);
    }

    async function joinGroup(groupId: string) {
        setJoiningId(groupId);
        const res = await fetch("/api/community/groups/join", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ groupId }),
        });
        if (res.ok || res.status === 409) {
            setJoinedIds(prev => new Set([...prev, groupId]));
        }
        setJoiningId(null);
    }

    async function respondToInvite(groupId: string, action: "accept" | "reject") {
        setRespondingId(groupId);
        const res = await fetch("/api/community/groups/invite/respond", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ groupId, action }),
        });
        if (res.ok) {
            onRequestResponded(groupId);
            if (action === "accept") {
                // Shell will refresh groups list
            }
        }
        setRespondingId(null);
    }

    const tabLabels = {
        chats: `Chats${groups.length > 0 ? ` (${groups.length})` : ""}`,
        requests: `Requests${requests.length > 0 ? ` (${requests.length})` : ""}`,
        discover: "Discover",
    };

    return (
        <div className="flex flex-col h-full">
            {/* Header */}
            <div className="flex-shrink-0 px-4 pt-4 pb-2">
                <div className="flex items-center justify-between mb-3">
                    <h2 className="text-sm font-semibold text-[var(--text)]">Community</h2>
                    <button
                        onClick={() => setCreating(true)}
                        title="New group"
                        aria-label="Create new group"
                        className="w-7 h-7 rounded-lg flex items-center justify-center text-[var(--muted)] hover:text-[var(--text)] hover:bg-[var(--surface2)] transition-colors border-none bg-transparent cursor-pointer"
                    >
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
                        </svg>
                    </button>
                </div>

                {/* Search */}
                <div className="relative mb-3">
                    <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--muted)]" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
                    </svg>
                    <input
                        type="text"
                        placeholder="Search groups..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        aria-label="Search groups"
                        className="w-full pl-8 pr-3 py-1.5 text-xs bg-[var(--surface2)] rounded-lg border border-transparent focus:border-[var(--border)] outline-none text-[var(--text)] placeholder:text-[var(--muted)] transition-colors"
                    />
                </div>

                {/* Tabs */}
                <div className="flex gap-0.5 bg-[var(--surface2)] p-0.5 rounded-lg">
                    {(["chats", "requests", "discover"] as const).map(t => (
                        <button
                            key={t}
                            onClick={() => setTab(t)}
                            className={`flex-1 py-1 rounded-md text-[10px] font-medium transition-all border-none cursor-pointer relative
                                ${tab === t
                                    ? "bg-[var(--bg)] text-[var(--text)] shadow-sm"
                                    : "bg-transparent text-[var(--muted)] hover:text-[var(--text)]"
                                }`}
                        >
                            {t === "requests" && requests.length > 0 && (
                                <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-red-500 text-white text-[8px] flex items-center justify-center font-bold">
                                    {requests.length > 9 ? "9+" : requests.length}
                                </span>
                            )}
                            {t.charAt(0).toUpperCase() + t.slice(1)}
                        </button>
                    ))}
                </div>
            </div>

            {/* Create group modal */}
            {creating && (
                <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
                    <div className="w-full max-w-sm bg-[var(--surface)] border border-[var(--border)] rounded-2xl overflow-hidden shadow-2xl" style={{ animation: "fadeUp 0.2s ease" }}>
                        <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border)]">
                            <p className="text-sm font-semibold text-[var(--text)]">New group</p>
                            <button onClick={() => setCreating(false)} aria-label="Close" className="text-[var(--muted)] hover:text-[var(--text)] bg-none border-none cursor-pointer text-xl leading-none">×</button>
                        </div>
                        <form onSubmit={createGroup} className="p-4 flex flex-col gap-3">
                            <div>
                                <label className="text-xs text-[var(--muted)] block mb-1.5">Group name *</label>
                                <input className="form-input text-sm" value={newName} onChange={e => setNewName(e.target.value)} placeholder="e.g. Next.js builders" required autoFocus aria-label="Group name" />
                            </div>
                            <div>
                                <label className="text-xs text-[var(--muted)] block mb-1.5">Description</label>
                                <input className="form-input text-sm" value={newDesc} onChange={e => setNewDesc(e.target.value)} placeholder="What's this group about?" aria-label="Group description" />
                            </div>
                            <div>
                                <label className="text-xs text-[var(--muted)] block mb-1.5">Invite by email (comma separated)</label>
                                <textarea className="form-input text-sm resize-none" rows={2} value={newEmails} onChange={e => setNewEmails(e.target.value)} placeholder="friend@example.com, other@example.com" aria-label="Invite emails" />
                            </div>
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input type="checkbox" checked={newPrivate} onChange={e => setNewPrivate(e.target.checked)} />
                                <div>
                                    <p className="text-xs text-[var(--text)]">Private group</p>
                                    <p className="text-[10px] text-[var(--muted)]">
                                        {newPrivate ? "Only visible to members. Invite-only." : "Visible in Discover. Users can request to join."}
                                    </p>
                                </div>
                            </label>
                            {createError && <p className="text-xs text-red-400">{createError}</p>}
                            <div className="flex gap-2 pt-1">
                                <button type="button" onClick={() => setCreating(false)} className="flex-1 py-2 rounded-xl text-sm border border-[var(--border)] bg-transparent text-[var(--muted)] cursor-pointer">Cancel</button>
                                <button type="submit" disabled={saving || !newName.trim()} className="flex-1 py-2 rounded-xl text-sm bg-[var(--accent)] text-[var(--bg)] border-none cursor-pointer font-medium disabled:opacity-60">
                                    {saving ? "Creating..." : "Create"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Content */}
            <div className="flex-1 overflow-y-auto">

                {/* ── CHATS TAB ── */}
                {tab === "chats" && (
                    <>
                        {pinned.length > 0 && (
                            <div>
                                <p className="text-[9px] text-[var(--muted)] uppercase tracking-wider px-4 py-2">Pinned</p>
                                {pinned.map(g => (
                                    <GroupRow key={g.id} group={g} active={activeGroupId === g.id} onSelect={() => onSelectGroup(g.id)} timeAgo={timeAgo} getColor={getColor} />
                                ))}
                            </div>
                        )}
                        {rest.length > 0 && (
                            <div>
                                {pinned.length > 0 && <p className="text-[9px] text-[var(--muted)] uppercase tracking-wider px-4 py-2">All</p>}
                                {rest.map(g => (
                                    <GroupRow key={g.id} group={g} active={activeGroupId === g.id} onSelect={() => onSelectGroup(g.id)} timeAgo={timeAgo} getColor={getColor} />
                                ))}
                            </div>
                        )}
                        {filtered.length === 0 && (
                            <div className="flex flex-col items-center justify-center py-12 px-4 text-center gap-2">
                                <p className="text-sm text-[var(--muted)]">No chats yet</p>
                                <button onClick={() => setCreating(true)} className="text-xs text-[var(--accent)] bg-none border-none cursor-pointer underline">Create a group</button>
                                <button onClick={() => setTab("discover")} className="text-xs text-[var(--muted)] bg-none border-none cursor-pointer underline">Discover groups</button>
                            </div>
                        )}
                    </>
                )}

                {/* ── REQUESTS TAB ── */}
                {tab === "requests" && (
                    <div>
                        {requests.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                                <p className="text-sm text-[var(--muted)]">No pending requests or invitations</p>
                            </div>
                        ) : (
                            <>
                                {/* Invitations (INVITED) */}
                                {requests.filter(r => r.status === "INVITED").length > 0 && (
                                    <div>
                                        <p className="text-[9px] text-[var(--muted)] uppercase tracking-wider px-4 py-2">Invitations</p>
                                        {requests.filter(r => r.status === "INVITED").map(r => (
                                            <div key={r.groupId} className="px-4 py-3 border-b border-[var(--border)]">
                                                <div className="flex items-center gap-3 mb-2">
                                                    <div className={`w-9 h-9 rounded-full flex-shrink-0 flex items-center justify-center text-sm font-bold text-white ${getColor(r.group.name)}`}>
                                                        {r.group.name.charAt(0).toUpperCase()}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-sm font-medium text-[var(--text)] truncate">{r.group.name}</p>
                                                        <p className="text-[10px] text-[var(--muted)]">{r.group.memberCount} members · Invited</p>
                                                    </div>
                                                </div>
                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={() => respondToInvite(r.groupId, "accept")}
                                                        disabled={respondingId === r.groupId}
                                                        aria-label={`Accept invitation to ${r.group.name}`}
                                                        className="flex-1 py-1.5 rounded-lg text-xs font-medium bg-[var(--accent)] text-[var(--bg)] border-none cursor-pointer disabled:opacity-50"
                                                    >
                                                        {respondingId === r.groupId ? "..." : "Accept"}
                                                    </button>
                                                    <button
                                                        onClick={() => respondToInvite(r.groupId, "reject")}
                                                        disabled={respondingId === r.groupId}
                                                        aria-label={`Reject invitation to ${r.group.name}`}
                                                        className="flex-1 py-1.5 rounded-lg text-xs border border-[var(--border)] text-[var(--muted)] bg-transparent cursor-pointer disabled:opacity-50"
                                                    >
                                                        Decline
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {/* Pending requests (PENDING — waiting admin approval) */}
                                {requests.filter(r => r.status === "PENDING").length > 0 && (
                                    <div>
                                        <p className="text-[9px] text-[var(--muted)] uppercase tracking-wider px-4 py-2">Sent requests</p>
                                        {requests.filter(r => r.status === "PENDING").map(r => (
                                            <div key={r.groupId} className="flex items-center gap-3 px-4 py-3 border-b border-[var(--border)]">
                                                <div className={`w-9 h-9 rounded-full flex-shrink-0 flex items-center justify-center text-sm font-bold text-white ${getColor(r.group.name)}`}>
                                                    {r.group.name.charAt(0).toUpperCase()}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-medium text-[var(--text)] truncate">{r.group.name}</p>
                                                    <p className="text-[10px] text-amber-400">Waiting for approval...</p>
                                                </div>
                                                <div className="w-2 h-2 rounded-full bg-amber-400 flex-shrink-0 animate-pulse" />
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                )}

                {/* ── DISCOVER TAB ── */}
                {tab === "discover" && (
                    <div>
                        {discoverGroups.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                                <p className="text-sm text-[var(--muted)]">No public groups to discover</p>
                                <p className="text-xs text-[var(--muted)] mt-1">Create a public group to appear here</p>
                            </div>
                        ) : (
                            <>
                                <p className="text-[9px] text-[var(--muted)] uppercase tracking-wider px-4 py-2">Public groups</p>
                                {discoverGroups.map(g => {
                                    const alreadyJoined = joinedIds.has(g.id);
                                    return (
                                        <div key={g.id} className="flex items-center gap-3 px-4 py-3 border-b border-[var(--border)] hover:bg-[var(--surface2)] transition-colors">
                                            <div className={`w-9 h-9 rounded-full flex-shrink-0 flex items-center justify-center text-sm font-bold text-white ${getColor(g.name)}`}>
                                                {g.name.charAt(0).toUpperCase()}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium text-[var(--text)] truncate">{g.name}</p>
                                                <p className="text-[10px] text-[var(--muted)]">{g.memberCount} members</p>
                                            </div>
                                            {alreadyJoined ? (
                                                <span className="text-[10px] text-amber-400 flex-shrink-0">Pending...</span>
                                            ) : (
                                                <button
                                                    onClick={() => joinGroup(g.id)}
                                                    disabled={joiningId === g.id}
                                                    aria-label={`Request to join ${g.name}`}
                                                    className="text-xs px-3 py-1.5 rounded-lg border border-[var(--border)] text-[var(--muted)] hover:text-[var(--text)] hover:border-[var(--accent)] bg-transparent cursor-pointer transition-colors disabled:opacity-50 flex-shrink-0 font-medium"
                                                >
                                                    {joiningId === g.id ? "..." : "Request"}
                                                </button>
                                            )}
                                        </div>
                                    );
                                })}
                            </>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

function GroupRow({ group, active, onSelect, timeAgo, getColor }: {
    group: GroupSummary; active: boolean; onSelect: () => void;
    timeAgo: (s: string) => string;
    getColor: (s: string) => string;
}) {
    const preview = group.lastMessage
        ? `${group.lastMessage.senderName?.split(" ")[0] ?? ""}: ${group.lastMessage.content?.slice(0, 40) ?? "📎 Media"}${(group.lastMessage.content?.length ?? 0) > 40 ? "..." : ""}`
        : "No messages yet";

    return (
        <button
            onClick={onSelect}
            aria-label={`Open ${group.name} chat`}
            className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors border-none cursor-pointer
                ${active ? "bg-[var(--surface2)]" : "bg-transparent hover:bg-[var(--surface2)]/60"}`}
        >
            <div className="relative flex-shrink-0">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white ${getColor(group.name)}`}>
                    {group.name.charAt(0).toUpperCase()}
                </div>
                {group.muted && (
                    <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-[var(--bg)] border border-[var(--border)] flex items-center justify-center">
                        <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="var(--muted)" strokeWidth="2">
                            <line x1="1" y1="1" x2="23" y2="23" /><path d="M9 9v3a3 3 0 0 0 5.12 2.12" /><path d="M15 9.34V4a3 3 0 0 0-5.94-.6" /><path d="M17 16.95A7 7 0 0 1 5 12v-2m14 0v2a7 7 0 0 1-.11 1.23M12 19v3M8 19h8" />
                        </svg>
                    </div>
                )}
                {group.role === "ADMIN" && (
                    <div className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-[var(--accent)] border border-[var(--bg)] flex items-center justify-center ">
                        <span className="text-[var(--bg)] text-[7px] font-bold leading-none pl-px pt-px">A</span>
                    </div>
                )}
            </div>
            <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-1">
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