import { createFileRoute } from "@tanstack/react-router";
import { PageSections } from "@/components/site/PageSections";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About | Straight Line Printing" },
      {
        name: "description",
        content:
          "Straight Line Printing is a custom apparel shop doing screen printing, DTF and embroidery in-house, from single pieces to team runs.",
      },
      { property: "og:title", content: "About Straight Line Printing" },
      {
        property: "og:description",
        content: "A custom apparel shop printing and stitching in-house.",
      },
    ],
  }),
  component: PageAbout,
});

function PageAbout() {
  return <PageSections slug="/about" />;
}
