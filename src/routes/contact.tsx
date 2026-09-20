import { createFileRoute } from "@tanstack/react-router";
import { PageSections } from "@/components/site/PageSections";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact | Straight Line Printing" },
      {
        name: "description",
        content:
          "Get in touch about custom apparel, bulk quotes, artwork or an order already in production.",
      },
      { property: "og:title", content: "Contact Straight Line Printing" },
      {
        property: "og:description",
        content: "Reach us about custom apparel, quotes, artwork or an existing order.",
      },
    ],
  }),
  component: PageContact,
});

function PageContact() {
  return <PageSections slug="/contact" />;
}
