import PageHero from "@/components/marketing/PageHero";

const sections = [
    { title: "What we collect", body: "We collect the information you provide when creating an account — your name, email address, and password (stored as a secure hash). If you sign in with Google or GitHub, we receive your name, email, and profile picture from those services." },
    { title: "How we use it", body: "We use your information to provide the SancoDevs service: to personalise your learning path, track your progress, and communicate with you about your account. We do not sell your data to third parties." },
    { title: "Cookies", body: "We use cookies to keep you signed in and to remember your preferences such as theme. We do not use tracking or advertising cookies." },
    { title: "Third-party services", body: "We use Vercel for hosting, Neon for our database, and NextAuth for authentication. Each of these services has their own privacy policy. We use Google and GitHub OAuth for sign-in — only the information you explicitly grant is shared with us." },
    { title: "Your rights", body: "You can request deletion of your account and all associated data at any time by emailing privacy@sancodevs.com. We will process requests within 30 days." },
    { title: "Contact", body: "If you have questions about this policy, contact us at privacy@sancodevs.com." },
];

export default function PrivacyPage() {
    return (
        <>
            <PageHero
                title="Privacy policy"
                sub={`Last updated: April 2026`}
            />
            <div style={{ maxWidth: "680px", margin: "0 auto", padding: "0 2rem 5rem" }}>
                <div style={{ display: "flex", flexDirection: "column", gap: "0" }}>
                    {sections.map((s, i) => (
                        <div key={i} style={{
                            padding: "1.5rem 0",
                            borderBottom: i < sections.length - 1 ? "0.5px solid var(--border)" : "none",
                        }}>
                            <p style={{ fontSize: "14px", fontWeight: 500, color: "var(--text)", marginBottom: "8px" }}>{s.title}</p>
                            <p style={{ fontSize: "13px", color: "var(--muted)", lineHeight: 1.8 }}>{s.body}</p>
                        </div>
                    ))}
                </div>
            </div>
        </>
    );
}