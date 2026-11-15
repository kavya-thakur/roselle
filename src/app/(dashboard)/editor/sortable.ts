"use client";

import { useRef, useState, type PointerEvent } from "react";

// Drag to reorder, by a handle, with a mouse, a finger or a pen. Built on pointer events because
// the browser's own drag and drop doesn't work on phones.
// The list reorders live under the finger (each step through onMove), so what you see while
// dragging is exactly what you get; the editor's history folds the burst into one undo step.
// Near the top or bottom of the scrolling box the box scrolls, so long lists can be crossed.

// The list with the item at `from` moved to `to`
export function moved<T>(list: T[], from: number, to: number) {
    const next = [...list];
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item);
    return next;
}

// how close to the scrolling box's edge (px) the finger has to be for it to scroll
const EDGE = 64;

function scrollParentOf(element: HTMLElement | null) {
    for (let node = element?.parentElement; node; node = node.parentElement) {
        const { overflowY } = getComputedStyle(node);
        if ((overflowY === "auto" || overflowY === "scroll") && node.scrollHeight > node.clientHeight) return node;
    }
    return document.scrollingElement as HTMLElement;
}

export function useSortable(onMove: (from: number, to: number) => void) {
    // the index of the item being dragged, as it moves through the list
    const [dragging, setDragging] = useState<number | null>(null);
    const current = useRef<number | null>(null);
    const items = useRef<(HTMLElement | null)[]>([]);
    const scroller = useRef<HTMLElement | null>(null);

    function over(x: number, y: number) {
        return items.current.findIndex((item) => {
            if (!item) return false;
            const box = item.getBoundingClientRect();
            return x >= box.left && x <= box.right && y >= box.top && y <= box.bottom;
        });
    }

    function end() {
        current.current = null;
        setDragging(null);
    }

    const handle = (index: number) => ({
        onPointerDown(event: PointerEvent<HTMLElement>) {
            if (event.button !== 0) return;
            event.preventDefault();
            // keeps the moves coming to this handle even when the finger leaves it
            event.currentTarget.setPointerCapture(event.pointerId);
            scroller.current = scrollParentOf(event.currentTarget);
            current.current = index;
            setDragging(index);
        },
        onPointerMove(event: PointerEvent<HTMLElement>) {
            const from = current.current;
            if (from === null) return;

            const box = scroller.current === document.scrollingElement ? { top: 0, bottom: window.innerHeight } : scroller.current!.getBoundingClientRect();
            if (event.clientY < box.top + EDGE) scroller.current!.scrollBy(0, -12);
            else if (event.clientY > box.bottom - EDGE) scroller.current!.scrollBy(0, 12);

            const to = over(event.clientX, event.clientY);
            if (to === -1 || to === from) return;
            onMove(from, to);
            current.current = to;
            setDragging(to);
        },
        onPointerUp: end,
        onPointerCancel: end,
        // the handle drags, it doesn't scroll the page; everywhere else still scrolls as usual
        style: { touchAction: "none" } as const,
    });

    // what each item puts on itself, so a finger over it can be found
    const item = (index: number) => (element: HTMLElement | null) => {
        items.current[index] = element;
    };

    return { dragging, handle, item };
}
