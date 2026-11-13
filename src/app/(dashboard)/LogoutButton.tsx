"use client";

import { useState } from "react";
import { IconLogout } from "@tabler/icons-react";
import { api } from "@/lib/api/client";

export function LogoutButton() {
    const [busy, setBusy] = useState(false);

    async function logOut() {
        setBusy(true);
        await api("/auth/logout", { method: "POST" }).catch(() => {});
        // a full load, so nothing from the signed-in app stays in memory
        // eslint-disable-next-line @next/next/no-location-assign-relative-destination
        window.location.assign("/login");
    }

    return (
        <button
            onClick={logOut}
            disabled={busy}
            aria-label="Log out"
            title="Log out"
            className="flex size-9 items-center justify-center rounded-full text-muted transition hover:bg-sand hover:text-ink disabled:opacity-50"
        >
            <IconLogout size={18} />
        </button>
    );
}
