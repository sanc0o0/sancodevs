// components/ui/UserAvatar.tsx
// Profile links use /user/username — NO @ prefix (@ breaks Next.js routing)

"use client";

import Image from "next/image";
import Link from "next/link";

interface Props {
    userId: string;
    name: string;
    image: string | null | undefined;
    username?: string | null;
    size?: number;
    showTooltip?: boolean;
    clickable?: boolean;
}

export default function UserAvatar({
    userId, name, image, username,
    size = 32, showTooltip = false, clickable = true,
}: Props) {
   const href = username ? `/user/${username}` : `/user/${userId}`;

    const inner = (
        <div
            title={showTooltip ? (name ?? username ?? "") : undefined}
            style={{
                width: size, height: size, borderRadius: "50%",
                overflow: "hidden", border: "1.5px solid var(--border)",
                background: "var(--surface2)", flexShrink: 0,
                display: "flex", alignItems: "center", justifyContent: "center",
                cursor: clickable ? "pointer" : "default",
                transition: "border-color 0.15s",
            }}
            onMouseEnter={e => clickable && ((e.currentTarget as HTMLDivElement).style.borderColor = "var(--accent)")}
            onMouseLeave={e => clickable && ((e.currentTarget as HTMLDivElement).style.borderColor = "var(--border)")}
        >
            {image
                ? <Image src={image} alt={name} width={size} height={size} style={{ objectFit: "cover", width: "100%", height: "100%" }} />
                : <span style={{ fontSize: size * 0.38, fontWeight: 700, color: "var(--text)" }}>
                    {(name ?? "?").charAt(0).toUpperCase()}
                </span>
            }
        </div>
    );

    if (!clickable) return inner;

    return (
        <Link href={href} style={{ display: "flex", flexShrink: 0 }}>
            {inner}
        </Link>
    );
}