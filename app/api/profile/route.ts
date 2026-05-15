import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

// POST /api/profile
// Body: { field: "image" | "banner", value: string (data URL or URL) }
export async function POST(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { field, value } = body;

    if (!field || !value) {
        return NextResponse.json({ error: "Missing field or value" }, { status: 400 });
    }

    // Only allow safe fields
    const allowedFields = ["image", "banner"] as const;
    if (!allowedFields.includes(field)) {
        return NextResponse.json({ error: "Invalid field" }, { status: 400 });
    }

    // For now: store image (avatar) directly on User.image
    // Banner stored in UserPreferences as a custom field — add bannerUrl to schema if needed
    // Here we handle both:
    if (field === "image") {
        await prisma.user.update({
            where: { id: session.user.id },
            data: { image: value },
        });
    }

    // For banner: store in a generic way — you can add a `bannerUrl` field to User model later
    // For now we return success and the client holds it in state until schema is extended
    if (field === "banner") {
        // TODO: add bannerUrl String? to User model in schema.prisma then:
        // await prisma.user.update({ where: { id: session.user.id }, data: { bannerUrl: value } });
        // For now just acknowledge — client already updated local state
    }

    return NextResponse.json({ success: true });
}

export async function GET() {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { image: true },
    });

    return NextResponse.json({ image: user?.image ?? null, banner: null });
}