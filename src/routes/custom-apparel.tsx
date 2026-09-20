import { createFileRoute } from "@tanstack/react-router";
import { PageSections } from "@/components/site/PageSections";

export const Route = createFileRoute("/custom-apparel")({
  head: () => ({
    meta: [
      { title: "Custom Apparel | Straight Line Printing" },
      {
        name: "description",
        content:
          "Custom t-shirts, hoodies, sweatshirts, polos and hats decorated with screen printing, DTF or embroidery.",
      },
      { property: "og:title", content: "Custom Apparel | Straight Line Printing" },
      {
        property: "og:description",
        content: "T-shirts, hoodies, polos and hats decorated to order in-house.",
      },
    ],
  }),
  component: PageCustomApparel,
});

function PageCustomApparel() {
  return <PageSections slug="/custom-apparel" />;
}
