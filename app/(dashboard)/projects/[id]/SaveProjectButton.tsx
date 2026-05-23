"use client";

// app/(dashboard)/projects/[id]/SaveProjectButton.tsx

import { useState, useEffect } from "react";

interface Props {
    projectId: string;
    initialSaved?: boolean; // pass from server if you pre-fetched, else omit
}

export default function SaveProjectButton({ projectId, initialSaved }: Props) {
    const [saved, setSaved] = useState(initialSaved ?? false);
    const [loading, setLoading] = useState(initialSaved === undefined);
    const [acting, setActing] = useState(false);

    // If initialSaved wasn't pre-fetched, fetch on mount
    useEffect(() => {
        if (initialSaved !== undefined) return;
        fetch(`/api/projects/save?projectId=${projectId}`)
            .then(r => r.ok ? r.json() : { saved: false })
            .then(d => setSaved(d.saved))
            .catch(() => { })
            .finally(() => setLoading(false));
    }, [projectId, initialSaved]);

    async function toggle() {
        if (acting) return;
        setActing(true);
        // Optimistic update
        setSaved(prev => !prev);
        try {
            const res = await fetch("/api/projects/save", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ projectId }),
            });
            if (res.ok) {
                const data = await res.json();
                setSaved(data.saved);
            } else {
                // Revert on failure
                setSaved(prev => !prev);
            }
        } catch {
            setSaved(prev => !prev);
        }
        setActing(false);
    }

    if (loading) {
        return (
            <div
                style={{
                    width: 34, height: 34, borderRadius: 8,
                    border: "0.5px solid var(--border)",
                    background: "var(--surface2)",
                    opacity: 0.5,
                }}
            />
        );
    }

    return (
        <button
            onClick={toggle}
            disabled={acting}
            title={saved ? "Remove from saved" : "Save project"}
            aria-label={saved ? "Remove from saved" : "Save project"}
            style={{
                width: 34, height: 34, borderRadius: 8,
                border: `0.5px solid ${saved ? "var(--accent)" : "var(--border)"}`,
                background: saved ? "var(--accent)" : "transparent",
                color: saved ? "var(--bg)" : "var(--muted)",
                cursor: acting ? "wait" : "pointer",
                display: "flex", alignItems: "center", justifyContent: "center",
                transition: "all 0.15s ease",
                flexShrink: 0,
                padding: 0,
            }}
        >
            {/* Bookmark icon */}
            <svg
                width="14" height="14" viewBox="0 0 24 24" fill={saved ? "currentColor" : "none"}
                stroke="currentColor" strokeWidth="1.8"
                style={{ transition: "fill 0.15s ease" }}
            >
                <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
            </svg>
        </button>
    );
}