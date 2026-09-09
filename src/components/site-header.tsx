import { Link, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { Wrench, LogOut } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useProfile, useSession } from "@/hooks/use-session";

export function SiteHeader() {
  const session = useSession();
  const { data: profile } = useProfile(session?.user?.id);
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  async function handleSignOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    toast.success("Signed out");
    navigate({ to: "/auth", replace: true });
  }

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link to="/" className="flex items-center gap-2.5">
          <span className="grid size-9 place-items-center rounded-xl bg-primary text-primary-foreground">
            <Wrench className="size-4" />
          </span>
          <span className="font-display text-xl font-semibold tracking-tight">QuickServe</span>
        </Link>

        <nav className="flex items-center gap-1 sm:gap-2">
          <Link
            to="/"
            className="rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            activeProps={{ className: "text-foreground" }}
          >
            Find a pro
          </Link>
          {session && profile?.role === "customer" && (
            <Link
              to="/bookings"
              className="rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
              activeProps={{ className: "text-foreground" }}
            >
              My bookings
            </Link>
          )}
          {session && profile?.role === "provider" && (
            <Link
              to="/dashboard"
              className="rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
              activeProps={{ className: "text-foreground" }}
            >
              Dashboard
            </Link>
          )}
          {session && profile?.role === "provider" && (
            <Link
              to="/provider-profile"
              className="hidden rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground sm:block"
              activeProps={{ className: "text-foreground" }}
            >
              My listing
            </Link>
          )}
          {session === undefined ? (
            <span className="size-9" />
          ) : session ? (
            <button
              onClick={handleSignOut}
              className="btn-outline ml-1 !px-3 !py-2"
              title={`Sign out (${profile?.full_name ?? session.user.email})`}
            >
              <LogOut className="size-4" />
              <span className="hidden sm:inline">Sign out</span>
            </button>
          ) : (
            <Link to="/auth" className="btn-primary ml-1 !px-4 !py-2">
              Sign in
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
