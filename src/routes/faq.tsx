import { createFileRoute } from "@tanstack/react-router";
import { PageSections } from "@/components/site/PageSections";
import { DEFAULT_SECTIONS } from "@/lib/site-defaults";

const faqDefaults =
  (DEFAULT_SECTIONS["/faq"]?.find((s) => s.type === "faq")?.content["items"] as
    | { q: string; a: string }[]
    | undefined) ?? [];

export const Route = createFileRoute("/faq")({
  head: () => ({
    meta: [
      { title: "FAQ | Straight Line Printing" },
      {
        name: "description",
        content:
          "Answers about minimums, artwork files, decoration methods, proofs, turnaround times and shipping for custom apparel orders.",
      },
      { property: "og:title", content: "Custom Apparel FAQ | Straight Line Printing" },
      {
        property: "og:description",
        content: "Minimums, artwork, proofs, turnaround and shipping questions answered.",
      },
    ],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: faqDefaults.map((f) => ({
            "@type": "Question",
            name: f.q,
            acceptedAnswer: { "@type": "Answer", text: f.a },
          })),
        }),
      },
    ],
  }),
  component: PageFaq,
});

function PageFaq() {
  return <PageSections slug="/faq" />;
}
