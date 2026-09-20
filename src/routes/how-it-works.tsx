import { createFileRoute } from "@tanstack/react-router";
import { PageSections } from "@/components/site/PageSections";

export const Route = createFileRoute("/how-it-works")({
  head: () => ({
    meta: [
      { title: "How It Works | Straight Line Printing" },
      {
        name: "description",
        content:
          "From artwork to approved proof to production: how custom apparel orders and bulk quotes move through our shop.",
      },
      { property: "og:title", content: "How It Works | Straight Line Printing" },
      {
        property: "og:description",
        content: "Artwork, proof approval and production, explained step by step.",
      },
    ],
  }),
  component: PageHowItWorks,
});

function PageHowItWorks() {
  return <PageSections slug="/how-it-works" />;
}
