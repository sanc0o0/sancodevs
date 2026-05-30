"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { WsEmptyState } from "./Created";
import { TabSkeleton } from "./Joined";
import type {
    WsArchivedData,
    WsArchivedProject,
    WsArchivedMembership,
} from "./types";

export default function Archived({ userId }: { userId: string }) {
    const [data, setData] = useState<WsArchivedData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch("/api/workspace/archived")
            .then((r) => r.json())
            .then((json) => {
                setData(json);
                setLoading(false);
            });
    }, []);

    if (loading) return <TabSkeleton />;

    const total = (data?.archivedCreated.length ?? 0) + (data?.archivedJoined.length ?? 0);

    if (total === 0) {
        return (
            <WsEmptyState
                icon={<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2"><polyline points="21 8 21 21 3 21 3 8" /><rect x="1" y="3" width="22" height="5" /><line x1="10" y1="12" x2="14" y2="12" /></svg>}
                title="No archived projects"
                subtitle="Projects you've closed out or left will appear here."
            />
        );
    }

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
            {/* ── Archived created ──────────────────────────── */}
            {data!.archivedCreated.length > 0 && (
                <section>
                    <p style={{ fontSize: "10px", color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "10px" }}>
                        Your projects
                    </p>
                    <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                        {data!.archivedCreated.map((p) => (
                            <ArchivedCard
                                key={p.id}
                                id={p.id}
                                title={p.title}
                                tagline={p.tagline}
                                domain={p.domain}
                                updatedAt={p.updatedAt}
                                members={p._count?.teams ?? 0}
                                label="Archived"
                            />
                        ))}
                    </div>
                </section>
            )}

            {/* ── Archived joined ───────────────────────────── */}
            {data!.archivedJoined.length > 0 && (
                <section>
                    <p style={{ fontSize: "10px", color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "10px" }}>
                        Participated in
                    </p>
                    <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                        {data!.archivedJoined.map((m) => (
                            <ArchivedCard
                                key={m.id}
                                id={m.project.id}
                                title={m.project.title}
                                tagline={m.project.tagline}
                                domain={m.project.domain}
                                updatedAt={m.project.updatedAt}
                                members={0}
                                label={m.role}
                            />
                        ))}
                    </div>
                </section>
            )}
        </div>
    );
}

function ArchivedCard({ id, title, tagline, domain, updatedAt, members, label }: {
    id: string; 
    title: string; 
    tagline?: string | null;
    domain?: string | null; 
    updatedAt: string | Date; 
    members: number; 
    label: string;
}) {
    return (
        <div
            style={{ border: "0.5px solid var(--border)", borderRadius: "8px", background: "var(--surface)", padding: "11px 13px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "10px", opacity: 0.7 }}
        >
            <div style={{ flex: 1, minWidth: 0 }}>
                <Link
                    href={`/projects/${id}`}
                    style={{ fontSize: "12px", fontWeight: 500, color: "var(--text)", textDecoration: "none", display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", marginBottom: "3px" }}
                >
                    {title}
                </Link>
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    {domain && (
                        <span style={{ fontSize: "10px", color: "var(--muted)" }}>{domain}</span>
                    )}
                    <span style={{ fontSize: "10px", color: "var(--muted)" }}>
                        Updated {fmt(updatedAt)}
                    </span>
                </div>
            </div>

            <span style={{ fontSize: "10px", color: "var(--muted)", padding: "2px 7px", borderRadius: "20px", border: "0.5px solid var(--border)", background: "var(--surface2)", whiteSpace: "nowrap", flexShrink: 0 }}>
                {label}
            </span>
        </div>
    );
}

function fmt(date: string | Date) {
    return new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}