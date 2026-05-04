import { prisma } from "@/lib/prisma";

/**
 * SCORING FORMULA
 * ───────────────
 * Reliability Score = weighted outcome rate across all terminal tasks
 *
 * Weights per outcome:
 *   DONE     → 1.0  (full credit — on time)
 *   LATE     → 0.6  (partial — submitted but past deadline)
 *   REJECTED → 0.2  (submitted but quality failed)
 *   MISSED   → 0.0  (no submission at all — worst outcome)
 *
 * reliabilityScore = (done*1.0 + late*0.6 + rejected*0.2) / total * 100
 *
 * On-Time Rate = tasks done strictly on time / (done + late + missed)
 * — excludes rejected since rejection is a quality signal, not a time signal
 *
 * Both scores are clamped 0–100 and rounded to 1 decimal.
 * New users with 0 tasks start at 100 (benefit of the doubt).
 *
 * Phase 2 additions (not yet):
 *   - streak bonus (consecutive on-time)
 *   - review score (avg reviewer rating 1–5)
 *   - recency weighting (recent tasks count more)
 */

export interface ScoringResult {
    tasksCompleted: number;   // DONE
    tasksLate: number;        // LATE (approved but past deadline)
    tasksMissed: number;      // MISSED (never submitted)
    tasksRejected: number;    // REJECTED
    totalTerminal: number;    // sum of above
    reliabilityScore: number; // 0–100
    onTimeRate: number;       // 0–100
}

export async function computeUserStats(userId: string): Promise<ScoringResult> {
    const tasks = await prisma.projectTask.findMany({
        where: {
            assignedTo: userId,
            status: { in: ["DONE", "LATE", "MISSED", "REJECTED"] },
        },
        select: { status: true },
    });

    const done = tasks.filter(t => t.status === "DONE").length;
    const late = tasks.filter(t => t.status === "LATE").length;
    const missed = tasks.filter(t => t.status === "MISSED").length;
    const rejected = tasks.filter(t => t.status === "REJECTED").length;
    const total = done + late + missed + rejected;

    if (total === 0) {
        return {
            tasksCompleted: 0, tasksLate: 0, tasksMissed: 0, tasksRejected: 0,
            totalTerminal: 0, reliabilityScore: 100, onTimeRate: 100,
        };
    }

    // Reliability: weighted score across all outcomes
    const reliabilityScore = parseFloat(
        ((done * 1.0 + late * 0.6 + rejected * 0.2) / total * 100).toFixed(1)
    );

    // On-time rate: only counts time-relevant outcomes (done vs late+missed)
    const timeBased = done + late + missed;
    const onTimeRate = timeBased > 0
        ? parseFloat((done / timeBased * 100).toFixed(1))
        : 100;

    return {
        tasksCompleted: done,
        tasksLate: late,
        tasksMissed: missed,
        tasksRejected: rejected,
        totalTerminal: total,
        reliabilityScore: Math.min(100, Math.max(0, reliabilityScore)),
        onTimeRate: Math.min(100, Math.max(0, onTimeRate)),
    };
}

/**
 * Recalculates and persists UserStats for a user.
 * Call this after ANY task reaches a terminal state:
 *   DONE, LATE, MISSED, REJECTED
 */
export async function updateUserStats(userId: string): Promise<void> {
    const stats = await computeUserStats(userId);

    await prisma.userStats.upsert({
        where: { userId },
        update: {
            tasksCompleted: stats.tasksCompleted,
            tasksLate: stats.tasksLate,
            tasksMissed: stats.tasksMissed,
            tasksRejected: stats.tasksRejected,
            reliabilityScore: stats.reliabilityScore,
            onTimeRate: stats.onTimeRate,
        },
        create: {
            userId,
            tasksCompleted: stats.tasksCompleted,
            tasksLate: stats.tasksLate,
            tasksMissed: stats.tasksMissed,
            tasksRejected: stats.tasksRejected,
            reliabilityScore: stats.reliabilityScore,
            onTimeRate: stats.onTimeRate,
        },
    });
}

/**
 * Returns a human-readable reliability tier label.
 */
export function getReliabilityTier(score: number): {
    label: string;
    color: string;
    description: string;
} {
    if (score >= 90) return { label: "Excellent", color: "#22c55e", description: "Consistently delivers on time" };
    if (score >= 75) return { label: "Good", color: "#86efac", description: "Reliable with minor delays" };
    if (score >= 55) return { label: "Fair", color: "#facc15", description: "Occasional misses or delays" };
    if (score >= 35) return { label: "Inconsistent", color: "#fb923c", description: "Frequent delays or missed tasks" };
    return { label: "At risk", color: "#ef4444", description: "Multiple missed deadlines" };
}