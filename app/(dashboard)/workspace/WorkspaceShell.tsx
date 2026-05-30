"use client";

import { useState, useCallback } from "react";
import CreatedTab from "./Created";
import JoinedTab from "./Joined";
import ApplicationsTab from "./Applications";
import TasksTab from "./Tasks";
import ActivityTab from "./Activity";
import SavedTab from "./Saved";
import ArchivedTab from "./Archived";
import type { WsCreatedProject } from "./types";

// ─── Tab definitions ──────────────────────────────────────────
const TABS = [
    {
        id: "created",
        label: "Created",
        icon: (
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <rect x="3" y="3" width="7" height="7" rx="1" />
                <rect x="14" y="3" width="7" height="7" rx="1" />
                <rect x="3" y="14" width="7" height="7" rx="1" />
                <rect x="14" y="14" width="7" height="7" rx="1" />
            </svg>
        ),
    },
    {
        id: "joined",
        label: "Joined",
        icon: (
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
        ),
    },
    {
        id: "applications",
        label: "Applications",
        icon: (
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
            </svg>
        ),
    },
    {
        id: "tasks",
        label: "Tasks",
        icon: (
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <polyline points="9 11 12 14 22 4" />
                <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
            </svg>
        ),
    },
    {
        id: "activity",
        label: "Activity",
        icon: (
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
            </svg>
        ),
    },
    {
        id: "saved",
        label: "Saved",
        icon: (
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
            </svg>
        ),
    },
    {
        id: "archived",
        label: "Archived",
        icon: (
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <polyline points="21 8 21 21 3 21 3 8" />
                <rect x="1" y="3" width="22" height="5" />
                <line x1="10" y1="12" x2="14" y2="12" />
            </svg>
        ),
    },
] as const;

type TabId = (typeof TABS)[number]["id"];

// ─── Props ────────────────────────────────────────────────────
interface WorkspaceShellProps {
    userId: string;
    tabCounts: Record<TabId, number>;
    initialCreatedProjects: WsCreatedProject[];
}

export default function WorkspaceShell({
    userId,
    tabCounts,
    initialCreatedProjects,
}: WorkspaceShellProps) {
    const [activeTab, setActiveTab] = useState<TabId>("created");
    // Track which tabs have been visited so we mount them once and keep state
    const [visited, setVisited] = useState<Set<TabId>>(new Set(["created"]));

    const switchTab = useCallback((tab: TabId) => {
        setActiveTab(tab);
        setVisited((prev) => new Set(prev).add(tab));
    }, []);

    return (
        <div style={{ minHeight: "100%", background: "var(--bg)" }}>
            {/* ── Header ───────────────────────────────────────── */}
            <div
                style={{
                    borderBottom: "0.5px solid var(--border)",
                    padding: "1.5rem 1.5rem 0",
                }}
            >
                <h1
                    style={{
                        fontSize: "14px",
                        fontWeight: 500,
                        color: "var(--text)",
                        marginBottom: "1.25rem",
                        letterSpacing: "-0.01em",
                    }}
                >
                    Workspace
                </h1>

                {/* ── Tab bar ──────────────────────────────────── */}
                <div
                    style={{
                        display: "flex",
                        overflowX: "auto",
                        scrollbarWidth: "none",
                        gap: 0,
                    }}
                >
                    {TABS.map((tab) => {
                        const active = activeTab === tab.id;
                        const count = tabCounts[tab.id];
                        return (
                            <button
                                key={tab.id}
                                onClick={() => switchTab(tab.id)}
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "6px",
                                    padding: "8px 14px",
                                    fontSize: "12px",
                                    fontWeight: active ? 500 : 400,
                                    color: active ? "var(--text)" : "var(--muted)",
                                    background: "transparent",
                                    border: "none",
                                    borderBottom: active
                                        ? "1.5px solid var(--text)"
                                        : "1.5px solid transparent",
                                    cursor: "pointer",
                                    whiteSpace: "nowrap",
                                    transition: "color 0.15s",
                                    marginBottom: "-0.5px",
                                }}
                            >
                                <span style={{ color: active ? "var(--text)" : "var(--muted)", transition: "color 0.15s" }}>
                                    {tab.icon}
                                </span>
                                {tab.label}
                                {count > 0 && (
                                    <span
                                        style={{
                                            fontSize: "10px",
                                            padding: "1px 6px",
                                            borderRadius: "20px",
                                            background: active ? "var(--surface2)" : "var(--surface)",
                                            color: active ? "var(--text)" : "var(--muted)",
                                            fontWeight: 500,
                                            lineHeight: "16px",
                                        }}
                                    >
                                        {count}
                                    </span>
                                )}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* ── Tab panels — mount-once pattern ──────────────── */}
            {/* Created is pre-hydrated from server; others fetch on first visit */}
            <div style={{ padding: "1.5rem" }}>
                <TabPanel active={activeTab === "created"}>
                    <CreatedTab
                        initialProjects={initialCreatedProjects}
                        userId={userId}
                    />
                </TabPanel>

                <TabPanel active={activeTab === "joined"}>
                    {visited.has("joined") && <JoinedTab userId={userId} />}
                </TabPanel>

                <TabPanel active={activeTab === "applications"}>
                    {visited.has("applications") && <ApplicationsTab userId={userId} />}
                </TabPanel>

                <TabPanel active={activeTab === "tasks"}>
                    {visited.has("tasks") && <TasksTab userId={userId} />}
                </TabPanel>

                <TabPanel active={activeTab === "activity"}>
                    {visited.has("activity") && <ActivityTab userId={userId} />}
                </TabPanel>

                <TabPanel active={activeTab === "saved"}>
                    {visited.has("saved") && <SavedTab userId={userId} />}
                </TabPanel>

                <TabPanel active={activeTab === "archived"}>
                    {visited.has("archived") && <ArchivedTab userId={userId} />}
                </TabPanel>
            </div>

            <style>{`
        @keyframes wsIn {
          from { opacity: 0; transform: translateY(5px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
        </div>
    );
}

// ─── TabPanel — display:none keeps DOM, avoids remount ────────
function TabPanel({
    active,
    children,
}: {
    active: boolean;
    children: React.ReactNode;
}) {
    return (
        <div
            style={{
                display: active ? "block" : "none",
                animation: active ? "wsIn 0.18s ease both" : "none",
            }}
        >
            {children}
        </div>
    );
}