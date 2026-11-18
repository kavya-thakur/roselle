import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/getCurrentUser";
import { handleRouteError } from "@/lib/api/http";
import { getPublishedPage } from "@/lib/pages/publish";
import { posterImage, storyImage } from "@/lib/pages/shareImages";

// The signed-in creator's share kit, as a download: their page as an Instagram story (story) or a
// poster to print (poster). Drawn from the published page, so what it shows is what the link opens.
export async function GET(_req: NextRequest, { params }: RouteContext<"/api/share/[kind]">) {
    try {
        const { kind } = await params;
        if (kind !== "story" && kind !== "poster") return NextResponse.json({ ok: false, message: "Not found" }, { status: 404 });

        const user = await getCurrentUser();
        if (!user) throw new Error("UNAUTHORIZED");

        const page = await getPublishedPage(user.page.username);
        if (!page) return NextResponse.json({ ok: false, message: "Publish your page first, so the link in the picture opens it." }, { status: 409 });

        const headers = { "Content-Disposition": `attachment; filename="roselle-${page.username}-${kind}.png"`, "Cache-Control": "private, no-store" };
        return kind === "story" ? storyImage(page, headers) : await posterImage(page, headers);
    } catch (error) {
        return handleRouteError(error, "Share image");
    }
}
