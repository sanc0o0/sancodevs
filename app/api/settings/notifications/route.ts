import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    
    const { prefTechs, prefTopics } = await req.json();
    if (!Array.isArray(prefTechs) || !Array.isArray(prefTopics)) {
        return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }
    const unique = (arr: string[]) => [...new Set(arr)];

    const normalizedPrefTechs = unique(
        (prefTechs ?? []).map((t: string) => t.toLowerCase().trim())
    );

    const normalizedPrefTopics = unique(
        (prefTopics ?? []).map((t: string) => t.toLowerCase().trim())
    );

    await prisma.userPreferences.upsert({
        where: { userId: session.user.id },
        update: { prefTechs: normalizedPrefTechs, prefTopics: normalizedPrefTopics },
        create: { userId: session.user.id, prefTechs: normalizedPrefTechs, prefTopics: normalizedPrefTopics },
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