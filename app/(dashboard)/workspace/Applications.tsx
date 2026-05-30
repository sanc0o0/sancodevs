"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { WsEmptyState } from "./Created";
import { TabSkeleton } from "./Joined";
import type { WsApplication } from "./types";

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
    PENDING: { label: "Pending", color: "#f59e0b", bg: "rgba(245,158,11,0.08)" },
    REVIEWING: { label: "Reviewing", color: "#3b82f6", bg: "rgba(59,130,246,0.08)" },
    ACCEPTED: { label: "Accepted", color: "#22c55e", bg: "rgba(34,197,94,0.08)" },
    REJECTED: { label: "Rejected", color: "#ef4444", bg: "rgba(239,68,68,0.08)" },
};

const FILTERS = ["ALL", "PENDING", "REVIEWING", "ACCEPTED", "REJECTED"];

export default function Applications({ userId }: { userId: string }) {
    const [filter, setFilter] = useState("ALL");
    const [apps, setApps] = useState<WsApplication[]>([]);
    const [loading, setLoading] = useState(true);
    const [nextCursor, setNextCursor] = useState<string | null>(null);
    const [loadingMore, setLoadingMore] = useState(false);

    async function load(status?: string, cursor?: string) {
        const params = new URLSearchParams();
        if (status && status !== "ALL") params.set("status", status);
        if (cursor) params.set("cursor", cursor);
        const res = await fetch(`/api/workspace/applications?${params}`);
        return res.json();
    }

    useEffect(() => {
        setLoading(true);
        load(filter).then(({ data, nextCursor }) => {
            setApps(data);
            setNextCursor(nextCursor);
            setLoading(false);
        });
    }, [filter]);

    async function loadMore() {
        if (!nextCursor) return;
        setLoadingMore(true);
        const { data, nextCursor: nc } = await load(filter, nextCursor);
        setApps((prev) => [...prev, ...data]);
        setNextCursor(nc);
        setLoadingMore(false);
    }

    return (
        <div>
            {/* Filter pills */}
            <div style={{ display: "flex", gap: "5px", marginBottom: "14px", flexWrap: "wrap" }}>
                {FILTERS.map((f) => (
                    <button
                        key={f}
                        onClick={() => setFilter(f)}
                        style={{
                            fontSize: "11px", padding: "3px 10px", borderRadius: "20px",
                            border: "0.5px solid var(--border)",
                            background: filter === f ? "var(--surface2)" : "transparent",
                            color: filter === f ? "var(--text)" : "var(--muted)",
                            cursor: "pointer",
                        }}
                    >
                        {f === "ALL" ? "All" : STATUS_CONFIG[f].label}
                    </button>
                ))}
            </div>

            {loading ? (
                <TabSkeleton />
            ) : apps.length === 0 ? (
                <WsEmptyState
                    icon={<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /></svg>}
                    title={filter === "ALL" ? "No applications yet" : `No ${STATUS_CONFIG[filter]?.label.toLowerCase()} applications`}
                    subtitle="Find a project you're excited about and apply."
                    action={{ label: "Browse projects", href: "/projects" }}
                />
            ) : (
                <>
                    <p style={{ fontSize: "11px", color: "var(--muted)", marginBottom: "10px" }}>
                        {apps.length} application{apps.length !== 1 ? "s" : ""}
                    </p>
                    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                        {apps.map((app) => {
                            const sc = STATUS_CONFIG[app.status] ?? STATUS_CONFIG.PENDING;
                            return (
                                <div
                                    key={app.id}
                                    className="card-hover"
                                    style={{ border: "0.5px solid var(--border)", borderRadius: "9px", background: "var(--surface)", overflow: "hidden" }}
                                >
                                    <div style={{ padding: "13px 14px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "10px" }}>
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <Link
                                                href={`/projects/${app.project.id}`}
                                                style={{ fontSize: "13px", fontWeight: 500, color: "var(--text)", textDecoration: "none", display: "block", marginBottom: "4px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
                                            >
                                                {app.project.title}
                                            </Link>
                                            <div style={{ display: "flex", alignItems: "center", gap: "7px" }}>
                                                {app.desiredRole && (
                                                    <span style={{ fontSize: "10px", color: "var(--muted)", padding: "1px 6px", borderRadius: "20px", border: "0.5px solid var(--border)", background: "var(--surface2)" }}>
                                                        {app.desiredRole}
                                                    </span>
                                                )}
                                                <span style={{ fontSize: "10px", color: "var(--muted)" }}>
                                                    Applied {fmt(app.createdAt)}
                                                </span>
                                                {app.reviewedAt && (
                                                    <span style={{ fontSize: "10px", color: "var(--muted)" }}>
                                                        · Reviewed {fmt(app.reviewedAt)}
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        {/* Status badge */}
                                        <span style={{ fontSize: "10px", padding: "3px 8px", borderRadius: "20px", background: sc.bg, color: sc.color, fontWeight: 500, whiteSpace: "nowrap", flexShrink: 0 }}>
                                            {sc.label}
                                        </span>
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
                </>
            )}
        </div>
    );
}

function fmt(date: string | Date) {
    return new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}