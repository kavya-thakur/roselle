import {
    IconBook,
    IconBrandBehance,
    IconBrandDiscord,
    IconBrandDribbble,
    IconBrandFacebook,
    IconBrandGithub,
    IconBrandInstagram,
    IconBrandLinkedin,
    IconBrandPinterest,
    IconBrandSnapchat,
    IconBrandSoundcloud,
    IconBrandSpotify,
    IconBrandTelegram,
    IconBrandThreads,
    IconBrandTiktok,
    IconBrandTwitch,
    IconBrandWhatsapp,
    IconBrandX,
    IconBrandYoutube,
    IconCalendarEvent,
    IconCamera,
    IconCoffee,
    IconDownload,
    IconGift,
    IconHeart,
    IconMail,
    IconMapPin,
    IconMicrophone,
    IconMusic,
    IconNews,
    IconPhone,
    IconPlayerPlay,
    IconShoppingBag,
    IconStar,
    IconTicket,
    IconWorld,
} from "@tabler/icons-react";

import type { LinkIconName, Social } from "@/lib/validations/page";

export const SOCIAL_LABELS: Record<Social, string> = {
    instagram: "Instagram",
    x: "X",
    tiktok: "TikTok",
    youtube: "YouTube",
    github: "GitHub",
    linkedin: "LinkedIn",
    dribbble: "Dribbble",
    behance: "Behance",
    spotify: "Spotify",
    threads: "Threads",
    email: "Email",
    website: "Website",
};

const ICONS = {
    instagram: IconBrandInstagram,
    x: IconBrandX,
    tiktok: IconBrandTiktok,
    youtube: IconBrandYoutube,
    github: IconBrandGithub,
    linkedin: IconBrandLinkedin,
    dribbble: IconBrandDribbble,
    behance: IconBrandBehance,
    spotify: IconBrandSpotify,
    threads: IconBrandThreads,
    email: IconMail,
    website: IconWorld,
};

export function SocialIcon({ platform, size = 18 }: { platform: Social; size?: number }) {
    const Icon = ICONS[platform];
    return <Icon size={size} stroke={1.6} aria-hidden />;
}

const LINK_ICONS: Record<LinkIconName, typeof IconWorld> = {
    ...ICONS,
    facebook: IconBrandFacebook,
    whatsapp: IconBrandWhatsapp,
    pinterest: IconBrandPinterest,
    twitch: IconBrandTwitch,
    discord: IconBrandDiscord,
    snapchat: IconBrandSnapchat,
    telegram: IconBrandTelegram,
    soundcloud: IconBrandSoundcloud,
    shop: IconShoppingBag,
    music: IconMusic,
    podcast: IconMicrophone,
    calendar: IconCalendarEvent,
    ticket: IconTicket,
    book: IconBook,
    news: IconNews,
    camera: IconCamera,
    play: IconPlayerPlay,
    download: IconDownload,
    gift: IconGift,
    heart: IconHeart,
    star: IconStar,
    phone: IconPhone,
    map: IconMapPin,
    coffee: IconCoffee,
};

// The icon on a link button: any social, plus a few more brands and plain shapes
export function LinkIcon({ name, size = 18 }: { name: LinkIconName; size?: number }) {
    const Icon = LINK_ICONS[name];
    return <Icon size={size} stroke={1.6} aria-hidden />;
}
