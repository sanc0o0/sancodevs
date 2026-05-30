"use client";

import { useRouter, usePathname } from "next/navigation";
import { useTransition } from "react";

const ALL_TABS = [
    { id: "overview", label: "Overview" },
    { id: "reliability", label: "Reliability" },
    { id: "projects", label: "Projects" },
    { id: "tasks", label: "Tasks" },
    { id: "achievements", label: "Achievements" },
    { id: "reputation", label: "Reputation" },
    { id: "timeline", label: "Timeline" },
    { id: "links", label: "Links" },
] as const;

type TabId = typeof ALL_TABS[number]["id"];

interface ProfileTabsProps {
    activeTab: string;
    isOwner: boolean;
    username: string;
}

export default function ProfileTabs({ activeTab, isOwner }: ProfileTabsProps) {
    const router = useRouter();
    const pathname = usePathname();
    const [isPending, startTransition] = useTransition();

    function navigate(tabId: TabId) {
        if (tabId === activeTab) return;
        startTransition(() => {
            router.push(`${pathname}?tab=${tabId}`, { scroll: false });
        });
    }

    const visibleTabs = ALL_TABS.filter((t) => {
        if (t.id === "tasks" && !isOwner) return false;
        return true;
    });

    return (
        <>
            <style>{`
        .pt-bar {
          display: flex;
          gap: 2px;
          background: var(--surface);
          border: 0.5px solid var(--border);
          border-radius: 10px;
          padding: 4px;
          overflow-x: auto;
          scrollbar-width: none;
          -ms-overflow-style: none;
        }
        .pt-bar::-webkit-scrollbar { display: none; }
        .pt-tab {
          flex-shrink: 0;
          padding: 6px 14px;
          border-radius: 7px;
          font-size: 12px;
          font-weight: 400;
          cursor: pointer;
          transition: background 0.12s, color 0.12s;
          border: none;
          background: transparent;
          color: var(--muted);
          font-family: var(--font-body);
          white-space: nowrap;
        }
        .pt-tab:hover { color: var(--text); background: var(--surface2); }
        .pt-tab.active { background: var(--surface2); color: var(--text); font-weight: 500; }
        .pt-tab.pending { opacity: 0.6; }
      `}</style>
            <div className="pt-bar" role="tablist" aria-label="Profile sections">
                {visibleTabs.map((tab) => (
                    <button
                        key={tab.id}
                        role="tab"
                        aria-selected={tab.id === activeTab}
                        className={`pt-tab ${tab.id === activeTab ? "active" : ""} ${isPending ? "pending" : ""}`}
                        onClick={() => navigate(tab.id as TabId)}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>
        </>
    );
}