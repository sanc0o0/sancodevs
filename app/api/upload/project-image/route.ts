import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

// ─── POST /api/upload/project-image ──────────────────────────────────────────
// Accepts a multipart form with a single "file" field (image).
// Uploads to Cloudinary (or your existing provider) and returns the URL.
// Falls back gracefully if no cloud storage is configured.

const MAX_SIZE_MB = 5;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const formData = await req.formData();
        const file = formData.get("file") as File | null;

        if (!file) {
            return NextResponse.json({ error: "No file provided." }, { status: 400 });
        }

        // ── Validation ──────────────────────────────────────────────────────
        if (!ALLOWED_TYPES.includes(file.type)) {
            return NextResponse.json(
                { error: "Only JPEG, PNG, WebP, and GIF images are allowed." },
                { status: 400 }
            );
        }

        const sizeMB = file.size / (1024 * 1024);
        if (sizeMB > MAX_SIZE_MB) {
            return NextResponse.json(
                { error: `Image must be under ${MAX_SIZE_MB}MB.` },
                { status: 400 }
            );
        }

        // ── Upload to Cloudinary ────────────────────────────────────────────
        // Requires CLOUDINARY_CLOUD_NAME + CLOUDINARY_UPLOAD_PRESET in .env
        // Uses unsigned upload preset (no API secret needed client-side).
        const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
        const uploadPreset = process.env.CLOUDINARY_UPLOAD_PRESET;

        if (!cloudName || !uploadPreset) {
            return NextResponse.json(
                { error: "Image upload is not configured. Set CLOUDINARY_CLOUD_NAME and CLOUDINARY_UPLOAD_PRESET." },
                { status: 500 }
            );
        }

        const upload = new FormData();
        upload.append("file", file);
        upload.append("upload_preset", uploadPreset);
        upload.append("folder", "sancodevs/projects");

        const cloudRes = await fetch(
            `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
            { method: "POST", body: upload }
        );

        if (!cloudRes.ok) {
            const err = await cloudRes.json();
            console.error("CLOUDINARY_UPLOAD_ERROR:", err);
            return NextResponse.json(
                { error: "Image upload failed. Please try again." },
                { status: 500 }
            );
        }

        const data = await cloudRes.json();

        return NextResponse.json({
            url: data.secure_url as string,
            publicId: data.public_id as string,
            width: data.width as number,
            height: data.height as number,
        });

    } catch (error) {
        console.error("PROJECT_IMAGE_UPLOAD_ERROR:", error);
        return NextResponse.json({ error: "Internal server error." }, { status: 500 });
    }
}