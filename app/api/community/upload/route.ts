import { NextResponse } from "next/server";
import { put } from "@vercel/blob";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function POST(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const formData = await req.formData();
    const file = formData.get("file") as File;
    if (!file) return NextResponse.json({ error: "No file." }, { status: 400 });

    if (file.size > 20 * 1024 * 1024) {
        return NextResponse.json({ error: "Max 20MB." }, { status: 400 });
    }

    const isImage = file.type.startsWith("image/");
    const isVideo = file.type.startsWith("video/");
    if (!isImage && !isVideo) {
        return NextResponse.json({ error: "Only images and videos allowed." }, { status: 400 });
    }

    const blob = await put(`chat/${session.user.id}-${Date.now()}-${file.name}`, file, { access: "public" });

    return NextResponse.json({
        url: blob.url,
        type: isImage ? "image" : "video",
    });
}