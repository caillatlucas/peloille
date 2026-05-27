"use client";

import { motion } from "framer-motion";
import { 
  FaLinkedin, 
  FaGithub, 
  FaTwitter, 
  FaInstagram,
  FaYoutube,
  FaTiktok,
  FaGlobe,
  FaDiscord,
  FaPhone,
  FaLink,
  FaFacebook,
  FaTwitch,
  FaSnapchat,
  FaPinterest,
  FaSpotify,
  FaSteam,
  FaReddit,
  FaWhatsapp,
  FaTelegram,
  FaEnvelope,
  FaPatreon,
  FaPaypal,
  FaMedium,
  FaBehance,
  FaDribbble,
  FaFigma,
  FaArtstation,
  FaBriefcase,
  FaBook
} from "react-icons/fa";

export interface SocialLink {
  url: string;
  enabled: boolean;
}

export interface CustomLink {
  name: string;
  url: string;
  icon?: string;
  customIconUrl?: string;
  enabled: boolean;
}

export interface SocialConfig {
  email: string;
  linkedin: SocialLink;
  github: SocialLink;
  twitter: SocialLink;
  instagram: SocialLink;
  youtube: SocialLink;
  tiktok: SocialLink;
  discord: SocialLink;
  phone: SocialLink;
  customLinks?: CustomLink[];
}

export const ICON_MAP: Record<string, any> = {
  globe: FaGlobe,
  link: FaLink,
  linkedin: FaLinkedin,
  github: FaGithub,
  twitter: FaTwitter,
  instagram: FaInstagram,
  youtube: FaYoutube,
  tiktok: FaTiktok,
  discord: FaDiscord,
  phone: FaPhone,
  facebook: FaFacebook,
  twitch: FaTwitch,
  snapchat: FaSnapchat,
  pinterest: FaPinterest,
  spotify: FaSpotify,
  steam: FaSteam,
  reddit: FaReddit,
  whatsapp: FaWhatsapp,
  telegram: FaTelegram,
  envelope: FaEnvelope,
  patreon: FaPatreon,
  paypal: FaPaypal,
  medium: FaMedium,
  behance: FaBehance,
  dribbble: FaDribbble,
  figma: FaFigma,
  artstation: FaArtstation,
  portfolio: FaBriefcase,
  blog: FaBook
};

const defaultSocials: SocialConfig = {
  email: "contact@lucasPELOILLE.fr",
  linkedin: { url: "https://linkedin.com/in/lucasPELOILLE", enabled: true },
  github: { url: "https://github.com/lucasPELOILLE", enabled: true },
  twitter: { url: "https://twitter.com/lucasPELOILLE", enabled: false },
  instagram: { url: "https://instagram.com/lucasPELOILLE", enabled: false },
  youtube: { url: "", enabled: false },
  tiktok: { url: "", enabled: false },
  discord: { url: "", enabled: false },
  phone: { url: "", enabled: false },
  customLinks: []
};

export default function Socials({ config, color }: { config?: SocialConfig | null, color?: any }) {
  const socials = config || defaultSocials;

  const socialItems = [
    { id: "linkedin", icon: FaLinkedin, label: "LinkedIn", data: socials.linkedin },
    { id: "github", icon: FaGithub, label: "GitHub", data: socials.github },
    { id: "twitter", icon: FaTwitter, label: "Twitter", data: socials.twitter },
    { id: "instagram", icon: FaInstagram, label: "Instagram", data: socials.instagram },
    { id: "youtube", icon: FaYoutube, label: "YouTube", data: socials.youtube },
    { id: "tiktok", icon: FaTiktok, label: "TikTok", data: socials.tiktok },
    { id: "discord", icon: FaDiscord, label: "Discord", data: socials.discord },
    { id: "phone", icon: FaPhone, label: "Téléphone", data: socials.phone ? { ...socials.phone, url: socials.phone.url.startsWith('tel:') ? socials.phone.url : `tel:${socials.phone.url}` } : null },
  ];

  const customItems = (socials.customLinks || []).map((link, index) => {
    const IconComponent = ICON_MAP[link.icon || "link"] || FaGlobe;
    let finalUrl = link.url;
    if (finalUrl && !finalUrl.startsWith('http') && !finalUrl.startsWith('mailto:') && !finalUrl.startsWith('tel:')) {
      finalUrl = 'https://' + finalUrl;
    }
    return {
      id: `custom-${index}-${link.name}`,
      icon: IconComponent,
      customIconUrl: link.customIconUrl,
      label: link.name,
      data: { url: finalUrl, enabled: link.enabled }
    };
  });

  const enabledItems = [...socialItems, ...customItems].filter(item => item.data?.enabled && item.data?.url) as Array<{
    id: string;
    icon: any;
    label: string;
    data: { url: string; enabled: boolean };
    customIconUrl?: string;
  }>;

  if (enabledItems.length === 0) return null;

  return (
    <div className="flex gap-8 md:gap-12 items-center flex-wrap">
      {enabledItems.map((item, index) => (
        <motion.a
          key={item.id}
          href={item.data!.url}
          target="_blank"
          rel="noopener noreferrer"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: index * 0.1 }}
          className="group relative"
          title={item.label}
        >
          {item.customIconUrl ? (
            <img 
              src={item.customIconUrl} 
              alt={item.label}
              className="w-6 h-6 object-contain transition-all duration-300 transform group-hover:-translate-y-1"
            />
          ) : (
            <item.icon 
              className="text-2xl transition-all duration-300 transform group-hover:-translate-y-1 group-hover:!text-primary-green" 
              style={{ color: color || 'rgba(255,255,255,0.4)' }}
            />
          )}
          <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-[8px] font-bold tracking-[0.2em] uppercase opacity-0 group-hover:opacity-40 transition-all duration-300 whitespace-nowrap">
            {item.label}
          </span>
        </motion.a>
      ))}
    </div>
  );
}

