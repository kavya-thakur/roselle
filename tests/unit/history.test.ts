import { describe, expect, it } from "vitest";
import { GROUP_MS, LIMIT, record, redo, start, undo } from "@/app/(dashboard)/editor/history";

describe("undo and redo in the editor", () => {
    it("steps back and forward through changes", () => {
        let h = start("a");
        h = record(h, "b", 10_000);
        h = record(h, "c", 20_000);
        h = undo(h);
        expect(h.present).toBe("b");
        h = undo(h);
        expect(h.present).toBe("a");
        // nothing further back
        expect(undo(h)).toBe(h);
        h = redo(h);
        expect(h.present).toBe("b");
    });

    it("undoes a burst of typing as one step", () => {
        let h = start("");
        for (const [i, text] of ["H", "Hi", "Hi!"].entries()) h = record(h, text, 10_000 + i * 200);
        expect(undo(h).present).toBe("");
        // a pause starts a new step
        h = record(h, "Hi! there", 10_400 + GROUP_MS);
        expect(undo(h).present).toBe("Hi!");
    });

    it("forgets what was undone once something new is changed", () => {
        let h = record(record(start("a"), "b", 10_000), "c", 20_000);
        h = record(undo(h), "d", 30_000);
        expect(h.future).toEqual([]);
        expect(redo(h)).toBe(h);
        expect(undo(h).present).toBe("b");
    });

    it("makes the first change after an undo a step of its own, however quick", () => {
        let h = record(record(start("a"), "b", 10_000), "c", 20_000);
        h = record(undo(h), "x", 20_100);
        expect(undo(h).present).toBe("b");
    });

    it("keeps a limited number of steps", () => {
        let h = start(0);
        for (let i = 1; i <= LIMIT + 20; i++) h = record(h, i, i * 10_000);
        expect(h.past).toHaveLength(LIMIT);
    });
});
