import { createFileRoute } from "@tanstack/react-router";
import { PageSections } from "@/components/site/PageSections";

export const Route = createFileRoute("/screen-printing")({
  head: () => ({
    meta: [
      { title: "Screen Printing | Straight Line Printing" },
      {
        name: "description",
        content:
          "Durable screen printing for team runs, merch and workwear. Configurable ink colours, print locations and quantity pricing.",
      },
      { property: "og:title", content: "Screen Printing | Straight Line Printing" },
      {
        property: "og:description",
        content: "Bold, durable ink for medium and large runs, priced by quantity, locations and ink colours.",
      },
    ],
  }),
  component: PageScreenPrinting,
});

function PageScreenPrinting() {
  return <PageSections slug="/screen-printing" />;
}
