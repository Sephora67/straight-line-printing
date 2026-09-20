import JSZip from "jszip";
import { signedArtworkUrl } from "@/lib/storage";
import {
  REFERENCE_LABELS,
  REQUEST_TYPE_LABELS,
  VIEW_LABELS,
  formatIn,
  placementSentence,
  titleCase,
} from "@/lib/production-spec";
import type { JobSnapshot } from "@/lib/production-jobs";

type PackageJob = {
  job_number: string;
  stage: string;
  priority: string;
  due_date: string | null;
  proof_id: string | null;
  locked_at: string | null;
  notes: string | null;
  production_data: Record<string, string> | null;
  snapshot: JobSnapshot | null;
  orders: { order_number: string; contact_name: string | null; contact_email: string | null } | null;
  production_overrides: { field_key: string; override_value: string; calculated_value: string | null; reason: string | null }[];
  production_files: { kind: string; label: string | null; storage_path: string | null }[];
};

function safeName(value: string) {
  return value.replace(/[^a-zA-Z0-9._-]+/g, "-").replace(/^-+|-+$/g, "") || "file";
}

export function productionSpecText(j: PackageJob) {
  const snap = j.snapshot;
  const method = snap?.decorationMethod ?? "dtf";
  const lines = [
    "PRODUCTION SPECIFICATION",
    `Job: ${j.job_number}`,
    `Order: ${j.orders?.order_number ?? "—"}`,
    `Customer: ${j.orders?.contact_name ?? "—"} (${j.orders?.contact_email ?? "—"})`,
    `Decoration method: ${REQUEST_TYPE_LABELS[method] ?? titleCase(method)}`,
    `Stage: ${titleCase(j.stage)} · Priority: ${titleCase(j.priority)} · Due: ${j.due_date ?? "—"}`,
    `Proof approved: ${j.proof_id ? "yes" : "no"} · Locked: ${j.locked_at ?? "not locked"}`,
    "",
  ];
  for (const item of snap?.items ?? []) {
    lines.push(`GARMENT: ${item.productName} ${item.brand ? `(${item.brand})` : ""}`);
    lines.push(`SKU: ${item.sku ?? "—"} · Colour: ${item.colorName ?? "—"} · Size: ${item.sizeLabel ?? "—"}`);
    lines.push(`Quantity: ${item.quantity} ${JSON.stringify(item.quantityMatrix ?? {})}`);
    for (const p of item.placements ?? []) {
      lines.push(`${VIEW_LABELS[p.view]} — ${p.printAreaName ?? "—"} ${formatIn(p.areaWidthIn)} × ${formatIn(p.areaHeightIn)}`);
      lines.push(`Reference: ${REFERENCE_LABELS[p.referenceType] ?? p.referenceType}${p.referenceLabel ? ` (${p.referenceLabel})` : ""}${p.referenceConfirmed ? " (confirmed)" : " (NOT CONFIRMED)"}`);
      lines.push(`Calibration: ${p.pixelsPerInch ? `${Number(p.pixelsPerInch).toFixed(1)} px/in` : "missing"}`);
      lines.push(`Garment mockup: ${p.mockupUrl ? "included (visual reference only)" : "MISSING"}`);
      for (const layer of p.layers ?? []) {
        const source = layer.artworkPath
          ? "original file"
          : layer.artworkPreview
            ? "studio preview only — NOT production ready"
            : "no file";
        lines.push(`${layer.artworkName ?? titleCase(layer.kind)} [${source}]: ${placementSentence(p, layer)}`);
      }
    }
    lines.push("");
  }
  for (const [key, value] of Object.entries(j.production_data ?? {})) lines.push(`${titleCase(key)}: ${value}`);
  for (const o of j.production_overrides) lines.push(`Override ${o.field_key}: ${o.override_value} (was ${o.calculated_value ?? "—"}) — ${o.reason ?? ""}`);
  if (j.notes) lines.push(`Production notes: ${j.notes}`);
  return lines.join("\n");
}

function pdfEscape(value: string) {
  return value.replace(/[^\x20-\x7E]/g, " ").replace(/([\\()])/g, "\\$1");
}

export function productionSpecPdf(j: PackageJob) {
  const sourceLines = productionSpecText(j).split("\n");
  const wrapped = sourceLines.flatMap((line) => line.match(/.{1,92}(?:\s|$)|.{1,92}/g) ?? [""]);
  const pages: string[][] = [];
  for (let index = 0; index < wrapped.length; index += 52) pages.push(wrapped.slice(index, index + 52));
  if (!pages.length) pages.push(["PRODUCTION SPECIFICATION"]);

  const objects: string[] = [];
  const add = (body: string) => { objects.push(body); return objects.length; };
  const fontId = add("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>");
  const pagesId = add("");
  const pageIds: number[] = [];
  for (const lines of pages) {
    const stream = ["BT", "/F1 9 Tf", "44 742 Td", "12 TL", ...lines.flatMap((line, index) => index === 0 ? [`(${pdfEscape(line)}) Tj`] : ["T*", `(${pdfEscape(line)}) Tj`]), "ET"].join("\n");
    const contentId = add(`<< /Length ${new TextEncoder().encode(stream).length} >>\nstream\n${stream}\nendstream`);
    pageIds.push(add(`<< /Type /Page /Parent ${pagesId} 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 ${fontId} 0 R >> >> /Contents ${contentId} 0 R >>`));
  }
  objects[pagesId - 1] = `<< /Type /Pages /Kids [${pageIds.map((id) => `${id} 0 R`).join(" ")}] /Count ${pageIds.length} >>`;
  const catalogId = add(`<< /Type /Catalog /Pages ${pagesId} 0 R >>`);
  let document = "%PDF-1.4\n";
  const offsets = [0];
  objects.forEach((body, index) => { offsets.push(new TextEncoder().encode(document).length); document += `${index + 1} 0 obj\n${body}\nendobj\n`; });
  const xref = new TextEncoder().encode(document).length;
  document += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n${offsets.slice(1).map((offset) => `${String(offset).padStart(10, "0")} 00000 n `).join("\n")}\ntrailer\n<< /Size ${objects.length + 1} /Root ${catalogId} 0 R >>\nstartxref\n${xref}\n%%EOF`;
  return new TextEncoder().encode(document);
}

export function downloadProductionPdf(j: PackageJob) {
  const blob = new Blob([productionSpecPdf(j)], { type: "application/pdf" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${safeName(j.job_number)}-production-spec.pdf`;
  link.click();
  URL.revokeObjectURL(url);
}

async function addRemote(zip: JSZip, folder: string, name: string, url: string) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Could not download ${name}`);
  zip.file(`${folder}/${safeName(name)}`, await response.blob());
}

export async function downloadProductionZip(j: PackageJob) {
  const zip = new JSZip();
  zip.file("production-spec.txt", productionSpecText(j));
  zip.file("production-spec.pdf", productionSpecPdf(j));
  const tasks: Promise<void>[] = [];
  for (const item of j.snapshot?.items ?? []) {
    for (const placement of item.placements ?? []) {
      if (placement.mockupUrl) {
        tasks.push(addRemote(zip, "mockups", `${item.productName}-${VIEW_LABELS[placement.view]}.png`, placement.mockupUrl));
      }
      for (const layer of placement.layers ?? []) {
        if (layer.artworkPath) {
          tasks.push(signedArtworkUrl(layer.artworkPath).then((url) => {
            if (!url) throw new Error(`Could not sign ${layer.artworkName ?? "artwork"}`);
            return addRemote(zip, "customer-originals", layer.artworkName ?? `${layer.id}.png`, url);
          }));
          continue;
        }
        // No stored original: include the studio preview, clearly labelled as
        // a preview so it is never mistaken for a production-ready file.
        if (layer.artworkPreview) {
          tasks.push(addRemote(
            zip,
            "design-previews-not-production-ready",
            `PREVIEW-${VIEW_LABELS[placement.view]}-${layer.artworkName ?? layer.id}.png`,
            layer.artworkPreview,
          ));
        }
      }
    }
  }
  for (const file of j.production_files) {
    const storagePath = file.storage_path;
    if (!storagePath) continue;
    tasks.push(signedArtworkUrl(storagePath).then((url) => {
      if (!url) throw new Error(`Could not sign ${file.label ?? "production file"}`);
      return addRemote(zip, file.kind === "production_artwork" ? "production-ready" : "customer-originals", file.label ?? storagePath, url);
    }));
  }
  await Promise.all(tasks);
  const blob = await zip.generateAsync({ type: "blob" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${safeName(j.job_number)}-production-package.zip`;
  link.click();
  URL.revokeObjectURL(url);
}