"use client";

import { useState } from "react";

interface Props {
    onCreated: (group: {
        id: string; name: string; description: string | null;
        isPrivate: boolean; memberCount: number; muted: boolean; pinned: boolean; lastMessage: null;
    }) => void;
}

export default function CreateGroupButton({ onCreated }: Props) {
    const [open, setOpen] = useState(false);
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [emails, setEmails] = useState("");
    const [isPrivate, setIsPrivate] = useState(true); // default private
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError("");
        setLoading(true);
        try {
            const res = await fetch("/api/community/groups", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: name.trim(),
                    description: description.trim() || null,
                    isPrivate,
                    emails: emails.split(",").map(e => e.trim()).filter(Boolean),
                }),
            });
            if (res.ok) {
                const data = await res.json();
                onCreated({
                    id: data.id,
                    name: data.name,
                    description: data.description,
                    isPrivate: data.isPrivate,
                    memberCount: 1,
                    muted: false,
                    pinned: false,
                    lastMessage: null,
                });
                setOpen(false);
                setName(""); setDescription(""); setEmails(""); setIsPrivate(true);
            } else {
                const d = await res.json();
                setError(d.error ?? "Failed to create group.");
            }
        } catch {
            setError("Something went wrong.");
        }
        setLoading(false);
    }

    return (
        <>
            <button
                onClick={() => setOpen(true)}
                aria-label="Create new group"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-[var(--accent)] text-[var(--bg)] border-none cursor-pointer hover:opacity-85 transition-opacity"
            >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
                </svg>
                New group
            </button>

            {open && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
                    <div
                        className="w-full max-w-sm bg-[var(--surface)] border border-[var(--border)] rounded-2xl overflow-hidden shadow-2xl"
                        style={{ animation: "fadeUp 0.2s ease" }}
                    >
                        <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border)]">
                            <p className="text-sm font-semibold text-[var(--text)]">Create a group</p>
                            <button
                                onClick={() => setOpen(false)}
                                aria-label="Close"
                                className="text-[var(--muted)] hover:text-[var(--text)] bg-none border-none cursor-pointer text-xl leading-none"
                            >×</button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-5 flex flex-col gap-3">
                            <div>
                                <label className="text-xs text-[var(--muted)] block mb-1.5">Group name *</label>
                                <input
                                    className="form-input text-sm"
                                    value={name}
                                    onChange={e => setName(e.target.value)}
                                    placeholder="e.g. Next.js builders"
                                    required
                                    aria-label="Group name"
                                    autoFocus
                                />
                            </div>
                            <div>
                                <label className="text-xs text-[var(--muted)] block mb-1.5">Description</label>
                                <input
                                    className="form-input text-sm"
                                    value={description}
                                    onChange={e => setDescription(e.target.value)}
                                    placeholder="What's this group about?"
                                    aria-label="Group description"
                                />
                            </div>
                            <div>
                                <label className="text-xs text-[var(--muted)] block mb-1.5">
                                    Invite by email <span className="text-[var(--muted)]">(comma separated)</span>
                                </label>
                                <textarea
                                    className="form-input text-sm resize-none"
                                    rows={2}
                                    value={emails}
                                    onChange={e => setEmails(e.target.value)}
                                    placeholder="friend@example.com, other@example.com"
                                    aria-label="Invite emails"
                                />
                            </div>
                            <label className="flex items-center gap-2.5 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={isPrivate}
                                    onChange={e => setIsPrivate(e.target.checked)}
                                    className="rounded"
                                />
                                <span className="text-xs text-[var(--text)]">
                                    Private — members need admin approval to join
                                </span>
                            </label>

                            {error && <p className="text-xs text-red-400">{error}</p>}

                            <div className="flex gap-2 pt-1">
                                <button
                                    type="button"
                                    onClick={() => setOpen(false)}
                                    className="flex-1 py-2.5 rounded-xl text-sm border border-[var(--border)] bg-transparent text-[var(--muted)] cursor-pointer"
                                >Cancel</button>
                                <button
                                    type="submit"
                                    disabled={loading || !name.trim()}
                                    className="flex-1 py-2.5 rounded-xl text-sm bg-[var(--accent)] text-[var(--bg)] border-none cursor-pointer font-medium disabled:opacity-50"
                                >
                                    {loading ? "Creating..." : "Create"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
}