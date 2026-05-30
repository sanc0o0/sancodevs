// app/api/users/[userId]/reliability/route.ts

import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { buildActivityBuckets } from "@/components/profile/reliability/utils/buildActivityBuckets";
import { computeReliabilityScore, computeOnTimeRate } from "@/components/profile/reliability/utils/computeReliabilityScore";
import { computeReliabilityTrend } from "@/components/profile/reliability/utils/computeReliabilityTrend";
import { computeReliabilityTier, computeConfidence } from "@/components/profile/reliability/utils/computeReliabilityTier";
import { normalizeReliabilityEvents } from "@/components/profile/reliability/utils/normalizeReliabilityEvents";

export async function GET(
    _req: Request,
    { params }: { params: Promise<{ userId: string }> }
) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { userId } = await params;
    const viewerId = session.user.id;
    const isOwner = viewerId === userId;

    // ── Auth: check block status ─────────────────────────────────
    if (!isOwner) {
        const block = await prisma.block.findFirst({
            where: {
                OR: [
                    { blockerId: viewerId, blockedId: userId },
                    { blockerId: userId, blockedId: viewerId },
                ],
            },
            select: { id: true },
        });
        if (block) {
            return NextResponse.json({ error: "Not found" }, { status: 404 });
        }
    }

    // ── Fetch raw data in parallel ───────────────────────────────
    const [terminalTasks, missedTasks, existingEvents] = await Promise.all([
        prisma.projectTask.findMany({
            where: {
                assignedTo: userId,
                status: { in: ["DONE", "REVIEW"] },
            },
            select: {
                id: true,
                status: true,
                dueDate: true,
                submittedAt: true,
                updatedAt: true,
                title: true,
                project: { select: { id: true, title: true, visibility: true } },
            },
            orderBy: { updatedAt: "asc" },
        }),

        prisma.projectTask.findMany({
            where: {
                assignedTo: userId,
                status: { notIn: ["DONE", "REVIEW"] },
                dueDate: { lt: new Date() },
            },
            select: {
                id: true,
                status: true,
                dueDate: true,
                updatedAt: true,
                title: true,
                project: { select: { id: true, title: true, visibility: true } },
            },
            orderBy: { updatedAt: "asc" },
        }),

        // Already-recorded events (to avoid duplicates on upsert)
        prisma.reliabilityEvent.findMany({
            where: { userId },
            select: { taskId: true, eventType: true },
        }),
    ]);

    // ── Compute counts ───────────────────────────────────────────
    let rawDone = 0;
    let rawLate = 0;
    const rawMissed = missedTasks.length;

    for (const t of terminalTasks) {
        const isLate = t.dueDate && t.submittedAt && t.submittedAt > t.dueDate;
        if (isLate) rawLate++;
        else rawDone++;
    }

    const rawTotal = rawDone + rawLate + rawMissed;
    const score = computeReliabilityScore({ done: rawDone, late: rawLate, missed: rawMissed, rejected: 0 });
    const onTimeRate = computeOnTimeRate(rawDone, rawTotal);
    const tier = computeReliabilityTier(score);
    const confidence = computeConfidence(rawTotal);

    // ── Write missing ReliabilityEvent rows (fire-and-forget) ────
    const existingSet = new Set(
        existingEvents.map((e) => `${e.taskId}:${e.eventType}`)
    );

    const eventsToCreate: {
        userId: string;
        eventType: string;
        scoreDelta: number;
        taskId: string;
        taskTitle: string;
        projectId: string;
        projectLabel: string;
        isPublic: boolean;
        occurredAt: Date;
    }[] = [];

    for (const t of terminalTasks) {
        const isLate = t.dueDate && t.submittedAt && t.submittedAt > t.dueDate;
        const eventType = isLate ? "LATE" : "COMPLETED";
        const key = `${t.id}:${eventType}`;

        if (!existingSet.has(key)) {
            eventsToCreate.push({
                userId,
                eventType,
                scoreDelta: eventType === "COMPLETED" ? 1.0 : 0.6,
                taskId: t.id,
                taskTitle: t.title,
                projectId: t.project.id,
                projectLabel: t.project.title,
                isPublic: t.project.visibility === "PUBLIC",
                occurredAt: t.submittedAt ?? t.updatedAt,
            });
        }
    }

    for (const t of missedTasks) {
        const key = `${t.id}:MISSED`;
        if (!existingSet.has(key)) {
            eventsToCreate.push({
                userId,
                eventType: "MISSED",
                scoreDelta: 0,
                taskId: t.id,
                taskTitle: t.title,
                projectId: t.project.id,
                projectLabel: t.project.title,
                isPublic: t.project.visibility === "PUBLIC",
                occurredAt: t.dueDate!,
            });
        }
    }

    if (eventsToCreate.length > 0) {
        prisma.reliabilityEvent
            .createMany({ data: eventsToCreate, skipDuplicates: true })
            .catch(() => { });
    }

    // ── Upsert UserStats ─────────────────────────────────────────
    if (rawTotal > 0) {
        prisma.userStats
            .upsert({
                where: { userId },
                create: {
                    userId,
                    tasksCompleted: rawDone,
                    tasksLate: rawLate,
                    tasksMissed: rawMissed,
                    tasksRejected: 0,
                    totalTaskVolume: rawTotal,
                    reliabilityScore: score,
                    onTimeRate: onTimeRate,
                },
                update: {
                    tasksCompleted: rawDone,
                    tasksLate: rawLate,
                    tasksMissed: rawMissed,
                    totalTaskVolume: rawTotal,
                    reliabilityScore: score,
                    onTimeRate: onTimeRate,
                },
            })
            .catch(() => { });
    }

    // ── Fetch timeline events for response ───────────────────────
    const timelineRows = await prisma.reliabilityEvent.findMany({
        where: { userId },
        orderBy: { occurredAt: "desc" },
        take: 40,
        select: {
            id: true,
            eventType: true,
            scoreDelta: true,
            taskTitle: true,
            projectLabel: true,
            occurredAt: true,
            isPublic: true,
        },
    });

    const timeline = normalizeReliabilityEvents(timelineRows, isOwner);

    // ── Activity buckets ─────────────────────────────────────────
    const weekly = buildActivityBuckets(terminalTasks, missedTasks as { dueDate: Date }[], "week");
    const monthly = buildActivityBuckets(terminalTasks, missedTasks as { dueDate: Date }[], "month");
    const yearly = buildActivityBuckets(terminalTasks, missedTasks as { dueDate: Date }[], "year");

    // ── Trend from weekly data ───────────────────────────────────
    const trend = computeReliabilityTrend(weekly);

    // ── 90-day inactivity check ──────────────────────────────────
    const lastActivity = terminalTasks.at(-1)?.updatedAt ?? null;
    const inactive = lastActivity
        ? Date.now() - new Date(lastActivity).getTime() > 90 * 86400000
        : rawTotal === 0;

    return NextResponse.json({
        summary: {
            score,
            tier: tier.label,
            trend,
            confidence,
            totalTrackedTasks: rawTotal,
            inactive,
        },
        stats: {
            reliabilityScore: score,
            onTimeRate,
            tasksCompleted: rawDone,
            tasksLate: rawLate,
            tasksMissed: rawMissed,
            tasksRejected: 0,
            totalTaskVolume: rawTotal,
            consistencyStreak: 0, // derived from trend streak if needed
        },
        activity: { weekly, monthly, yearly },
        timeline,
        visibility: {
            isVisible: true,
            isOwner,
            isRestricted: false,
        },
    });
}