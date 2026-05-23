// app/api/projects/apply/route.ts
// ─────────────────────────────────────────────────────────────────────────────
// PLACE THIS FILE AT:  app/api/projects/apply/route.ts
// ─────────────────────────────────────────────────────────────────────────────

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function isValidUrl(raw: string | null | undefined): boolean {
    if (!raw?.trim()) return false;
    try {
        const u = new URL(raw.trim());
        return u.protocol === "https:" || u.protocol === "http:";
    } catch { return false; }
}

function isGithubUrl(raw: string | null | undefined): boolean {
    if (!raw?.trim()) return false;
    try {
        const u = new URL(raw.trim());
        return (
            u.hostname === "github.com" &&
            u.pathname.replace(/\/$/, "").length > 1
        );
    } catch { return false; }
}

function containsSpam(s: string): boolean {
    return (
        /\b(click here|free money|crypto|nft|telegram|whatsapp me|buy now)\b/i.test(s) ||
        /(.)\1{8,}/.test(s)
    );
}

// ─── POST ─────────────────────────────────────────────────────────────────────

export async function POST(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // ── CRITICAL FIX: resolve user by EMAIL, not session.user.id ─────────────
    // session.user.id can be an OAuth providerAccountId that doesn't match
    // the User table's primary key. Email is the only reliable unique identifier.
    const dbUser = await prisma.user.findUnique({
        where: { email: session.user.email },
        select: { id: true, name: true, username: true },
    });

    if (!dbUser) {
        return NextResponse.json({ error: "User account not found." }, { status: 404 });
    }

    const userId = dbUser.id; // ← always the real DB id from here on

    // ── Parse body ────────────────────────────────────────────────────────────
    let body: Record<string, unknown>;
    try {
        body = await req.json();
    } catch {
        return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
    }

    const {
        projectId,
        message,
        pitch,
        desiredRole,
        availability,
        resumeUrl,
        portfolioUrl,
        githubUrl,
        linkedinUrl,
    } = body as Record<string, string | null | undefined>;

    // ── Required field validation ─────────────────────────────────────────────
    if (!projectId || typeof projectId !== "string") {
        return NextResponse.json({ error: "Missing project." }, { status: 400 });
    }
    if (!desiredRole?.trim()) {
        return NextResponse.json({ error: "Please select a desired role." }, { status: 400 });
    }
    if (!availability?.trim()) {
        return NextResponse.json({ error: "Please select your availability." }, { status: 400 });
    }

    const pitchTrimmed = pitch?.trim() ?? "";
    if (!pitchTrimmed) {
        return NextResponse.json({ error: "A pitch is required." }, { status: 400 });
    }
    if (pitchTrimmed.split(/\s+/).filter(Boolean).length < 15) {
        return NextResponse.json({ error: "Pitch must be at least 15 words." }, { status: 400 });
    }
    if (pitchTrimmed.length > 1500) {
        return NextResponse.json({ error: "Pitch exceeds maximum length." }, { status: 400 });
    }

    if (!githubUrl?.trim() || !isGithubUrl(githubUrl)) {
        return NextResponse.json({ error: "A valid GitHub profile URL is required." }, { status: 400 });
    }
    if (!resumeUrl?.trim() || !isValidUrl(resumeUrl)) {
        return NextResponse.json({ error: "A valid resume URL is required." }, { status: 400 });
    }

    // ── Optional URL validation ───────────────────────────────────────────────
    if (portfolioUrl?.trim() && !isValidUrl(portfolioUrl)) {
        return NextResponse.json({ error: "Portfolio URL is not a valid URL." }, { status: 400 });
    }
    if (linkedinUrl?.trim() && !isValidUrl(linkedinUrl)) {
        return NextResponse.json({ error: "LinkedIn URL is not a valid URL." }, { status: 400 });
    }

    // ── Spam checks ───────────────────────────────────────────────────────────
    for (const field of [message, pitchTrimmed]) {
        if (field && containsSpam(field)) {
            return NextResponse.json(
                { error: "Your application contains prohibited content. Please revise it." },
                { status: 400 }
            );
        }
    }

    // ── Message length cap ────────────────────────────────────────────────────
    if (message && message.length > 500) {
        return NextResponse.json({ error: "Message exceeds 500 characters." }, { status: 400 });
    }

    // ── Project checks ────────────────────────────────────────────────────────
    const project = await prisma.project.findUnique({ where: { id: projectId } });
    if (!project) {
        return NextResponse.json({ error: "Project not found." }, { status: 404 });
    }
    if (project.createdBy === userId) {
        return NextResponse.json({ error: "You own this project." }, { status: 400 });
    }
    if (!project.hiringOpen || project.status === "ARCHIVED" || project.status === "COMPLETED") {
        return NextResponse.json({ error: "This project is not currently accepting applications." }, { status: 400 });
    }

    // ── Already applied? ──────────────────────────────────────────────────────
    const existing = await prisma.projectApplication.findUnique({
        where: { projectId_userId: { projectId, userId } },
    });
    if (existing) {
        return NextResponse.json({ error: "You have already applied to this project." }, { status: 409 });
    }

    // ── Already a member? ─────────────────────────────────────────────────────
    const isMember = await prisma.teamMember.findUnique({
        where: { projectId_userId: { projectId, userId } },
    });
    if (isMember) {
        return NextResponse.json({ error: "You are already a member of this project." }, { status: 409 });
    }

    // ── Create application ────────────────────────────────────────────────────
    await prisma.projectApplication.create({
        data: {
            projectId,
            userId,                                  // ← real DB id, not session id
            message: message?.trim() || null,
            pitch: pitchTrimmed,
            desiredRole: desiredRole.trim(),
            availability: availability.trim(),
            resumeUrl: resumeUrl.trim(),
            portfolioUrl: portfolioUrl?.trim() || null,
            githubUrl: githubUrl.trim(),
            linkedinUrl: linkedinUrl?.trim() || null,
        },
    });

    // ── Notify project owner ──────────────────────────────────────────────────
    await prisma.notification.create({
        data: {
            userId: project.createdBy,
            title: `New join request — ${project.title}`,
            body: `${dbUser.name ?? dbUser.username ?? "Someone"} wants to join as ${desiredRole.trim()}.`,
            href: `/projects/${projectId}`,
        },
    });

    return NextResponse.json({ success: true });
}