import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { prefTechs, prefTopics } = await req.json();

    await prisma.userPreferences.upsert({
        where: { userId: session.user.id },
        update: { prefTechs, prefTopics },
        create: { userId: session.user.id, prefTechs, prefTopics },
    });

    return NextResponse.json({ success: true });
}

export async function GET() {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ prefTechs: [], prefTopics: [] });

    const prefs = await prisma.userPreferences.findUnique({
        where: { userId: session.user.id },
    });

    return NextResponse.json({
        prefTechs: prefs?.prefTechs ?? [],
        prefTopics: prefs?.prefTopics ?? [],
    });
}