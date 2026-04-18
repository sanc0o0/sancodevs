"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import Link from "next/link";
import { PATHS } from "@/lib/path";
import { CONTENT } from "@/lib/content"; // your content map

interface Props {
    moduleId: string;
    moduleIndex: number;
    pathId: string;
    totalModules: number;
    alreadyCompleted: boolean;
    hasContent: boolean; // pass from server — whether real content exists
}

export default function ModuleActions({
    moduleId, moduleIndex, pathId, totalModules, alreadyCompleted, hasContent
}: Props) {
    const router = useRouter();
    const [marking, setMarking] = useState(false);
    const [done, setDone] = useState(alreadyCompleted);

    const isLast = moduleIndex === totalModules - 1;
    const nextIndex = moduleIndex + 1;

    async function markComplete() {
        if (!hasContent) return; // Block fake completion
        setMarking(true);
        await fetch("/api/progress", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ pathId, moduleIndex }),
        });
        setDone(true);
        setMarking(false);

        if (isLast) {
            router.push(`/learn/complete?path=${pathId}`);
        } else {
            router.push(`/learn/${pathId}-${nextIndex}`);
        }
    }

    return (
        <div className="flex items-center justify-between pt-4 border-t border-[var(--border)] mt-6">
            {moduleIndex > 0 ? (
                <Link
                    href={`/learn/${pathId}-${moduleIndex - 1}`}
                    className="flex items-center gap-2 text-sm text-[var(--muted)] hover:text-[var(--text)] no-underline transition-colors"
                >
                    ← Previous
                </Link>
            ) : <div />}

            {!hasContent ? (
                <div className="text-xs text-[var(--muted)] px-4 py-2 rounded-lg border border-[var(--border)] bg-[var(--surface2)]">
                    Content coming soon — can&apos;t mark complete yet
                </div>
            ) : done ? (
                <span className="flex items-center gap-1.5 text-sm text-green-500">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <path d="M20 6L9 17l-5-5" />
                    </svg>
                    Completed
                </span>
            ) : (
                <button
                    onClick={markComplete}
                    disabled={marking}
                    aria-label="Mark module as complete"
                    className="px-5 py-2 rounded-lg text-sm font-medium bg-[var(--accent)] text-[var(--bg)] border-none cursor-pointer disabled:opacity-60 hover:opacity-85 transition-opacity active:scale-95"
                >
                    {marking ? "Saving..." : isLast ? "Complete path →" : "Mark complete →"}
                </button>
            )}
        </div>
    );
}