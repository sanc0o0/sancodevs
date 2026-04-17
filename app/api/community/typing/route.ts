import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { pusher } from "@/lib/pusher";

export async function POST(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { groupId, isTyping } = await req.json();

    await pusher.trigger(`group-${groupId}`, isTyping ? "typing:start" : "typing:stop", {
        userId: session.user.id,
        userName: session.user.name,
    });

    return NextResponse.json({ success: true });
}