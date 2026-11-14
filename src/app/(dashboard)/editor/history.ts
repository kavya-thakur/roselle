// Undo and redo for the editor: the page as it was before each change (past), as it is
// (present), and the changes undone that can be brought back (future). Plain functions over
// plain data, so EditorView only wires them up and the rules are tested on their own.

export interface History<T> {
    past: T[];
    present: T;
    future: T[];
    // when the present was last changed, to fold a burst of typing into one step
    changedAt: number;
}

// Changes closer together than this are one step: typing a word is undone as a word, not a letter
export const GROUP_MS = 1000;
// How many steps back are kept
export const LIMIT = 100;

export const start = <T>(present: T): History<T> => ({ past: [], present, future: [], changedAt: 0 });

// A new change. It starts a new step unless it follows the last one within GROUP_MS, and
// anything that had been undone is gone, as in every editor.
export function record<T>(history: History<T>, next: T, now: number): History<T> {
    if (next === history.present) return history;
    const grouped = history.past.length > 0 && now - history.changedAt < GROUP_MS;
    const past = grouped ? history.past : [...history.past, history.present].slice(-LIMIT);
    return { past, present: next, future: [], changedAt: now };
}

// changedAt goes back to 0 so the next change after an undo or redo is a step of its own
export function undo<T>(history: History<T>): History<T> {
    if (history.past.length === 0) return history;
    return { past: history.past.slice(0, -1), present: history.past[history.past.length - 1], future: [history.present, ...history.future], changedAt: 0 };
}

export function redo<T>(history: History<T>): History<T> {
    if (history.future.length === 0) return history;
    return { past: [...history.past, history.present], present: history.future[0], future: history.future.slice(1), changedAt: 0 };
}
