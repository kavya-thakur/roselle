import { SITE_HOST } from "@/lib/site";

// "<our address>/____ [Claim]": sends the name straight to sign-up, which fills it in
export function ClaimForm({ className = "" }: { className?: string }) {
    return (
        <form
            action="/register"
            method="get"
            className={`flex w-full max-w-md items-center gap-1 rounded-full bg-paper p-1.5 text-ink shadow-soft focus-within:outline-2 focus-within:outline-offset-3 focus-within:outline-(--focus) ${className}`}
        >
            <label className="flex min-w-0 flex-1 items-center pl-4 text-[15px]">
                <span className="sr-only">Your page address:</span>
                <span className="shrink-0 text-muted">{SITE_HOST}/</span>
                <input
                    name="username"
                    placeholder="yourname"
                    autoComplete="off"
                    autoCapitalize="none"
                    spellCheck={false}
                    maxLength={30}
                    className="w-full min-w-0 bg-transparent font-semibold placeholder:text-faint focus-visible:outline-none!"
                />
            </label>
            {/* 19px bold: large text, so white on pink is readable */}
            <button type="submit" className="h-11 shrink-0 rounded-full bg-pink px-5 text-[19px] font-bold text-white transition-colors duration-300 hover:bg-pink-hover">
                Claim
            </button>
        </form>
    );
}
