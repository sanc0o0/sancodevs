import { Suspense } from "react";
import CareerApplyForm from "./CareerApplyForm";

export default function CareerApplyPage() {
    return (
        <Suspense fallback={
            <div style={{ minHeight: "80vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <p style={{ fontSize: "13px", color: "var(--muted)" }}>Loading...</p>
            </div>
        }>
            <CareerApplyForm />
        </Suspense>
    );
}