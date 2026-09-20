import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { inviteEmployee, listTeam, updateEmployee, updateInvitation } from "@/lib/team.functions";
import { titleCase } from "@/lib/production-spec";
import { usePermissions } from "@/hooks/use-permissions";

export const Route = createFileRoute("/_authenticated/admin/employees")({
  head: () => ({
    meta: [
      { title: "Employees | Straight Line Printing" },
      { name: "description", content: "Invite staff and control exactly what each member can change." },
      { property: "og:title", content: "Employees | Straight Line Printing" },
      { property: "og:description", content: "Invite staff and control exactly what each member can change." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: EmployeesPage,
});

const ROLES = [
  "owner",
  "administrator",
  "manager",
  "production",
  "sales",
  "designer",
  "customer_service",
] as const;
type Role = (typeof ROLES)[number];
type Choice = "default" | "allow" | "deny";

const AREA_LABELS: Record<string, string> = {
  site: "Website content",
  products: "Products & variants",
  orders: "Orders",
  quotes: "Quotes & requests",
  production: "Production",
  shipping: "Shipping",
  customers: "Customers",
  designs: "Designs",
  employees: "Employees",
  notifications: "Email & notifications",
  financial: "Financial information",
  settings: "Settings",
  audit: "Activity log",
};

function EmployeesPage() {
  const queryClient = useQueryClient();
  const myPermissions = usePermissions();
  const list = useServerFn(listTeam);
  const invite = useServerFn(inviteEmployee);
  const update = useServerFn(updateEmployee);
  const changeInvitation = useServerFn(updateInvitation);

  const [form, setForm] = useState({ fullName: "", email: "", role: "customer_service" as Role });
  const [openEmployee, setOpenEmployee] = useState<string | null>(null);
  const [draft, setDraft] = useState<Record<string, Choice>>({});

  const team = useQuery({ queryKey: ["team"], queryFn: () => list() });

  const invitation = useMutation({
    mutationFn: () => invite({ data: form }),
    onSuccess: (result) => {
      toast.success(result.activated ? "Access granted to their existing account" : "Invitation created");
      setForm({ fullName: "", email: "", role: "customer_service" });
      void queryClient.invalidateQueries({ queryKey: ["team"] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const employeeUpdate = useMutation({
    mutationFn: (data: {
      userId: string;
      role: Role;
      status: "active" | "inactive";
      overrides?: { permissionId: string; granted: boolean }[];
    }) => update({ data }),
    onSuccess: () => {
      toast.success("Employee updated");
      void queryClient.invalidateQueries({ queryKey: ["team"] });
      void queryClient.invalidateQueries({ queryKey: ["my-permissions"] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const invitationUpdate = useMutation({
    mutationFn: (data: { invitationId: string; action: "revoke" | "extend" }) => changeInvitation({ data }),
    onSuccess: () => {
      toast.success("Invitation updated");
      void queryClient.invalidateQueries({ queryKey: ["team"] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const permissionsByArea = useMemo(() => {
    const groups = new Map<string, { id: string; code: string; name: string; description: string; area: string }[]>();
    for (const permission of team.data?.permissions ?? []) {
      const bucket = groups.get(permission.area) ?? [];
      bucket.push(permission);
      groups.set(permission.area, bucket);
    }
    return [...groups.entries()];
  }, [team.data?.permissions]);

  const canManagePermissions = myPermissions.can("employees.permissions");
  const canEdit = myPermissions.can("employees.edit");
  const canInvite = myPermissions.can("employees.add");

  function openOverrides(userId: string, overrides: { permission_id: string; granted: boolean }[]) {
    if (openEmployee === userId) {
      setOpenEmployee(null);
      return;
    }
    const next: Record<string, Choice> = {};
    for (const item of overrides) next[item.permission_id] = item.granted ? "allow" : "deny";
    setDraft(next);
    setOpenEmployee(userId);
  }

  function roleHasDefault(role: string, permissionId: string) {
    if (role === "owner") return true;
    return (team.data?.rolePermissions ?? []).some(
      (item) => item.role === role && item.permission_id === permissionId,
    );
  }

  const invitations = team.data?.invitations ?? [];

  return (
    <div className="grid gap-8">
      <div>
        <h1 className="display-heading text-4xl">Employees</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Give your team their own logins and decide exactly what each person can change. Nobody needs access to
          your account.
        </p>
      </div>

      {canInvite && (
        <section className="border border-border bg-card p-5">
          <h2 className="display-heading text-2xl">Add a team member</h2>
          <div className="mt-4 grid gap-3 md:grid-cols-[1fr_1fr_14rem_auto]">
            <Input
              placeholder="Full name"
              value={form.fullName}
              onChange={(event) => setForm({ ...form, fullName: event.target.value })}
            />
            <Input
              type="email"
              placeholder="name@company.com"
              value={form.email}
              onChange={(event) => setForm({ ...form, email: event.target.value })}
            />
            <select
              className="h-10 border border-border bg-background px-2 text-sm"
              value={form.role}
              onChange={(event) => setForm({ ...form, role: event.target.value as Role })}
            >
              {ROLES.map((role) => (
                <option key={role} value={role}>
                  {titleCase(role)}
                </option>
              ))}
            </select>
            <Button
              disabled={invitation.isPending || !form.email || !form.fullName}
              onClick={() => invitation.mutate()}
            >
              {invitation.isPending ? "Adding…" : "Add"}
            </Button>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            If they already have an account on your website, access starts right away. Otherwise they create their
            own login with this email address and their access activates automatically.
          </p>
          <Button
            variant="outline"
            size="sm"
            className="mt-3"
            onClick={() => {
              const link = `${window.location.origin}/auth?redirect=%2Fadmin`;
              void navigator.clipboard
                .writeText(link)
                .then(() => toast.success("Sign-up link copied"))
                .catch(() => toast.error("Could not copy the link"));
            }}
          >
            Copy sign-up link
          </Button>
        </section>
      )}

      <section>
        <h2 className="display-heading text-2xl">Team</h2>
        {team.isPending && <p className="mt-3 text-sm text-muted-foreground">Loading your team…</p>}
        {team.isError && (
          <p className="mt-3 text-sm text-destructive">
            {(team.error as Error).message || "Could not load your team."}
          </p>
        )}
        {team.data && team.data.employees.length === 0 && (
          <p className="mt-3 text-sm text-muted-foreground">No team members yet.</p>
        )}
        <div className="mt-3 grid gap-3">
          {(team.data?.employees ?? []).map((employee) => {
            const profile = employee.profile;
            const status = (profile?.employee_status ?? "active") as "active" | "inactive";
            return (
              <div key={employee.id} className="border border-border bg-card p-4">
                <div className="grid gap-3 md:grid-cols-[1fr_14rem_10rem_auto] md:items-center">
                  <div>
                    <p className="font-semibold">{profile?.full_name ?? profile?.email ?? "Employee"}</p>
                    <p className="text-sm text-muted-foreground">{profile?.email}</p>
                    <p className="text-xs text-muted-foreground">
                      {status === "active" ? "Active" : "Deactivated"}
                      {profile?.last_login_at
                        ? ` · last signed in ${new Date(profile.last_login_at).toLocaleDateString()}`
                        : ""}
                    </p>
                  </div>
                  <select
                    className="h-10 border border-border bg-background px-2 text-sm"
                    value={employee.role}
                    disabled={!canEdit || employeeUpdate.isPending}
                    onChange={(event) =>
                      employeeUpdate.mutate({
                        userId: employee.user_id,
                        role: event.target.value as Role,
                        status,
                      })
                    }
                  >
                    {ROLES.map((role) => (
                      <option key={role} value={role}>
                        {titleCase(role)}
                      </option>
                    ))}
                  </select>
                  <Button
                    variant="outline"
                    disabled={!canEdit || employeeUpdate.isPending}
                    onClick={() =>
                      employeeUpdate.mutate({
                        userId: employee.user_id,
                        role: employee.role as Role,
                        status: status === "active" ? "inactive" : "active",
                      })
                    }
                  >
                    {status === "active" ? "Deactivate" : "Activate"}
                  </Button>
                  {canManagePermissions && (
                    <Button
                      variant="ghost"
                      onClick={() =>
                        openOverrides(
                          employee.user_id,
                          employee.overrides.map((item) => ({
                            permission_id: item.permission_id,
                            granted: item.granted,
                          })),
                        )
                      }
                    >
                      {openEmployee === employee.user_id ? "Close access" : "Access"}
                    </Button>
                  )}
                </div>

                {canManagePermissions && openEmployee === employee.user_id && (
                  <div className="mt-4 border-t border-border pt-4">
                    {employee.role === "owner" ? (
                      <p className="text-sm text-muted-foreground">
                        Owners always have full access, so there is nothing to limit here.
                      </p>
                    ) : (
                      <>
                        <p className="text-sm text-muted-foreground">
                          Each item follows the role default unless you allow or deny it for this person.
                        </p>
                        <div className="mt-4 grid gap-5">
                          {permissionsByArea.map(([area, items]) => (
                            <div key={area}>
                              <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                                {AREA_LABELS[area] ?? titleCase(area)}
                              </p>
                              <div className="mt-2 grid gap-2">
                                {items.map((permission) => {
                                  const choice = draft[permission.id] ?? "default";
                                  const fallback = roleHasDefault(employee.role, permission.id);
                                  return (
                                    <div
                                      key={permission.id}
                                      className="flex flex-wrap items-center justify-between gap-2 border border-border px-3 py-2"
                                    >
                                      <div className="min-w-0">
                                        <p className="text-sm font-medium">{permission.name}</p>
                                        <p className="text-xs text-muted-foreground">{permission.description}</p>
                                      </div>
                                      <div className="flex gap-1">
                                        {(["default", "allow", "deny"] as Choice[]).map((option) => (
                                          <Button
                                            key={option}
                                            size="sm"
                                            variant={choice === option ? "default" : "outline"}
                                            onClick={() =>
                                              setDraft((prev) => ({ ...prev, [permission.id]: option }))
                                            }
                                          >
                                            {option === "default"
                                              ? `Role default (${fallback ? "allowed" : "denied"})`
                                              : option === "allow"
                                                ? "Allow"
                                                : "Deny"}
                                          </Button>
                                        ))}
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          ))}
                        </div>
                        <Button
                          className="mt-4"
                          disabled={employeeUpdate.isPending}
                          onClick={() =>
                            employeeUpdate.mutate({
                              userId: employee.user_id,
                              role: employee.role as Role,
                              status,
                              overrides: Object.entries(draft)
                                .filter(([, value]) => value !== "default")
                                .map(([permissionId, value]) => ({
                                  permissionId,
                                  granted: value === "allow",
                                })),
                            })
                          }
                        >
                          {employeeUpdate.isPending ? "Saving…" : "Save access"}
                        </Button>
                      </>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      <section>
        <h2 className="display-heading text-2xl">Invitations</h2>
        {invitations.length === 0 && <p className="mt-3 text-sm text-muted-foreground">No invitations yet.</p>}
        <div className="mt-3 grid gap-2">
          {invitations.map((item) => (
            <div
              key={item.id}
              className="flex flex-wrap items-center justify-between gap-3 border border-border p-3 text-sm"
            >
              <div>
                <span className="font-semibold">{item.full_name ?? item.email}</span> · {item.email} ·{" "}
                {titleCase(item.role)}
                <span className="ml-2 text-xs uppercase tracking-widest text-muted-foreground">{item.status}</span>
              </div>
              {canInvite && item.status !== "accepted" && (
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={invitationUpdate.isPending}
                    onClick={() => invitationUpdate.mutate({ invitationId: item.id, action: "extend" })}
                  >
                    Renew
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    disabled={invitationUpdate.isPending}
                    onClick={() => invitationUpdate.mutate({ invitationId: item.id, action: "revoke" })}
                  >
                    Revoke
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
