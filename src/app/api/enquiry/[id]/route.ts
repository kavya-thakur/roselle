import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { getCurrentUser } from "@/lib/auth/getCurrentUser";
import { handleRouteError } from "@/lib/api/http";

// Deletes one message from the signed-in creator's inbox (and only theirs)
export async function DELETE(_req: Request, { params }: RouteContext<"/api/enquiry/[id]">) {
    try {
        const user = await getCurrentUser();
        if (!user) throw new Error("UNAUTHORIZED");

        const { count } = await prisma.enquiry.deleteMany({ where: { id: Number((await params).id) || 0, pageId: user.page.id } });
        if (!count) return NextResponse.json({ ok: false, message: "That message is already gone" }, { status: 404 });

        return NextResponse.json({ ok: true });
    } catch (error) {
        return handleRouteError(error, "Delete enquiry");
    }
}
