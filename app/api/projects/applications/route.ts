import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { applicationId, action, projectId, userId, message, projectTitle, userName } = await req.json();

    const project = await prisma.project.findUnique({ where: { id: projectId } });
    if (!project || project.createdBy !== session.user.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    await prisma.projectApplication.update({
        where: { id: applicationId },
        data: { status: action === "accept" ? "ACCEPTED" : "REJECTED" },
    });

    if (action === "accept") {
        await prisma.teamMember.create({
            data: { projectId, userId, role: "CONTRIBUTOR" },
        });

        await prisma.notification.create({
            data: {
                userId,
                title: `You're in — ${projectTitle}`,
                body: `Your request to join "${projectTitle}" was accepted. Welcome to the team.`,
                href: `/projects/${projectId}`,
            },
        });
    } else {
        await prisma.notification.create({
            data: {
                userId,
                title: `Request update — ${projectTitle}`,
                body: message
                    ? `Your request to join "${projectTitle}" was not accepted. Message: ${message}`
                    : `Your request to join "${projectTitle}" was not accepted at this time.`,
                href: `/projects`,
            },
        });
    }

    return NextResponse.json({ success: true });
}