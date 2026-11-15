import { describe, expect, it } from "vitest";
import { sized } from "@/lib/media/sized";
import { signature } from "@/lib/media/cloudinary";

describe("photos on Cloudinary", () => {
    it("asks Cloudinary for the size a photo is shown at, and leaves other addresses alone", () => {
        const photo = "https://res.cloudinary.com/demo/image/upload/v1/roselle/site/u1/a.webp";
        expect(sized(photo, 600)).toBe("https://res.cloudinary.com/demo/image/upload/c_limit,w_600,f_auto,q_auto/v1/roselle/site/u1/a.webp");
        // a JPEG for the share image, whose renderer can't read WebP
        expect(sized(photo, 1200, "jpg")).toContain("/upload/c_limit,w_1200,f_jpg,q_auto/");
        expect(sized("https://images.unsplash.com/photo-1?w=900", 600)).toBe("https://images.unsplash.com/photo-1?w=900");
        expect(sized("/media/abc", 600)).toBe("/media/abc");
    });

    it("signs uploads the way Cloudinary checks them (the example from its docs)", () => {
        const params = { eager: "w_400,h_300,c_pad|w_260,h_200,c_crop", public_id: "sample_image", timestamp: 1315060510 };
        expect(signature(params, "abcd")).toBe("bfd09f95f331f558cbd1320e67aa8d488770583e");
    });
});
