import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CalendarDays, Clock, MapPin, Loader2, Check } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { formatDate, formatTime } from "@/lib/format";
import { StatusPill, type BookingStatus } from "@/components/status-pill";
import { RatingStars, StarPicker } from "@/components/rating-stars";
import { useProfile, useSession } from "@/hooks/use-session";
import { useRealtimeBookings } from "@/hooks/use-realtime-bookings";

export const Route = createFileRoute("/_authenticated/bookings")({
  head: () => ({
    meta: [
      { title: "My bookings — QuickServe Pakistan" },
      {
        name: "description",
        content: "Track your QuickServe service requests across Pakistan and rate professionals once the job is done.",
      },
      { property: "og:title", content: "My bookings — QuickServe Pakistan" },
      {
        property: "og:description",
        content: "Live status for every request you've sent, plus 1–5 star reviews for completed jobs.",
      },
    ],
  }),
  component: BookingsPage,
});

type BookingRow = {
  id: string;
  booking_number: string;
  service_category: string;
  description: string;
  booking_date: string;
  booking_time: string;
  location: string;
  status: BookingStatus;
  created_at: string;
  provider_id: string;
  provider_profile_id: string;
  profiles: { full_name: string; avatar_url: string | null } | null;
};

type ReviewRow = { id: string; booking_id: string; rating: number; comment: string };

async function fetchMyBookings(customerId: string) {
  const [{ data, error }, { data: reviews, error: reviewError }] = await Promise.all([
    supabase
      .from("bookings")
      .select(
        "id, booking_number, service_category, description, booking_date, booking_time, location, status, created_at, provider_id, provider_profile_id, profiles!bookings_provider_id_fkey(full_name, avatar_url)",
      )
      .eq("customer_id", customerId)
      .order("created_at", { ascending: false }),
    supabase.from("reviews").select("id, booking_id, rating, comment").eq("customer_id", customerId),
  ]);
  if (error) throw error;
  if (reviewError) throw reviewError;
  return {
    bookings: (data ?? []) as unknown as BookingRow[],
    reviews: (reviews ?? []) as ReviewRow[],
  };
}

const TIMELINE: { key: BookingStatus; label: string }[] = [
  { key: "pending", label: "Requested" },
  { key: "accepted", label: "Accepted" },
  { key: "in_progress", label: "In progress" },
  { key: "completed", label: "Completed" },
];

function BookingsPage() {
  const session = useSession();
  const userId = session?.user?.id;
  const { data: profile } = useProfile(userId);
  useRealtimeBookings(userId);

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["bookings", "customer", userId],
    enabled: !!userId,
    queryFn: () => fetchMyBookings(userId!),
  });

  if (profile?.role === "provider") {
    return (
      <div className="mx-auto max-w-2xl px-4 py-24 text-center sm:px-6">
        <h1 className="font-display text-2xl font-semibold">This page is for customers</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Your incoming job requests live on the provider dashboard.
        </p>
        <Link to="/dashboard" className="btn-primary mt-6">
          Go to dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 sm:py-14">
      <p className="eyebrow">Your requests</p>
      <h1 className="mt-1 font-display text-3xl font-semibold tracking-tight sm:text-4xl">My bookings</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Every request you&apos;ve sent, updating live as your professional accepts and works on the job.
      </p>

      {isLoading || !userId ? (
        <div className="mt-8 space-y-4">
          {[0, 1, 2].map((i) => (
            <div key={i} className="card-surface h-40 animate-pulse bg-muted/60" />
          ))}
        </div>
      ) : isError ? (
        <div className="card-surface mt-8 p-6">
          <p className="font-semibold text-destructive">Couldn&apos;t load your bookings</p>
          <p className="mt-1 text-sm text-muted-foreground">{(error as Error).message}</p>
          <button className="btn-outline mt-4" onClick={() => refetch()}>
            Try again
          </button>
        </div>
      ) : !data?.bookings.length ? (
        <div className="card-surface mt-8 p-10 text-center">
          <h2 className="font-display text-xl font-semibold">No bookings yet</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Find an electrician, plumber or tutor near you and send your first request.
          </p>
          <Link to="/" className="btn-primary mt-6">
            Find a professional
          </Link>
        </div>
      ) : (
        <ul className="mt-8 space-y-5">
          {data.bookings.map((b) => (
            <li key={b.id}>
              <BookingCard booking={b} review={data.reviews.find((r) => r.booking_id === b.id) ?? null} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function BookingCard({ booking, review }: { booking: BookingRow; review: ReviewRow | null }) {
  const rejected = booking.status === "rejected";
  const activeIndex = TIMELINE.findIndex((s) => s.key === booking.status);

  return (
    <article className="card-surface overflow-hidden">
      <div className="flex flex-wrap items-start justify-between gap-4 p-6">
        <div className="flex items-start gap-4">
          <img
            src={booking.profiles?.avatar_url ?? "/images/provider-marcus.jpg"}
            alt={booking.profiles?.full_name ?? "Provider"}
            className="size-14 rounded-2xl object-cover"
          />
          <div>
            <p className="eyebrow">{booking.service_category}</p>
            <h2 className="mt-0.5 font-display text-xl font-semibold tracking-tight">
              {booking.profiles?.full_name ?? "QuickServe pro"}
            </h2>
            <p className="mt-1 font-mono text-xs text-muted-foreground">{booking.booking_number}</p>
          </div>
        </div>
        <StatusPill status={booking.status} />
      </div>

      <div className="grid gap-3 border-t border-border px-6 py-5 text-sm text-muted-foreground sm:grid-cols-3">
        <span className="inline-flex items-center gap-2">
          <CalendarDays className="size-4" /> {formatDate(booking.booking_date)}
        </span>
        <span className="inline-flex items-center gap-2">
          <Clock className="size-4" /> {formatTime(booking.booking_time)}
        </span>
        <span className="inline-flex items-center gap-2">
          <MapPin className="size-4" /> {booking.location}
        </span>
      </div>

      <p className="border-t border-border px-6 py-5 text-sm leading-relaxed">{booking.description}</p>

      <div className="border-t border-border px-6 py-5">
        {rejected ? (
          <p className="text-sm text-destructive">
            This request was declined. You can book another professional any time.
          </p>
        ) : (
          <ol className="flex items-center gap-2">
            {TIMELINE.map((step, i) => {
              const done = i <= activeIndex;
              return (
                <li key={step.key} className="flex flex-1 items-center gap-2">
                  <div className="flex flex-1 flex-col gap-2">
                    <div className="flex items-center gap-2">
                      <span
                        className={
                          done
                            ? "grid size-6 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground"
                            : "grid size-6 shrink-0 place-items-center rounded-full border border-border text-muted-foreground"
                        }
                      >
                        {done ? <Check className="size-3.5" /> : <span className="text-[10px]">{i + 1}</span>}
                      </span>
                      {i < TIMELINE.length - 1 && (
                        <span
                          className={`h-0.5 flex-1 rounded-full ${i < activeIndex ? "bg-primary" : "bg-border"}`}
                        />
                      )}
                    </div>
                    <span
                      className={`text-[11px] font-medium uppercase tracking-[0.06em] ${
                        done ? "text-foreground" : "text-muted-foreground"
                      }`}
                    >
                      {step.label}
                    </span>
                  </div>
                </li>
              );
            })}
          </ol>
        )}
      </div>

      {booking.status === "completed" && (
        <div className="border-t border-border bg-muted/40 px-6 py-5">
          {review ? (
            <div>
              <p className="text-sm font-semibold">Your review</p>
              <div className="mt-2 flex items-center gap-3">
                <RatingStars value={review.rating} size="md" />
                <span className="text-sm text-muted-foreground">{review.rating}/5</span>
              </div>
              {review.comment && <p className="mt-2 text-sm text-muted-foreground">{review.comment}</p>}
            </div>
          ) : (
            <ReviewForm bookingId={booking.id} providerId={booking.provider_id} />
          )}
        </div>
      )}
    </article>
  );
}

function ReviewForm({ bookingId, providerId }: { bookingId: string; providerId: string }) {
  const session = useSession();
  const queryClient = useQueryClient();
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [error, setError] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: async () => {
      const { error: insertError } = await supabase.from("reviews").insert({
        booking_id: bookingId,
        customer_id: session!.user.id,
        provider_id: providerId,
        rating,
        comment: comment.trim(),
      });
      if (insertError) throw insertError;
    },
    onSuccess: () => {
      toast.success("Thanks for your review!");
      queryClient.invalidateQueries({ queryKey: ["bookings"] });
      queryClient.invalidateQueries({ queryKey: ["reviews"] });
    },
    onError: (e: Error) =>
      setError(
        e.message.includes("duplicate")
          ? "You've already reviewed this job."
          : e.message,
      ),
  });

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (rating < 1 || rating > 5) {
      setError("Pick a rating from 1 to 5 stars.");
      return;
    }
    mutation.mutate();
  }

  return (
    <form onSubmit={submit}>
      <p className="text-sm font-semibold">Rate this job</p>
      <div className="mt-2">
        <StarPicker value={rating} onChange={setRating} disabled={mutation.isPending} />
      </div>
      <textarea
        className="field mt-3 min-h-20"
        placeholder="How did it go? (optional)"
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        maxLength={500}
      />
      {error && <p className="mt-2 text-sm text-destructive">{error}</p>}
      <button className="btn-primary mt-3" disabled={mutation.isPending}>
        {mutation.isPending && <Loader2 className="size-4 animate-spin" />}
        Submit review
      </button>
    </form>
  );
}
