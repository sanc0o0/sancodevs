import type { ActivityBucket } from "../types/reliability.types";

interface RawTask {
    submittedAt: Date | null;
    updatedAt: Date;
    dueDate: Date | null;
}

interface MissedTask {
    dueDate: Date;
}

function isoWeek(d: Date): string {
    const jan4 = new Date(d.getFullYear(), 0, 4);
    const weekNum = Math.ceil(
        ((d.getTime() - jan4.getTime()) / 86400000 + jan4.getDay() + 1) / 7
    );
    return `${d.getFullYear()}-W${String(weekNum).padStart(2, "0")}`;
}

function periodKey(d: Date, granularity: "week" | "month" | "year"): string {
    if (granularity === "week") return isoWeek(d);
    if (granularity === "month")
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    return `${d.getFullYear()}`;
}

export function buildActivityBuckets(
    terminalTasks: RawTask[],
    missedTasks: MissedTask[],
    granularity: "week" | "month" | "year"
): ActivityBucket[] {
    const map = new Map<string, ActivityBucket>();

    for (const t of terminalTasks) {
        const date = t.submittedAt ?? t.updatedAt;
        const k = periodKey(date, granularity);
        const b = map.get(k) ?? { period: k, done: 0, late: 0, missed: 0 };
        const isLate = t.dueDate && t.submittedAt && t.submittedAt > t.dueDate;
        if (isLate) b.late++;
        else b.done++;
        map.set(k, b);
    }

    for (const t of missedTasks) {
        const k = periodKey(t.dueDate, granularity);
        const b = map.get(k) ?? { period: k, done: 0, late: 0, missed: 0 };
        b.missed++;
        map.set(k, b);
    }

    return Array.from(map.values()).sort((a, b) =>
        a.period.localeCompare(b.period)
    );
}