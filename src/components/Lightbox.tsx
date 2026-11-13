"use client";
/* eslint-disable @next/next/no-img-element -- creators' images come from any host */

import { useEffect, useRef, useState } from "react";
import { IconChevronLeft, IconChevronRight, IconX } from "@tabler/icons-react";

type Photo = { src: string; alt: string };

// Full-screen photos. Anything on the page marked data-zoom="<group>" (with data-src and
// data-alt) opens here when tapped, together with the rest of its group, so a gallery is
// browsed with arrows, the keyboard or a swipe. Mounted once per public page; the pages
// themselves stay server-rendered.
export function Lightbox() {
    const dialog = useRef<HTMLDialogElement>(null);
    const [photos, setPhotos] = useState<Photo[]>([]);
    const [index, setIndex] = useState(0);
    const swipeFrom = useRef<number | null>(null);

    useEffect(() => {
        function open(event: MouseEvent) {
            const trigger = (event.target as Element).closest<HTMLElement>("[data-zoom]");
            if (!trigger) return;
            const group = [...document.querySelectorAll<HTMLElement>(`[data-zoom="${CSS.escape(trigger.dataset.zoom!)}"]`)];
            setPhotos(group.map((element) => ({ src: element.dataset.src!, alt: element.dataset.alt ?? "" })));
            setIndex(group.indexOf(trigger));
            dialog.current?.showModal();
        }
        document.addEventListener("click", open);
        return () => document.removeEventListener("click", open);
    }, []);

    const go = (step: number) => setIndex((current) => (current + step + photos.length) % photos.length);
    const photo = photos[index];
    const many = photos.length > 1;

    return (
        <dialog
            ref={dialog}
            aria-label="Photo viewer"
            onKeyDown={(event) => {
                if (event.key === "ArrowRight") go(1);
                if (event.key === "ArrowLeft") go(-1);
            }}
            // a tap on the dark around the photo closes it, like everywhere else
            onClick={(event) => event.target === event.currentTarget && dialog.current?.close()}
            onPointerDown={(event) => (swipeFrom.current = event.clientX)}
            onPointerUp={(event) => {
                const moved = swipeFrom.current === null ? 0 : event.clientX - swipeFrom.current;
                swipeFrom.current = null;
                if (many && Math.abs(moved) > 50) go(moved < 0 ? 1 : -1);
            }}
            className="m-0 h-dvh max-h-none w-screen max-w-none bg-black/95 p-0 text-white backdrop:bg-black/60 open:flex open:flex-col"
        >
            <div className="flex h-14 shrink-0 items-center justify-between px-4 text-sm text-white/70">
                <span>{many ? `${index + 1} / ${photos.length}` : ""}</span>
                <button onClick={() => dialog.current?.close()} aria-label="Close" className="flex size-10 items-center justify-center rounded-full hover:bg-white/10">
                    <IconX size={22} />
                </button>
            </div>

            {photo && (
                <figure onClick={(event) => event.target === event.currentTarget && dialog.current?.close()} className="flex min-h-0 flex-1 flex-col items-center justify-center gap-3 px-4 pb-6 select-none">
                    <img key={photo.src} src={photo.src} alt={photo.alt} draggable={false} className="min-h-0 max-w-full flex-1 object-contain animate-[fade-in_0.2s_ease-out]" />
                    {photo.alt && <figcaption className="max-w-xl text-center text-sm text-white/70">{photo.alt}</figcaption>}
                </figure>
            )}

            {many && (
                <>
                    <button onClick={() => go(-1)} aria-label="Previous photo" className="absolute top-1/2 left-3 hidden size-12 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 hover:bg-white/20 sm:flex">
                        <IconChevronLeft size={24} />
                    </button>
                    <button onClick={() => go(1)} aria-label="Next photo" className="absolute top-1/2 right-3 hidden size-12 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 hover:bg-white/20 sm:flex">
                        <IconChevronRight size={24} />
                    </button>
                </>
            )}
        </dialog>
    );
}
