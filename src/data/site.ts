// Central site identity. Seo.astro, lib/schema.ts and astro.config all read from
// here — the production origin is declared nowhere else.

export const site = {
  /** Brand / site name — og:site_name and schema.org Organization. */
  name: "The Trail of Bits Blog",
  /** Production origin, no trailing slash. */
  url: "https://blog.trailofbits.com",
  /** Default meta description; pages override per page. */
  description:
    "Research, tools and field notes from the engineers at Trail of Bits. Browse by folder, filter by post type, or search the whole tree.",
  /** Default social-share image in /public. */
  ogImage: "/og.jpg",
  /** Organization logo in /public, for JSON-LD. */
  logo: "/logo.png",
  twitter: "@trailofbits",
  sameAs: [
    "https://x.com/trailofbits",
    "https://www.linkedin.com/company/trail-of-bits",
    "https://github.com/trailofbits",
    "https://infosec.exchange/@trailofbits",
  ] as string[],
};

/** Top-bar links beside the search. */
export const topLinks = [
  { label: "RSS", href: "/rss.xml" },
  { label: "Subscribe", href: "#subscribe" },
  { label: "trailofbits.com", href: "https://www.trailofbits.com", external: true },
];

/** Social row under every subscribe form. */
export const socialLinks = [
  { label: "X", href: "https://x.com/trailofbits" },
  { label: "LinkedIn", href: "https://www.linkedin.com/company/trail-of-bits" },
  { label: "GitHub", href: "https://github.com/trailofbits" },
  { label: "Mastodon", href: "https://infosec.exchange/@trailofbits" },
  { label: "Hacker News", href: "https://news.ycombinator.com/from?site=trailofbits.com" },
];

export const legalLinks = [
  { label: "Privacy Policy", href: "https://www.trailofbits.com/privacy-policy" },
  { label: "Vulnerability Disclosure", href: "https://www.trailofbits.com/vulnerability-disclosure-policy" },
];

/**
 * Newsletter endpoint. Unset until the list provider is chosen — the forms
 * render and validate, but post nowhere.
 */
export const subscribeAction = "";
