import { createFileRoute } from "@tanstack/react-router";
import { PageSections } from "@/components/site/PageSections";

export const Route = createFileRoute("/dtf-printing")({
  head: () => ({
    meta: [
      { title: "DTF Printing | Straight Line Printing" },
      {
        name: "description",
        content:
          "Full-colour DTF printing on garments with no minimums. Photographic detail, soft hand, fast turnaround.",
      },
      { property: "og:title", content: "DTF Printing | Straight Line Printing" },
      {
        property: "og:description",
        content: "Full-colour direct-to-film printing on garments with no minimum order.",
      },
    ],
  }),
  component: PageDtfPrinting,
});

function PageDtfPrinting() {
  return <PageSections slug="/dtf-printing" />;
}
