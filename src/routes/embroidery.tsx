import { createFileRoute } from "@tanstack/react-router";
import { PageSections } from "@/components/site/PageSections";

export const Route = createFileRoute("/embroidery")({
  head: () => ({
    meta: [
      { title: "Embroidery | Straight Line Printing" },
      {
        name: "description",
        content:
          "Stitched embroidery for hats, polos and outerwear. Digitizing, stitch counts, thread matching and per-location pricing.",
      },
      { property: "og:title", content: "Embroidery | Straight Line Printing" },
      {
        property: "og:description",
        content: "Professional embroidery for hats, polos and outerwear, priced by stitch count and location.",
      },
    ],
  }),
  component: PageEmbroidery,
});

function PageEmbroidery() {
  return <PageSections slug="/embroidery" />;
}
