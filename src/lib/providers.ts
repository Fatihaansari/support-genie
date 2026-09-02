import { supabase } from "@/integrations/supabase/client";

export type ProviderCard = {
  id: string;
  user_id: string;
  category: string;
  headline: string;
  bio: string;
  hourly_rate: number;
  skills: string[];
  area: string;
  response_time: string;
  full_name: string;
  avatar_url: string | null;
  rating: number | null;
  review_count: number;
};

type ProviderRow = {
  id: string;
  user_id: string;
  category: string;
  headline: string;
  bio: string;
  hourly_rate: number;
  skills: string[];
  area: string;
  response_time: string;
  profiles: { full_name: string; avatar_url: string | null } | null;
};

const SELECT = "id, user_id, category, headline, bio, hourly_rate, skills, area, response_time, profiles!provider_profiles_user_id_fkey(full_name, avatar_url)";

export async function fetchProviders(): Promise<ProviderCard[]> {
  const [{ data, error }, { data: reviews }] = await Promise.all([
    supabase.from("provider_profiles").select(SELECT).order("created_at", { ascending: true }),
    supabase.from("reviews").select("provider_id, rating"),
  ]);
  if (error) throw error;

  const stats = new Map<string, { total: number; count: number }>();
  for (const r of reviews ?? []) {
    const s = stats.get(r.provider_id) ?? { total: 0, count: 0 };
    s.total += r.rating;
    s.count += 1;
    stats.set(r.provider_id, s);
  }

  return ((data ?? []) as unknown as ProviderRow[]).map((row) => {
    const s = stats.get(row.user_id);
    return {
      ...row,
      full_name: row.profiles?.full_name ?? "QuickServe pro",
      avatar_url: row.profiles?.avatar_url ?? null,
      rating: s ? s.total / s.count : null,
      review_count: s?.count ?? 0,
      profiles: undefined,
    } as ProviderCard;
  });
}

export async function fetchProvider(id: string): Promise<ProviderCard | null> {
  const { data, error } = await supabase.from("provider_profiles").select(SELECT).eq("id", id).maybeSingle();
  if (error) throw error;
  if (!data) return null;
  const row = data as unknown as ProviderRow;
  const { data: reviews } = await supabase.from("reviews").select("rating").eq("provider_id", row.user_id);
  const count = reviews?.length ?? 0;
  return {
    ...row,
    full_name: row.profiles?.full_name ?? "QuickServe pro",
    avatar_url: row.profiles?.avatar_url ?? null,
    rating: count ? (reviews ?? []).reduce((a, r) => a + r.rating, 0) / count : null,
    review_count: count,
  } as ProviderCard;
}

export async function fetchProviderReviews(providerUserId: string) {
  const { data, error } = await supabase
    .from("reviews")
    .select("id, rating, comment, created_at, customer_id, profiles!reviews_customer_id_fkey(full_name)")
    .eq("provider_id", providerUserId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as unknown as Array<{
    id: string;
    rating: number;
    comment: string;
    created_at: string;
    profiles: { full_name: string } | null;
  }>;
}
