import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Search, MapPin, Clock, ShieldCheck, Sparkles, ArrowRight } from "lucide-react";
import { fetchProviders } from "@/lib/providers";
import { formatPkr } from "@/lib/format";
import { RatingStars } from "@/components/rating-stars";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "QuickServe — Book trusted local pros in Pakistan" },
      {
        name: "description",
        content:
          "Find verified electricians, plumbers, tutors, cleaners and more in Karachi, Lahore and Islamabad. Book in minutes, track the job, and review when it's done.",
      },
      { property: "og:title", content: "QuickServe — Book trusted local pros in Pakistan" },
      {
        property: "og:description",
        content: "Verified home-service professionals across Pakistan. Book, track and review in one place.",
      },
    ],
  }),
  component: Index,
});

function Index() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<string | null>(null);
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["providers"],
    queryFn: fetchProviders,
  });

  const categories = useMemo(
    () => Array.from(new Set((data ?? []).map((p) => p.category))).sort(),
    [data],
  );

  const results = useMemo(() => {
    const q = search.trim().toLowerCase();
    return (data ?? []).filter((p) => {
      if (category && p.category !== category) return false;
      if (!q) return true;
      return [p.full_name, p.category, p.headline, p.area, ...p.skills]
        .join(" ")
        .toLowerCase()
        .includes(q);
    });
  }, [data, search, category]);

  return (
    <div>
      <section className="relative overflow-hidden border-b border-border">
        <div
          aria-hidden
          className="pointer-events-none absolute -right-24 -top-32 size-[28rem] rounded-full bg-accent/15 blur-3xl"
        />
        <div className="relative mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24">
          <p className="eyebrow">Pakistan&apos;s local services marketplace</p>
          <h1 className="mt-4 max-w-3xl font-display text-4xl font-semibold leading-[1.05] tracking-tight sm:text-6xl">
            Hire trusted pros across Karachi, Lahore &amp; Islamabad.
          </h1>
          <p className="mt-5 max-w-xl text-base leading-relaxed text-muted-foreground">
            No more chasing numbers on WhatsApp. Search a verified professional, book a slot, follow the job
            live, and leave a review when it&apos;s done.
          </p>

          <div className="mt-8 flex max-w-xl items-center gap-2 rounded-2xl border border-border bg-card p-2 shadow-[var(--shadow-card)]">
            <Search className="ml-2 size-5 shrink-0 text-muted-foreground" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Try 'electrician', 'tutor' or 'Gulberg'"
              aria-label="Search services"
              className="w-full bg-transparent px-1 py-2 text-sm outline-none placeholder:text-muted-foreground"
            />
          </div>

          <div className="mt-6 flex flex-wrap gap-2">
            <Chip active={category === null} onClick={() => setCategory(null)}>
              All services
            </Chip>
            {categories.map((c) => (
              <Chip key={c} active={category === c} onClick={() => setCategory(c)}>
                {c}
              </Chip>
            ))}
          </div>

          <div className="mt-10 flex flex-wrap gap-x-8 gap-y-3 text-sm text-muted-foreground">
            <span className="inline-flex items-center gap-2">
              <ShieldCheck className="size-4 text-success" /> Verified professionals
            </span>
            <span className="inline-flex items-center gap-2">
              <Clock className="size-4 text-accent" /> Same-day availability
            </span>
            <span className="inline-flex items-center gap-2">
              <Sparkles className="size-4 text-gold" /> Rated by real customers
            </span>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
        <div className="flex items-end justify-between gap-4">
          <h2 className="font-display text-2xl font-semibold tracking-tight sm:text-3xl">
            {category ?? "Available"} professionals
          </h2>
          {!isLoading && !isError && (
            <p className="text-sm text-muted-foreground">
              {results.length} {results.length === 1 ? "pro" : "pros"} found
            </p>
          )}
        </div>

        {isLoading && (
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="card-surface h-64 animate-pulse bg-muted/60" />
            ))}
          </div>
        )}

        {isError && (
          <div className="card-surface mt-8 p-8 text-center">
            <p className="text-sm text-muted-foreground">We couldn&apos;t load professionals right now.</p>
            <button onClick={() => refetch()} className="btn-outline mt-4">
              Try again
            </button>
          </div>
        )}

        {!isLoading && !isError && results.length === 0 && (
          <div className="card-surface mt-8 p-10 text-center">
            <p className="font-display text-lg">No matches for &ldquo;{search}&rdquo;</p>
            <p className="mt-2 text-sm text-muted-foreground">
              Try a different service or clear the filters.
            </p>
            <button
              onClick={() => {
                setSearch("");
                setCategory(null);
              }}
              className="btn-outline mt-5"
            >
              Clear search
            </button>
          </div>
        )}

        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {results.map((p) => (
            <Link
              key={p.id}
              to="/provider/$id"
              params={{ id: p.id }}
              className="card-surface card-lift group flex flex-col overflow-hidden"
            >
              <div className="flex items-center gap-4 p-5">
                <img
                  src={p.avatar_url ?? "/images/provider-marcus.jpg"}
                  alt={`${p.full_name}, ${p.category}`}
                  loading="lazy"
                  className="size-16 rounded-2xl object-cover"
                />
                <div className="min-w-0">
                  <p className="truncate font-display text-lg font-semibold">{p.full_name}</p>
                  <p className="text-xs font-semibold uppercase tracking-[0.12em] text-accent">
                    {p.category}
                  </p>
                  <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                    <MapPin className="size-3" /> {p.area}
                  </p>
                </div>
              </div>
              <div className="flex-1 px-5">
                <p className="line-clamp-2 text-sm text-muted-foreground">{p.headline}</p>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {p.skills.slice(0, 3).map((s) => (
                    <span
                      key={s}
                      className="rounded-full bg-muted px-2.5 py-1 text-[11px] text-muted-foreground"
                    >
                      {s}
                    </span>
                  ))}
                </div>
              </div>
              <div className="mt-5 flex items-center justify-between border-t border-border px-5 py-4">
                <div>
                  <p className="font-display text-lg font-semibold">
                    {formatPkr(p.hourly_rate)}
                    <span className="text-xs font-normal text-muted-foreground">/hr</span>
                  </p>
                  {p.rating ? (
                    <span className="mt-1 flex items-center gap-1.5">
                      <RatingStars value={p.rating} />
                      <span className="text-xs text-muted-foreground">({p.review_count})</span>
                    </span>
                  ) : (
                    <span className="text-xs text-muted-foreground">New on QuickServe</span>
                  )}
                </div>
                <span className="inline-flex items-center gap-1 text-sm font-semibold text-accent">
                  View
                  <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={
        active
          ? "rounded-full border border-primary bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
          : "rounded-full border border-border bg-card px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
      }
    >
      {children}
    </button>
  );
}
