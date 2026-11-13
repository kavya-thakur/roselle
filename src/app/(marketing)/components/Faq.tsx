import { IconPlus } from "@tabler/icons-react";

// Each answer matches what the product really does today; change them together
const QUESTIONS = [
    {
        q: "Is Roselle really free?",
        a: "Yes. Every template, block and pattern is free right now, with no card and no time limit. Pro extras are on the way; anything you've built stays yours either way.",
    },
    {
        q: "How long does it take to set up?",
        a: "About a minute. Claim your name, pick a look, paste your first link. Your photo, bio and the rest can come later; the page autosaves as you go.",
    },
    {
        q: "Can I move over from another link-in-bio tool?",
        a: "Paste your links into the Add box one by one and Roselle names each one for you. Then put your new page address in your bio and you're done.",
    },
    {
        q: "Do you take a cut of tips or payments?",
        a: "Never. The tip block links to your own PayPal, Ko-fi, Buy Me a Coffee or UPI, so the money goes straight to you. Roselle never touches it.",
    },
    {
        q: "What do you know about my visitors?",
        a: "Only what helps you: how many came, from where, on what kind of device and what they tapped. No ads, no cross-site tracking, and visitors are counted without storing their IP address.",
    },
    {
        q: "Can I change my address later?",
        a: "Yes, in Settings. The old address stops working straight away, so update it wherever you've shared it (the QR code updates on its own).",
    },
];

// The usual questions, answered plainly. Native <details>, so every answer opens with the
// keyboard and shows without JavaScript; the opening is animated in CSS.
export function Faq() {
    return (
        <section id="faq" aria-labelledby="faq-title" className="bg-shell py-28 text-forest lg:py-40">
            <div className="mx-auto grid max-w-[1360px] gap-12 px-5 lg:grid-cols-12 lg:gap-6 lg:px-10">
                <div className="lg:col-span-4">
                    <div className="lg:sticky lg:top-28">
                        <h2 id="faq-title" data-heading className="font-(family-name:--font-anton) text-[clamp(3.4rem,6vw,6rem)] leading-[0.88] uppercase">
                            Good
                            <span className="block text-pink">questions.</span>
                        </h2>
                        <p data-rise className="mt-6 max-w-xs text-[17px] leading-relaxed text-ink/60">
                            Anything else? Start a page and see; it&rsquo;s free and takes a minute.
                        </p>
                    </div>
                </div>

                <ul className="border-t border-forest/15 lg:col-span-7 lg:col-start-6">
                    {QUESTIONS.map((item) => (
                        <li key={item.q} data-rise className="border-b border-forest/15">
                            <details className="group py-2">
                                <summary className="flex cursor-pointer list-none items-center justify-between gap-6 py-5 text-[clamp(1.15rem,1.7vw,1.45rem)] font-bold [&::-webkit-details-marker]:hidden">
                                    {item.q}
                                    <span className="grid size-10 shrink-0 place-items-center rounded-full bg-blush text-pink transition-[transform,background-color] duration-300 group-open:rotate-45 group-open:bg-pink group-open:text-white">
                                        <IconPlus size={20} />
                                    </span>
                                </summary>
                                <p className="max-w-2xl pr-14 pb-6 text-[17px] leading-relaxed text-ink/70 group-open:animate-[faq-open_0.4s_ease-out]">{item.a}</p>
                            </details>
                        </li>
                    ))}
                </ul>
            </div>
        </section>
    );
}
