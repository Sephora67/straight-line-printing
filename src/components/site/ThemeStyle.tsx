import { useQuery } from "@tanstack/react-query";
import {
  DEFAULT_COLORS,
  fetchTheme,
  googleFontsHref,
  themeQueryKey,
  type SiteTheme,
} from "@/lib/site-content";

export function useTheme() {
  return useQuery({
    queryKey: themeQueryKey,
    queryFn: fetchTheme,
    staleTime: 60_000,
  });
}

export function themeColors(theme: SiteTheme | null | undefined) {
  return { ...DEFAULT_COLORS, ...(theme?.colors ?? {}) };
}

export function ThemeStyle() {
  const { data: theme } = useTheme();
  const display = theme?.font_display || "Bebas Neue";
  const body = theme?.font_body || "Barlow";
  const colors = theme?.colors ?? {};

  const vars = Object.entries(colors)
    .filter(([, v]) => typeof v === "string" && v.length > 0)
    .map(([k, v]) => `--${k}: ${v};`)
    .join("");

  const css = `:root{${vars}${theme?.radius ? `--radius:${theme.radius};` : ""}}
:root{--font-display:"${display}", "Arial Narrow", sans-serif;--font-sans:"${body}", system-ui, sans-serif;}
body{font-family:var(--font-sans);}
[contenteditable]:empty:before{content:attr(data-placeholder);opacity:.5;}`;

  return (
    <>
      <link rel="stylesheet" href={googleFontsHref(display, body)} />
      <style>{css}</style>
    </>
  );
}
