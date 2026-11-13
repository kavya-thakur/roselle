import type { ReactNode } from "react";

// The look of every text box in the app, in one place
const inputLook =
    "w-full border border-line bg-paper outline-none transition-[border-color,box-shadow] placeholder:text-faint focus:border-pink focus:bg-white focus:shadow-[0_0_0_4px_rgb(224_64_143/0.1)] aria-invalid:border-danger";

// sign in, sign up, settings
export const inputClass = `h-11 rounded-xl px-3.5 text-[15px] ${inputLook}`;

// the editor's panels, where many fields share a narrow column
export const smallInputClass = `h-9 rounded-lg px-3 text-sm ${inputLook}`;

// A label, the input itself (children), and the error under it
export function Field({ label, htmlFor, error, children }: { label: string; htmlFor: string; error?: string; children: ReactNode }) {
    return (
        <div>
            <label htmlFor={htmlFor} className="mb-1.5 block text-[13px] font-medium text-ink/70">
                {label}
            </label>
            {children}
            {error && (
                <p role="alert" className="mt-1.5 text-[13px] text-danger">
                    {error}
                </p>
            )}
        </div>
    );
}
