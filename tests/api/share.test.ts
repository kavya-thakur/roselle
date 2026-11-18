import { describe, expect, it } from "vitest";
import { GET as share } from "@/app/api/share/[kind]/route";
import { createCreator, request, signInAs, signOut } from "./helpers";

const get = (kind: string) => share(request(`/api/share/${kind}`), { params: Promise.resolve({ kind }) });

describe("share kit", () => {
    it("draws the story and the poster of the creator's published page, as downloads", async () => {
        const { user } = await createCreator("lena");
        await signInAs(user.id);

        for (const kind of ["story", "poster"]) {
            const response = await get(kind);
            expect(response.status).toBe(200);
            expect(response.headers.get("content-type")).toBe("image/png");
            expect(response.headers.get("content-disposition")).toBe(`attachment; filename="roselle-lena-${kind}.png"`);
            // a PNG really came out
            expect(Buffer.from(await response.arrayBuffer()).subarray(1, 4).toString()).toBe("PNG");
        }
    });

    it("waits for the page to be published, so the link in the picture opens it", async () => {
        const { user } = await createCreator("lena", { publish: false });
        await signInAs(user.id);
        expect((await get("story")).status).toBe(409);
    });

    it("is only for the signed-in creator, and only these two pictures", async () => {
        const { user } = await createCreator("lena");
        signOut();
        expect((await get("story")).status).toBe(401);
        await signInAs(user.id);
        expect((await get("flyer")).status).toBe(404);
    });
});
