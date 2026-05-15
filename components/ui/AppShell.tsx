import { ReactNode } from "react";
import { AppSidebar } from "./AppSidebar";

interface AppShellProps {
    children: ReactNode;
}

export function AppShell({
    children,
}: AppShellProps) {
    return (
        <div className="flex min-h-screen bg-zinc-950 text-white">
            <AppSidebar />

            <main className="flex-1 overflow-hidden">
                {children}
            </main>
        </div>
    );
}