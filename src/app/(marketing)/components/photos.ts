// The landing page's photographs: one art-directed set, shot (as it were) on the same day,
// warm light against pink. Every floating picture on the page comes from here.
export const photo = (id: string, width = 600) => `https://images.unsplash.com/${id}?w=${width}&q=80&auto=format&fit=crop`;

export const PHOTOS = {
    sasha: { id: "photo-1662893965003-31ae7064ae9a", alt: "A woman in a pink head wrap against a pink wall" },
    cup: { id: "photo-1781150363981-546c399139df", alt: "A pink glazed cup on a wooden table" },
    cupHand: { id: "photo-1781150363961-6284b0a95933", alt: "A hand holding a pink glazed cup among leaves" },
    noor: { id: "photo-1713546232252-2d77e979ba40", alt: "A young woman in dungarees against a pink wall" },
    piano: { id: "photo-1691120040190-b763dfee386c", alt: "A pianist in warm evening light" },
    theo: { id: "photo-1654198297045-c6355d1ffe75", alt: "A man with curly hair against a peach wall" },
    desk: { id: "photo-1636485042715-f0e844b82338", alt: "A white desk with a pink computer and a microphone" },
    chair: { id: "photo-1608789637632-ecb75e322555", alt: "A green woven chair against a pink wall" },
    mira: { id: "photo-1581396770327-994e1345610c", alt: "A woman holding a monstera leaf in front of a pink backdrop" },
    ines: { id: "photo-1571615340136-6325385ed43d", alt: "A woman with long dark hair against a pink backdrop" },
    elena: { id: "photo-1654670857563-595e64324ef8", alt: "A woman raising a glass among pink balloons in a garden" },
};
