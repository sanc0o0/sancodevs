"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { WsEmptyState } from "./Created";
import type { WsMembership } from "./types";

interface JoinedProps {
    userId: string;
}

const PHASE_LABELS: Record<string, string> = {
    IDEA: "Idea", PLANNING: "Planning", BUILDING: "Building",
    TESTING: "Testing", LAUNCHED: "Launched",
};

const PERM_COLORS: Record<string, string> = {
    OWNER: "#8b5cf6", LEAD: "#3b82f6", CORE: "#22c55e", CONTRIBUTOR: "var(--muted)",
};

export default function Joined({ userId }: JoinedProps) {
    const [memberships, setMemberships] = useState<WsMembership[]>([]);
    const [loading, setLoading] = useState(true);
    const [nextCursor, setNextCursor] = useState<string | null>(null);
    const [loadingMore, setLoadingMore] = useState(false);

    async function load(cursor?: string) {
        const url = cursor
            ? `/api/workspace/joined?cursor=${cursor}`
            : `/api/workspace/joined`;
        const res = await fetch(url);
        const json = await res.json();
        return json;
    }

    useEffect(() => {
        load().then(({ data, nextCursor }) => {
            setMemberships(data);
            setNextCursor(nextCursor);
            setLoading(false);
        });
    }, []);

    async function loadMore() {
        if (!nextCursor) return;
        setLoadingMore(true);
        const { data, nextCursor: nc } = await load(nextCursor);
        setMemberships((prev) => [...prev, ...data]);
        setNextCursor(nc);
        setLoadingMore(false);
    }

    if (loading) return <TabSkeleton />;

    if (memberships.length === 0) {
        return (
            <WsEmptyState
                icon={<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /></svg>}
                title="Not part of any projects yet"
                subtitle="Apply to open projects and get accepted to see them here."
                action={{ label: "Browse projects", href: "/projects" }}
            />
        );
    }

    return (
        <div>
            <p style={{ fontSize: "11px", color: "var(--muted)", marginBottom: "12px" }}>
                {memberships.length} project{memberships.length !== 1 ? "s" : ""}
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {memberships.map((m) => {
                    const p = m.project;
                    const myTasks = p._count?.tasks ?? 0;
                    return (
                        <div
                            key={m.id}
                            className="card-hover"
                            style={{ border: "0.5px solid var(--border)", borderRadius: "9px", background: "var(--surface)", overflow: "hidden" }}
                        >
                            <div style={{ padding: "13px 14px 10px", display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "10px" }}>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <Link href={`/projects/${p.id}`} style={{ fontSize: "13px", fontWeight: 500, color: "var(--text)", textDecoration: "none", display: "block", marginBottom: "5px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                        {p.title}
                                    </Link>
                                    <div style={{ display: "flex", alignItems: "center", gap: "7px" }}>
                                        <span style={{ fontSize: "10px", padding: "2px 6px", borderRadius: "20px", border: "0.5px solid var(--border)", background: "var(--surface2)", color: PERM_COLORS[m.permissionLevel] ?? "var(--muted)" }}>
                                            {m.role}
                                        </span>
                                        <span style={{ fontSize: "10px", color: "var(--muted)" }}>
                                            Joined {fmt(m.joinedAt)}
                                        </span>
                                        {myTasks > 0 && (
                                            <span style={{ fontSize: "10px", color: "var(--muted)" }}>
                                                · {myTasks} task{myTasks !== 1 ? "s" : ""}
                                            </span>
                                        )}
                                    </div>
                                </div>
                                <span style={{ fontSize: "10px", color: "var(--muted)", padding: "2px 7px", borderRadius: "20px", border: "0.5px solid var(--border)", background: "var(--surface2)", whiteSpace: "nowrap", flexShrink: 0 }}>
                                    {PHASE_LABELS[p.phase] ?? p.phase}
                                </span>
                            </div>
                            <div style={{ borderTop: "0.5px solid var(--border)", padding: "7px 10px", display: "flex", gap: "5px" }}>
                                <MiniLink href={`/projects/${p.id}`} label="View project" />
                                <MiniLink href={`/projects/${p.id}/board`} label="Task board" />
                            </div>
                        </div>
                    );
                })}
            </div>

            {nextCursor && (
                <button
                    onClick={loadMore}
                    disabled={loadingMore}
                    style={{ marginTop: "12px", width: "100%", padding: "8px", fontSize: "11px", color: "var(--muted)", background: "transparent", border: "0.5px solid var(--border)", borderRadius: "7px", cursor: "pointer" }}
                >
                    {loadingMore ? "Loading..." : "Load more"}
                </button>
            )}
        </div>
    );
}

function fmt(date: string | Date) {
    return new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function MiniLink({ href, label }: { href: string; label: string }) {
    return (
        <Link href={href} className="link-hover" style={{ fontSize: "11px", color: "var(--muted)", textDecoration: "none", padding: "3px 9px", borderRadius: "5px", border: "0.5px solid var(--border)", background: "var(--surface2)" }}>
            {label}
        </Link>
    );
}

export function TabSkeleton() {
    return (
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {[1, 2, 3].map((i) => (
                <div key={i} style={{ height: "80px", borderRadius: "9px", background: "var(--surface)", border: "0.5px solid var(--border)", opacity: 0.6 }} />
            ))}
        </div>
    );
}