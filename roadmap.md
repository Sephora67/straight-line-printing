# Straight Line Printing — build roadmap

## Staff members access (requested 2026-09-19)
- [x] Employees area: add members by name/email/role, instant access for existing accounts, invitation renew/revoke, sign-up link.
- [x] Per-member allow/deny controls grouped by area, including website content, pages, theme, products and variants.
- [x] Permissions enforced in database rules (catalogue, website, employees) and server actions; deactivated members lose access.
- [ ] Signed-in end-to-end verification (owner + limited staff) — blocked until you sign into the preview.

## Stage 0 — Foundation
- [x] Enable Lovable Cloud (database, auth, storage)
- [ ] Design system (red / white / black / grey industrial print-shop look)
- [ ] Core database schema (catalog, assets, print areas, calibration, pricing, artwork, designs, quotes, orders, production, QC, inventory, suppliers, audit, notifications)
- [ ] Roles + RLS + storage buckets (private artwork, public garment assets)
- [x] Auth (email/password + Google), customer portal overview

## Stage 1 — Public site
- [x] Home, Shop, Custom Apparel, Screen Printing, DTF Printing, DTF Transfers/Sheets, Embroidery
- [x] Bulk Orders, Print-on-Demand, How It Works, About, Contact, FAQ, Quote Request
- [ ] Replace placeholder contact details (phone, address, hours, email)

## Stage 2 — Admin catalog
- [x] Auth (email + Google), owner claim, staff-gated admin shell, dashboard
- [x] Products list: create, duplicate, archive
- [x] Editor tabs: General, Colours & sizes (+ variant generation), Garment images, Print areas
- [x] Visual drag/resize print-area editor with physical inches, revisions/restore, publish validation
- [ ] Remaining editor tabs: Decoration methods, Pricing, Inventory, Supplier
- [x] Calibration tab: reference marker per view, pixels-per-inch, confirm before publish
- [ ] Colour-consistency check across the four views

## Stage 3 — Design Studio
- [x] Garment/colour/view switching from catalog data, artwork upload, transform, multi-placement
- [x] Placement -> physical measurement engine (studio inches readout)
- [x] Rotate any artwork in every print area and preserve the angle through production
- [ ] Saved designs, add to cart, request quote

## Stage 4 — Commerce
- [x] Cart + checkout that place a real order carrying the full production spec
- [ ] Pricing engine (shared), taxes (CAD/QC), shipping rules
- [x] Built-in Stripe product catalogue, embedded checkout, and paid-order reconciliation
- [x] Purchase lifecycle: keep orders unpaid until payment succeeds, then retain manual staff review

## Stage 5 — Quotes, proofs, orders
- [x] Order & request inbox (filters, detail view, status/priority/notes, quote → order)
- [x] Frozen design snapshots from studio → cart/request → order item → production job
- [x] Proof creation + approval marking, production job creation from an order
- [ ] Customer-facing proof approval screen

## Stage 6 — Production
- [x] Production queue, job detail, readiness checklist, stages, method fields, overrides, QC, spec download
- [x] Multi-file production ZIP with specifications, mockups, originals, and production-ready files

## Stage 7 — Ops
- [ ] Automated order, quote, contact, production, and shipping emails
- [x] Editable notification settings and customer templates (live delivery/history waits for sender domain)
- [x] Employee invitations, roles, granular server-enforced permissions, and access-aware Admin navigation
- [x] Admin activity/audit log with before/after values
- [ ] Complete order, quote, contact, employee, and template workflow testing
- [ ] Analytics

## Open items
- Built-in Stripe selected for physical apparel. Tax is calculated and collected at checkout; tax filing and shipping remain merchant responsibilities.
- DTF express dispatch is the only expedited option; garment orders use standard scheduling.

- [x] Editable marketing pages: sections (add/remove/reorder/hide), inline text, images, video, theme colours and fonts, contact form messages
- [x] Editable page catalogue: add, rename, reorder, publish, archive and remove public pages while protecting commerce routes

## Connected order + production workflow (requested 2026-09-11)
- [ ] Fix account detail navigation (missing child outlet) and row affordance
- [ ] Order detail: delivery address, payment, contact, quantities, all saved views
- [ ] Studio: only allow decorating views with print area + colour-matched asset
- [ ] Per-placement production panels (mockup, area guide, overlay, measurements, calibration)
- [ ] Readiness validation naming each missing item; no substitution
- [x] Multi-method orders -> multiple linked production jobs under one master order
- [ ] Mockup as documentation only; previews labelled, never production-ready
- [x] Frozen approved snapshot/versioning immune to later catalogue edits
- [x] Spec/PDF/ZIP driven by the same approved data
- [x] Automatically create linked production jobs when an order is approved
- [x] Ensure Front, Back, Left Sleeve, and Right Sleeve production details come only from the frozen approved snapshot
- [x] Add a production-specification PDF per job from the same frozen approved snapshot

## Done 2026-09-11
- Account detail pages open and show delivery, payment, contact, units and every artwork view.
- Studio blocks views without a colour-matched garment photo instead of substituting.
- Production ZIP includes labelled studio previews; readiness checks all items.
- Manual production decisions now support Request Proof, Approve & Send to Production, Send Directly to Production, and Hold.
- Employee roles, active/inactive access, protected permissions, notification settings/templates, and activity history are available in Admin.
- Live app emails remain blocked until a business-owned sender domain is connected.
