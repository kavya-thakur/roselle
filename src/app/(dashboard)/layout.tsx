import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/getCurrentUser";
import { KeyboardFix } from "./KeyboardFix";

// Everything signed-in lives under here. The proxy only checks that a cookie exists; this checks
// it's a real, current session. The editor is full-screen; analytics and settings get the sidebar
// from (shell)/layout.tsx.
export default async function DashboardLayout({ children }: LayoutProps<"/">) {
    const user = await getCurrentUser();

    if (!user) {
        redirect("/login");
    }

    return (
        <div className="flex h-dvh flex-col bg-cream">
            {children}
            <KeyboardFix />
        </div>
    );
}
