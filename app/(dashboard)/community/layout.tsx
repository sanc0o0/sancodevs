export default function CommunityLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}

// export default function CommunityLayout({ children }: { children: React.ReactNode }) {
//     return (
//         <div
//             // className="fixed inset-0"
//             className="flex h-[calc(100vh-60px)] overflow-hidden"
//             style={{ top: "60px" }} // navbar height
//         >
//             {children}
//         </div>
//     );
// }