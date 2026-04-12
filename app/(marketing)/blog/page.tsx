import PageHero from "@/components/marketing/PageHero";
import Link from "next/link";

const posts = [
    {
        slug: "why-most-devs-quit",
        title: "Why most developers quit before they get good",
        date: "Apr 10, 2026",
        tag: "Learning",
        excerpt: "The gap between 'I want to learn to code' and 'I shipped something' is where most people disappear. Here's why — and how to bridge it.",
    },
    {
        slug: "git-is-not-optional",
        title: "Git is not optional — it's the first professional skill",
        date: "Apr 5, 2026",
        tag: "Git",
        excerpt: "Every junior developer we've talked to says the same thing: nobody taught me Git properly. We're fixing that.",
    },
    {
        slug: "accountability-in-learning",
        title: "Why accountability is the missing ingredient in online learning",
        date: "Mar 28, 2026",
        tag: "Product",
        excerpt: "Courses are cheap. Bootcamps are expensive. Neither of them solves the real problem: there's no consequence for quitting.",
    },
];

export default function BlogPage() {
    return (
        <>
            <PageHero
                title="Writing about learning, building, and shipping."
                sub="Thoughts on developer education, open source, and what it actually takes to grow as a software developer."
            />
            <div style={{ maxWidth: "720px", margin: "0 auto", padding: "0 2rem 5rem" }}>
                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                    {posts.map(post => (
                        <Link
                            key={post.slug}
                            href={`/blog/${post.slug}`}
                            className="card-hover"
                            style={{
                                display: "block", padding: "1.5rem",
                                borderRadius: "11px",
                                border: "0.5px solid var(--border)",
                                background: "var(--surface)",
                                textDecoration: "none",
                            }}
                        >
                            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
                                <span style={{
                                    fontSize: "10px", padding: "2px 8px", borderRadius: "4px",
                                    border: "0.5px solid var(--border)", color: "var(--muted)",
                                    textTransform: "uppercase", letterSpacing: "0.04em",
                                }}>{post.tag}</span>
                                <span style={{ fontSize: "11px", color: "var(--muted)" }}>{post.date}</span>
                            </div>
                            <p style={{ fontSize: "15px", fontWeight: 500, color: "var(--text)", marginBottom: "6px" }}>{post.title}</p>
                            <p style={{ fontSize: "13px", color: "var(--muted)", lineHeight: 1.6 }}>{post.excerpt}</p>
                        </Link>
                    ))}
                </div>
            </div>
        </>
    );
}