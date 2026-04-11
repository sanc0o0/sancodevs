import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import Navbar from "@/components/layout/Navbar";
import Sidebar from "@/components/layout/Sidebar";

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const session = await getServerSession(authOptions);
    if (!session) redirect("/login");

    return (
        <div style={{
            height: "100vh",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
        }}>
            {/* Sticky navbar */}
            <div style={{ flexShrink: 0 }}>
                <Navbar />
            </div>

            {/* Body row — sidebar + main */}
            <div style={{
                display: "flex",
                flex: 1,
                overflow: "hidden",
            }}>
                {/* Sidebar stays fixed */}
                <Sidebar />

                {/* Main content scrolls */}
                <main style={{
                    flex: 1,
                    overflowY: "auto",
                    padding: "2rem",
                }}>
                    {children}
                </main>
            </div>
        </div>
    );
}