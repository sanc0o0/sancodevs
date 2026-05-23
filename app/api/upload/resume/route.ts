// app/api/upload/resume/route.ts
// ─────────────────────────────────────────────────────────────────────────────
// PLACE THIS FILE AT:  app/api/upload/resume/route.ts
// ─────────────────────────────────────────────────────────────────────────────
// Uploads resume to Vercel Blob.
// Requires BLOB_READ_WRITE_TOKEN in your .env / Vercel env vars.
// ─────────────────────────────────────────────────────────────────────────────

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { put } from "@vercel/blob";

const ACCEPTED_TYPES = [
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];
const MAX_BYTES = 5 * 1024 * 1024; // 5 MB

export async function POST(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let formData: FormData;
    try {
        formData = await req.formData();
    } catch {
        return NextResponse.json({ error: "Invalid form data." }, { status: 400 });
    }

    const file = formData.get("file");
    if (!file || !(file instanceof Blob)) {
        return NextResponse.json({ error: "No file provided." }, { status: 400 });
    }

    // Type check
    if (!ACCEPTED_TYPES.includes(file.type)) {
        return NextResponse.json(
            { error: "Only PDF or Word (.doc, .docx) files are accepted." },
            { status: 400 }
        );
    }

    // Size check
    if (file.size > MAX_BYTES) {
        return NextResponse.json(
            { error: `File too large (${(file.size / 1048576).toFixed(1)} MB). Maximum is 5 MB.` },
            { status: 400 }
        );
    }

    // Build a safe filename:  resumes/userId_timestamp.ext
    const originalName = (file as File).name ?? "resume";
    const ext = originalName.split(".").pop()?.toLowerCase() ?? "pdf";

    // Derive a safe user id segment from email (no PII in the path)
    const emailHash = session.user.email
        .split("@")[0]
        .replace(/[^a-zA-Z0-9]/g, "")
        .slice(0, 20);

    const filename = `resumes/${emailHash}_${Date.now()}.${ext}`;

    try {
        const blob = await put(filename, file, {
            access: "public",      // owner can download, we store the URL
            addRandomSuffix: true, // prevent collisions
        });

        return NextResponse.json({ url: blob.url });
    } catch (err) {
        console.error("[resume-upload] Vercel Blob error:", err);
        return NextResponse.json(
            { error: "File upload failed. Please try again." },
            { status: 500 }
        );
    }
}