"use client";

import { useState } from "react";

interface Props { pathLabel: string; }

export default function CompletionActions({ pathLabel }: Props) {
    const [copied, setCopied] = useState(false);

    const linkedInPost = `I just completed the "${pathLabel}" learning path on @SancoDevs! 🚀

Instead of tutorial hell, SancoDevs helped me build real projects while learning.

Now shipping my first project.

If you're a developer stuck in tutorial hell — check out SancoDevs.

#coding #webdevelopment #buildinpublic #SancoDevs`;

    function copyAndShare() {
        navigator.clipboard.writeText(linkedInPost).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 3000);
            window.open("https://www.linkedin.com/feed/", "_blank");
        });
    }

    return (
        <div className="border border-[var(--border)] rounded-xl p-4 text-left bg-[var(--surface)]">
            <p className="text-xs font-medium text-[var(--text)] mb-2">Share your achievement</p>
            <div className="bg-[var(--surface2)] rounded-lg p-3 mb-3">
                <p className="text-xs text-[var(--muted)] leading-relaxed whitespace-pre-line">{linkedInPost}</p>
            </div>
            <button
                onClick={copyAndShare}
                aria-label="Copy post and open LinkedIn"
                className="w-full py-2.5 rounded-lg text-sm font-medium border-none cursor-pointer transition-all hover:opacity-85"
                style={{ background: "#0077B5", color: "#fff" }}
            >
                {copied ? "Copied! Opening LinkedIn..." : "Share on LinkedIn →"}
            </button>
        </div>
    );
}