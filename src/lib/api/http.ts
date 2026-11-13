import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { Prisma } from "@/generated/prisma/client";

// A page document with 100 blocks is ~60 KB; anything far bigger isn't a real page
const MAX_BODY_BYTES = 300_000;

export function validationError(error: z.ZodError) {
    const { formErrors, fieldErrors } = z.flattenError(error);

    return NextResponse.json(
        {
            ok: false,
            // formErrors = problems with the body as a whole (not an object, ...)
            message: formErrors[0] ?? "Invalid request data",
            errors: fieldErrors,
        },
        { status: 400 }
    );
}

// Reads and validates a JSON body. Invalid JSON is handled like any other invalid body (400).
export async function parseBody<T extends z.ZodType>(req: NextRequest, schema: T) {
    if (Number(req.headers.get("content-length")) > MAX_BODY_BYTES) {
        return {
            success: false as const,
            response: NextResponse.json({ ok: false, message: "Request body too large" }, { status: 413 }),
        };
    }

    const body = await req.json().catch(() => null);
    const result = schema.safeParse(body);

    if (!result.success) {
        return { success: false as const, response: validationError(result.error) };
    }

    return { success: true as const, data: result.data as z.output<T> };
}

// One place that turns thrown errors into responses, instead of a copy in every route
export function handleRouteError(error: unknown, context: string) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
        return NextResponse.json({ ok: false, message: "Please sign in again" }, { status: 401 });
    }

    // Unique constraint hit by a concurrent request that passed the same check
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
        return NextResponse.json({ ok: false, message: "This already exists" }, { status: 409 });
    }

    console.error(`${context} error:`, error);

    return NextResponse.json({ ok: false, message: "Something went wrong" }, { status: 500 });
}
