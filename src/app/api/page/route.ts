import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { getCurrentUser } from "@/lib/auth/getCurrentUser";
import { handleRouteError, parseBody } from "@/lib/api/http";
import { saveDraftSchema } from "@/lib/validations/page";

// The editor's autosave. Only the draft changes; visitors keep seeing the published page
// until Publish is pressed.
export async function PUT(req: NextRequest) {
    try {
        const user = await getCurrentUser();
        if (!user) throw new Error("UNAUTHORIZED");

        const parsed = await parseBody(req, saveDraftSchema);
        if (!parsed.success) return parsed.response;

        const page = await prisma.page.update({
            where: { id: user.page.id },
            data: { draft: parsed.data.draft },
            select: { updatedAt: true },
        });

        return NextResponse.json({ ok: true, data: page });
    } catch (error) {
        return handleRouteError(error, "Save draft");
    }
}
