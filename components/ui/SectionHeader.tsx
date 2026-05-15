interface SectionHeaderProps {
    title: string;
    description?: string;
    action?: React.ReactNode;
}

export function SectionHeader({
    title,
    description,
    action,
}: SectionHeaderProps) {
    return (
        <div className="flex items-center justify-between">
            <div>
                <h2 className="text-xl font-semibold text-white">
                    {title}
                </h2>

                {description && (
                    <p className="mt-1 text-sm text-zinc-400">
                        {description}
                    </p>
                )}
            </div>

            {action}
        </div>
    );
  }