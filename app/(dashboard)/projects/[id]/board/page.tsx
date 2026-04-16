import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { redirect, notFound } from "next/navigation";
import TaskBoard from "./TaskBoard";

export default async function ProjectBoardPage({ params }: { params: Promise<{ id: string }> }) {
    const session = await getServerSession(authOptions);
    if (!session) redirect("/login");

    const { id } = await params;

    const project = await prisma.project.findUnique({
        where: { id },
        include: {
            tasks: {
                include: {
                    assignee: { select: { id: true, name: true, image: true } },
                    milestone: { select: { id: true, title: true } },
                },
                orderBy: { createdAt: "desc" },
            },
            teams: {
                include: { user: { select: { id: true, name: true, image: true } } },
            },
        },
    });

    if (!project) notFound();

    const isOwner = project.createdBy === session.user.id;
    const isMember = project.teams.some(t => t.userId === session.user.id);
    if (!isOwner && !isMember) redirect("/projects");

    return (
        <TaskBoard
            project={{
                ...project,
                createdAt: project.createdAt.toISOString(),
                tasks: project.tasks.map(t => ({
                    ...t,
                    createdAt: t.createdAt.toISOString(),
                    updatedAt: t.updatedAt.toISOString(),
                    dueDate: t.dueDate?.toISOString() ?? null,
                })),
            }}
            currentUserId={session.user.id}
            isOwner={isOwner}
        />
    );
}