"use client";
import { useRouter } from "next/navigation";

export default function BackButton({ href, label = "Back" }: { href?: string; label?: string }) {
    const router = useRouter();
    return (
        <button
            onClick={() => href ? router.push(href) : router.back()}
            aria-label={`Go back: ${label}`}
            className="flex items-center gap-1.5 text-xs text-[var(--muted)] hover:text-[var(--text)] bg-none border-none cursor-pointer transition-colors mb-4 p-0"
        >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="15 18 9 12 15 6" />
            </svg>
            {label}
        </button>
    );
}