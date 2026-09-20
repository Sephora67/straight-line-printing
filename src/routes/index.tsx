import { createFileRoute } from "@tanstack/react-router";
import { PageSections } from "@/components/site/PageSections";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Straight Line Printing | Custom Apparel, Screen Print & Embroidery" },
      {
        name: "description",
        content:
          "Custom apparel decorated in-house: screen printing, DTF, transfers and embroidery. Design online, order one piece or a thousand.",
      },
      { property: "og:title", content: "Straight Line Printing | Custom Apparel & Decoration" },
      {
        property: "og:description",
        content:
          "Screen printing, DTF, DTF transfers and embroidery. Design online, request bulk quotes, approve proofs, get it produced.",
      },
    ],
  }),
  component: HomePage,
});

function HomePage() {
  return <PageSections slug="/" />;
}
