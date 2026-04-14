import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

export async function GET() {
    const projects = await prisma.project.findMany({
        orderBy: { createdAt: "desc" },
        include: {
            applicants: { select: { userId: true } },
            _count: { select: { applicants: true } },
        },
    });
    return NextResponse.json(projects);
}

export async function POST(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { title, description, difficulty, maxMembers, techStack, lookingFor, type } = await req.json();

    if (!title || !description || !difficulty) {
        return NextResponse.json({ error: "Title, description, and difficulty are required." }, { status: 400 });
    }

    const project = await prisma.project.create({
        data: {
            title,
            description,
            createdBy: session.user.id,
            status: "OPEN",
        },
    });

    // Send notification to creator
    await prisma.notification.create({
        data: {
            userId: session.user.id,
            title: "Project created",
            body: `Your project "${title}" is now live and accepting contributors.`,
            href: `/projects/${project.id}`,
        },
    });

    return NextResponse.json(project, { status: 201 });
}