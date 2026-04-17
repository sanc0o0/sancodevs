"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

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
    onClose: () => void;
    onGroupUpdated: (updates: Partial<Group>) => void;
    onGroupLeft: () => void;
}

interface Member {
    userId: string;
    role: "ADMIN" | "MEMBER";
    user: {
        name: string | null;
        email: string;
        image?: string | null;
    };
}

export default function DetailsPane({ group, currentUserId, onClose, onGroupUpdated, onGroupLeft }: Props) {
    const router = useRouter();
    const [members, setMembers] = useState<Member[]>([]);
    const [loadedMembers, setLoadedMembers] = useState(false);
    const [muted, setMuted] = useState(group.muted);
    const [pinned, setPinned] = useState(group.pinned);
    const [renaming, setRenaming] = useState(false);
    const [newName, setNewName] = useState(group.name);
    const [leaving, setLeaving] = useState(false);
    const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);


    // Load members on mount
    useEffect(() => {
        fetch(`/api/community/groups/${group.id}/members`)
            .then(r => r.json())
            .then(data => {
                setMembers(data);
                setLoadedMembers(true);
            })
            .catch(() => setLoadedMembers(true));
    }, [group.id]);

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
        if (!newName.trim() || newName === group.name) { setRenaming(false); return; }
        await fetch(`/api/community/groups/${group.id}/settings`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name: newName.trim() }),
        });
        onGroupUpdated({ name: newName.trim() });
        setRenaming(false);
    }

    async function leaveGroup() {
        setLeaving(true);
        await fetch("/api/community/groups/leave", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ groupId: group.id }),
        });
        onGroupLeft();
    }

    function getAvatarColor(name: string) {
        const colors = ["bg-orange-500", "bg-blue-500", "bg-green-500", "bg-purple-500", "bg-pink-500", "bg-teal-500"];
        return colors[name.charCodeAt(0) % colors.length];
    }

    return (
        <div className="flex flex-col h-full">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border)] flex-shrink-0">
                <p className="text-sm font-semibold text-[var(--text)]">Details</p>
                <button 
                    onClick={onClose}  
                    aria-label="Close details panel"
                    className="text-[var(--muted)] hover:text-[var(--text)] bg-none border-none cursor-pointer text-xl leading-none">
                        ×
                </button>
            </div>

            <div className="flex-1 overflow-y-auto">
                {/* Group identity */}
                <div className="flex flex-col items-center px-4 py-5 border-b border-[var(--border)]">
                    <div className={`w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold text-white mb-3 ${getAvatarColor(group.name)}`}>
                        {group.name.charAt(0).toUpperCase()}
                    </div>
                    <p className="text-sm font-semibold text-[var(--text)] mb-1">{group.name}</p>
                    {group.description && <p className="text-xs text-[var(--muted)] text-center">{group.description}</p>}
                    <p className="text-[10px] text-[var(--muted)] mt-1">{group.memberCount} members</p>
                </div>

                {/* Change name */}
                <div className="px-4 py-3 border-b border-[var(--border)]">
                    <div className="flex items-center justify-between">
                        <p className="text-xs text-[var(--text)]">Change group name</p>
                        <button     
                            onClick={() => setRenaming(!renaming)} 
                            aria-label="Set renaming mode"
                            className="text-xs text-[var(--accent)] bg-none border-none cursor-pointer font-medium">
                            {renaming ? "Cancel" : "Change"}
                        </button>
                    </div>
                    {renaming && (
                        <div className="mt-2 flex gap-2">
                            <input 
                                title="form-input"
                                aria-label=" New group name"
                                className="form-input text-xs flex-1" 
                                value={newName} onChange={e => setNewName(e.target.value)} 
                                autoFocus />
                            <button 
                                aria-label="Save new group name"
                                onClick={saveRename} 
                                className="px-3 py-1.5 rounded-lg text-xs bg-[var(--accent)] text-[var(--bg)] border-none cursor-pointer">
                                    Save
                            </button>
                        </div>
                    )}
                </div>

                {/* Mute toggle */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border)]">
                    <div className="flex items-center gap-2">
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--muted)" strokeWidth="1.5">
                            {muted
                                ? <><line x1="1" y1="1" x2="23" y2="23" /><path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6" /><path d="M17 16.95A7 7 0 0 1 5 12v-2m14 0v2a7 7 0 0 1-.11 1.23M12 19v3M8 19h8" /></>
                                : <><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" /><path d="M19 10v2a7 7 0 0 1-14 0v-2" /><line x1="12" y1="19" x2="12" y2="23" /><line x1="8" y1="23" x2="16" y2="23" /></>
                            }
                        </svg>
                        <span id="mute-label" className="text-sm text-[var(--text)]">Mute messages</span>
                    </div>
                    <div className="relative flex-shrink-0">
                        <input
                            id="mute-checkbox"
                            type="checkbox"
                            checked={muted}
                            onChange={toggleMute}
                            aria-labelledby="mute-label"
                            className="sr-only"
                        />
                        <label
                            htmlFor="mute-checkbox"
                            className={`w-10 h-5 rounded-full transition-colors cursor-pointer relative flex-shrink-0 block ${muted ? "bg-[var(--muted)]" : "bg-[var(--accent)]"}`}
                        >
                            <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all ${muted ? "left-0.5" : "left-5"}`} />
                        </label>
                    </div>
                </div>

                {/* Pin toggle */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border)]">
                    <div className="flex items-center gap-2">
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--muted)" strokeWidth="1.5">
                            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                        </svg>
                        <span 
                            id="pin-label"
                            className="text-sm text-[var(--text)]">
                                Pin chat
                        </span>
                    </div>
                    <div className="relative flex-shrink-0">
                        <input
                            id="pin-checkbox"
                            type="checkbox"
                            checked={pinned}
                            onChange={togglePin}
                            aria-labelledby="pin-label"
                            className="sr-only"
                        />
                        <label
                            htmlFor="pin-checkbox"
                            className={`w-10 h-5 rounded-full transition-colors cursor-pointer relative flex-shrink-0 block ${pinned ? "bg-[var(--accent)]" : "bg-[var(--muted)]/30"}`}
                        >
                            <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all ${pinned ? "left-5" : "left-0.5"}`} />
                        </label>
                    </div>
                </div>

                {/* Members */}
                <div className="py-2">
                    <div className="flex items-center justify-between px-4 py-2">
                        <p className="text-xs font-semibold text-[var(--text)]">Members</p>
                        <button 
                            aria-label="Add people to group"
                            className="text-xs text-[var(--accent)] bg-none border-none cursor-pointer">
                                Add people
                        </button>
                    </div>
                    {!loadedMembers ? (
                        <p className="px-4 text-xs text-[var(--muted)]">Loading...</p>
                    ) : members.length === 0 ? (
                        <p className="px-4 text-xs text-[var(--muted)]">No members</p>
                    ) : (
                        members.map(m => (
                            <div key={m.userId} className="flex items-center gap-3 px-4 py-2.5 hover:bg-[var(--surface2)] transition-colors">
                                <div className={`w-9 h-9 rounded-full flex-shrink-0 flex items-center justify-center text-sm font-bold text-white overflow-hidden ${getAvatarColor(m.user.name ?? "?")}`}>
                                    {m.user.image
                                        ? <img src={m.user.image} alt="" className="w-full h-full object-cover" />
                                        : m.user.name?.charAt(0)
                                    }
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-xs font-medium text-[var(--text)] truncate">{m.user.name}</p>
                                    <p className="text-[10px] text-[var(--muted)] truncate">{m.user.email}</p>
                                </div>
                                {m.role === "ADMIN" && (
                                    <span className="text-[9px] px-1.5 py-0.5 rounded-full border border-[var(--accent)]/30 text-[var(--accent)] flex-shrink-0">Admin</span>
                                )}
                            </div>
                        ))
                    )}
                </div>

                {/* Danger zone */}
                <div className="px-4 py-4 border-t border-[var(--border)] mt-2 flex flex-col gap-1">
                    {!showLeaveConfirm ? (
                        <button 
                            onClick={() => setShowLeaveConfirm(true)} 
                            aria-label="Initiate leave group"
                            className="text-sm text-red-400 text-left bg-none border-none cursor-pointer py-1.5 hover:text-red-300">
                            Leave chat
                        </button>
                    ) : (
                        <div className="p-3 rounded-xl border border-red-400/20 bg-red-400/5">
                            <p className="text-xs text-[var(--muted)] mb-3">You won&apos;t be able to send or receive messages unless someone adds you back.</p>
                            <div className="flex gap-2">
                                <button 
                                    onClick={() => setShowLeaveConfirm(false)} 
                                    aria-label="Cancel leave group"
                                    className="flex-1 py-1.5 rounded-lg text-xs border border-[var(--border)] bg-transparent text-[var(--muted)] cursor-pointer">Cancel</button>
                                <button 
                                    onClick={leaveGroup}   
                                    aria-label="Confirm leave group" 
                                    disabled={leaving} 
                                    className="flex-1 py-1.5 rounded-lg text-xs bg-red-500 text-white border-none cursor-pointer disabled:opacity-60">
                                    {leaving ? "Leaving..." : "Leave"}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}