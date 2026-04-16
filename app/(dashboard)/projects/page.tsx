import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import ProjectsClient from "./ProjectsClient";

export default async function ProjectsPage() {
    const session = await getServerSession(authOptions);
    if (!session) redirect("/login");

    const projects = await prisma.project.findMany({
        orderBy: { createdAt: "desc" },
        include: { _count: { select: { applicants: true, teams: true } } },
    });

    return (
        <ProjectsClient
            initialProjects={projects.map(p => ({
                ...p,
                createdAt: p.createdAt.toISOString(),
            }))}
            currentUserId={session.user.id}
        />
    );
}