import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

// ─── Allowed direct User fields ──────────────────────────────────────────────
const USER_FIELDS = ["name", "bio", "image", "bannerImage"] as const;
type UserField = typeof USER_FIELDS[number];

// ─── GET /api/profile ─────────────────────────────────────────────────────────
export async function GET() {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id)
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: {
            id: true, name: true, bio: true, image: true,
            bannerImage: true, username: true, email: true,
            preferences: { select: { prefTechs: true, prefTopics: true } },
        },
    });

    return NextResponse.json(user);
}

// ─── POST /api/profile ────────────────────────────────────────────────────────
// Body: { field: string, value: unknown }
// Supported fields:
//   name, bio, image, bannerImage  → User table
//   prefTechs, prefTopics          → UserPreferences table
export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id)
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const { field, value } = await req.json();

        if (!field) {
            return NextResponse.json({ error: "Missing field." }, { status: 400 });
        }

        const userId = session.user.id;

        // ── Direct user fields ────────────────────────────────────────────────
        if ((USER_FIELDS as readonly string[]).includes(field)) {
            const key = field as UserField;

            // Validate string fields
            if (key === "name") {
                if (typeof value !== "string" || !value.trim())
                    return NextResponse.json({ error: "Name cannot be empty." }, { status: 400 });
                if (value.trim().length > 50)
                    return NextResponse.json({ error: "Name must be under 50 characters." }, { status: 400 });
            }
            if (key === "bio") {
                if (typeof value !== "string")
                    return NextResponse.json({ error: "Invalid bio." }, { status: 400 });
                if (value.length > 280)
                    return NextResponse.json({ error: "Bio must be under 280 characters." }, { status: 400 });
            }
            // image + bannerImage: must be a URL string or null
            if (key === "image" || key === "bannerImage") {
                if (value !== null && typeof value !== "string")
                    return NextResponse.json({ error: "Invalid image value." }, { status: 400 });
            }

            const updated = await prisma.user.update({
                where: { id: userId },
                data: { [key]: typeof value === "string" ? value.trim() : value },
                select: { id: true, [key]: true },
            });

            return NextResponse.json({ success: true, data: updated });
        }

        // ── UserPreferences fields ────────────────────────────────────────────
        if (field === "prefTechs" || field === "prefTopics") {
            if (!Array.isArray(value))
                return NextResponse.json({ error: "Value must be an array." }, { status: 400 });

            const prefs = await prisma.userPreferences.upsert({
                where: { userId },
                create: {
                    userId,
                    prefTechs: field === "prefTechs" ? value : [],
                    prefTopics: field === "prefTopics" ? value : [],
                },
                update: { [field]: value },
            });

            return NextResponse.json({ success: true, data: prefs });
        }

        return NextResponse.json({ error: `Unknown field: ${field}` }, { status: 400 });

    } catch (error) {
        console.error("PROFILE_UPDATE_ERROR:", error);
        return NextResponse.json({ error: "Internal server error." }, { status: 500 });
    }
}