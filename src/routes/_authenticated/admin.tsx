import { createFileRoute, Link, Outlet } from "@tanstack/react-router";
import { LayoutDashboard, Shirt, ShieldAlert, Inbox, Factory, Users, Mail, ScrollText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRoles } from "@/hooks/useSession";
import { claimOwner } from "@/lib/roles.functions";
import { toast } from "sonner";
import { useState } from "react";
import { usePermissions } from "@/hooks/use-permissions";

export const Route = createFileRoute("/_authenticated/admin")({
  component: AdminLayout,
});

function AdminLayout() {
  const { isStaff, loading, roles } = useRoles();
  const [claiming, setClaiming] = useState(false);
  const permissions = usePermissions();

  if (loading) {
    return <div className="section-shell py-20 text-muted-foreground">Checking access…</div>;
  }

  if (!isStaff) {
    return (
      <div className="section-shell py-20">
        <div className="max-w-lg border-l-4 border-primary bg-card p-8">
          <ShieldAlert className="size-8 text-primary" />
          <h1 className="display-heading mt-4 text-3xl">Staff access required</h1>
          <p className="mt-3 text-sm text-muted-foreground">
            Your account doesn't have an admin role yet. If you're the business owner and this is a
            brand-new system, you can claim the Owner account now.
          </p>
          <Button
            className="mt-6"
            disabled={claiming}
            onClick={async () => {
              setClaiming(true);
              try {
                const { claimed } = await claimOwner();
                if (claimed) {
                  toast.success("You're the owner now");
                  window.location.reload();
                } else {
                  toast.error("An owner already exists — ask them to grant you access.");
                }
              } catch (e) {
                toast.error(e instanceof Error ? e.message : "Could not claim ownership");
              } finally {
                setClaiming(false);
              }
            }}
          >
            Claim owner account
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="section-shell grid gap-8 py-10 md:grid-cols-[220px_1fr]">
      <aside>
        <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
          Admin · {roles.join(", ")}
        </p>
        <nav className="mt-4 grid gap-1">
          <AdminLink to="/admin" icon={LayoutDashboard} label="Dashboard" exact />
          {permissions.can("orders.view") && <AdminLink to="/admin/inbox" icon={Inbox} label="Orders & requests" />}
          {permissions.can("production.view") && <AdminLink to="/admin/production" icon={Factory} label="Production" />}
          {permissions.can("products.view") && <AdminLink to="/admin/products" icon={Shirt} label="Products" />}
          {permissions.can("employees.view") && <AdminLink to="/admin/employees" icon={Users} label="Employees" />}
          {permissions.can("notifications.view") && <AdminLink to="/admin/notifications" icon={Mail} label="Email & notifications" />}
          {permissions.can("audit.view") && <AdminLink to="/admin/activity" icon={ScrollText} label="Activity" />}
        </nav>
      </aside>
      <div className="min-w-0">
        <Outlet />
      </div>
    </div>
  );
}

function AdminLink({
  to,
  icon: Icon,
  label,
  exact,
}: {
  to: "/admin" | "/admin/products" | "/admin/inbox" | "/admin/production" | "/admin/employees" | "/admin/notifications" | "/admin/activity";
  icon: typeof Shirt;
  label: string;
  exact?: boolean;
}) {
  return (
    <Link
      to={to}
      activeOptions={{ exact: exact ?? false }}
      activeProps={{ className: "bg-secondary font-semibold" }}
      className="flex items-center gap-2 rounded px-3 py-2 text-sm hover:bg-secondary"
    >
      <Icon className="size-4" />
      {label}
    </Link>
  );
}
