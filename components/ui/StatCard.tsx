import { AppCard } from "./AppCard";

interface StatCardProps {
    label: string;
    value: string | number;
    hint?: string;
}

export function StatCard({
    label,
    value,
    hint,
}: StatCardProps) {
    return (
        <AppCard className="p-5">
            <div className="flex flex-col gap-2">
                <span className="text-sm text-zinc-400">
                    {label}
                </span>

                <span className="text-3xl font-semibold text-white">
                    {value}
                </span>

                {hint && (
                    <span className="text-xs text-zinc-500">
                        {hint}
                    </span>
                )}
            </div>
        </AppCard>
    );
}