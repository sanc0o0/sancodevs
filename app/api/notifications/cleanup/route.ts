import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Called by a cron job or on each notification fetch
export async function POST() {
    const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);
    await prisma.notification.deleteMany({
        where: { createdAt: { lt: cutoff }, read: true },
    });
    return NextResponse.json({ success: true });
}