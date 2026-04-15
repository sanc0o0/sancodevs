import { NextResponse } from "next/server";
import { put } from "@vercel/blob";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function POST(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get("resume") as File;

    if (!file) {
        return NextResponse.json({ error: "No file provided." }, { status: 400 });
    }

    if (file.size > 5 * 1024 * 1024) {
        return NextResponse.json({ error: "File too large. Max 5MB." }, { status: 400 });
    }

    const allowed = ["application/pdf", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"];
    if (!allowed.includes(file.type)) {
        return NextResponse.json({ error: "Only PDF or Word documents allowed." }, { status: 400 });
    }

    const blob = await put(`resumes/${session.user.id}-${Date.now()}-${file.name}`, file, {
        access: "public",
    });

    return NextResponse.json({ url: blob.url });
}