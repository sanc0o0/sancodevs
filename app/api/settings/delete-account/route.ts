import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

export async function DELETE() {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const userId = session.user.id;

    // Delete in dependency order
    await prisma.messageReceipt.deleteMany({ where: { userId } }).catch(() => { });
    await prisma.communityMessage.deleteMany({ where: { userId } }).catch(() => { });
    await prisma.communityMember.deleteMany({ where: { userId } }).catch(() => { });
    await prisma.communityGroup.deleteMany({ where: { createdBy: userId } }).catch(() => { });
    await prisma.notification.deleteMany({ where: { userId } }).catch(() => { });
    await prisma.projectApplication.deleteMany({ where: { userId } }).catch(() => { });
    await prisma.teamMember.deleteMany({ where: { userId } }).catch(() => { });
    await prisma.userProgress.deleteMany({ where: { userId } }).catch(() => { });
    await prisma.userOnboarding.deleteMany({ where: { userId } }).catch(() => { });
    await prisma.userActivity.deleteMany({ where: { userId } }).catch(() => { });
    await prisma.contactMessage.deleteMany({ where: { email: session.user.email! } }).catch(() => { });
    await prisma.session.deleteMany({ where: { userId } }).catch(() => { });
    await prisma.account.deleteMany({ where: { userId } }).catch(() => { });
    await prisma.user.delete({ where: { id: userId } }).catch(() => { });

    return NextResponse.json({ success: true });
}