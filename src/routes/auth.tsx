import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in — QuickServe" },
      { name: "description", content: "Sign in or create your QuickServe account as a customer or service provider." },
      { property: "og:title", content: "Sign in — QuickServe" },
      { property: "og:description", content: "Sign in or create your QuickServe account." },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [role, setRole] = useState<"customer" | "provider">("customer");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  async function routeAfterLogin(userId: string) {
    const { data } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", userId)
      .single();
    const r = (data as unknown as { role: string } | null)?.role;
    navigate({ to: r === "provider" ? "/dashboard" : "/", replace: true });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === "signup") {
        if (!fullName.trim()) {
          toast.error("Please enter your name");
          return;
        }
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: { data: { full_name: fullName.trim(), role } },
        });
        if (error) throw error;
        if (!data.user) throw new Error("Signup failed");
        toast.success("Account created — welcome to QuickServe!");
        await routeAfterLogin(data.user.id);
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });
        if (error) throw error;
        toast.success("Welcome back!");
        await routeAfterLogin(data.user.id);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Authentication failed");
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogle() {
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (result.error) toast.error("Google sign-in failed");
  }

  return (
    <div className="mx-auto flex max-w-md flex-col px-4 py-14 sm:py-20">
      <p className="eyebrow text-center">QuickServe</p>
      <h1 className="mt-2 text-center font-display text-3xl font-semibold tracking-tight">
        {mode === "signin" ? "Welcome back" : "Create your account"}
      </h1>
      <p className="mt-2 text-center text-sm text-muted-foreground">
        {mode === "signin"
          ? "Sign in to book a pro or manage your jobs."
          : "Join as a customer to book help, or as a provider to get booked."}
      </p>

      <div className="card-surface mt-8 p-6 sm:p-8">
        {mode === "signup" && (
          <div className="mb-5 grid grid-cols-2 gap-2">
            {(["customer", "provider"] as const).map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setRole(r)}
                className={cn(
                  "rounded-xl border px-4 py-3 text-left transition-all",
                  role === r
                    ? "border-accent bg-accent/10 shadow-sm"
                    : "border-border bg-background hover:bg-muted",
                )}
              >
                <span className="block text-sm font-semibold capitalize">{r}</span>
                <span className="mt-0.5 block text-xs text-muted-foreground">
                  {r === "customer" ? "I need help with a job" : "I offer a service"}
                </span>
              </button>
            ))}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === "signup" && (
            <div>
              <label className="field-label" htmlFor="name">Full name</label>
              <input
                id="name"
                className="field"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Alex Morgan"
                maxLength={100}
              />
            </div>
          )}
          <div>
            <label className="field-label" htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              required
              className="field"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              maxLength={255}
            />
          </div>
          <div>
            <label className="field-label" htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              required
              minLength={6}
              className="field"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />
          </div>
          <button type="submit" disabled={loading} className="btn-primary w-full !py-3">
            {loading && <Loader2 className="size-4 animate-spin" />}
            {mode === "signin" ? "Sign in" : "Create account"}
          </button>
        </form>

        <div className="my-5 flex items-center gap-3 text-xs text-muted-foreground">
          <span className="h-px flex-1 bg-border" />
          or
          <span className="h-px flex-1 bg-border" />
        </div>

        <button onClick={handleGoogle} className="btn-outline w-full !py-3">
          <svg className="size-4" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.1a7.16 7.16 0 0 1 0-4.2V7.06H2.18a11 11 0 0 0 0 9.88l3.66-2.84z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/></svg>
          Continue with Google
        </button>

        <p className="mt-5 text-center text-sm text-muted-foreground">
          {mode === "signin" ? "New here? " : "Already have an account? "}
          <button
            type="button"
            onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
            className="font-semibold text-accent hover:underline"
          >
            {mode === "signin" ? "Create an account" : "Sign in"}
          </button>
        </p>
      </div>

      <div className="mt-6 rounded-xl border border-dashed border-border bg-muted/50 p-4 text-center text-xs leading-relaxed text-muted-foreground">
        <span className="font-semibold text-foreground">Demo accounts</span> — password{" "}
        <code className="rounded bg-background px-1.5 py-0.5 font-semibold">quickserve123</code>
        <br />
        Customer: customer@quickserve.demo · Provider: priya@quickserve.demo
      </div>
    </div>
  );
}
