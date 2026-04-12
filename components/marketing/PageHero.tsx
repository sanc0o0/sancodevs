export default function PageHero({ title, sub }: { title: string; sub: string }) {
    return (
        <div style={{ maxWidth: "720px", margin: "0 auto", padding: "5rem 2rem 3rem" }}>
            <div style={{ width: "28px", height: "2px", background: "var(--accent)", marginBottom: "1.25rem" }} />
            <h1 style={{ fontSize: "clamp(28px, 5vw, 42px)", fontWeight: 500, color: "var(--text)", marginBottom: "1rem", lineHeight: 1.2 }}>
                {title}
            </h1>
            <p style={{ fontSize: "15px", color: "var(--muted)", lineHeight: 1.75, maxWidth: "540px" }}>
                {sub}
            </p>
        </div>
    );
}