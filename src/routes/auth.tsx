import { useState, useEffect } from "react";
import { createFileRoute, useNavigate, useSearch } from "@tanstack/react-router";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageHero, Section } from "@/components/site/PageHero";
import { toast } from "sonner";

const searchSchema = z.object({ redirect: z.string().optional() });

export const Route = createFileRoute("/auth")({
  validateSearch: searchSchema,
  head: () => ({
    meta: [
      { title: "Sign In | Straight Line Printing" },
      {
        name: "description",
        content: "Sign in to track orders, review quotes, approve proofs and manage your account.",
      },
      { property: "og:title", content: "Sign In | Straight Line Printing" },
      { property: "og:description", content: "Access your quotes, orders and proofs." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Auth,
});

function safePath(value: string | undefined) {
  return value && value.startsWith("/") && !value.startsWith("//") ? value : "/account";
}

function Auth() {
  const navigate = useNavigate();
  const search = useSearch({ from: "/auth" });
  const target = safePath(search.redirect);
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) navigate({ to: target, replace: true });
    });
  }, [navigate, target]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}${target}`,
            data: { full_name: name },
          },
        });
        if (error) throw error;
        toast.success("Account created", { description: "Check your email to confirm it." });
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        navigate({ to: target, replace: true });
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  async function handleGoogle() {
    setBusy(true);
    try {
      try {
        sessionStorage.setItem("post_auth_path", target);
      } catch {
        /* storage unavailable */
      }
      const result = await Promise.race([
        lovable.auth.signInWithOAuth("google", {
          redirect_uri: window.location.origin,
        }),
        new Promise<never>((_, reject) => {
          window.setTimeout(
            () => reject(new Error("Google sign-in timed out. Close the Google window and try again.")),
            90000,
          );
        }),
      ]);
      if (result.error) throw result.error;
      if (result.redirected) return;

      const { data, error } = await supabase.auth.getUser();
      if (error || !data.user) {
        throw error ?? new Error("Google returned without creating a login session.");
      }
      try {
        sessionStorage.removeItem("post_auth_path");
      } catch {
        /* storage unavailable */
      }
      window.location.assign(target);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      toast.error("Google sign-in failed", { description: message });
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <PageHero
        eyebrow="Account"
        title={mode === "signin" ? "Sign In" : "Create Account"}
        description="One login for your quotes, orders, proofs and saved designs."
      />
      <Section>
        <div className="max-w-md">
          <Button variant="outline" size="lg" className="w-full" onClick={handleGoogle} disabled={busy}>
            {busy ? "Signing in…" : "Continue with Google"}
          </Button>

          <div className="my-6 flex items-center gap-3 text-xs uppercase tracking-widest text-muted-foreground">
            <span className="h-px flex-1 bg-border" /> or <span className="h-px flex-1 bg-border" />
          </div>

          <form className="grid gap-4" onSubmit={handleSubmit}>
            {mode === "signup" && (
              <div className="grid gap-2">
                <Label htmlFor="name">Full name</Label>
                <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
              </div>
            )}
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
              />
            </div>
            <Button type="submit" size="lg" disabled={busy}>
              {mode === "signin" ? "Sign in" : "Create account"}
            </Button>
          </form>

          <button
            type="button"
            className="mt-6 text-sm text-muted-foreground underline"
            onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
          >
            {mode === "signin"
              ? "Need an account? Create one"
              : "Already have an account? Sign in"}
          </button>
        </div>
      </Section>
    </>
  );
}
