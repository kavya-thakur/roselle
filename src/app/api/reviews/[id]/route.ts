import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { getCurrentUser } from "@/lib/auth/getCurrentUser";
import { handleRouteError, parseBody } from "@/lib/api/http";
import { refreshPublicPage } from "@/lib/pages/publish";

const approvalSchema = z.object({ approved: z.boolean() });

// Only the signed-in creator's own reviews: the page id is part of every query
async function owned(params: RouteContext<"/api/reviews/[id]">["params"]) {
    const user = await getCurrentUser();
    if (!user) throw new Error("UNAUTHORIZED");
    return { where: { id: Number((await params).id) || 0, pageId: user.page.id }, username: user.page.username };
}

const gone = () => NextResponse.json({ ok: false, message: "That review is already gone" }, { status: 404 });

// Show a review on the page, or take it off again. The page refreshes either way.
export async function PATCH(req: NextRequest, { params }: RouteContext<"/api/reviews/[id]">) {
    try {
        const { where, username } = await owned(params);
        const parsed = await parseBody(req, approvalSchema);
        if (!parsed.success) return parsed.response;

        const { count } = await prisma.review.updateMany({ where, data: { approvedAt: parsed.data.approved ? new Date() : null } });
        if (!count) return gone();

        refreshPublicPage(username);
        return NextResponse.json({ ok: true });
    } catch (error) {
        return handleRouteError(error, "Approve review");
    }
}

export async function DELETE(_req: NextRequest, { params }: RouteContext<"/api/reviews/[id]">) {
    try {
        const { where, username } = await owned(params);
        const { count } = await prisma.review.deleteMany({ where });
        if (!count) return gone();

        refreshPublicPage(username);
        return NextResponse.json({ ok: true });
    } catch (error) {
        return handleRouteError(error, "Delete review");
    }
}
