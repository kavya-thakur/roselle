import { NextResponse } from "next/server";
import { endSession } from "@/lib/auth/session";
import { handleRouteError } from "@/lib/api/http";

export async function POST() {
    try {
        await endSession();
        return NextResponse.json({ ok: true });
    } catch (error) {
        return handleRouteError(error, "Logout");
    }
}
