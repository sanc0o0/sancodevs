import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import NotificationsClient from "./NotificationsClient";

export default async function NotificationsPage() {
    const session = await getServerSession(authOptions);
    if (!session) redirect("/login");

    const notifications = await prisma.notification.findMany({
        where: { userId: session.user.id },
        orderBy: { createdAt: "desc" },
        take: 100,
    });

    // Mark all as read
    await prisma.notification.updateMany({
        where: { userId: session.user.id, read: false },
        data: { read: true },
    });

    // Group by date
    const grouped: Record<string, typeof notifications> = {};
    for (const n of notifications) {
        const date = new Date(n.createdAt);
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(today.getDate() - 1);

        let label: string;
        if (date.toDateString() === today.toDateString()) {
            label = "Today";
        } else if (date.toDateString() === yesterday.toDateString()) {
            label = "Yesterday";
        } else {
            label = date.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
        }

        if (!grouped[label]) grouped[label] = [];
        grouped[label].push(n);
    }

    return (
        <NotificationsClient grouped={grouped} />
    );
}