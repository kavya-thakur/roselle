"use client";

import { useRef } from "react";
import Link from "next/link";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import { useGSAP } from "@gsap/react";
import { IconArrowRight, IconCircleCheckFilled } from "@tabler/icons-react";

import type { PageDoc } from "@/lib/validations/page";
import { ProfileCard } from "./ProfileCard";
import { SITE_HOST } from "@/lib/site";

gsap.registerPlugin(useGSAP, ScrollTrigger, SplitText);

const COLUMNS = [
    {
        title: "Product",
        links: [
            { href: "#features", label: "Features" },
            { href: "#templates", label: "Templates" },
            { href: "#pricing", label: "Pricing" },
        ],
    },
    {
        title: "Account",
        links: [
            { href: "/register", label: "Sign up" },
            { href: "/login", label: "Log in" },
        ],
    },
    {
        title: "Legal",
        links: [
            { href: "/terms", label: "Terms" },
            { href: "/privacy", label: "Privacy" },
        ],
    },
];

// Where the claimed pages float round the last call, and the name each one has taken. The two
// inner ones only show from tablets up; `speed` is how fast each drifts up as you scroll.
const SPOTS = [
    { left: "3%", top: "9%", tilt: -8, speed: 1.2, scale: { phone: 0.26, desktop: 0.4 }, handle: "kwame" },
    { left: "14%", top: "50%", tilt: 6, speed: 0.7, scale: { phone: 0.26, desktop: 0.34 }, handle: "lucia", inner: true },
    { right: "3%", top: "7%", tilt: 7, speed: 1.2, scale: { phone: 0.26, desktop: 0.4 }, handle: "daniel" },
    { right: "14%", top: "49%", tilt: -6, speed: 0.7, scale: { phone: 0.26, desktop: 0.34 }, handle: "folake", inner: true },
];

// Names that type themselves into the claim box while nobody's using it
const EXAMPLES = ["yourname", "studio.ana", "theo.cooks", "inesduarte", "yourname"];

// The end of the page: one last "claim your name", made real. Around it float pages people have
// already claimed, each tagged with the name it took, so "before someone else does" is something
// you can see. The address box is the biggest thing on screen and types example names to itself
// until you click into it. Below, the links, then the wordmark across the whole width climbing
// out of the bottom edge letter by letter as you reach the very end.
export function Footer({ pages }: { pages: PageDoc[] }) {
    const ref = useRef<HTMLElement>(null);
    const input = useRef<HTMLInputElement>(null);

    useGSAP(
        () => {
            const mm = gsap.matchMedia(ref);
            mm.add("(prefers-reduced-motion: no-preference)", () => {
                const claimed = gsap.utils.toArray<HTMLElement>("[data-claimed]");

                // arriving: the pages spring up one after another, then their "claimed" tags pop on
                const arrive = gsap.timeline({ scrollTrigger: { trigger: "[data-claim]", start: "top 70%" } });
                arrive.from("[data-claimed-card]", { scale: 0.3, y: 120, autoAlpha: 0, rotation: (i) => (i % 2 ? 25 : -25), duration: 1.2, ease: "back.out(1.6)", stagger: 0.12 });
                arrive.from("[data-claimed-tag]", { scale: 0, autoAlpha: 0, duration: 0.6, ease: "back.out(2.5)", stagger: 0.12 }, 0.7);

                // floating, each at its own pace
                claimed.forEach((spot) =>
                    gsap.to(spot.querySelector("[data-bob]"), { y: gsap.utils.random(-16, 16), duration: gsap.utils.random(2.8, 4.2), ease: "sine.inOut", repeat: -1, yoyo: true }),
                );
                // and, where there's room beside the words, drifting up past you at different speeds
                if (matchMedia("(min-width: 768px)").matches) claimed.forEach((spot) =>
                    gsap.fromTo(spot, { y: 140 * Number(spot.dataset.speed) }, { y: -140 * Number(spot.dataset.speed), ease: "none", scrollTrigger: { trigger: "[data-claim]", start: "top bottom", end: "bottom top", scrub: true } }),
                );

                // the headline's words rise in, then the box
                const words = SplitText.create("[data-claim-title]", { type: "words,lines", mask: "lines" });
                gsap.from(words.words, { yPercent: 110, duration: 1.2, ease: "expo.out", stagger: 0.06, scrollTrigger: { trigger: "[data-claim-title]", start: "top 80%" } });
                gsap.from("[data-claim-box]", { y: 40, scale: 0.94, autoAlpha: 0, duration: 1.1, ease: "expo.out", scrollTrigger: { trigger: "[data-claim-box]", start: "top 90%" } });

                // the box types example names into its placeholder, over and over, while it's empty
                const field = input.current!;
                const typing = gsap.timeline({ repeat: -1, paused: true });
                EXAMPLES.forEach((name) => {
                    const typed = { n: 0 };
                    const show = () => (field.placeholder = name.slice(0, Math.round(typed.n)));
                    typing.to(typed, { n: name.length, duration: name.length * 0.08, ease: "none", onUpdate: show });
                    typing.to(typed, { n: 0, duration: name.length * 0.035, ease: "none", onUpdate: show }, "+=1.4");
                });
                ScrollTrigger.create({ trigger: "[data-claim-box]", start: "top bottom", end: "bottom top", onToggle: (self) => (self.isActive ? typing.play() : typing.pause()) });
                const stop = () => {
                    typing.pause();
                    field.placeholder = "yourname";
                };
                field.addEventListener("focus", stop);

                // the wordmark climbs out of the bottom edge letter by letter, tied to the scroll
                const letters = SplitText.create("[data-wordmark]", { type: "chars" });
                gsap.from(letters.chars, { yPercent: 100, ease: "none", stagger: 0.08, scrollTrigger: { trigger: "[data-wordmark]", start: "top bottom", end: "bottom bottom", scrub: 0.8 } });

                return () => field.removeEventListener("focus", stop);
            });
        },
        { scope: ref },
    );

    return (
        <footer ref={ref} className="relative overflow-hidden bg-forest text-white [--focus:var(--color-rose)]">
            {/* ---------- the last call ---------- */}
            <div data-claim className="relative flex min-h-[92svh] flex-col items-center justify-center px-5 pt-80 pb-28 text-center md:pt-36">
                {/* a soft light behind the words */}
                <span aria-hidden className="absolute top-1/2 left-1/2 size-[min(900px,120vw)] -translate-1/2 rounded-full bg-[radial-gradient(closest-side,rgb(246_181_207/0.16),transparent)]" />

                <div aria-hidden className="absolute inset-0">
                    {SPOTS.map((spot, i) => (
                        <div
                            key={spot.handle}
                            data-claimed
                            data-speed={spot.speed}
                            className={`absolute max-md:top-12! ${spot.inner ? "hidden md:block" : ""}`}
                            style={{ left: spot.left, right: spot.right, top: spot.top }}
                        >
                            <div data-bob>
                                <div className="relative" style={{ transform: `rotate(${spot.tilt}deg)` }}>
                                    <div data-claimed-card>
                                        <ProfileCard page={pages[i % pages.length]} scale={spot.scale} />
                                    </div>
                                    {/* the name it took */}
                                    <p
                                        data-claimed-tag
                                        className="absolute -bottom-4 left-1/2 flex -translate-x-1/2 items-center gap-1.5 rounded-full bg-paper py-2 pr-3.5 pl-2.5 text-[13px] font-bold whitespace-nowrap text-forest shadow-lifted"
                                    >
                                        <IconCircleCheckFilled size={16} className="text-pink" />@{spot.handle}
                                        <span className="font-medium text-ink/45">claimed</span>
                                    </p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                <h2 data-claim-title className="relative max-w-[min(56rem,90vw)] font-(family-name:--font-anton) text-[clamp(3.2rem,7.4vw,8rem)] leading-[0.88] uppercase md:max-w-[min(48rem,58vw)]">
                    Claim your name
                    <span className="block text-rose">before someone else does.</span>
                </h2>

                {/* the address itself, big: a plain GET form, /register fills the name in */}
                <form
                    data-claim-box
                    action="/register"
                    method="get"
                    className="relative mt-14 flex w-full max-w-xl items-center gap-2 rounded-full bg-paper p-2 text-ink shadow-[0_30px_60px_-24px_rgb(0_0_0/0.5)] focus-within:outline-3 focus-within:outline-offset-4 focus-within:outline-rose"
                >
                    <label className="flex min-w-0 flex-1 items-center pl-5 text-[clamp(1rem,2.2vw,1.35rem)]">
                        <span className="sr-only">Your page address:</span>
                        <span className="shrink-0 font-medium text-ink/45">{SITE_HOST}/</span>
                        <input
                            ref={input}
                            name="username"
                            placeholder="yourname"
                            autoComplete="off"
                            autoCapitalize="none"
                            spellCheck={false}
                            maxLength={30}
                            className="w-full min-w-0 bg-transparent font-bold text-forest placeholder:text-pink focus-visible:outline-none!"
                        />
                    </label>
                    {/* 19px bold: large text, so white on pink is readable */}
                    <button type="submit" className="group flex h-14 shrink-0 items-center gap-2 rounded-full bg-pink px-6 text-[19px] font-bold text-white transition-colors duration-300 hover:bg-pink-hover">
                        Claim
                        <IconArrowRight size={20} className="transition-transform duration-300 group-hover:translate-x-1" />
                    </button>
                </form>
                <p className="relative mt-5 text-[15px] text-white/60">Free forever · No card needed · Live in a minute</p>
            </div>

            {/* ---------- links ---------- */}
            <div className="relative mx-auto grid w-full max-w-[1360px] gap-10 border-t border-white/15 px-5 pt-12 sm:grid-cols-2 lg:grid-cols-12 lg:gap-6 lg:px-10">
                <p className="max-w-xs text-[17px] leading-relaxed text-white/70 lg:col-span-6">Everything you are, one link. Made with care for people who make things.</p>
                {COLUMNS.map((column) => (
                    <nav key={column.title} aria-label={column.title} className="lg:col-span-2">
                        <h3 className="text-[13px] font-bold tracking-[0.16em] text-rose uppercase">{column.title}</h3>
                        <ul className="mt-4 flex flex-col gap-2.5 text-[16px] font-semibold">
                            {column.links.map((link) => (
                                <li key={link.href}>
                                    <Link href={link.href} className="transition-colors duration-300 hover:text-rose">
                                        {link.label}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </nav>
                ))}
                <p className="text-[14px] text-white/55 lg:col-span-2 lg:text-right">&copy; {new Date().getFullYear()} Roselle</p>
            </div>

            {/* Anton's capitals are about 0.43em wide, so 30vw spans the seven letters across the page;
                overflow-hidden on the line is the edge the letters climb out of */}
            <p data-wordmark aria-hidden className="relative mt-10 overflow-hidden text-center font-(family-name:--font-anton) text-[30vw] leading-[0.82] text-rose uppercase">
                Roselle
            </p>
        </footer>
    );
}
