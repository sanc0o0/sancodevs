"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const links = [
    {
        label: "Dashboard",
        href: "/dashboard",
    },
    {
        label: "Projects",
        href: "/projects",
    },
    {
        label: "Community",
        href: "/community",
    },
    {
        label: "Applications",
        href: "/applications",
    },
    {
        label: "Notifications",
        href: "/notifications",
    },
    {
        label: "Profile",
        href: "/profile",
    },
    {
        label: "Settings",
        href: "/settings",
    },
];

export function AppSidebar() {
    const pathname = usePathname();

    return (
        <aside
            className="
        hidden lg:flex
        w-72
        border-r border-zinc-800
        bg-zinc-950/95
        backdrop-blur-xl
        flex-col
      "
        >
            <div className="border-b border-zinc-800 p-6">
                <h1 className="text-2xl font-bold tracking-tight">
                    Sancodevs
                </h1>

                <p className="mt-1 text-sm text-zinc-400">
                    Build real projects together
                </p>
            </div>

            <nav className="flex flex-1 flex-col gap-1 p-4">
                {links.map((link) => {
                    const active =
                        pathname === link.href ||
                        pathname.startsWith(link.href + "/");

                    return (
                        <Link
                            key={link.href}
                            href={link.href}
                            className={cn(
                                "rounded-xl px-4 py-3 text-sm transition-all",
                                active
                                    ? "bg-zinc-800 text-white"
                                    : "text-zinc-400 hover:bg-zinc-900 hover:text-white"
                            )}
                        >
                            {link.label}
                        </Link>
                    );
                })}
            </nav>

            <div className="border-t border-zinc-800 p-4">
                <button
                    className="
            w-full rounded-xl
            bg-indigo-500
            px-4 py-3
            text-sm font-medium
            transition hover:bg-indigo-400
          "
                >
                    Create Project
                </button>
            </div>
        </aside>
    );
}