import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { getCurrentUser } from "@/lib/auth/getCurrentUser";
import { handleRouteError, parseBody } from "@/lib/api/http";
import { usernameChangeSchema } from "@/lib/validations/settings";
import { refreshPublicPage } from "@/lib/pages/publish";

// A new address for the page. The old one stops working straight away (and is free for
// someone else), so the settings screen warns about that before saving.
export async function PUT(req: NextRequest) {
    try {
        const user = await getCurrentUser();
        if (!user) throw new Error("UNAUTHORIZED");

        const parsed = await parseBody(req, usernameChangeSchema);
        if (!parsed.success) return parsed.response;

        const { username } = parsed.data;

        const taken = await prisma.page.findFirst({ where: { username, NOT: { id: user.page.id } }, select: { id: true } });
        if (taken) {
            return NextResponse.json({ ok: false, message: "That name is taken" }, { status: 409 });
        }

        await prisma.page.update({ where: { id: user.page.id }, data: { username } });

        refreshPublicPage(user.page.username);
        refreshPublicPage(username);

        return NextResponse.json({ ok: true, data: { username } });
    } catch (error) {
        return handleRouteError(error, "Change username");
    }
}
