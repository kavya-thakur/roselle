import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { getCurrentUser } from "@/lib/auth/getCurrentUser";
import { handleRouteError, parseBody } from "@/lib/api/http";
import { businessSettingsSchema } from "@/lib/validations/enquiry";

// The creator's business settings: the currency amounts are counted in (changing it relabels,
// it doesn't convert), the monthly goal, and whether the Monday email comes. Only what's sent changes.
export async function PUT(req: NextRequest) {
    try {
        const user = await getCurrentUser();
        if (!user) throw new Error("UNAUTHORIZED");

        const parsed = await parseBody(req, businessSettingsSchema);
        if (!parsed.success) return parsed.response;

        await prisma.user.update({ where: { id: user.id }, data: parsed.data });
        return NextResponse.json({ ok: true });
    } catch (error) {
        return handleRouteError(error, "Business settings");
    }
}
