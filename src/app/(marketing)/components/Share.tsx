"use client";

import { useLayoutEffect, useRef, useState } from "react";
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
//
// Below laptop width the places sit in two rows, three above the card and three below, and each
// gets its own curve to the card. Those curves are measured from where the pills really land
// (they wrap differently on every screen), so they always join pill to card.
export function Share() {
    const ref = useRef<HTMLElement>(null);
    const [curves, setCurves] = useState<{ width: number; height: number; paths: string[] }>({ width: 0, height: 0, paths: [] });

    useLayoutEffect(() => {
        const stage = ref.current!.querySelector<HTMLElement>("[data-share-stage]")!;
        const holder = stage.querySelector<HTMLElement>("[data-share-holder]")!;
        const card = stage.querySelector<HTMLElement>("[data-share-float]")!;

        const measure = () => {
            if (window.innerWidth >= 1024) return;
            const box = stage.getBoundingClientRect();
            // the card's place, from its holder (which never moves) and its own size
            const holderBox = holder.getBoundingClientRect();
            const cardLeft = holderBox.left - box.left + (holderBox.width - card.offsetWidth) / 2;
            const cardTop = holderBox.top - box.top;
            const cardBottom = cardTop + card.offsetHeight;

            const paths = [...stage.querySelectorAll<HTMLElement>("[data-share-pin]")].map((pill) => {
                // the pill's centre doesn't move while it pops in (it scales from the middle)
                const pillBox = pill.getBoundingClientRect();
                const x = pillBox.left + pillBox.width / 2 - box.left;
                const y = pillBox.top + pillBox.height / 2 - box.top;
                const above = pill.dataset.sharePin === "top";
                const from = y + (above ? 1 : -1) * (pill.offsetHeight / 2 + 2);
                // each line lands on the card right in line with its pill (kept off the corners),
                // so lines never cross each other
                const to = { x: Math.min(Math.max(x, cardLeft + 36), cardLeft + card.offsetWidth - 36), y: above ? cardTop + 14 : cardBottom - 14 };
                const middle = (from + to.y) / 2;
                return `M${x} ${from} C ${x} ${middle}, ${to.x} ${middle}, ${to.x} ${to.y}`;
            });
            setCurves({ width: box.width, height: box.height, paths });
        };

        measure();
        const observer = new ResizeObserver(measure);
        observer.observe(stage);
        return () => observer.disconnect();
    }, []);

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
        // rebuilt once the phone curves exist, so they're drawn on scroll like the rest
        { scope: ref, dependencies: [curves.paths.length], revertOnUpdate: true },
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
                {/* smaller screens: a curve from each place to the card, measured in the effect above */}
                <svg aria-hidden width={curves.width} height={curves.height} className="pointer-events-none absolute inset-0 lg:hidden">
                    {curves.paths.map((path, i) => (
                        <path key={i} data-share-line d={path} fill="none" stroke="#e0408f" strokeWidth="5" strokeLinecap="round" />
                    ))}
                </svg>

                {/* smaller screens: the first three places above the card */}
                <Places places={PLACES.slice(0, 3)} pin="top" />

                <ul className="hidden lg:contents">
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
                <div data-share-holder className="relative mt-20 flex justify-center lg:absolute lg:top-1/2 lg:left-1/2 lg:mt-0 lg:-translate-x-1/2 lg:-translate-y-1/2">
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

                {/* smaller screens: the other three below it */}
                <Places places={PLACES.slice(3)} pin="bottom" />
            </div>
        </section>
    );
}

// A row of place pills for smaller screens, above or below the card
function Places({ places, pin }: { places: typeof PLACES; pin: "top" | "bottom" }) {
    return (
        <ul className={`relative flex flex-wrap justify-center gap-2.5 lg:hidden ${pin === "bottom" ? "mt-20" : ""}`}>
            {places.map(({ label, icon: Icon }) => (
                <li key={label} data-share-place data-share-pin={pin}>
                    <span className="flex items-center gap-2 rounded-full bg-paper py-2.5 pr-4 pl-3 text-[14px] font-bold whitespace-nowrap shadow-soft">
                        <Icon size={19} className="text-pink" />
                        {label}
                    </span>
                </li>
            ))}
        </ul>
    );
}
