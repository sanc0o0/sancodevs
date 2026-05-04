
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import Navbar from "@/components/layout/Navbar";
import Sidebar from "@/components/layout/Sidebar";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
    const session = await getServerSession(authOptions);
    if (!session) redirect("/login");

    return (
        <div style={{ height: "100vh", overflow: "hidden" }}>
            {/* Fixed Navbar */}
            <div style={{
                position: "fixed",
                top: 0, left: 0, right: 0,
                height: "60px",
                zIndex: 50,
            }}>
                <Navbar />
            </div>

            {/* Fixed Sidebar — desktop only */}
            <div
                className="hidden-mobile"
                style={{
                    position: "fixed",
                    top: "60px", left: 0,
                    width: "200px",
                    height: "calc(100vh - 60px)",
                    borderRight: "0.5px solid var(--border)",
                    background: "var(--bg)",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                    zIndex: 40,
                }}
            >
                <Sidebar />
            </div>

            {/* Main content */}
            <main
                id="dashboard-main"
                style={{
                    position: "fixed",
                    top: "60px",
                    bottom: 0,
                    right: 0,
                    overflowY: "auto",
                    overflowX: "hidden",
                    // Desktop: offset by sidebar. Mobile: full width
                    left: "var(--sidebar-offset, 200px)",
                }}
            >
                {children}
            </main>

            {/* CSS variable override for mobile */}
            <style>{`
                @media (max-width: 768px) {
                    #dashboard-main {
                        left: 0 !important;
                    }
                }
            `}</style>
        </div>
    );
}