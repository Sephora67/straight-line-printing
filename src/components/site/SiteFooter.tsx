import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { fetchPages, pagesQueryKey } from "@/lib/site-content";

const columns = [
  {
    title: "Services",
    links: [
      { to: "/screen-printing", label: "Screen Printing" },
      { to: "/dtf-printing", label: "DTF Printing" },
      { to: "/dtf-transfers", label: "DTF Transfers & Sheets" },
      { to: "/embroidery", label: "Embroidery" },
    ],
  },
  {
    title: "Order",
    links: [
      { to: "/shop", label: "Shop" },
      { to: "/design-studio", label: "Design Studio" },
      { to: "/bulk-orders", label: "Bulk Orders" },
      { to: "/print-on-demand", label: "Print-on-Demand" },
      { to: "/quote-request", label: "Request a Quote" },
    ],
  },
  {
    title: "Company",
    links: [
      { to: "/about", label: "About" },
      { to: "/how-it-works", label: "How It Works" },
      { to: "/faq", label: "FAQ" },
      { to: "/contact", label: "Contact" },
      { to: "/account", label: "My Account" },
    ],
  },
] as const;

export function SiteFooter() {
  const { data = [] } = useQuery({ queryKey: pagesQueryKey, queryFn: fetchPages, staleTime: 30_000 });
  const managed = data.filter((page) => page.is_published && page.show_in_nav).slice(0, 8);
  return (
    <footer className="mt-24 bg-ink text-ink-foreground">
      <div className="hazard-rule" />
      <div className="section-shell grid gap-10 py-14 md:grid-cols-4">
        <div>
          <div className="display-heading text-3xl">
            Straight Line <span className="text-primary">Printing</span>
          </div>
          <p className="mt-3 max-w-xs text-sm opacity-70">
            Custom apparel decorated in-house: screen printing, DTF, transfers and embroidery,
            from one-offs to full team runs.
          </p>
        </div>
        {columns.slice(1).map((col) => (
          <div key={col.title}>
            <h3 className="display-heading text-lg text-primary">{col.title}</h3>
            <ul className="mt-3 space-y-2">
              {col.links.map((l) => (
                <li key={l.to}>
                  <Link to={l.to} className="text-sm opacity-75 hover:opacity-100">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
        <div>
          <h3 className="display-heading text-lg text-primary">Explore</h3>
          <ul className="mt-3 space-y-2">
            {managed.map((page) => (
              <li key={page.id}>
                <a href={page.path} className="text-sm opacity-75 hover:opacity-100">{page.nav_label}</a>
              </li>
            ))}
          </ul>
        </div>
      </div>
      <div className="border-t border-steel">
        <div className="section-shell flex flex-col gap-2 py-5 text-xs opacity-60 sm:flex-row sm:justify-between">
          <span>&copy; {new Date().getFullYear()} Straight Line Printing. All rights reserved.</span>
          <span>Prices in CAD. Canadian and US shipping available.</span>
        </div>
      </div>
    </footer>
  );
}
