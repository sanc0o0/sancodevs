import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { projectId, message } = await req.json();

    const project = await prisma.project.findUnique({ where: { id: projectId } });
    if (!project) return NextResponse.json({ error: "Project not found." }, { status: 404 });
    if (project.createdBy === session.user.id) return NextResponse.json({ error: "You own this project." }, { status: 400 });

    const existing = await prisma.projectApplication.findUnique({
        where: { projectId_userId: { projectId, userId: session.user.id } },
    });
    if (existing) return NextResponse.json({ error: "Already applied." }, { status: 409 });

    await prisma.projectApplication.create({
        data: { projectId, userId: session.user.id, message: message || null },
    });

    // Notify project owner
    await prisma.notification.create({
        data: {
            userId: project.createdBy,
            title: `New join request — ${project.title}`,
            body: `${session.user.name ?? "Someone"} wants to join your project.`,
            href: `/projects/${projectId}?tab=requests`,        },
    });

    return NextResponse.json({ success: true });
}