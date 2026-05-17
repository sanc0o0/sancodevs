import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

// ─── POST /api/upload/profile-image ──────────────────────────────────────────
// Accepts multipart with "file" + "type" ("avatar" | "banner")
// Uploads to Cloudinary and returns { url }
// Then the client calls PATCH /api/profile to persist the URL

const MAX_MB = 5;
const ALLOWED = ["image/jpeg", "image/png", "image/webp", "image/gif"];

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id)
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const formData = await req.formData();
        const file = formData.get("file") as File | null;
        const type = (formData.get("type") as string | null) ?? "avatar";

        if (!file)
            return NextResponse.json({ error: "No file provided." }, { status: 400 });

        if (!ALLOWED.includes(file.type))
            return NextResponse.json({ error: "Only JPEG, PNG, WebP, or GIF allowed." }, { status: 400 });

        if (file.size / (1024 * 1024) > MAX_MB)
            return NextResponse.json({ error: `Image must be under ${MAX_MB}MB.` }, { status: 400 });

        const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
        const uploadPreset = process.env.CLOUDINARY_UPLOAD_PRESET;

        if (!cloudName || !uploadPreset)
            return NextResponse.json({ error: "Image upload not configured." }, { status: 500 });

        const upload = new FormData();
        upload.append("file", file);
        upload.append("upload_preset", uploadPreset);
        upload.append("folder", `sancodevs/profiles/${type === "banner" ? "banners" : "avatars"}`);

        const cloudRes = await fetch(
            `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
            { method: "POST", body: upload }
        );

        if (!cloudRes.ok) {
            const err = await cloudRes.json();
            console.error("CLOUDINARY_ERROR:", err);
            return NextResponse.json({ error: "Upload failed. Try again." }, { status: 500 });
        }

        const data = await cloudRes.json();
        return NextResponse.json({ url: data.secure_url as string });

    } catch (error) {
        console.error("PROFILE_IMAGE_UPLOAD_ERROR:", error);
        return NextResponse.json({ error: "Internal server error." }, { status: 500 });
    }
}