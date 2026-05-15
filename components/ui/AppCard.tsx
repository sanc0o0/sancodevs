import { cn } from "@/lib/utils";

interface AppCardProps extends React.HTMLAttributes<HTMLDivElement> { }

export function AppCard({
    className,
    children,
    ...props
}: AppCardProps) {
    return (
        <div
            className={cn(
                "rounded-2xl border border-zinc-800 bg-zinc-900/70",
                "backdrop-blur-sm",
                className
            )}
            {...props}
        >
            {children}
        </div>
    );
}