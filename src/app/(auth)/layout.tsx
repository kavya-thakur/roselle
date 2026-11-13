import { Logo } from "@/components/Logo";
import { AuthShowcase } from "./AuthShowcase";

// Sign in and sign up share one look: the form on cream, and on wide screens a green panel with
// a wall of real creator pages drifting past
export default function AuthLayout({ children }: LayoutProps<"/">) {
    return (
        <div className="grid min-h-dvh flex-1 lg:grid-cols-[1fr_1.05fr]">
            <div className="flex flex-col px-6 py-6 sm:px-12">
                <Logo />
                <main className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center py-12 animate-[fade-in_0.5s_ease-out]">{children}</main>
                <p className="text-xs text-faint">© {new Date().getFullYear()} Roselle</p>
            </div>

            <AuthShowcase />
        </div>
    );
}
