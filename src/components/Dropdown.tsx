"use client";

import { useEffect, useId, useLayoutEffect, useRef, useState, type CSSProperties, type KeyboardEvent, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { IconCheck, IconChevronDown } from "@tabler/icons-react";

export interface DropdownOption<T extends string> {
    value: T;
    label: string;
    // a coloured dot before the label: a status, a category
    dot?: string;
    icon?: ReactNode;
    // a quieter second line under the label
    hint?: string;
    // how the label is drawn, e.g. a font previewed in its own typeface
    style?: CSSProperties;
}

interface DropdownProps<T extends string> {
    value: T;
    options: DropdownOption<T>[];
    onChange: (value: T) => void;
    // what it's for, for screen readers when there's no visible label pointing at `id`
    label?: string;
    id?: string;
    // "field" fills its row like a text box; "chip" is small and sits in a row of buttons
    look?: "field" | "chip";
    className?: string;
}

const GAP = 6;

// The app's dropdown, instead of the browser's own. The list is drawn on top of the whole page
// (a portal into <body>), so a card or a scrolling panel can never cut it off; it opens below
// the button, or above when there's more room there, and follows the button if the page moves.
// Keyboard: arrows move, Enter or Space picks, Escape closes, a letter jumps to the first option
// starting with it. Focus stays on the button the whole time, like a native select.
export function Dropdown<T extends string>({ value, options, onChange, label, id, look = "field", className = "" }: DropdownProps<T>) {
    const [open, setOpen] = useState(false);
    const [active, setActive] = useState(0);
    const [place, setPlace] = useState<CSSProperties>({});
    const button = useRef<HTMLButtonElement>(null);
    const list = useRef<HTMLUListElement>(null);
    const listId = useId();

    const current = options.find((option) => option.value === value) ?? options[0];

    function show() {
        setActive(Math.max(0, options.findIndex((option) => option.value === value)));
        setOpen(true);
    }

    function pick(index: number) {
        const option = options[index];
        if (option && option.value !== value) onChange(option.value);
        setOpen(false);
        button.current?.focus();
    }

    // Where the list goes: under the button, or over it when the space below is too short
    useLayoutEffect(() => {
        if (!open) return;
        const measure = () => {
            const box = button.current!.getBoundingClientRect();
            const height = list.current?.offsetHeight ?? 0;
            const below = window.innerHeight - box.bottom;
            const up = below < height + GAP + 8 && box.top > below;
            const width = Math.max(box.width, 200);
            // kept inside the screen sideways, with a small margin
            const left = Math.min(Math.max(8, box.left), window.innerWidth - width - 8);
            setPlace({ position: "fixed", left, width, top: up ? box.top - height - GAP : box.bottom + GAP, transformOrigin: up ? "bottom" : "top" });
        };
        measure();
        // any scroll (any panel, not just the page) or resize moves the button: follow it
        window.addEventListener("scroll", measure, true);
        window.addEventListener("resize", measure);
        return () => {
            window.removeEventListener("scroll", measure, true);
            window.removeEventListener("resize", measure);
        };
    }, [open]);

    // A click anywhere else closes it
    useEffect(() => {
        if (!open) return;
        const close = (event: PointerEvent) => {
            const target = event.target as Node;
            if (!button.current?.contains(target) && !list.current?.contains(target)) setOpen(false);
        };
        document.addEventListener("pointerdown", close);
        return () => document.removeEventListener("pointerdown", close);
    }, [open]);

    // keep the highlighted option in view in a long list
    useEffect(() => {
        if (open) list.current?.children[active]?.scrollIntoView({ block: "nearest" });
    }, [open, active]);

    function onKeyDown(event: KeyboardEvent) {
        if (!open) {
            if (["ArrowDown", "ArrowUp", "Enter", " "].includes(event.key)) {
                event.preventDefault();
                show();
            }
            return;
        }
        if (event.key === "Escape" || event.key === "Tab") {
            if (event.key === "Escape") event.preventDefault();
            setOpen(false);
        } else if (event.key === "ArrowDown") {
            event.preventDefault();
            setActive((index) => Math.min(options.length - 1, index + 1));
        } else if (event.key === "ArrowUp") {
            event.preventDefault();
            setActive((index) => Math.max(0, index - 1));
        } else if (event.key === "Home" || event.key === "End") {
            event.preventDefault();
            setActive(event.key === "Home" ? 0 : options.length - 1);
        } else if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            pick(active);
        } else if (event.key.length === 1) {
            const letter = event.key.toLowerCase();
            const found = options.findIndex((option, index) => index > active && option.label.toLowerCase().startsWith(letter));
            const first = options.findIndex((option) => option.label.toLowerCase().startsWith(letter));
            if (found >= 0 || first >= 0) setActive(found >= 0 ? found : first);
        }
    }

    const looks = {
        field: "h-10 w-full rounded-xl border border-line bg-paper px-3 text-sm hover:border-line-strong",
        chip: "h-8 rounded-lg bg-sand px-2.5 text-[13px] font-semibold hover:bg-line",
    };

    return (
        <>
            <button
                ref={button}
                id={id}
                type="button"
                // a combobox that only picks (no typing in it): the pattern screen readers know
                role="combobox"
                aria-haspopup="listbox"
                aria-expanded={open}
                aria-controls={open ? listId : undefined}
                aria-label={label}
                aria-activedescendant={open ? `${listId}-${active}` : undefined}
                onClick={() => (open ? setOpen(false) : show())}
                onKeyDown={onKeyDown}
                className={`group inline-flex min-w-0 items-center gap-2 text-left text-ink transition-colors outline-none focus-visible:ring-2 focus-visible:ring-pink/40 ${looks[look]} ${open ? "border-ink" : ""} ${className}`}
            >
                {current?.dot && <span className="size-2 shrink-0 rounded-full" style={{ background: current.dot }} />}
                {current?.icon}
                <span className="min-w-0 flex-1 truncate" style={current?.style}>
                    {current?.label}
                </span>
                <IconChevronDown size={look === "chip" ? 14 : 16} stroke={2.2} className={`shrink-0 text-ink/45 transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
            </button>

            {open &&
                createPortal(
                    <ul
                        ref={list}
                        id={listId}
                        role="listbox"
                        aria-label={label}
                        style={place}
                        // the first frame has no position yet; it's measured, then placed and shown
                        className={`z-[100] max-h-72 overflow-y-auto rounded-2xl border border-line bg-paper p-1.5 text-ink shadow-[0_2px_6px_rgb(20_20_20/0.06),0_24px_48px_-16px_rgb(20_20_20/0.28)] ${place.top === undefined ? "invisible fixed" : "animate-[dropdown-in_0.16s_ease-out]"}`}
                    >
                        {options.map((option, index) => {
                            const selected = option.value === value;
                            return (
                                <li
                                    key={option.value}
                                    id={`${listId}-${index}`}
                                    role="option"
                                    aria-selected={selected}
                                    onPointerMove={() => setActive(index)}
                                    onClick={() => pick(index)}
                                    className={`flex cursor-pointer items-center gap-2.5 rounded-xl px-3 py-2 text-sm ${index === active ? "bg-sand" : ""}`}
                                >
                                    {option.dot && <span className="size-2 shrink-0 rounded-full" style={{ background: option.dot }} />}
                                    {option.icon}
                                    <span className="min-w-0 flex-1">
                                        <span className={`block truncate ${selected ? "font-semibold" : ""}`} style={option.style}>
                                            {option.label}
                                        </span>
                                        {option.hint && <span className="block truncate text-xs text-muted">{option.hint}</span>}
                                    </span>
                                    {selected && <IconCheck size={16} stroke={2.4} className="shrink-0 text-pink" />}
                                </li>
                            );
                        })}
                    </ul>,
                    document.body,
                )}
        </>
    );
}
