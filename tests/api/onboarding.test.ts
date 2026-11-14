import { describe, expect, it } from "vitest";
import { prisma } from "@/lib/db/prisma";
import { POST as onboard } from "@/app/api/onboarding/route";
import { pageSchema } from "@/lib/validations/page";
import { createCreator, read, request, signInAs, signOut } from "./helpers";

const answers = { craft: "photographer", name: "Lena Hart", bio: "Wedding photographer in Jaipur.", template: "noir", currency: "INR" };
const send = (body: object) => onboard(request("/api/onboarding", { method: "POST", body }));

describe("onboarding", () => {
    it("turns the answers into a draft that fits the craft, in the creator's currency", async () => {
        const { user, page } = await createCreator("lena", { publish: false });
        await signInAs(user.id);

        expect((await send(answers)).status).toBe(200);

        const saved = await prisma.user.findUniqueOrThrow({ where: { id: user.id }, include: { page: true } });
        expect(saved.onboardedAt).not.toBeNull();
        expect(saved.currency).toBe("INR");
        const draft = pageSchema.parse(saved.page!.draft);
        expect(draft.profile).toMatchObject({ name: "Lena Hart", bio: "Wedding photographer in Jaipur." });
        expect(draft.theme.template).toBe("noir");
        const services = draft.blocks.find((block) => block.type === "services");
        expect(services?.type === "services" && services.items[0].price).toBe("from ₹24,000");
        // a draft only: nothing goes public until they publish
        expect((await prisma.page.findUniqueOrThrow({ where: { id: page.id } })).published).toBeNull();
    });

    it("only happens once, so it can never wipe a page they've worked on since", async () => {
        const { user } = await createCreator("lena", { publish: false });
        await signInAs(user.id);
        await send(answers);
        await prisma.page.update({ where: { userId: user.id }, data: { draft: { ...(pageSchema.parse((await prisma.page.findUniqueOrThrow({ where: { userId: user.id } })).draft)), seo: { title: "Edited since", description: "" } } } });

        expect((await send({ ...answers, craft: "designer" })).status).toBe(409);
        const draft = pageSchema.parse((await prisma.page.findUniqueOrThrow({ where: { userId: user.id } })).draft);
        expect(draft.seo.title).toBe("Edited since");
    });

    it("can be skipped, keeping the plain starter page", async () => {
        const { user } = await createCreator("lena", { publish: false });
        await signInAs(user.id);
        const before = (await prisma.page.findUniqueOrThrow({ where: { userId: user.id } })).draft;

        expect((await send({ skip: true })).status).toBe(200);
        const after = await prisma.user.findUniqueOrThrow({ where: { id: user.id }, include: { page: true } });
        expect(after.onboardedAt).not.toBeNull();
        expect(after.page!.draft).toEqual(before);
    });

    it("refuses a look that doesn't exist or a missing name", async () => {
        const { user } = await createCreator("lena", { publish: false });
        await signInAs(user.id);
        expect((await send({ ...answers, template: "not-a-template" })).status).toBe(400);
        expect((await send({ ...answers, name: "  " })).status).toBe(400);
        expect((await prisma.user.findUniqueOrThrow({ where: { id: user.id } })).onboardedAt).toBeNull();
    });

    it("turns away anyone not signed in", async () => {
        signOut();
        expect((await read(await send(answers))).status).toBe(401);
    });
});
