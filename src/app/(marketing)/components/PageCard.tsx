import { PageRenderer } from "@/components/PageRenderer";
import type { PageDoc } from "@/lib/validations/page";

// A creator page as a floating screen: no phone drawn around it, just the page on a big rounded
// card with a fine edge and a deep soft shadow. Cleaner than a fake device, and the page itself
// is the thing worth looking at. Decorative here, so it's skipped by screen readers and keyboards.
export function PageCard({ page, className = "" }: { page: PageDoc; className?: string }) {
    return (
        <div
            inert
            aria-hidden
            className={`relative overflow-hidden rounded-[2rem] bg-paper ring-1 ring-black/5 shadow-[0_2px_4px_rgb(20_20_20/0.04),0_20px_40px_-12px_rgb(20_20_20/0.18),0_60px_100px_-40px_rgb(11_77_44/0.35)] ${className}`}
        >
            <PageRenderer page={page} mode="preview" />
            {/* a faint sheen along the top edge, like light on glass */}
            <span className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-[linear-gradient(180deg,rgb(255_255_255/0.18),transparent)]" />
        </div>
    );
}
