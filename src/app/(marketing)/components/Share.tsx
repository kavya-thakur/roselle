"use client";

import { useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { DrawSVGPlugin } from "gsap/DrawSVGPlugin";
import { useGSAP } from "@gsap/react";
import { IconBrandInstagram, IconBrandTiktok, IconBrandYoutube, IconId, IconMail, IconBrandWhatsapp } from "@tabler/icons-react";

import { QrCode } from "@/components/QrCode";
import { SITE_HOST, SITE_URL } from "@/lib/site";

gsap.registerPlugin(useGSAP, ScrollTrigger, DrawSVGPlugin);

// The places one Roselle address ends up, round the card in the middle. `x`/`y` are where each
// sits on a 1000 × 600 stage (the same box the lines are drawn in), so lines and pills line up.
const PLACES = [
    { label: "Instagram bio", icon: IconBrandInstagram, x: 120, y: 110 },
    { label: "TikTok profile", icon: IconBrandTiktok, x: 80, y: 300 },
    { label: "YouTube description", icon: IconBrandYoutube, x: 150, y: 490 },
    { label: "Email signature", icon: IconMail, x: 870, y: 110 },
    { label: "WhatsApp status", icon: IconBrandWhatsapp, x: 920, y: 300 },
    { label: "Business card", icon: IconId, x: 850, y: 490 },
];

// The middle of the stage, where every line ends: the card
const CENTRE = { x: 500, y: 300 };

// "Share it everywhere": a printed card with the page's QR code in the middle, and lines drawing
// themselves in from the places the same link goes, while those places pop up one by one.
export function Share() {
    const ref = useRef<HTMLElement>(null);

    useGSAP(
        () => {
            const mm = gsap.matchMedia(ref);
            mm.add("(prefers-reduced-motion: no-preference)", () => {
                const steps = gsap.timeline({ scrollTrigger: { trigger: "[data-share-stage]", start: "top 75%", end: "center 50%", scrub: 0.6 } });
                steps
                    .from("[data-share-card]", { scale: 0.7, rotation: -12, autoAlpha: 0, duration: 0.5, ease: "back.out(1.6)" })
                    .fromTo("[data-share-line]", { drawSVG: "0%" }, { drawSVG: "100%", duration: 0.6, stagger: 0.06, ease: "power1.inOut" }, 0.2)
                    .from("[data-share-place]", { scale: 0.4, autoAlpha: 0, duration: 0.3, stagger: 0.06, ease: "back.out(2)" }, 0.25);
                // the card floats once it's there
                gsap.to("[data-share-float]", { y: -12, rotation: 2, duration: 3.2, ease: "sine.inOut", repeat: -1, yoyo: true });
            });
        },
        { scope: ref },
    );

    return (
        <section ref={ref} id="share" aria-labelledby="share-title" className="overflow-hidden bg-blush py-28 text-forest lg:py-40">
            <div className="mx-auto max-w-[1360px] px-5 text-center lg:px-10">
                <h2 id="share-title" data-heading className="mx-auto max-w-5xl font-(family-name:--font-anton) text-[clamp(3.4rem,7vw,7rem)] leading-[0.88] uppercase">
                    One link.
                    <span className="block text-pink">Everywhere you are.</span>
                </h2>
                <p data-rise className="mx-auto mt-7 max-w-lg text-[18px] leading-relaxed text-ink/65">
                    Put it in every bio, every signature, every printed card. Your page has its own QR code, ready to download.
                </p>
            </div>

            {/* ---------- the stage: a 1000 × 600 box, lines underneath, pills and the card on top ---------- */}
            <div data-share-stage className="relative mx-auto mt-16 aspect-[10/6] w-full max-w-[1100px] max-lg:aspect-auto max-lg:px-5">
                <svg aria-hidden viewBox="0 0 1000 600" preserveAspectRatio="none" className="absolute inset-0 hidden size-full lg:block">
                    {PLACES.map((place) => {
                        // a soft curve from the pill to the card, bending away from the middle
                        const bend = (place.y - CENTRE.y) * 0.6;
                        return (
                            <path
                                key={place.label}
                                data-share-line
                                d={`M${place.x} ${place.y} C ${(place.x + CENTRE.x) / 2} ${place.y - bend * 0.2}, ${(place.x + CENTRE.x) / 2} ${CENTRE.y + bend * 0.4}, ${CENTRE.x} ${CENTRE.y}`}
                                fill="none"
                                stroke="#e0408f"
                                strokeWidth="10"
                                strokeLinecap="round"
                                vectorEffect="non-scaling-stroke"
                            />
                        );
                    })}
                </svg>

                {/* the places: round the card on the stage from laptops up, a wrapped row on smaller screens */}
                <ul className="flex flex-wrap justify-center gap-2.5 lg:contents">
                    {PLACES.map(({ label, icon: Icon, x, y }) => (
                        <li
                            key={label}
                            data-share-place
                            // left/top only count once the pill is absolutely placed (laptops up);
                            // smaller screens put it in the wrapped row and they're ignored
                            className="lg:absolute lg:-translate-x-1/2 lg:-translate-y-1/2"
                            style={{ left: `${x / 10}%`, top: `${y / 6}%` }}
                        >
                            <span className="flex items-center gap-2 rounded-full bg-paper py-2.5 pr-4 pl-3 text-[14px] font-bold whitespace-nowrap shadow-soft lg:text-[15px]">
                                <Icon size={19} className="text-pink" />
                                {label}
                            </span>
                        </li>
                    ))}
                </ul>

                {/* the card in the middle: the page's address and its QR code, as if printed */}
                {/* smaller screens: one line drawing itself down from the row of places to the card */}
                <svg aria-hidden viewBox="0 0 40 120" className="mx-auto mt-3 block h-24 w-8 lg:hidden">
                    <path data-share-line d="M20 0 C 38 30, 2 60, 20 90 S 20 110, 20 120" fill="none" stroke="#e0408f" strokeWidth="6" strokeLinecap="round" />
                </svg>

                <div className="relative mt-3 flex justify-center lg:absolute lg:top-1/2 lg:left-1/2 lg:mt-0 lg:-translate-x-1/2 lg:-translate-y-1/2">
                    <div data-share-card>
                        <div data-share-float className="w-[250px] rotate-[-3deg] rounded-[1.75rem] bg-forest p-5 text-left text-shell shadow-lifted">
                            <div className="flex items-center justify-between">
                                <span className="font-(family-name:--font-anton) text-xl uppercase">Mira Okafor</span>
                                <span className="size-2.5 rounded-full bg-pink" />
                            </div>
                            <p className="text-[13px] text-shell/60">Ceramicist &amp; art director</p>
                            <div className="mt-4 rounded-2xl bg-paper p-3">
                                <QrCode value={`${SITE_URL}/mira`} size={186} color="#0b4d2c" className="h-auto w-full" />
                            </div>
                            <p className="mt-3 text-center text-[14px] font-bold">{SITE_HOST}/mira</p>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
