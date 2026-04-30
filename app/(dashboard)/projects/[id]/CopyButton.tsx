"use client";
import { useState } from "react";

export default function CopyButton({ text, displayText }: { text: string; displayText: string }) {
    const [copied, setCopied] = useState(false);

    function handleCopy() {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    }

    return (
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <span style={{ fontSize: "12px", color: "var(--text)", fontWeight: 500, fontFamily: "monospace" }}>
                {displayText}
            </span>
            <button
                onClick={handleCopy}
                style={{
                    fontSize: "10px", color: copied ? "var(--accent)" : "var(--muted)",
                    background: "none", cursor: "pointer", padding: "2px 6px",
                    borderRadius: "4px", transition: "color 0.15s",
                    border: "0.5px solid var(--border)",
                }}
            >
                {copied ? "Copied ✓" : "copy"}
            </button>
        </div>
    );
}