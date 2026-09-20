import { createFileRoute } from "@tanstack/react-router";
import { PageSections } from "@/components/site/PageSections";
import { DtfSheetBuilder } from "@/components/order/DtfSheetBuilder";

export const Route = createFileRoute("/dtf-transfers")({
  head: () => ({
    meta: [
      { title: "DTF Transfers & Gang Sheets | Straight Line Printing" },
      {
        name: "description",
        content:
          "Order ready-to-press DTF transfers, single designs or gang sheets in standard and custom sizes, shipped to your shop.",
      },
      { property: "og:title", content: "DTF Transfers & Gang Sheets" },
      {
        property: "og:description",
        content: "Ready-to-press DTF transfers and gang sheets in standard and custom sizes.",
      },
    ],
  }),
  component: PageDtfTransfers,
});

function PageDtfTransfers() {
  return (
    <>
      <PageSections slug="/dtf-transfers" />
      <DtfSheetBuilder />
    </>
  );
}
