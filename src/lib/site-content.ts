import { supabase } from "@/integrations/supabase/client";

export type SectionType =
  | "hero"
  | "rich_text"
  | "feature_grid"
  | "steps"
  | "checklist"
  | "spec_list"
  | "image_text"
  | "gallery"
  | "video"
  | "faq"
  | "testimonials"
  | "cta"
  | "pricing"
  | "logo_strip"
  | "contact_form"
  | "contact_info"
  | "link_row"
  | "table";

export type SectionContent = Record<string, unknown>;

export type SiteSection = {
  id: string;
  page_slug: string;
  type: SectionType;
  sort_order: number;
  is_visible: boolean;
  content: SectionContent;
};

export type SiteTheme = {
  id: string;
  colors: Record<string, string>;
  font_display: string;
  font_body: string;
  radius: string;
  logo_text: string | null;
};

export type SitePage = {
  id: string;
  path: string;
  original_path: string;
  title: string;
  nav_label: string;
  meta_title: string;
  meta_description: string;
  page_kind: "content" | "system";
  is_protected: boolean;
  is_published: boolean;
  show_in_nav: boolean;
  nav_order: number;
};

export type SitePageRoute = {
  original_path: string;
  current_path: string;
  is_published: boolean;
};

export const SECTION_LIBRARY: { type: SectionType; label: string; blank: SectionContent }[] = [
  {
    type: "hero",
    label: "Hero banner",
    blank: {
      eyebrow: "Eyebrow",
      title: "Headline goes here",
      description: "A short supporting sentence for this page.",
      dark: true,
      image: { url: "", alt: "" },
      buttons: [{ label: "Get a quote", to: "/quote-request" }],
    },
  },
  {
    type: "rich_text",
    label: "Text block",
    blank: { title: "Section title", body: "Write your paragraph here.\n\nAdd another paragraph." },
  },
  {
    type: "feature_grid",
    label: "Feature cards",
    blank: {
      title: "Features",
      description: "",
      items: [
        { title: "First feature", body: "What makes it good." },
        { title: "Second feature", body: "What makes it good." },
        { title: "Third feature", body: "What makes it good." },
      ],
    },
  },
  {
    type: "steps",
    label: "Numbered steps",
    blank: {
      title: "How it works",
      items: [
        { title: "Step one", body: "Describe the step." },
        { title: "Step two", body: "Describe the step." },
      ],
    },
  },
  {
    type: "checklist",
    label: "Checklist",
    blank: { title: "What you get", items: ["First point", "Second point"] },
  },
  {
    type: "spec_list",
    label: "Spec list",
    blank: {
      title: "Specs & options",
      items: [
        { label: "Best for", value: "Describe" },
        { label: "Turnaround", value: "Describe" },
      ],
    },
  },
  {
    type: "image_text",
    label: "Image + text",
    blank: {
      title: "Section title",
      body: "Describe what is in the picture.",
      image: { url: "", alt: "" },
      imageSide: "right",
      buttons: [],
    },
  },
  {
    type: "gallery",
    label: "Image gallery",
    blank: { title: "Gallery", items: [{ url: "", alt: "" }] },
  },
  {
    type: "video",
    label: "Video",
    blank: { title: "Watch", url: "", caption: "" },
  },
  {
    type: "faq",
    label: "FAQ",
    blank: {
      title: "Questions",
      items: [{ q: "A question?", a: "The answer." }],
    },
  },
  {
    type: "testimonials",
    label: "Testimonials",
    blank: {
      title: "What customers say",
      items: [{ quote: "Great work.", name: "Customer name", role: "Company" }],
    },
  },
  {
    type: "cta",
    label: "Call to action",
    blank: {
      title: "Ready to start?",
      body: "A short nudge to act.",
      dark: false,
      buttons: [{ label: "Get a quote", to: "/quote-request" }],
    },
  },
  {
    type: "pricing",
    label: "Pricing",
    blank: {
      title: "Pricing",
      description: "",
      items: [
        {
          name: "Starter",
          price: "$0",
          period: "per piece",
          features: ["Feature one", "Feature two"],
          button: { label: "Get started", to: "/quote-request" },
          highlight: false,
        },
      ],
    },
  },
  {
    type: "logo_strip",
    label: "Logo strip",
    blank: { title: "Trusted by", items: [{ url: "", alt: "Logo" }] },
  },
  {
    type: "contact_form",
    label: "Contact form",
    blank: { title: "Send us a message", body: "We reply within one business day." },
  },
  {
    type: "contact_info",
    label: "Contact details",
    blank: {
      title: "",
      items: [
        { icon: "mail", label: "Email", value: "hello@example.com" },
        { icon: "phone", label: "Phone", value: "Add your phone number" },
      ],
    },
  },
  {
    type: "link_row",
    label: "Button row",
    blank: {
      title: "Explore",
      items: [{ label: "Shop", to: "/shop" }],
    },
  },
  {
    type: "table",
    label: "Table",
    blank: {
      title: "Table",
      description: "",
      columns: ["Column A", "Column B"],
      rows: [["Value", "Value"]],
      note: "",
    },
  },
];

export const DISPLAY_FONTS = [
  "Bebas Neue",
  "Anton",
  "Archivo Black",
  "Oswald",
  "Space Grotesk",
  "Syne",
  "Playfair Display",
  "Instrument Serif",
  "Poppins",
  "Montserrat",
];

export const BODY_FONTS = [
  "Barlow",
  "Inter",
  "DM Sans",
  "Work Sans",
  "Manrope",
  "Rubik",
  "Nunito Sans",
  "Source Sans 3",
  "IBM Plex Sans",
  "Karla",
];

export const DEFAULT_COLORS: Record<string, string> = {
  primary: "#d92211",
  "primary-foreground": "#fcfcfc",
  background: "#fcfcfc",
  foreground: "#1a1a1c",
  card: "#ffffff",
  secondary: "#f2f2f3",
  muted: "#f2f2f3",
  "muted-foreground": "#71717a",
  border: "#e3e3e6",
  ink: "#1a1a1c",
  "ink-foreground": "#fafafa",
  steel: "#46464b",
};

export const COLOR_LABELS: { key: string; label: string }[] = [
  { key: "primary", label: "Accent colour" },
  { key: "primary-foreground", label: "Text on accent" },
  { key: "background", label: "Page background" },
  { key: "foreground", label: "Body text" },
  { key: "card", label: "Card background" },
  { key: "secondary", label: "Soft background" },
  { key: "muted-foreground", label: "Secondary text" },
  { key: "border", label: "Borders" },
  { key: "ink", label: "Dark band background" },
  { key: "ink-foreground", label: "Dark band text" },
];

export const sectionsQueryKey = (slug: string) => ["site_sections", slug] as const;
export const themeQueryKey = ["site_theme"] as const;
export const pagesQueryKey = ["site_pages"] as const;
export const pageRoutesQueryKey = ["site_page_routes"] as const;

export async function fetchPages(): Promise<SitePage[]> {
  const { data, error } = await supabase
    .from("site_pages")
    .select("id,path,original_path,title,nav_label,meta_title,meta_description,page_kind,is_protected,is_published,show_in_nav,nav_order")
    .order("nav_order", { ascending: true });
  if (error) throw error;
  return (data ?? []) as SitePage[];
}

export async function fetchPage(path: string): Promise<SitePage | null> {
  const { data, error } = await supabase
    .from("site_pages")
    .select("id,path,original_path,title,nav_label,meta_title,meta_description,page_kind,is_protected,is_published,show_in_nav,nav_order")
    .eq("path", path)
    .maybeSingle();
  if (error) throw error;
  return data as SitePage | null;
}

export async function fetchPageRoutes(): Promise<SitePageRoute[]> {
  const { data, error } = await supabase
    .from("site_page_routes")
    .select("original_path,current_path,is_published");
  if (error) throw error;
  return data ?? [];
}

export async function fetchSections(slug: string): Promise<SiteSection[]> {
  const { data, error } = await supabase
    .from("site_sections")
    .select("id,page_slug,type,sort_order,is_visible,content")
    .eq("page_slug", slug)
    .order("sort_order", { ascending: true });
  if (error) throw error;
  return (data ?? []) as unknown as SiteSection[];
}

export async function fetchTheme(): Promise<SiteTheme | null> {
  const { data, error } = await supabase
    .from("site_theme")
    .select("id,colors,font_display,font_body,radius,logo_text")
    .eq("id", "default")
    .maybeSingle();
  if (error) throw error;
  return (data as unknown as SiteTheme) ?? null;
}

export function googleFontsHref(display: string, body: string) {
  const families = Array.from(new Set([display, body])).map(
    (f) => `family=${encodeURIComponent(f).replace(/%20/g, "+")}:wght@400;500;600;700;800`,
  );
  return `https://fonts.googleapis.com/css2?${families.join("&")}&display=swap`;
}

/** Immutably set a value at a path such as ["items", 2, "title"]. */
export function setAtPath<T>(source: T, path: (string | number)[], value: unknown): T {
  if (path.length === 0) return value as T;
  const [head, ...rest] = path as [string | number, ...(string | number)[]];
  if (typeof head === "number") {
    const arr = Array.isArray(source) ? [...(source as unknown[])] : [];
    arr[head] = setAtPath(arr[head], rest, value);
    return arr as unknown as T;
  }
  const obj = { ...((source ?? {}) as Record<string, unknown>) };
  obj[head] = setAtPath(obj[head], rest, value);
  return obj as unknown as T;
}

export function getAtPath(source: unknown, path: (string | number)[]): unknown {
  return path.reduce<unknown>((acc, key) => {
    if (acc === null || acc === undefined) return undefined;
    return (acc as Record<string | number, unknown>)[key];
  }, source);
}

export function videoEmbedUrl(url: string): { kind: "iframe" | "file"; src: string } | null {
  if (!url) return null;
  const yt = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([\w-]{6,})/);
  if (yt) return { kind: "iframe", src: `https://www.youtube.com/embed/${yt[1]}` };
  const vimeo = url.match(/vimeo\.com\/(\d+)/);
  if (vimeo) return { kind: "iframe", src: `https://player.vimeo.com/video/${vimeo[1]}` };
  return { kind: "file", src: url };
}
