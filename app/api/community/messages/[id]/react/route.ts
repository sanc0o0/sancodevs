import { NextResponse } from "next/server";

export async function POST() {
    // Reactions are optimistic client-side for now
    return NextResponse.json({ success: true });
}