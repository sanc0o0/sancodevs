import Navbar from "@/components/layout/Navbar";

export default function OnboardingLayout({ children }: { children: React.ReactNode }) {
    return (
        <div style={{ minHeight: "100vh", background: "var(--bg)" }}>
            <Navbar minimal />
            {children}
        </div>
    );
}