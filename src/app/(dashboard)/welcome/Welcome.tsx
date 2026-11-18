"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { IconArrowLeft, IconBarbell, IconBrush, IconCamera, IconHanger, IconMicrophone2, IconPalette, IconSchool, IconSparkles, IconUserStar, IconWand } from "@tabler/icons-react";

import { Button } from "@/components/Button";
import { Dropdown } from "@/components/Dropdown";
import { inputClass } from "@/components/Field";
import { Logo } from "@/components/Logo";
import { PageRenderer } from "@/components/PageRenderer";
import { api } from "@/lib/api/client";
import { pageBackground } from "@/lib/pages/patterns";
import { CRAFTS, guessCurrency, starterFor, type Craft } from "@/lib/pages/starters";
import { TEMPLATES } from "@/lib/pages/theme";
import { CURRENCIES } from "@/lib/validations/enquiry";
import { currencySymbol } from "@/lib/utils/format";
import type { PageDoc } from "@/lib/validations/page";
import { photo, PHOTOS } from "@/app/(marketing)/components/photos";

// each currency with its symbol, so "INR" also reads "₹" (not when the symbol is just the code again)
const CURRENCY_OPTIONS = CURRENCIES.map((code) => ({ value: code as string, label: currencySymbol(code) === code ? code : `${code}  ${currencySymbol(code)}` }));

type Currency = (typeof CURRENCIES)[number];

const ICONS = { photographer: IconCamera, designer: IconPalette, illustrator: IconBrush, model: IconUserStar, makeup: IconWand, stylist: IconHanger, musician: IconMicrophone2, tutor: IconSchool, fitness: IconBarbell, other: IconSparkles };

// An example intro for each craft, as the bio box's placeholder
const BIO_EXAMPLES: Record<Craft, string> = {
    photographer: "Wedding and portrait photographer in Jaipur.",
    designer: "Brand and web designer for small, ambitious companies.",
    illustrator: "Illustrator drawing people, plants and cities.",
    model: "Fashion and commercial model based in Mumbai.",
    makeup: "Bridal and party makeup artist in Delhi.",
    stylist: "Personal and editorial stylist in Bengaluru.",
    musician: "Singer and guitarist for weddings and events.",
    tutor: "Maths and science tutor for classes 8 to 12.",
    fitness: "Strength and fat-loss coach, in person and online.",
    other: "What you do, in one line.",
};

// The preview with photos in it, so a look is judged on what the page will be, not on empty
// frames. Only the preview: the page itself starts empty, and says so under the preview.
function withExamplePhotos(page: PageDoc): PageDoc {
    const work = [PHOTOS.cupHand, PHOTOS.chair, PHOTOS.piano, PHOTOS.desk, PHOTOS.elena, PHOTOS.mira].map((picture) => ({ src: photo(picture.id), alt: picture.alt }));
    return {
        ...page,
        profile: { ...page.profile, avatar: photo(PHOTOS.ines.id, 900) },
        blocks: page.blocks.map((block) => {
            if (block.type === "gallery") return { ...block, images: work };
            if (block.type === "project") return { ...block, image: photo(PHOTOS.desk.id, 900) };
            return block;
        }),
    };
}

// Three short steps, then the editor. Each answer shapes the page: the craft decides the blocks,
// the name and intro fill the header, the currency prices the example services, the look is the
// template. The last step shows the actual page they'll get, updating as they pick.
export function Welcome({ username }: { username: string }) {
    const router = useRouter();
    const [step, setStep] = useState(1);
    const [craft, setCraft] = useState<Craft>("photographer");
    const [name, setName] = useState(username);
    const [bio, setBio] = useState("");
    const [currency, setCurrency] = useState<Currency>("USD");
    const [template, setTemplate] = useState<string>(CRAFTS.photographer.looks[0]);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState<string | null>(null);

    function chooseCraft(next: Craft) {
        setCraft(next);
        setTemplate(CRAFTS[next].looks[0]);
        // guessed here, in the browser, where the time zone and language are known
        setCurrency(guessCurrency(Intl.DateTimeFormat().resolvedOptions().timeZone, navigator.language));
        setStep(2);
    }

    async function finish(body: object) {
        setBusy(true);
        setError(null);
        try {
            await api("/onboarding", { method: "POST", body });
            router.replace("/editor");
        } catch (failure) {
            setError((failure as Error).message);
            setBusy(false);
        }
    }

    return (
        <main className="flex-1 overflow-y-auto">
            <div className="mx-auto flex max-w-5xl items-center justify-between px-6 pt-6">
                <Logo />
                <button onClick={() => finish({ skip: true })} disabled={busy} className="text-sm font-semibold text-muted hover:text-ink">
                    Skip for now
                </button>
            </div>

            <div className="mx-auto max-w-5xl px-6 pt-12 pb-16">
                <div className="flex items-center gap-3 text-sm text-muted">
                    {step > 1 && (
                        <button onClick={() => setStep(step - 1)} aria-label="Back" className="-ml-2 flex size-8 items-center justify-center rounded-full hover:bg-sand hover:text-ink">
                            <IconArrowLeft size={18} />
                        </button>
                    )}
                    <span>Step {step} of 3</span>
                    <span className="h-1 w-24 rounded-full bg-sand">
                        <span className="block h-full rounded-full bg-forest transition-[width] duration-500" style={{ width: `${(step / 3) * 100}%` }} />
                    </span>
                </div>

                {step === 1 && (
                    <section className="animate-[fade-in_0.3s_ease-out]">
                        <h1 className="mt-6 font-display text-5xl">What do you do?</h1>
                        <p className="mt-3 max-w-lg text-[16px] text-muted">Your page starts with the right pieces for your work: a gallery, your services and a way to hire you. You can change everything later.</p>
                        <div className="mt-10 grid gap-3 sm:grid-cols-2">
                            {(Object.keys(CRAFTS) as Craft[]).map((key) => {
                                const Icon = ICONS[key];
                                return (
                                    <button
                                        key={key}
                                        onClick={() => chooseCraft(key)}
                                        className="group flex items-center gap-4 rounded-3xl border border-line bg-paper p-5 text-left shadow-soft transition hover:-translate-y-0.5 hover:border-ink"
                                    >
                                        <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-blush text-pink transition group-hover:bg-pink group-hover:text-white">
                                            <Icon size={24} stroke={1.6} />
                                        </span>
                                        <span>
                                            <span className="block text-[17px] font-semibold">{CRAFTS[key].label}</span>
                                            <span className="block text-sm text-muted">{CRAFTS[key].hint}</span>
                                        </span>
                                    </button>
                                );
                            })}
                        </div>
                    </section>
                )}

                {step === 2 && (
                    <section className="max-w-lg animate-[fade-in_0.3s_ease-out]">
                        <h1 className="mt-6 font-display text-5xl">Who&apos;s it for?</h1>
                        <p className="mt-3 text-[16px] text-muted">The top of your page: your name and a line about what you do.</p>
                        <form
                            className="mt-10 space-y-5"
                            onSubmit={(event) => {
                                event.preventDefault();
                                if (name.trim()) setStep(3);
                            }}
                        >
                            <label className="block text-[13px] font-medium text-ink/70">
                                Your name, or your studio&apos;s
                                <input value={name} onChange={(event) => setName(event.target.value)} required maxLength={80} autoFocus className={`${inputClass} mt-1.5`} />
                            </label>
                            <label className="block text-[13px] font-medium text-ink/70">
                                One line about what you do
                                <input value={bio} onChange={(event) => setBio(event.target.value)} maxLength={300} placeholder={BIO_EXAMPLES[craft]} className={`${inputClass} mt-1.5`} />
                            </label>
                            <div className="text-[13px] font-medium text-ink/70">
                                <label htmlFor="welcome-currency">The currency you charge in</label>
                                <div className="mt-1.5">
                                    <Dropdown id="welcome-currency" value={currency} options={CURRENCY_OPTIONS} onChange={(code) => setCurrency(code as Currency)} className="h-11 text-[15px]" />
                                </div>
                            </div>
                            <Button type="submit" size="large" disabled={!name.trim()}>
                                Continue
                            </Button>
                        </form>
                    </section>
                )}

                {step === 3 && (
                    <section className="grid animate-[fade-in_0.3s_ease-out] items-start gap-10 lg:grid-cols-[1fr_380px]">
                        <div>
                            <h1 className="mt-6 font-display text-5xl">Pick a look</h1>
                            <p className="mt-3 max-w-md text-[16px] text-muted">This is your page as it starts. Add your photos and prices in the editor, then publish when it feels like you.</p>
                            <div role="radiogroup" aria-label="Look" className="mt-10 grid grid-cols-2 gap-3">
                                {CRAFTS[craft].looks.map((id) => {
                                    const look = TEMPLATES.find((candidate) => candidate.id === id)!;
                                    return (
                                        <button
                                            key={id}
                                            role="radio"
                                            aria-checked={template === id}
                                            onClick={() => setTemplate(id)}
                                            className={`flex items-center gap-3 rounded-2xl border bg-paper p-3 text-left transition ${template === id ? "border-ink ring-1 ring-ink" : "border-line hover:border-line-strong"}`}
                                        >
                                            <span className="size-11 shrink-0 rounded-xl ring-1 ring-black/5" style={{ background: pageBackground(look.theme) }} />
                                            <span className="font-semibold">{look.name}</span>
                                        </button>
                                    );
                                })}
                            </div>
                            {error && <p className="mt-6 text-sm text-danger">{error}</p>}
                            <Button size="large" busy={busy} onClick={() => finish({ craft, name, bio, template, currency })} className="mt-8">
                                Create my page
                            </Button>
                        </div>

                        {/* the page they'll get, drawn by the same renderer as the real one */}
                        <figure className="lg:sticky lg:top-8">
                            <div className="h-[min(640px,calc(100dvh-9rem))] overflow-hidden rounded-[1.75rem] border border-line bg-paper shadow-lifted">
                                <div className="h-full overflow-y-auto overscroll-contain [scrollbar-width:none]">
                                    <PageRenderer page={withExamplePhotos(starterFor(craft, { name: name || username, bio: bio || BIO_EXAMPLES[craft], template, currency }))} mode="preview" />
                                </div>
                            </div>
                            <figcaption className="mt-3 text-center text-xs text-muted">Shown with example photos until you add your own</figcaption>
                        </figure>
                    </section>
                )}
            </div>
        </main>
    );
}
