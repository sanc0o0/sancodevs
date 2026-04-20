// "use client";
// import { useEffect } from "react";

// export default function CommunityLayout({ children }: { children: React.ReactNode }) {
//     useEffect(() => {
//         const main = document.getElementById("dashboard-main");
//         if (main) {
//             main.style.padding = "0";
//             main.style.overflow = "hidden";
//         }
//         return () => {
//             const main = document.getElementById("dashboard-main");
//             if (main) {
//                 main.style.padding = "";
//                 main.style.overflow = "";
//             }
//         };
//     }, []);

//     return (
//         <div className="flex h-[calc(100vh-54px)] w-full overflow-hidden">
//             {children}
//         </div>
//     );
// }


export default function CommunityLayout({ children }: { children: React.ReactNode }) {
    return (
        <div
            // className="fixed inset-0"
            className="flex h-[calc(100vh-60px)] overflow-hidden"
            style={{ top: "60px" }} // navbar height
        >
            {children}
        </div>
    );
}