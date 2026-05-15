interface PageContainerProps {
    children: React.ReactNode;
}

export function PageContainer({
    children,
}: PageContainerProps) {
    return (
        <div className="flex flex-col gap-6 p-6">
            {children}
        </div>
    );
  }