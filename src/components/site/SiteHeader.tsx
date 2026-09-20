import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Menu, X, ShoppingCart, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { fetchPages, pagesQueryKey } from "@/lib/site-content";

function ManagedNavLink({ to, children, className, onClick }: { to: string; children: React.ReactNode; className: string; onClick?: () => void }) {
  return <a href={to} className={className} onClick={onClick}>{children}</a>;
}

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const { data = [] } = useQuery({ queryKey: pagesQueryKey, queryFn: fetchPages, staleTime: 30_000 });
  const nav = data.filter((page) => page.is_published && page.show_in_nav);

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-ink text-ink-foreground">
      <div className="section-shell flex h-16 items-center justify-between gap-4">
        <Link to="/" className="flex items-center gap-2" onClick={() => setOpen(false)}>
          <span className="block h-7 w-1.5 bg-primary" aria-hidden />
          <span className="display-heading text-2xl leading-none">
            Straight Line <span className="text-primary">Printing</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-5 xl:flex">
          {nav.map((item) => (
            <ManagedNavLink
              key={item.id}
              to={item.path}
              className="text-sm font-medium uppercase tracking-wide opacity-80 transition-opacity hover:opacity-100"
            >
              {item.nav_label}
            </ManagedNavLink>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <Button asChild variant="ghost" size="icon" className="text-ink-foreground hover:bg-steel">
            <Link to="/account" aria-label="Account">
              <User className="size-5" />
            </Link>
          </Button>
          <Button asChild variant="ghost" size="icon" className="text-ink-foreground hover:bg-steel">
            <Link to="/cart" aria-label="Cart">
              <ShoppingCart className="size-5" />
            </Link>
          </Button>
          <Button asChild className="hidden sm:inline-flex">
            <Link to="/quote-request">Get a Quote</Link>
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="text-ink-foreground hover:bg-steel xl:hidden"
            onClick={() => setOpen((v) => !v)}
            aria-label="Menu"
          >
            {open ? <X className="size-5" /> : <Menu className="size-5" />}
          </Button>
        </div>
      </div>
      <div className="hazard-rule" />

      {open && (
        <div className="border-t border-steel bg-ink xl:hidden">
          <nav className="section-shell grid gap-1 py-4">
            {nav.map((item) => (
              <ManagedNavLink
                key={item.id}
                to={item.path}
                onClick={() => setOpen(false)}
                className="rounded px-2 py-2 text-sm font-semibold uppercase tracking-wide hover:bg-steel"
              >
                {item.nav_label}
              </ManagedNavLink>
            ))}
            <Link
              to="/quote-request"
              onClick={() => setOpen(false)}
              className="mt-2 rounded bg-primary px-3 py-2 text-center text-sm font-semibold uppercase text-primary-foreground"
            >
              Get a Quote
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}
