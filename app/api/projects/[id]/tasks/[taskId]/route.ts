import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { updateUserStats } from "@/lib/scoring";

export async function PATCH(
    req: Request,
    { params }: { params: Promise<{ id: string; taskId: string }> }
) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id: projectId, taskId } = await params;
    const body = await req.json();

    const existing = await prisma.projectTask.findUnique({
        where: { id: taskId },
        include: { assignee: { select: { id: true, name: true } } },
    });
    if (!existing) return NextResponse.json({ error: "Task not found." }, { status: 404 });

    const project = await prisma.project.findUnique({
        where: { id: projectId },
        select: { createdBy: true, title: true },
    });
    const isOwner = project?.createdBy === session.user.id;
    const isAssignee = existing.assignedTo === session.user.id;

    // ── Submit flow ──
    if (body.action === "submit") {
        if (!isAssignee)
            return NextResponse.json({ error: "Only the assignee can submit." }, { status: 403 });
        if (!body.submissionUrl)
            return NextResponse.json({ error: "Submission URL required." }, { status: 400 });
        if (!["TODO", "IN_PROGRESS", "MISSED"].includes(existing.status))
            return NextResponse.json({ error: "This task cannot be submitted." }, { status: 400 });

        const isValidRepo = /^(https?:\/\/)?(www\.)?(github|gitlab|bitbucket)\.com\/.+/.test(body.submissionUrl);
        if (!isValidRepo)
            return NextResponse.json({ error: "Must be a valid GitHub, GitLab, or Bitbucket URL." }, { status: 400 });

        const isLate = existing.dueDate ? new Date() > new Date(existing.dueDate) : false;

        const task = await prisma.projectTask.update({
            where: { id: taskId },
            data: {
                status: "SUBMITTED",
                submissionUrl: body.submissionUrl,
                submittedAt: new Date(),
            },
            include: { assignee: { select: { id: true, name: true, image: true } } },
        });

        if (project && project.createdBy !== session.user.id) {
            await prisma.notification.create({
                data: {
                    userId: project.createdBy,
                    title: `Task submitted${isLate ? " (late)" : ""}`,
                    body: `"${existing.title}" was submitted by ${session.user.name ?? "a member"}.`,
                    href: `/projects/${projectId}/board`,
                },
            });
        }

        return NextResponse.json(task);
    }

    // ── Review flow ──
    if (body.action === "review") {
        if (!isOwner)
            return NextResponse.json({ error: "Only the project owner can review." }, { status: 403 });
        if (!["APPROVED", "REJECTED"].includes(body.verdict))
            return NextResponse.json({ error: "verdict must be APPROVED or REJECTED." }, { status: 400 });

        const isLate = existing.dueDate && existing.submittedAt
            ? new Date(existing.submittedAt) > new Date(existing.dueDate)
            : false;

        const newStatus = body.verdict === "APPROVED"
            ? (isLate ? "LATE" : "DONE")
            : "REJECTED";

        const task = await prisma.projectTask.update({
            where: { id: taskId },
            data: {
                status: newStatus,
                reviewNote: body.reviewNote || null,
                reviewedBy: session.user.id,
                reviewedAt: new Date(),
            },
            include: { assignee: { select: { id: true, name: true, image: true } } },
        });

        // ── Scoring: recalculate after terminal state reached ──
        if (existing.assignedTo) {
            await updateUserStats(existing.assignedTo);
        }

        // Notify assignee
        if (existing.assignedTo && existing.assignedTo !== session.user.id) {
            await prisma.notification.create({
                data: {
                    userId: existing.assignedTo,
                    title: body.verdict === "APPROVED" ? "Task approved ✓" : "Task needs revision",
                    body: body.reviewNote
                        ? `"${existing.title}": ${body.reviewNote}`
                        : `"${existing.title}" was ${body.verdict.toLowerCase()}.`,
                    href: `/projects/${projectId}/board`,
                },
            });
        }

        return NextResponse.json(task);
    }

    // ── Standard field updates ──
    if (!isOwner && !isAssignee)
        return NextResponse.json({ error: "Not authorized." }, { status: 403 });

    const task = await prisma.projectTask.update({
        where: { id: taskId },
        data: {
            ...(body.status && { status: body.status }),
            ...(body.title && { title: body.title }),
            ...(body.description !== undefined && { description: body.description }),
            ...(body.assignedTo !== undefined && { assignedTo: body.assignedTo || null }),
            ...(body.priority && { priority: body.priority }),
            ...(body.dueDate !== undefined && { dueDate: body.dueDate ? new Date(body.dueDate) : null }),
        },
        include: { assignee: { select: { id: true, name: true, image: true } } },
    });

    return NextResponse.json(task);
}

export async function DELETE(
    req: Request,
    { params }: { params: Promise<{ id: string; taskId: string }> }
) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id: projectId, taskId } = await params;

    const project = await prisma.project.findUnique({
        where: { id: projectId },
        select: { createdBy: true },
    });
    if (project?.createdBy !== session.user.id)
        return NextResponse.json({ error: "Only the owner can delete tasks." }, { status: 403 });

    await prisma.projectTask.delete({ where: { id: taskId } });
    return NextResponse.json({ success: true });
}