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
            <div style={{ 
                position: "fixed",
                top: 0,
                left: 0,
                right: 0,
                height: "60px",
                zIndex: 50,
                 }}>
                <Navbar />
            </div>
            {/* <div style={{ display: "flex", flex: 1, overflow: "hidden" }}> */}
                <div className="hidden-mobile" 
                    style={{
                        position: "fixed", 
                        top: "60px",
                        left:0,
                        width: "200px", 
                        height: "calc(100vh - 60px)",
                        borderRight: "0.5px solid var(--border)",
                        background: "var(--bg)", 
                        display: "flex", 
                        flexDirection: "column",
                        justifyContent: "space-between", 
                        zIndex:40,
                    }}>
                    <Sidebar />
                </div>
                {/* Main content — NO overflow here, let children manage it */}
                <main 
                    id="dashboard-main"
                    style={{
                        position: "absolute",
                        top: "60px",
                        left: "200px",
                        right: 0,
                        bottom: 0,
                        overflowY: "auto",
                        overflowX: "hidden",
                    }}>
                    <div className="community-wrapper">
                        {children}
                    </div>
                </main>
            {/* </div> */}
        </div>
    );
}