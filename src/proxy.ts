import { NextRequest, NextResponse } from "next/server";

// The cookie set by startSession (src/lib/auth/session.ts). Not imported from there: that file
// brings the database along, and this runs before every matching request.
//
// Optimistic check only: no cookie, no point rendering the app. The real check (is the session
// still valid?) happens in the dashboard layout and every API route.
export function proxy(req: NextRequest) {
    if (!req.cookies.has("session")) {
        return NextResponse.redirect(new URL("/login", req.url));
    }

    return NextResponse.next();
}

export const config = {
    matcher: ["/editor/:path*", "/analytics/:path*", "/settings/:path*", "/admin/:path*", "/inbox/:path*", "/reviews/:path*", "/welcome/:path*"],
};
