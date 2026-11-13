import type { ComponentProps } from "react";
import { IconLoader2 } from "@tabler/icons-react";

const LOOKS = {
    // the main button: black, quiet, unmistakable
    primary:
        "bg-ink text-white hover:bg-[#2e2e2e]",
    secondary: "border border-line bg-paper text-ink hover:border-line-strong hover:bg-white",
    ghost: "text-muted hover:bg-sand hover:text-ink",
};

interface ButtonProps extends ComponentProps<"button"> {
    look?: keyof typeof LOOKS;
    size?: "small" | "regular" | "large";
    // shows a spinner and stops double submits while a request is on its way
    busy?: boolean;
}

export function Button({ look = "primary", size = "regular", busy = false, className = "", children, disabled, ...props }: ButtonProps) {
    const height = { small: "h-8 px-3 text-[13px]", regular: "h-10 px-4 text-sm", large: "h-12 px-6 text-[15px]" }[size];

    return (
        <button
            {...props}
            disabled={disabled || busy}
            className={`inline-flex items-center justify-center gap-2 rounded-full font-semibold whitespace-nowrap transition duration-200 outline-offset-2 focus-visible:outline-2 focus-visible:outline-pink disabled:pointer-events-none disabled:opacity-55 ${height} ${LOOKS[look]} ${className}`}
        >
            {busy && <IconLoader2 size={16} className="animate-spin" />}
            {children}
        </button>
    );
}
