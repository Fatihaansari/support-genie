import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CalendarDays, Clock, MapPin, Loader2, Star, Wallet, ClipboardList, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { formatDate, formatTime, formatPkr } from "@/lib/format";
import { StatusPill, type BookingStatus } from "@/components/status-pill";
import { useProfile, useSession } from "@/hooks/use-session";
import { useRealtimeBookings } from "@/hooks/use-realtime-bookings";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Provider dashboard — QuickServe Pakistan" },
      {
        name: "description",
        content: "Manage incoming job requests, accept work and update job status across Pakistan.",
      },
      { property: "og:title", content: "Provider dashboard — QuickServe Pakistan" },
      {
        property: "og:description",
        content: "Your QuickServe request queue with accept, start and complete actions.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: DashboardPage,
});

type JobRow = {
  id: string;
  booking_number: string;
  service_category: string;
  description: string;
  booking_date: string;
  booking_time: string;
  location: string;
  status: BookingStatus;
  created_at: string;
  customer_id: string;
  profiles: { full_name: string; avatar_url: string | null } | null;
};

async function fetchJobs(providerId: string) {
  const [{ data, error }, { data: reviews }, { data: listing }] = await Promise.all([
    supabase
      .from("bookings")
      .select(
        "id, booking_number, service_category, description, booking_date, booking_time, location, status, created_at, customer_id, profiles!bookings_customer_id_fkey(full_name, avatar_url)",
      )
      .eq("provider_id", providerId)
      .order("created_at", { ascending: false }),
    supabase.from("reviews").select("rating").eq("provider_id", providerId),
    supabase.from("provider_profiles").select("hourly_rate").eq("user_id", providerId).maybeSingle(),
  ]);
  if (error) throw error;
  return {
    jobs: (data ?? []) as unknown as JobRow[],
    ratings: (reviews ?? []).map((r) => r.rating as number),
    hourlyRate: (listing?.hourly_rate as number | undefined) ?? 0,
  };
}

const FILTERS: { key: "all" | BookingStatus; label: string }[] = [
  { key: "all", label: "All" },
  { key: "pending", label: "New" },
  { key: "accepted", label: "Accepted" },
  { key: "in_progress", label: "In progress" },
  { key: "completed", label: "Completed" },
  { key: "rejected", label: "Rejected" },
];

function DashboardPage() {
  const session = useSession();
  const userId = session?.user?.id;
  const { data: profile } = useProfile(userId);
  const [filter, setFilter] = useState<"all" | BookingStatus>("all");
  useRealtimeBookings(userId, { notifyOnNew: true });

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["bookings", "provider", userId],
    enabled: !!userId,
    queryFn: () => fetchJobs(userId!),
  });

  const stats = useMemo(() => {
    const jobs = data?.jobs ?? [];
    const completed = jobs.filter((j) => j.status === "completed").length;
    const ratings = data?.ratings ?? [];
    return {
      pending: jobs.filter((j) => j.status === "pending").length,
      active: jobs.filter((j) => j.status === "accepted" || j.status === "in_progress").length,
      completed,
      earnings: completed * (data?.hourlyRate ?? 0),
      rating: ratings.length ? ratings.reduce((a, b) => a + b, 0) / ratings.length : null,
      reviewCount: ratings.length,
    };
  }, [data]);

  const jobs = useMemo(
    () => (data?.jobs ?? []).filter((j) => filter === "all" || j.status === filter),
    [data, filter],
  );

  if (profile && profile.role !== "provider") {
    return (
      <div className="mx-auto max-w-2xl px-4 py-24 text-center sm:px-6">
        <h1 className="font-display text-2xl font-semibold">This page is for professionals</h1>
        <p className="mt-2 text-sm text-muted-foreground">Your requests live on the bookings page.</p>
        <Link to="/bookings" className="btn-primary mt-6">
          My bookings
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 sm:py-14">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">Provider</p>
          <h1 className="mt-1 font-display text-3xl font-semibold tracking-tight sm:text-4xl">
            {profile?.full_name ? `Salam, ${profile.full_name.split(" ")[0]}` : "Dashboard"}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Incoming requests update live — accept, start and complete each job here.
          </p>
        </div>
        <Link to="/provider-profile" className="btn-outline">
          Edit my listing
        </Link>
      </div>

      <div className="mt-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard icon={<ClipboardList className="size-4" />} label="New requests" value={stats.pending} />
        <StatCard icon={<Clock className="size-4" />} label="Active jobs" value={stats.active} />
        <StatCard icon={<CheckCircle2 className="size-4" />} label="Completed" value={stats.completed} />
        <StatCard
          icon={<Wallet className="size-4" />}
          label="Est. earnings"
          value={formatPkr(stats.earnings)}
        />
      </div>

      {stats.rating !== null && (
        <p className="mt-4 inline-flex items-center gap-2 text-sm text-muted-foreground">
          <Star className="size-4 fill-gold text-gold" />
          {stats.rating.toFixed(1)} average from {stats.reviewCount}{" "}
          {stats.reviewCount === 1 ? "review" : "reviews"}
        </p>
      )}

      <div className="mt-8 flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={
              filter === f.key
                ? "rounded-full border border-primary bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
                : "rounded-full border border-border bg-card px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            }
          >
            {f.label}
          </button>
        ))}
      </div>

      {isLoading || !userId ? (
        <div className="mt-8 space-y-4">
          {[0, 1, 2].map((i) => (
            <div key={i} className="card-surface h-40 animate-pulse bg-muted/60" />
          ))}
        </div>
      ) : isError ? (
        <div className="card-surface mt-8 p-6">
          <p className="font-semibold text-destructive">Couldn&apos;t load your requests</p>
          <p className="mt-1 text-sm text-muted-foreground">{(error as Error).message}</p>
          <button className="btn-outline mt-4" onClick={() => refetch()}>
            Try again
          </button>
        </div>
      ) : jobs.length === 0 ? (
        <div className="card-surface mt-8 p-10 text-center">
          <h2 className="font-display text-xl font-semibold">Nothing here yet</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            New customer requests will appear here instantly — no refresh needed.
          </p>
        </div>
      ) : (
        <ul className="mt-6 space-y-5">
          {jobs.map((job) => (
            <li key={job.id}>
              <JobCard job={job} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string | number }) {
  return (
    <div className="card-surface p-5">
      <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.1em] text-muted-foreground">
        {icon} {label}
      </span>
      <p className="mt-2 font-display text-2xl font-semibold tracking-tight">{value}</p>
    </div>
  );
}

const NEXT_ACTIONS: Partial<Record<BookingStatus, { to: BookingStatus; label: string; variant: string }[]>> = {
  pending: [
    { to: "accepted", label: "Accept", variant: "btn-primary" },
    { to: "rejected", label: "Reject", variant: "btn-outline" },
  ],
  accepted: [{ to: "in_progress", label: "Start job", variant: "btn-accent" }],
  in_progress: [{ to: "completed", label: "Mark completed", variant: "btn-primary" }],
};

function JobCard({ job }: { job: JobRow }) {
  const queryClient = useQueryClient();
  const actions = NEXT_ACTIONS[job.status] ?? [];

  const mutation = useMutation({
    mutationFn: async (status: BookingStatus) => {
      const { error } = await supabase.from("bookings").update({ status }).eq("id", job.id);
      if (error) throw error;
      return status;
    },
    onSuccess: (status) => {
      toast.success(`Request ${job.booking_number} marked ${status.replace("_", " ")}`);
      queryClient.invalidateQueries({ queryKey: ["bookings"] });
    },
    onError: (e: Error) => toast.error("Couldn't update this job", { description: e.message }),
  });

  return (
    <article className="card-surface overflow-hidden">
      <div className="flex flex-wrap items-start justify-between gap-4 p-6">
        <div className="flex items-start gap-4">
          <img
            src={job.profiles?.avatar_url ?? "/images/provider-marcus.jpg"}
            alt={job.profiles?.full_name ?? "Customer"}
            loading="lazy"
            className="size-14 rounded-2xl object-cover"
          />
          <div>
            <p className="eyebrow">{job.service_category}</p>
            <h2 className="mt-0.5 font-display text-xl font-semibold tracking-tight">
              {job.profiles?.full_name ?? "QuickServe customer"}
            </h2>
            <p className="mt-1 font-mono text-xs text-muted-foreground">{job.booking_number}</p>
          </div>
        </div>
        <StatusPill status={job.status} />
      </div>

      <div className="grid gap-3 border-t border-border px-6 py-5 text-sm text-muted-foreground sm:grid-cols-3">
        <span className="inline-flex items-center gap-2">
          <CalendarDays className="size-4" /> {formatDate(job.booking_date)}
        </span>
        <span className="inline-flex items-center gap-2">
          <Clock className="size-4" /> {formatTime(job.booking_time)}
        </span>
        <span className="inline-flex items-center gap-2">
          <MapPin className="size-4" /> {job.location}
        </span>
      </div>

      <p className="border-t border-border px-6 py-5 text-sm leading-relaxed">{job.description}</p>

      {actions.length > 0 ? (
        <div className="flex flex-wrap gap-3 border-t border-border bg-muted/40 px-6 py-4">
          {actions.map((a) => (
            <button
              key={a.to}
              className={a.variant}
              disabled={mutation.isPending}
              onClick={() => mutation.mutate(a.to)}
            >
              {mutation.isPending && mutation.variables === a.to && (
                <Loader2 className="size-4 animate-spin" />
              )}
              {a.label}
            </button>
          ))}
        </div>
      ) : (
        <p className="border-t border-border bg-muted/40 px-6 py-4 text-sm text-muted-foreground">
          {job.status === "completed"
            ? "Job completed and locked. The customer can now leave a review."
            : "This request was rejected and can no longer be changed."}
        </p>
      )}
    </article>
  );
}
