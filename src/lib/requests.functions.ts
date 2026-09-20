import { createServerFn } from "@tanstack/react-start";
import { makeNumber, type DesignSnapshot } from "@/lib/production-spec";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

type SubmitInput = {
  requestType: string;
  decorationMethod: string;
  contactName: string;
  contactEmail: string;
  contactPhone?: string;
  company?: string;
  notes?: string;
  deadline?: string | null;
  userId?: string | null;
  /** loose artwork files not tied to a design */
  files?: { name: string; dataUrl: string }[];
  items: {
    description?: string;
    quantity: number;
    unitPrice?: number;
    snapshot: DesignSnapshot;
  }[];
};

function dataUrlToBytes(dataUrl: string) {
  const comma = dataUrl.indexOf(",");
  const meta = dataUrl.slice(0, comma);
  const base64 = dataUrl.slice(comma + 1);
  const mime = /data:([^;]+)/.exec(meta)?.[1] ?? "application/octet-stream";
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return { bytes, mime };
}

/**
 * Public submission endpoint used by the bulk builder, the quote form and the
 * DTF sheet builder. Persists artwork, a design + frozen design version per
 * item, and one quote request holding every item.
 */
export const submitRequest = createServerFn({ method: "POST" })
  .inputValidator((data: SubmitInput) => data)
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const quoteNumber = makeNumber("REQ");

    async function persistArtwork(name: string, dataUrl: string, userId: string | null) {
      const { bytes, mime } = dataUrlToBytes(dataUrl);
      const ext = (name.split(".").pop() ?? "png").toLowerCase().slice(0, 5);
      const path = `${quoteNumber}/${crypto.randomUUID()}.${ext}`;
      const { error: upErr } = await supabaseAdmin.storage
        .from("artwork")
        .upload(path, bytes, { contentType: mime, upsert: false });
      if (upErr) throw new Error(upErr.message);
      const { data: art, error } = await supabaseAdmin
        .from("artworks")
        .insert({
          user_id: userId,
          original_filename: name,
          storage_path: path,
          mime_type: mime,
          file_size: bytes.byteLength,
          status: "uploaded",
        })
        .select("id, storage_path")
        .single();
      if (error) throw new Error(error.message);
      return art;
    }

    const userId = data.userId ?? null;

    const { data: quote, error: quoteError } = await supabaseAdmin
      .from("quotes")
      .insert({
        quote_number: quoteNumber,
        user_id: userId,
        request_type: data.requestType,
        contact_name: data.contactName,
        contact_email: data.contactEmail,
        contact_phone: data.contactPhone ?? null,
        company: data.company ?? null,
        notes: data.notes ?? null,
        deadline: data.deadline ?? null,
        status: "new",
      })
      .select("id, quote_number")
      .single();
    if (quoteError) throw new Error(quoteError.message);

    // loose artwork -> attached to the request as an event with storage paths
    const looseFiles: { id: string; storage_path: string; name: string }[] = [];
    for (const f of data.files ?? []) {
      const art = await persistArtwork(f.name, f.dataUrl, userId);
      looseFiles.push({ id: art.id, storage_path: art.storage_path, name: f.name });
    }
    if (looseFiles.length) {
      await supabaseAdmin.from("quote_events").insert({
        quote_id: quote.id,
        event_type: "artwork_uploaded",
        message: `${looseFiles.length} customer artwork file(s) uploaded`,
        metadata: { files: looseFiles },
        is_customer_visible: true,
      });
    }

    let subtotal = 0;

    for (const item of data.items) {
      const snapshot: DesignSnapshot = JSON.parse(JSON.stringify(item.snapshot));

      // persist every artwork layer and replace previews with storage paths
      for (const placement of snapshot.placements ?? []) {
        for (const layer of placement.layers ?? []) {
          if (layer.artworkPreview?.startsWith("data:")) {
            const art = await persistArtwork(
              layer.artworkName ?? "artwork.png",
              layer.artworkPreview,
              userId,
            );
            layer.artworkPath = art.storage_path;
            delete layer.artworkPreview;
          }
        }
      }

      // design + frozen version
      const { data: design, error: designError } = await supabaseAdmin
        .from("designs")
        .insert({
          user_id: userId,
          name: `${snapshot.productName} — ${snapshot.colorName ?? ""}`.trim(),
          product_id: snapshot.productId || null,
          color_id: snapshot.colorId || null,
          config_snapshot: snapshot as never,
          is_saved: true,
        })
        .select("id")
        .single();
      if (designError) throw new Error(designError.message);

      const { data: version, error: versionError } = await supabaseAdmin
        .from("design_versions")
        .insert({
          design_id: design.id,
          version: 1,
          snapshot: snapshot as never,
          created_by: userId,
        })
        .select("id")
        .single();
      if (versionError) throw new Error(versionError.message);

      const lineTotal = (item.unitPrice ?? 0) * item.quantity;
      subtotal += lineTotal;

      const { error: itemError } = await supabaseAdmin.from("quote_items").insert({
        quote_id: quote.id,
        product_id: snapshot.productId || null,
        design_id: design.id,
        description: item.description ?? snapshot.productName,
        quantity: item.quantity,
        quantity_matrix: snapshot.quantityMatrix ?? {},
        unit_price: item.unitPrice ?? 0,
        line_total: lineTotal,
        config_snapshot: {
          ...snapshot,
          design_id: design.id,
          design_version_id: version.id,
          decoration_method: snapshot.decorationMethod ?? data.decorationMethod,
        } as never,
      });
      if (itemError) throw new Error(itemError.message);
    }

    await supabaseAdmin
      .from("quotes")
      .update({ subtotal, total: subtotal })
      .eq("id", quote.id);

    await supabaseAdmin.from("quote_events").insert({
      quote_id: quote.id,
      event_type: "created",
      message: "Request submitted by the customer",
      is_customer_visible: true,
    });

    await supabaseAdmin.from("audit_log").insert({
      user_id: userId,
      entity_type: "quotes",
      entity_id: quote.id,
      action: "request_created",
      after_value: { quote_number: quoteNumber, request_type: data.requestType },
    });

    return { quoteNumber: quote.quote_number, quoteId: quote.id };
  });

/** Public status lookup by request number + email. */
export const lookupRequest = createServerFn({ method: "POST" })
  .inputValidator((data: { number: string; email: string }) => data)
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: quote } = await supabaseAdmin
      .from("quotes")
      .select("quote_number, status, created_at, deadline, quote_items(id)")
      .eq("quote_number", data.number.trim())
      .ilike("contact_email", data.email.trim())
      .maybeSingle();
    if (quote) {
      return {
        number: quote.quote_number,
        status: quote.status as string,
        createdAt: quote.created_at,
        items: quote.quote_items?.length ?? 0,
      };
    }
    const { data: order } = await supabaseAdmin
      .from("orders")
      .select("order_number, status, created_at, order_items(id)")
      .eq("order_number", data.number.trim())
      .ilike("contact_email", data.email.trim())
      .maybeSingle();
    if (!order) return null;
    return {
      number: order.order_number,
      status: order.status as string,
      createdAt: order.created_at,
      items: order.order_items?.length ?? 0,
    };
  });

/** Cart checkout -> a real order carrying the frozen design snapshots. */
export const submitOrder = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (data: {
      contactName: string;
      contactEmail: string;
      contactPhone?: string;
      notes?: string;
      fulfilment: "pickup" | "ship";
      address?: Record<string, unknown>;
      items: { quantity: number; unitPrice: number; snapshot: DesignSnapshot }[];
    }) => data,
  )
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const orderNumber = makeNumber("ORD");
    const subtotal = data.items.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0);

    const { data: order, error } = await supabaseAdmin
      .from("orders")
      .insert({
        order_number: orderNumber,
        user_id: context.userId,
        request_type: "pod",
        contact_name: data.contactName,
        contact_email: data.contactEmail,
        contact_phone: data.contactPhone ?? null,
        status: "pending",
        payment_status: "unpaid",
        notes: data.notes ?? null,
        shipping_address: (data.address ?? {}) as never,
        billing_address: (data.address ?? {}) as never,
        subtotal,
        total: subtotal,
      })
      .select("id, order_number")
      .single();
    if (error) throw new Error(error.message);

    for (const item of data.items) {
      const snapshot: DesignSnapshot = JSON.parse(JSON.stringify(item.snapshot));
      const { data: design } = await supabaseAdmin
        .from("designs")
        .insert({
          user_id: context.userId,
          name: snapshot.productName,
          product_id: snapshot.productId || null,
          color_id: snapshot.colorId || null,
          config_snapshot: snapshot as never,
          is_saved: true,
        })
        .select("id")
        .single();
      const { data: version } = design
        ? await supabaseAdmin
            .from("design_versions")
            .insert({ design_id: design.id, version: 1, snapshot: snapshot as never })
            .select("id")
            .single()
        : { data: null };

      await supabaseAdmin.from("order_items").insert({
        order_id: order.id,
        product_id: snapshot.productId || null,
        design_id: design?.id ?? null,
        description: snapshot.productName,
        quantity: item.quantity,
        quantity_matrix: snapshot.quantityMatrix ?? {},
        unit_price: item.unitPrice,
        line_total: item.unitPrice * item.quantity,
        frozen_config: {
          ...snapshot,
          design_id: design?.id ?? null,
          design_version_id: version?.id ?? null,
        } as never,
      });
    }

    await supabaseAdmin.from("audit_log").insert({
      user_id: context.userId,
      entity_type: "orders",
      entity_id: order.id,
      action: "order_created",
      after_value: { order_number: orderNumber },
    });

    return { orderNumber: order.order_number, orderId: order.id };
  });
