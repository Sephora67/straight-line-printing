import { createFileRoute } from "@tanstack/react-router";
import { PageSections } from "@/components/site/PageSections";

export const Route = createFileRoute("/print-on-demand")({
  head: () => ({
    meta: [
      { title: "Print-on-Demand | Straight Line Printing" },
      {
        name: "description",
        content:
          "Order single custom pieces online. Pick a garment, upload your art, check out and we produce it — no minimums.",
      },
      { property: "og:title", content: "Print-on-Demand | Straight Line Printing" },
      {
        property: "og:description",
        content: "Single custom pieces, ordered online with no minimums.",
      },
    ],
  }),
  component: PagePrintOnDemand,
});

function PagePrintOnDemand() {
  return <PageSections slug="/print-on-demand" />;
}
