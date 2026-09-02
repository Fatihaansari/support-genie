import { useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { MapPin, Clock, Loader2, CalendarCheck } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { fetchProvider, fetchProviderReviews } from "@/lib/providers";
import { formatPkr, PK_CITIES } from "@/lib/format";
import { RatingStars } from "@/components/rating-stars";
import { useProfile, useSession } from "@/hooks/use-session";

export const Route = createFileRoute("/provider/$id")({
  head: () => ({
    meta: [
      { title: "Provider profile — QuickServe Pakistan" },
      {
        name: "description",
        content: "See rates, skills, service area and customer reviews, then book this professional.",
      },
      { property: "og:title", content: "Provider profile — QuickServe Pakistan" },
      {
        property: "og:description",
        content: "Rates, skills, service area and reviews for a verified QuickServe professional.",
      },
    ],
  }),
  component: ProviderPage,
});

function ProviderPage() {
  const { id } = Route.useParams();
  const { data: provider, isLoading, isError } = useQuery({
    queryKey: ["provider", id],
    queryFn: () => fetchProvider(id),
  });
  const { data: reviews } = useQuery({
    queryKey: ["reviews", provider?.user_id],
    enabled: !!provider?.user_id,
    queryFn: () => fetchProviderReviews(provider!.user_id),
  });

  if (isLoading) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <div className="card-surface h-72 animate-pulse bg-muted/60" />
      </div>
    );
  }

  if (isError || !provider) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-24 text-center sm:px-6">
        <h1 className="font-display text-2xl font-semibold">Provider not found</h1>
        <p className="mt-2 text-sm text-muted-foreground">This listing may have been removed.</p>
        <Link to="/" className="btn-primary mt-6">
          Browse professionals
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
      <div className="grid gap-8 lg:grid-cols-[1.6fr_1fr]">
        <div>
          <div className="card-surface overflow-hidden">
            <div className="flex flex-col gap-5 p-6 sm:flex-row sm:items-center">
              <img
                src={provider.avatar_url ?? "/images/provider-marcus.jpg"}
                alt={`${provider.full_name}, ${provider.category}`}
                className="size-24 rounded-2xl object-cover"
              />
              <div>
                <p className="eyebrow">{provider.category}</p>
                <h1 className="mt-1 font-display text-3xl font-semibold tracking-tight">
                  {provider.full_name}
                </h1>
                <p className="mt-1 text-sm text-muted-foreground">{provider.headline}</p>
                <div className="mt-3 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                  <span className="inline-flex items-center gap-1.5">
                    <MapPin className="size-4" /> {provider.area}
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <Clock className="size-4" /> Replies {provider.response_time}
                  </span>
                  {provider.rating && (
                    <span className="inline-flex items-center gap-1.5">
                      <RatingStars value={provider.rating} />
                      {provider.rating.toFixed(1)} ({provider.review_count})
                    </span>
                  )}
                </div>
              </div>
            </div>
            <div className="border-t border-border p-6">
              <h2 className="font-display text-lg font-semibold">About</h2>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {provider.bio || "This professional hasn't added a bio yet."}
              </p>
              <div className="mt-5 flex flex-wrap gap-2">
                {provider.skills.map((s) => (
                  <span key={s} className="rounded-full bg-muted px-3 py-1.5 text-xs text-muted-foreground">
                    {s}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-8">
            <h2 className="font-display text-2xl font-semibold tracking-tight">Customer reviews</h2>
            {!reviews?.length ? (
              <p className="mt-3 text-sm text-muted-foreground">No reviews yet.</p>
            ) : (
              <ul className="mt-4 space-y-4">
                {reviews.map((r) => (
                  <li key={r.id} className="card-surface p-5">
                    <div className="flex items-center justify-between gap-3">
                      <p className="font-semibold">{r.profiles?.full_name ?? "Customer"}</p>
                      <RatingStars value={r.rating} />
                    </div>
                    {r.comment && <p className="mt-2 text-sm text-muted-foreground">{r.comment}</p>}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <BookingPanel
          providerProfileId={provider.id}
          providerUserId={provider.user_id}
          category={provider.category}
          rate={provider.hourly_rate}
        />
      </div>
    </div>
  );
}

function BookingPanel({
  providerProfileId,
  providerUserId,
  category,
  rate,
}: {
  providerProfileId: string;
  providerUserId: string;
  category: string;
  rate: number;
}) {
  const session = useSession();
  const { data: profile } = useProfile(session?.user?.id);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [city, setCity] = useState<string>("Lahore");
  const [address, setAddress] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: async () => {
      const { error: insertError } = await supabase.from("bookings").insert({
        customer_id: session!.user.id,
        provider_id: providerUserId,
        provider_profile_id: providerProfileId,
        service_category: category,
        description: description.trim(),
        booking_date: date,
        booking_time: time,
        location: `${address.trim()}, ${city}`,
      });
      if (insertError) throw insertError;
    },
    onSuccess: () => {
      toast.success("Booking request sent", { description: "You'll be notified when it's accepted." });
      queryClient.invalidateQueries({ queryKey: ["bookings"] });
      navigate({ to: "/bookings" });
    },
    onError: (e: Error) => setError(e.message),
  });

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!date || !time || !address.trim() || !description.trim()) {
      setError("Date, time, address and a short description are all required.");
      return;
    }
    if (new Date(`${date}T${time}`) < new Date()) {
      setError("Pick a date and time in the future.");
      return;
    }
    mutation.mutate();
  }

  return (
    <aside className="lg:sticky lg:top-24 lg:h-fit">
      <div className="card-surface p-6">
        <p className="font-display text-2xl font-semibold">
          {formatPkr(rate)}
          <span className="text-sm font-normal text-muted-foreground">/hour</span>
        </p>

        {session === undefined ? (
          <div className="mt-6 h-40 animate-pulse rounded-xl bg-muted/60" />
        ) : !session ? (
          <>
            <p className="mt-3 text-sm text-muted-foreground">
              Sign in as a customer to send a booking request.
            </p>
            <Link to="/auth" className="btn-primary mt-5 w-full">
              Sign in to book
            </Link>
          </>
        ) : profile?.role === "provider" ? (
          <p className="mt-3 text-sm text-muted-foreground">
            You&apos;re signed in as a provider. Switch to a customer account to book services.
          </p>
        ) : (
          <form onSubmit={submit} className="mt-5 space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="field-label" htmlFor="date">
                  Date
                </label>
                <input
                  id="date"
                  type="date"
                  className="field"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="field-label" htmlFor="time">
                  Time
                </label>
                <input
                  id="time"
                  type="time"
                  className="field"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  required
                />
              </div>
            </div>
            <div>
              <label className="field-label" htmlFor="city">
                City
              </label>
              <select id="city" className="field" value={city} onChange={(e) => setCity(e.target.value)}>
                {PK_CITIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="field-label" htmlFor="address">
                Address
              </label>
              <input
                id="address"
                className="field"
                placeholder="House 24, Street 7, Gulberg III"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="field-label" htmlFor="desc">
                What do you need?
              </label>
              <textarea
                id="desc"
                rows={4}
                className="field resize-none"
                placeholder="Two ceiling fans need rewiring and one switchboard replaced."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
              />
            </div>

            {error && (
              <p role="alert" className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {error}
              </p>
            )}

            <button type="submit" disabled={mutation.isPending} className="btn-accent w-full">
              {mutation.isPending ? (
                <>
                  <Loader2 className="size-4 animate-spin" /> Sending…
                </>
              ) : (
                <>
                  <CalendarCheck className="size-4" /> Request booking
                </>
              )}
            </button>
            <p className="text-center text-xs text-muted-foreground">
              You only pay after the job is marked complete.
            </p>
          </form>
        )}
      </div>
    </aside>
  );
}
