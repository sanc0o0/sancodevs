// lib/auth-helpers.ts
// ─────────────────────────────────────────────────────────────────────────────
// Use this in every API route instead of session.user.id directly.
//
// WHY: NextAuth JWT strategy puts token.id from the jwt() callback into
// session.user.id. For credentials login this is always the DB User.id.
// For OAuth (first login), there's a brief window before the JWT refresh
// callback populates token.id where session.user.id can be undefined or
// the raw OAuth sub. Resolving by email (always present, always unique)
// is the guaranteed-safe approach for all auth methods.
//
// USAGE in any API route:
//   import { resolveDbUser } from "@/lib/auth-helpers";
//   const dbUser = await resolveDbUser(session);
//   if (!dbUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
//   const userId = dbUser.id; // always the real DB User.id
// ─────────────────────────────────────────────────────────────────────────────

import { prisma } from "@/lib/prisma";
import type { Session } from "next-auth";

export interface DbUserBasic {
    id: string;
    email: string;
    username: string | null;
    name: string | null;
}

/**
 * Resolves the real database User from a NextAuth session.
 * Always resolves by email — guaranteed unique and present for all auth methods.
 * Returns null if the session has no email or no matching user exists.
 */
export async function resolveDbUser(
    session: Session | null
): Promise<DbUserBasic | null> {
    if (!session?.user?.email) return null;

    const user = await prisma.user.findUnique({
        where: { email: session.user.email },
        select: { id: true, email: true, username: true, name: true },
    });

    return user ?? null;
}