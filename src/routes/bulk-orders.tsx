import { createFileRoute } from "@tanstack/react-router";
import { PageSections } from "@/components/site/PageSections";
import { BulkOrderBuilder } from "@/components/order/BulkOrderBuilder";

export const Route = createFileRoute("/bulk-orders")({
  head: () => ({
    meta: [
      { title: "Bulk Orders & Team Runs | Straight Line Printing" },
      {
        name: "description",
        content:
          "Order in bulk with size and colour matrices, tiered quantity pricing, artwork review and proof approval before production.",
      },
      { property: "og:title", content: "Bulk Orders | Straight Line Printing" },
      {
        property: "og:description",
        content: "Size and colour matrices, tiered pricing and proof approval for large runs.",
      },
    ],
  }),
  component: PageBulkOrders,
});

function PageBulkOrders() {
  return (
    <>
      <PageSections slug="/bulk-orders" />
      <BulkOrderBuilder />
    </>
  );
}
