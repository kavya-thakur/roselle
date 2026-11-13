import Link from "next/link";
import { Logo } from "@/components/Logo";

// Terms, privacy and the report form: plain reading pages, the logo on top and the links between them below
export default function LegalLayout({ children }: LayoutProps<"/">) {
    return (
        <div className="flex min-h-dvh flex-1 flex-col bg-cream">
            <header className="mx-auto w-full max-w-2xl px-6 pt-8">
                <Logo />
            </header>
            <main className="mx-auto w-full max-w-2xl flex-1 px-6 py-14">{children}</main>
            <footer className="mx-auto flex w-full max-w-2xl gap-5 px-6 pb-10 text-sm text-muted">
                <Link href="/terms" className="hover:text-ink">Terms</Link>
                <Link href="/privacy" className="hover:text-ink">Privacy</Link>
                <span className="ml-auto">© {new Date().getFullYear()} Roselle</span>
            </footer>
        </div>
    );
}
