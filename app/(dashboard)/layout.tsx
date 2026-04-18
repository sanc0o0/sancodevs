// import { getServerSession } from "next-auth";
// import { authOptions } from "@/app/api/auth/[...nextauth]/route";
// import { redirect } from "next/navigation";
// import Navbar from "@/components/layout/Navbar";
// import Sidebar from "@/components/layout/Sidebar";

// export default async function DashboardLayout({
//     children,
// }: {
//     children: React.ReactNode;
// }) {
//     const session = await getServerSession(authOptions);
//     if (!session) redirect("/login");

//     return (
//         <div style={{
//             height: "100vh",
//             display: "flex",
//             flexDirection: "column",
//             overflow: "hidden",
//         }}>
//             {/* Sticky navbar */}
//             <div style={{ flexShrink: 0 }}>
//                 <Navbar />
//             </div>

//             {/* Body row — sidebar + main */}
//             <div style={{
//                 display: "flex",
//                 flex: 1,
//                 overflow: "hidden",
//             }}>
//                 {/* Sidebar stays fixed */}
//                 <Sidebar />

//                 {/* Main content scrolls */}
//                 <main id="dashboard-main" style={{
//                     flex: 1,
//                     overflowY: "auto",
//                     padding: "2rem",
//                 }}>
//                     {children}
//                 </main>
//             </div>
//         </div>
//     );
// }


import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import Navbar from "@/components/layout/Navbar";
import Sidebar from "@/components/layout/Sidebar";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
    const session = await getServerSession(authOptions);
    if (!session) redirect("/login");

    return (
        <div style={{ height: "100vh", display: "flex", flexDirection: "column", overflow: "hidden" }}>
            <div style={{ flexShrink: 0 }}>
                <Navbar />
            </div>
            <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
                <div className="hidden-mobile" style={{
                    width: "200px", flexShrink: 0, borderRight: "0.5px solid var(--border)",
                    background: "var(--bg)", display: "flex", flexDirection: "column",
                    justifyContent: "space-between", position: "sticky", top: 0,
                    height: "calc(100vh - 54px)",
                }}>
                    <Sidebar />
                </div>
                {/* Main content — NO overflow here, let children manage it */}
                <main style={{ flex: 1, minWidth: 0, overflowY: "auto", overflowX: "hidden" }}>
                    <div className="community-wrapper">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
}