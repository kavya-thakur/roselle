import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { redeemToken } from "@/lib/auth/tokens";

// The link in the welcome email. Lands on settings, which says whether it worked.
export async function GET(req: NextRequest) {
    const userId = await redeemToken(req.nextUrl.searchParams.get("token") ?? "", "VERIFY_EMAIL");
    if (userId) await prisma.user.update({ where: { id: userId }, data: { emailVerifiedAt: new Date() } });

    return NextResponse.redirect(new URL(`/settings?verified=${userId ? "1" : "0"}`, req.url));
}
