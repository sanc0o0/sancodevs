"use client";

import { useState, useEffect, useCallback } from "react";

interface Member {
    userId: string;
    role: "ADMIN" | "MEMBER";
    user: { id: string; name: string | null; email: string; image?: string | null };
}

interface PendingRequest {
    userId: string;
    user: { id: string; name: string | null; email: string; image?: string | null };
    joinedAt: string;
}

interface Group {
    id: string;
    name: string;
    description: string | null;
    memberCount: number;
    muted: boolean;
    pinned: boolean;
}

interface Props {
    group: Group;
    currentUserId: string;
    isAdmin: boolean;
    onClose: () => void;
    onGroupUpdated: (updates: Partial<Group>) => void;
    onGroupLeft: () => void;
    initialTab?: "members" | "pending";
}

export default function DetailsPane({
    group, currentUserId, isAdmin, onClose, onGroupUpdated, onGroupLeft, initialTab
}: Props) {
    const [members, setMembers] = useState<Member[]>([]);
    const [pending, setPending] = useState<PendingRequest[]>([]);
    const [membersLoading, setMembersLoading] = useState(true);
    const [muted, setMuted] = useState(group.muted);
    const [pinned, setPinned] = useState(group.pinned);
    const [renaming, setRenaming] = useState(false);
    const [newName, setNewName] = useState(group.name);
    const [leaving, setLeaving] = useState(false);
    const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
    const [tab, setTab] = useState<"members" | "pending">(initialTab ?? "members");    const [approving, setApproving] = useState<string | null>(null);
    const [addEmail, setAddEmail] = useState("");
    const [addError, setAddError] = useState("");
    const [addSuccess, setAddSuccess] = useState("");
    const [adding, setAdding] = useState(false);
    const [showAddPeople, setShowAddPeople] = useState(false);
    const [removingId, setRemovingId] = useState<string | null>(null);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [deleting, setDeleting] = useState(false);


    // ── Load members (not useState — proper useEffect with useCallback) ──
    const loadMembers = useCallback(async () => {
        setMembersLoading(true);
        try {
            const res = await fetch(`/api/community/groups/${group.id}/members`);
            if (!res.ok) { setMembers([]); return; }
            const data = await res.json();
            setMembers(Array.isArray(data) ? data : []);
        } catch {
            setMembers([]);
        } finally {
            setMembersLoading(false);
        }
    }, [group.id]);

    const loadPending = useCallback(async () => {
        if (!isAdmin) return;
        try {
            const res = await fetch(`/api/community/groups/${group.id}/pending`);
            if (!res.ok) { setPending([]); return; }
            const data = await res.json();
            setPending(Array.isArray(data) ? data : []);
        } catch {
            setPending([]);
        }
    }, [group.id, isAdmin]);

    // ── This is the correct pattern — call async functions inside useEffect ──
    useEffect(() => {
        let cancelled = false;

        async function init() {
            setMembersLoading(true);
            try {
                const res = await fetch(`/api/community/groups/${group.id}/members`);
                if (cancelled) return;
                if (res.ok) {
                    const data = await res.json();
                    if (!cancelled) setMembers(Array.isArray(data) ? data : []);
                } else {
                    if (!cancelled) setMembers([]);
                }
            } catch {
                if (!cancelled) setMembers([]);
            } finally {
                if (!cancelled) setMembersLoading(false);
            }

            if (!isAdmin || cancelled) return;
            try {
                const res = await fetch(`/api/community/groups/${group.id}/pending`);
                if (cancelled || !res.ok) return;
                const data = await res.json();
                if (!cancelled) setPending(Array.isArray(data) ? data : []);
            } catch {
                if (!cancelled) setPending([]);
            }
        }

        init();
        return () => { cancelled = true; };
    }, [group.id, isAdmin]);

    // ── Settings ──
    async function toggleMute() {
        const next = !muted;
        setMuted(next);
        onGroupUpdated({ muted: next });
        await fetch(`/api/community/groups/${group.id}/settings`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ muted: next }),
        });
    }

    async function togglePin() {
        const next = !pinned;
        setPinned(next);
        onGroupUpdated({ pinned: next });
        await fetch(`/api/community/groups/${group.id}/settings`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ pinned: next }),
        });
    }

    async function saveRename() {
        if (!newName.trim() || newName.trim() === group.name) { setRenaming(false); return; }
        const res = await fetch(`/api/community/groups/${group.id}/settings`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name: newName.trim() }),
        });
        if (res.ok) {
            onGroupUpdated({ name: newName.trim() });
            setRenaming(false);
        }
    }

    // ── Approve / Reject ──
    async function handleApprove(targetUserId: string) {
        setApproving(targetUserId);
        const res = await fetch(`/api/community/groups/${group.id}/members/approve`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ targetUserId, action: "approve" }),
        });
        if (res.ok) {
            setPending(prev => prev.filter(p => p.userId !== targetUserId));
            onGroupUpdated({ memberCount: group.memberCount + 1 });
            // Reload members to show new member
            const mRes = await fetch(`/api/community/groups/${group.id}/members`);
            if (mRes.ok) setMembers(await mRes.json());
        }
        setApproving(null);
    }

    async function handleReject(targetUserId: string) {
        setApproving(targetUserId);
        await fetch(`/api/community/groups/${group.id}/members/approve`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ targetUserId, action: "reject" }),
        });
        setPending(prev => prev.filter(p => p.userId !== targetUserId));
        setApproving(null);
    }

    // ── Add people ──
    async function addPerson() {
        if (!addEmail.trim()) return;
        setAdding(true);
        setAddError("");
        setAddSuccess("");
        const res = await fetch(`/api/community/groups/${group.id}/add-member`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email: addEmail.trim() }),
        });
        const data = await res.json();
        if (res.ok) {
            setAddSuccess(`${data.user?.name ?? addEmail} was added.`);
            setAddEmail("");
            onGroupUpdated({ memberCount: group.memberCount + 1 });
            const mRes = await fetch(`/api/community/groups/${group.id}/members`);
            if (mRes.ok) setMembers(await mRes.json());
        } else {
            setAddError(data.error ?? "Failed to add user.");
        }
        setAdding(false);
    }

    // ── Leave ──
    async function leaveGroup() {
        setLeaving(true);
        const res = await fetch("/api/community/groups/leave", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ groupId: group.id }),
        });
        if (res.ok) {
            onGroupLeft();
        } else {
            const d = await res.json();
            alert(d.error ?? "Could not leave group.");
            setLeaving(false);
            setShowLeaveConfirm(false);
        }
    }

    function getColor(name: string) {
        const colors = ["bg-orange-500", "bg-blue-500", "bg-green-500", "bg-purple-500", "bg-pink-500", "bg-teal-500"];
        return colors[(name.charCodeAt(0) + (name.charCodeAt(1) || 0)) % colors.length];
    }

    async function handleRemoveMember(targetUserId: string, name: string) {
        if (!confirm(`Remove ${name} from this group?`)) return;
        setRemovingId(targetUserId);
        const res = await fetch(`/api/community/groups/${group.id}/members/remove`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ targetUserId }),
        });
        if (res.ok) {
            setMembers(prev => prev.filter(m => m.userId !== targetUserId));
            onGroupUpdated({ memberCount: group.memberCount - 1 });
        }
        setRemovingId(null);
    }

    async function deleteGroup() {
        setDeleting(true);
        const res = await fetch(`/api/community/groups/${group.id}/delete`, {
            method: "DELETE",
        });
        if (res.ok) {
            onGroupLeft(); // removes from shell state
        } else {
            setDeleting(false);
            setShowDeleteConfirm(false);
        }
    }

    return (
        <div className="flex flex-col h-full overflow-hidden">
            {/* Header */}
            <div className="flex-shrink-0 flex items-center justify-between px-4 py-3 border-b border-[var(--border)]">
                <p className="text-sm font-semibold text-[var(--text)]">Details</p>
                <button
                    onClick={onClose}
                    aria-label="Close details panel"
                    className="w-7 h-7 flex items-center justify-center rounded-full text-[var(--muted)] hover:text-[var(--text)] hover:bg-[var(--surface2)] transition-colors border-none bg-transparent cursor-pointer text-lg leading-none"
                >×</button>
            </div>

            <div className="flex-1 overflow-y-auto">
                {/* Group avatar + name */}
                <div className="flex flex-col items-center px-4 py-5 border-b border-[var(--border)]">
                    <div className={`w-14 h-14 rounded-full flex items-center justify-center text-xl font-bold text-white mb-3 ${getColor(group.name)}`}>
                        {group.name.charAt(0).toUpperCase()}
                    </div>

                    {renaming ? (
                        <div className="w-full flex gap-2">
                            <input
                                className="form-input text-xs flex-1"
                                value={newName}
                                onChange={e => setNewName(e.target.value)}
                                aria-label="New group name"
                                autoFocus
                                onKeyDown={e => {
                                    if (e.key === "Enter") saveRename();
                                    if (e.key === "Escape") setRenaming(false);
                                }}
                            />
                            <button onClick={saveRename} aria-label="Save group name" className="px-3 py-1.5 rounded-lg text-xs bg-[var(--accent)] text-[var(--bg)] border-none cursor-pointer font-medium">
                                Save
                            </button>
                        </div>
                    ) : (
                        <div className="flex items-center gap-1.5 mb-1">
                            <p className="text-sm font-semibold text-[var(--text)]">{group.name}</p>
                            {isAdmin && (
                                <button
                                    onClick={() => { setRenaming(true); setNewName(group.name); }}
                                    aria-label="Rename group"
                                    className="text-[var(--muted)] hover:text-[var(--text)] bg-none border-none cursor-pointer text-xs transition-colors"
                                >✎</button>
                            )}
                        </div>
                    )}
                    {group.description && (
                        <p className="text-[11px] text-[var(--muted)] text-center leading-relaxed">{group.description}</p>
                    )}
                    <p className="text-[10px] text-[var(--muted)] mt-1">{group.memberCount} members</p>
                </div>

                {/* Mute */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border)]">
                    <span id="mute-label" className="text-sm text-[var(--text)]">Mute messages</span>
                    <div className="relative flex-shrink-0">
                        <input
                            id="mute-toggle"
                            type="checkbox"
                            checked={muted}
                            onChange={toggleMute}
                            aria-labelledby="mute-label"
                            className="sr-only"
                        />
                        <label
                            htmlFor="mute-toggle"
                            className={`w-10 h-5 rounded-full cursor-pointer relative block transition-colors ${muted ? "bg-[var(--accent)]" : "bg-[var(--muted)]/30"}`}
                        >
                             <div
                                className={`absolute top-[1.8px] w-4 h-4 rounded-full shadow transition-all ${muted
                                        ? "left-[22px] bg-[var(--bg)] "
                                        : "left-0.5 bg-white"
                                    }`}
                            />
                        </label>
                    </div>
                </div>

                {/* Pin */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border)]">
                    <span id="pin-label" className="text-sm text-[var(--text)]">Pin chat</span>
                    <div className="relative flex-shrink-0">
                        <input
                            id="pin-toggle"
                            type="checkbox"
                            checked={pinned}
                            onChange={togglePin}
                            aria-labelledby="pin-label"
                            className="sr-only"
                        />
                        <label
                            htmlFor="pin-toggle"
                            className={`w-10 h-5 rounded-full cursor-pointer relative block transition-colors ${pinned ? "bg-[var(--accent)]" : "bg-[var(--muted)]/30"}`}
                        >
                            <div
                                className={`absolute top-[1.8px] w-4 h-4 rounded-full shadow transition-all ${pinned
                                        ? "left-[22px] bg-[var(--bg)] "
                                        : "left-0.5 bg-white"
                                    }`}
                            />
                        </label>
                    </div>
                </div>

                {/* Members / Pending tabs */}
                <div className="px-4 pt-3 pb-1">
                    <div className="flex items-center justify-between mb-3">
                        <div className="flex gap-1">
                            <button
                                onClick={() => setTab("members")}
                                className={`text-xs px-3 py-1 rounded-lg border-none cursor-pointer transition-colors
                                    ${tab === "members"
                                        ? "bg-[var(--surface2)] text-[var(--text)] font-medium"
                                        : "bg-transparent text-[var(--muted)] hover:text-[var(--text)]"
                                    }`}
                            >
                                Members ({members.length})
                            </button>
                            {isAdmin && (
                                <button
                                    onClick={() => setTab("pending")}
                                    className={`relative text-xs px-3 py-1 rounded-lg border-none cursor-pointer transition-colors
                                        ${tab === "pending"
                                            ? "bg-[var(--surface2)] text-[var(--text)] font-medium"
                                            : "bg-transparent text-[var(--muted)] hover:text-[var(--text)]"
                                        }`}
                                >
                                    Requests
                                    {pending.length > 0 && (
                                        <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 text-white text-[9px] flex items-center justify-center font-bold">
                                            {pending.length > 9 ? "9+" : pending.length}
                                        </span>
                                    )}
                                </button>
                            )}
                        </div>

                        {isAdmin && (
                            <button
                                onClick={() => setShowAddPeople(v => !v)}
                                aria-label="Add people to group"
                                className="text-xs text-[var(--accent)] bg-none border-none cursor-pointer font-medium hover:opacity-70 transition-opacity"
                            >
                                {showAddPeople ? "Cancel" : "+ Add people"}
                            </button>
                        )}
                    </div>

                    {/* Add people form */}
                    {showAddPeople && isAdmin && (
                        <div className="mb-3 p-3 rounded-xl bg-[var(--surface2)] border border-[var(--border)]">
                            <p className="text-[10px] text-[var(--muted)] mb-2 uppercase tracking-wider">Search by email</p>
                            <div className="flex gap-2">
                                <input
                                    className="form-input text-xs flex-1"
                                    type="email"
                                    placeholder="user@example.com"
                                    value={addEmail}
                                    onChange={e => { setAddEmail(e.target.value); setAddError(""); setAddSuccess(""); }}
                                    aria-label="Email to add"
                                    onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); addPerson(); } }}
                                />
                                <button
                                    onClick={addPerson}
                                    disabled={adding || !addEmail.trim()}
                                    aria-label="Add this user"
                                    className="px-3 py-1.5 rounded-lg text-xs bg-[var(--accent)] text-[var(--bg)] border-none cursor-pointer font-medium disabled:opacity-50 transition-opacity"
                                >
                                    {adding ? "..." : "Add"}
                                </button>
                            </div>
                            {addError && <p className="text-[10px] text-red-400 mt-1.5">{addError}</p>}
                            {addSuccess && <p className="text-[10px] text-green-500 mt-1.5">{addSuccess}</p>}
                        </div>
                    )}

                    {/* Members list */}
                    {tab === "members" && (
                        <div className="flex flex-col overflow-auto" style={{maxHeight:"280px"}}>
                            {membersLoading ? (
                                <p className="text-xs text-[var(--muted)] py-4 text-center">Loading...</p>
                            ) : members.length === 0 ? (
                                <p className="text-xs text-[var(--muted)] py-4 text-center">No members found</p>
                            ) : (
                                        // In the members map inside tab === "members", add remove button for non-admins:
                                        members.map(m => (
                                            <div key={m.userId} className="flex items-center gap-3 py-2.5 border-b border-[var(--border)] last:border-0">
                                                <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold text-white overflow-hidden ${getColor(m.user.name ?? "?")}`}>
                                                    {m.user.image
                                                        ? <img src={m.user.image} alt="" className="w-full h-full object-cover" />
                                                        : m.user.name?.charAt(0).toUpperCase()
                                                    }
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-xs font-medium text-[var(--text)] truncate">
                                                        {m.user.name}
                                                        {m.userId === currentUserId && <span className="text-[var(--muted)] font-normal"> (you)</span>}
                                                    </p>
                                                    <p className="text-[10px] text-[var(--muted)] truncate">{m.user.email}</p>
                                                </div>
                                                <div className="flex items-center gap-1.5 flex-shrink-0">
                                                    {m.role === "ADMIN" && (
                                                        <span className="text-[9px] px-1.5 py-0.5 rounded-full border border-[var(--accent)]/30 text-[var(--accent)] font-medium">
                                                            Admin
                                                        </span>
                                                    )}
                                                    {/* Admin can remove non-admin members who aren't themselves */}
                                                    {isAdmin && m.role !== "ADMIN" && m.userId !== currentUserId && (
                                                        <button
                                                            onClick={() => handleRemoveMember(m.userId, m.user.name ?? "this member")}
                                                            disabled={removingId === m.userId}
                                                            aria-label={`Remove ${m.user.name}`}
                                                            className="text-[9px] px-1.5 py-0.5 rounded border border-red-500/20 text-red-400 bg-transparent cursor-pointer hover:bg-red-500/10 transition-colors disabled:opacity-50"
                                                        >
                                                            {removingId === m.userId ? "..." : "Remove"}
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                ))
                            )}
                        </div>
                    )}

                    {/* Pending requests */}
                    {tab === "pending" && isAdmin && (
                        <div className="flex flex-col overflow-auto" style={ { maxHeight: "208px"}}>
                            {pending.length === 0 ? (
                                <p className="text-xs text-[var(--muted)] py-4 text-center">No pending requests</p>
                            ) : (
                                pending.map(req => (
                                    <div key={req.userId} className="flex items-center gap-2.5 py-3 border-b border-[var(--border)] last:border-0">
                                        <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold text-white overflow-hidden ${getColor(req.user.name ?? "?")}`}>
                                            {req.user.image
                                                ? <img src={req.user.image} alt="" className="w-full h-full object-cover" />
                                                : req.user.name?.charAt(0).toUpperCase()
                                            }
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-xs font-medium text-[var(--text)] truncate">{req.user.name}</p>
                                            <p className="text-[10px] text-[var(--muted)] truncate">{req.user.email}</p>
                                        </div>
                                        <div className="flex gap-1 flex-shrink-0">
                                            <button
                                                onClick={() => handleApprove(req.userId)}
                                                disabled={approving === req.userId}
                                                aria-label={`Approve ${req.user.name}`}
                                                className="px-2.5 py-1 rounded-lg text-[10px] font-medium bg-green-500 text-white border-none cursor-pointer disabled:opacity-50"
                                            >
                                                {approving === req.userId ? "·" : "✓"}
                                            </button>
                                            <button
                                                onClick={() => handleReject(req.userId)}
                                                disabled={approving === req.userId}
                                                aria-label={`Reject ${req.user.name}`}
                                                className="px-2.5 py-1 rounded-lg text-[10px] border border-[var(--border)] text-[var(--muted)] bg-transparent cursor-pointer disabled:opacity-50"
                                            >
                                                ✕
                                            </button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    )}
                </div>

                {/* Danger zone */}
                <div className="px-4 py-4 mt-1 border-t border-[var(--border)] flex flex-col gap-2">
                    {/* Leave chat — non-admins or admins with other admins */}
                    {!showLeaveConfirm && !showDeleteConfirm && (
                        <>
                            <button
                                onClick={() => setShowLeaveConfirm(true)}
                                aria-label="Leave this chat"
                                className="text-sm text-red-400 hover:text-red-300 transition-colors bg-none border-none cursor-pointer text-left py-1"
                            >
                                Leave chat
                            </button>
                            {isAdmin && (
                                <button
                                    onClick={() => setShowDeleteConfirm(true)}
                                    aria-label="Delete group permanently"
                                    className="text-sm text-red-500 hover:text-red-400 transition-colors bg-none border-none cursor-pointer text-left py-1 font-medium"
                                >
                                    Delete group permanently
                                </button>
                            )}
                        </>
                    )}

                    {showLeaveConfirm && (
                        <div className="p-3 rounded-xl border border-red-400/20 bg-red-400/5">
                            <p className="text-[10px] text-[var(--muted)] leading-relaxed mb-3">
                                You won&apos;t be able to send or receive messages unless someone adds you back.
                            </p>
                            <div className="flex gap-2">
                                <button onClick={() => setShowLeaveConfirm(false)} aria-label="Cancel leaving"
                                    className="flex-1 py-1.5 rounded-lg text-xs border border-[var(--border)] bg-transparent text-[var(--muted)] cursor-pointer">Cancel</button>
                                <button onClick={leaveGroup} disabled={leaving} aria-label="Confirm leave"
                                    className="flex-1 py-1.5 rounded-lg text-xs bg-red-500 text-white border-none cursor-pointer disabled:opacity-60 font-medium">
                                    {leaving ? "Leaving..." : "Leave"}
                                </button>
                            </div>
                        </div>
                    )}

                    {showDeleteConfirm && isAdmin && (
                        <div className="p-3 rounded-xl border border-red-500/30 bg-red-500/5">
                            <p className="text-xs font-medium text-red-400 mb-1">Delete group permanently?</p>
                            <p className="text-[10px] text-[var(--muted)] leading-relaxed mb-3">
                                All messages and members will be removed. All members will be notified. This cannot be undone.
                            </p>
                            <div className="flex gap-2">
                                <button onClick={() => setShowDeleteConfirm(false)} aria-label="Cancel"
                                    className="flex-1 py-1.5 rounded-lg text-xs border border-[var(--border)] bg-transparent text-[var(--muted)] cursor-pointer">Cancel</button>
                                <button onClick={deleteGroup} disabled={deleting} aria-label="Confirm delete group"
                                    className="flex-1 py-1.5 rounded-lg text-xs bg-red-500 text-white border-none cursor-pointer disabled:opacity-60 font-medium">
                                    {deleting ? "Deleting..." : "Delete"}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}