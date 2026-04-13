import Link from "next/link";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import HeroBackground from "@/components/landing/HeroBackground";

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col" style={{ background: "var(--bg)" }}>
      <Navbar hideAuth/>
      <HeroBackground />
      <Footer />
    </div>
  );
}