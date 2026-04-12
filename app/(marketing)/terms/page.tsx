import PageHero from "@/components/marketing/PageHero";

const sections = [
    { title: "Acceptance", body: "By using SancoDevs, you agree to these terms. If you don't agree, don't use the platform. We may update these terms over time and will notify users of significant changes." },
    { title: "Your account", body: "You're responsible for keeping your account credentials secure. You must be at least 13 years old to create an account. You may not create accounts for others without their consent." },
    { title: "Projects and accountability", body: "When you commit to a project on SancoDevs, you agree to make a genuine effort to complete it. Abandoning projects without notice may result in penalties such as loss of progress points or restrictions on joining new projects." },
    { title: "Acceptable use", body: "You may not use SancoDevs to harass other users, post harmful content, attempt to breach the security of the platform, or scrape data without permission." },
    { title: "Intellectual property", body: "Code and content you create remains yours. By posting on SancoDevs, you grant us a licence to display it within the platform. We do not claim ownership of your work." },
    { title: "Termination", body: "We reserve the right to suspend or delete accounts that violate these terms. You may delete your account at any time." },
    { title: "Limitation of liability", body: "SancoDevs is provided as-is. We are not liable for any damages arising from your use of the platform. The platform may be unavailable from time to time due to maintenance or technical issues." },
    { title: "Contact", body: "For questions about these terms, contact legal@sancodevs.com." },
];

export default function TermsPage() {
    return (
        <>
            <PageHero title="Terms of service" sub="Last updated: April 2026" />
            <div style={{ maxWidth: "680px", margin: "0 auto", padding: "0 2rem 5rem" }}>
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
        </>
    );
}