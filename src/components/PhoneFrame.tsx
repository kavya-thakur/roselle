import type { ReactNode } from "react";

// the buttons stick out 2px from the frame's sides, drawn as slim metal bars
const BUTTON = "absolute w-[3px] bg-gradient-to-b from-[#3a3a3a] via-[#1c1c1c] to-[#3a3a3a]";

// A phone-shaped window onto a creator page: the landing page, the sign-in screen and the
// editor's mobile preview. The page inside scrolls on its own. A thin dark bezel with a lit
// metal rim, side buttons, the camera island and a faint sheen across the glass; the shadow is
// several layers (a tight contact shadow up to a wide soft one) so it sits on the page like an object.
export function PhoneFrame({ children, className = "" }: { children: ReactNode; className?: string }) {
    return (
        <div className={`relative ${className}`}>
            <span className={`${BUTTON} top-[17%] -left-[2px] h-[5%] rounded-l-[2px]`} />
            <span className={`${BUTTON} top-[25%] -left-[2px] h-[9%] rounded-l-[2px]`} />
            <span className={`${BUTTON} top-[36%] -left-[2px] h-[9%] rounded-l-[2px]`} />
            <span className={`${BUTTON} top-[28%] -right-[2px] h-[13%] rounded-r-[2px]`} />

            <div className="relative h-full rounded-[3rem] bg-[#111] p-[5px] shadow-[0_1px_2px_rgb(0_0_0/0.12),0_6px_12px_-4px_rgb(0_0_0/0.16),0_28px_56px_-16px_rgb(20_20_20/0.32),0_70px_110px_-40px_rgb(20_20_20/0.38)]">
                {/* the metal rim: a hairline catching light, brighter along the top edge */}
                <span className="pointer-events-none absolute inset-0 rounded-[inherit] shadow-[inset_0_0_0_1px_rgb(255_255_255/0.12),inset_0_1.5px_0_rgb(255_255_255/0.28),inset_0_-1px_0_rgb(255_255_255/0.06)]" />

                <div className="relative h-full overflow-hidden rounded-[2.65rem] bg-black">
                    <div className="h-full overflow-y-auto overscroll-contain [scrollbar-width:none]">{children}</div>
                    {/* the glass: a soft diagonal sheen over the top left corner */}
                    <span className="pointer-events-none absolute inset-0 z-20 bg-[linear-gradient(118deg,rgb(255_255_255/0.16)_0%,rgb(255_255_255/0.04)_24%,transparent_38%)]" />
                    {/* the camera island */}
                    <span className="absolute top-2.5 left-1/2 z-30 h-[22px] w-[32%] max-w-[104px] -translate-x-1/2 rounded-full bg-black shadow-[inset_0_0_0_1px_rgb(255_255_255/0.05)]" />
                </div>
            </div>
        </div>
    );
}
