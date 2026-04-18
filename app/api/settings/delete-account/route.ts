import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

export async function DELETE() {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const userId = session.user.id;

    try {
        // Delete in dependency order — most dependent first
        await prisma.messageReaction.deleteMany({ where: { userId } }).catch(() => { });
        await prisma.messageReceipt.deleteMany({ where: { userId } }).catch(() => { });
        await prisma.communityMessage.deleteMany({ where: { userId } }).catch(() => { });
        await prisma.communityMember.deleteMany({ where: { userId } }).catch(() => { });

        // Groups created by user — transfer or delete
        const ownedGroups = await prisma.communityGroup.findMany({ where: { createdBy: userId } });
        for (const group of ownedGroups) {
            // Delete all messages in the group
            await prisma.messageReaction.deleteMany({
                where: { message: { groupId: group.id } },
            }).catch(() => { });
            await prisma.messageReceipt.deleteMany({
                where: { message: { groupId: group.id } },
            }).catch(() => { });
            await prisma.communityMessage.deleteMany({ where: { groupId: group.id } }).catch(() => { });
            await prisma.communityMember.deleteMany({ where: { groupId: group.id } }).catch(() => { });
            await prisma.communityGroup.delete({ where: { id: group.id } }).catch(() => { });
        }

        await prisma.projectApplication.deleteMany({ where: { userId } }).catch(() => { });
        await prisma.teamMember.deleteMany({ where: { userId } }).catch(() => { });
        await prisma.projectTask.deleteMany({ where: { assignedTo: userId } }).catch(() => { });

        // Projects owned by user
        const ownedProjects = await prisma.project.findMany({ where: { createdBy: userId } });
        for (const project of ownedProjects) {
            await prisma.projectTask.deleteMany({ where: { projectId: project.id } }).catch(() => { });
            await prisma.milestone.deleteMany({ where: { projectId: project.id } }).catch(() => { });
            await prisma.teamMember.deleteMany({ where: { projectId: project.id } }).catch(() => { });
            await prisma.projectApplication.deleteMany({ where: { projectId: project.id } }).catch(() => { });
            await prisma.project.delete({ where: { id: project.id } }).catch(() => { });
        }

        await prisma.notification.deleteMany({ where: { userId } }).catch(() => { });
        await prisma.userPreferences.deleteMany({ where: { userId } }).catch(() => { });
        await prisma.userActivity.deleteMany({ where: { userId } }).catch(() => { });
        await prisma.userProgress.deleteMany({ where: { userId } }).catch(() => { });
        await prisma.userOnboarding.deleteMany({ where: { userId } }).catch(() => { });
        await prisma.jobApplication.deleteMany({ where: { email: session.user.email! } }).catch(() => { });
        await prisma.session.deleteMany({ where: { userId } }).catch(() => { });
        await prisma.account.deleteMany({ where: { userId } }).catch(() => { });
        await prisma.user.delete({ where: { id: userId } });

        return NextResponse.json({ success: true });
    } catch (err) {
        console.error("Delete account error:", err);
        return NextResponse.json({ error: "Failed to delete account." }, { status: 500 });
    }
}