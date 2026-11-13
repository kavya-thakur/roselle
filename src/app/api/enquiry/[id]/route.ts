import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { getCurrentUser } from "@/lib/auth/getCurrentUser";
import { handleRouteError, parseBody } from "@/lib/api/http";
import { bookedAtFor, repliedAtFor } from "@/lib/bookings";
import { enquiryUpdateSchema } from "@/lib/validations/enquiry";

// Every route here only ever touches the signed-in creator's own enquiries: the page id is part
// of each query, so another id in the address finds nothing.
const ownedBy = async (params: RouteContext<"/api/enquiry/[id]">["params"]) => {
    const user = await getCurrentUser();
    if (!user) throw new Error("UNAUTHORIZED");
    return { id: Number((await params).id) || 0, pageId: user.page.id };
};

const gone = () => NextResponse.json({ ok: false, message: "That message is already gone" }, { status: 404 });

// Moves an enquiry along (New → Replied → Booked → Paid, or Not going ahead) and sets what it's worth
export async function PATCH(req: NextRequest, { params }: RouteContext<"/api/enquiry/[id]">) {
    try {
        const where = await ownedBy(params);
        const parsed = await parseBody(req, enquiryUpdateSchema);
        if (!parsed.success) return parsed.response;

        const enquiry = await prisma.enquiry.findFirst({ where, select: { bookedAt: true, repliedAt: true } });
        if (!enquiry) return gone();

        const { status, amount } = parsed.data;
        const updated = await prisma.enquiry.update({
            where: { id: where.id },
            data: {
                ...(status && { status, bookedAt: bookedAtFor(status, enquiry.bookedAt), repliedAt: repliedAtFor(status, enquiry.repliedAt) }),
                ...(amount !== undefined && { amount }),
            },
            select: { status: true, amount: true, bookedAt: true },
        });

        return NextResponse.json({ ok: true, data: updated });
    } catch (error) {
        return handleRouteError(error, "Update enquiry");
    }
}

export async function DELETE(_req: NextRequest, { params }: RouteContext<"/api/enquiry/[id]">) {
    try {
        const { count } = await prisma.enquiry.deleteMany({ where: await ownedBy(params) });
        return count ? NextResponse.json({ ok: true }) : gone();
    } catch (error) {
        return handleRouteError(error, "Delete enquiry");
    }
}
