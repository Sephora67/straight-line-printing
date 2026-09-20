import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/account")({
  component: AccountLayout,
});

function AccountLayout() {
  // Required: /account and /account/requests/... render here.
  return <Outlet />;
}
