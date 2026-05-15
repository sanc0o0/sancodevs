// lib/username.ts

import { prisma } from "@/lib/prisma";

const RESERVED_USERNAMES = [
    "admin",
    "root",
    "support",
    "api",
    "system",
    "sancodevs",
    "settings",
    "login",
    "signup",
    "explore",
    "dashboard",
    "profile",
    "users",
    "projects",
    "teams",
    "notifications",
    "messages",
    "billing",
    "security",
    "help",
    "contact",
    "about",
    "terms",
    "privacy",
    "status",
    "blog",
    "forum",
    "community",
    "developers",
    "manage",
    "administrator",
    ""
];


/// Convert email into clean username base
export function generateBaseUsername(email: string) {
    return email
        .split("@")[0]
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9_.]/g, "")
        .replace(/\.+/g, ".")
        .replace(/_+/g, "_")
        .slice(0, 20);
}


/// Ensure username is unique
export async function generateUniqueUsername(email: string) {
    let base = generateBaseUsername(email);

    // fallback if empty
    if (!base) {
        base = "user";
    }

    // avoid reserved names
    if (RESERVED_USERNAMES.includes(base)) {
        base = `${base}_user`;
    }

    const username = base;

    // check direct availability
    const existing = await prisma.user.findUnique({
        where: { username },
    });

    if (!existing) {
        return username;
    }

    // try numbered suffixes
    for (let i = 1; i <= 9999; i++) {
        const candidate = `${base}${i}`;

        const exists = await prisma.user.findUnique({
            where: {
                username: candidate,
            },
        });

        if (!exists) {
            return candidate;
        }
    }

    // ultra fallback
    return `${base}_${Date.now()}`;
}