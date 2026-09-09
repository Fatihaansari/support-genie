import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { CATEGORIES, PK_CITIES, formatPkr } from "@/lib/format";
import { useProfile, useSession } from "@/hooks/use-session";

export const Route = createFileRoute("/_authenticated/provider-profile")({
  head: () => ({
    meta: [
      { title: "Edit my listing — QuickServe Pakistan" },
      {
        name: "description",
        content:
          "Update your QuickServe listing: service category, headline, skills, area and hourly rate in PKR.",
      },
      { property: "og:title", content: "Edit my listing — QuickServe Pakistan" },
      {
        property: "og:description",
        content: "Keep your QuickServe professional profile accurate so customers can book you.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ProviderProfilePage,
});

type Listing = {
  id?: string;
  category: string;
  headline: string;
  bio: string;
  hourly_rate: number;
  skills: string[];
  area: string;
  response_time: string;
};

const EMPTY: Listing = {
  category: CATEGORIES[0],
  headline: "",
  bio: "",
  hourly_rate: 1000,
  skills: [],
  area: PK_CITIES[0],
  response_time: "Within 1 hour",
};

function ProviderProfilePage() {
  const session = useSession();
  const userId = session?.user?.id;
  const { data: profile } = useProfile(userId);
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["provider-listing", userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("provider_profiles")
        .select("id, category, headline, bio, hourly_rate, skills, area, response_time")
        .eq("user_id", userId!)
        .maybeSingle();
      if (error) throw error;
      return (data as unknown as Listing) ?? null;
    },
  });

  const [form, setForm] = useState<Listing>(EMPTY);
  const [skillsText, setSkillsText] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (data) {
      setForm(data);
      setSkillsText(data.skills.join(", "));
    }
  }, [data]);

  const save = useMutation({
    mutationFn: async (payload: Listing) => {
      const row = {
        user_id: userId!,
        category: payload.category,
        headline: payload.headline.trim(),
        bio: payload.bio.trim(),
        hourly_rate: payload.hourly_rate,
        skills: payload.skills,
        area: payload.area.trim(),
        response_time: payload.response_time.trim(),
      };
      const { error } = data?.id
        ? await supabase.from("provider_profiles").update(row).eq("id", data.id)
        : await supabase.from("provider_profiles").insert(row);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Listing saved", { description: "Customers will see your updated profile." });
      queryClient.invalidateQueries({ queryKey: ["provider-listing"] });
      queryClient.invalidateQueries({ queryKey: ["providers"] });
    },
    onError: (e: Error) => toast.error("Couldn't save your listing", { description: e.message }),
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const skills = skillsText
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    const next: Record<string, string> = {};
    if (form.headline.trim().length < 8) next.headline = "Write a headline of at least 8 characters.";
    if (form.bio.trim().length < 20) next.bio = "Tell customers a bit more (20+ characters).";
    if (!form.area.trim()) next.area = "Add the area you serve.";
    if (!(form.hourly_rate > 0)) next.hourly_rate = "Enter your hourly rate in rupees.";
    if (skills.length === 0) next.skills = "Add at least one skill.";
    setErrors(next);
    if (Object.keys(next).length) return;
    save.mutate({ ...form, skills });
  }

  if (profile && profile.role !== "provider") {
    return (
      <div className="mx-auto max-w-2xl px-4 py-24 text-center sm:px-6">
        <h1 className="font-display text-2xl font-semibold">Only professionals have a listing</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Sign up as a professional to offer your services on QuickServe.
        </p>
        <Link to="/" className="btn-primary mt-6">
          Find a professional
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-14">
      <p className="eyebrow">Your listing</p>
      <h1 className="mt-1 font-display text-3xl font-semibold tracking-tight sm:text-4xl">
        Edit my professional profile
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">
        This is exactly what customers in Karachi, Lahore and Islamabad see before booking you.
      </p>

      {isLoading || !userId ? (
        <div className="card-surface mt-8 h-96 animate-pulse bg-muted/60" />
      ) : (
        <form onSubmit={handleSubmit} className="card-surface mt-8 space-y-5 p-6 sm:p-8">
          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label className="field-label" htmlFor="category">
                Service
              </label>
              <select
                id="category"
                className="field"
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="field-label" htmlFor="rate">
                Hourly rate (PKR)
              </label>
              <input
                id="rate"
                type="number"
                min={1}
                step={50}
                className="field"
                value={form.hourly_rate}
                onChange={(e) => setForm({ ...form, hourly_rate: Number(e.target.value) })}
              />
              <p className="mt-1 text-xs text-muted-foreground">
                Shown as {formatPkr(form.hourly_rate || 0)}/hr
              </p>
              {errors.hourly_rate && <p className="mt-1 text-xs text-destructive">{errors.hourly_rate}</p>}
            </div>
          </div>

          <div>
            <label className="field-label" htmlFor="headline">
              Headline
            </label>
            <input
              id="headline"
              className="field"
              placeholder="Certified electrician for homes and offices"
              value={form.headline}
              onChange={(e) => setForm({ ...form, headline: e.target.value })}
            />
            {errors.headline && <p className="mt-1 text-xs text-destructive">{errors.headline}</p>}
          </div>

          <div>
            <label className="field-label" htmlFor="bio">
              About you
            </label>
            <textarea
              id="bio"
              rows={4}
              className="field resize-y"
              placeholder="Years of experience, the kind of jobs you take, and how you work."
              value={form.bio}
              onChange={(e) => setForm({ ...form, bio: e.target.value })}
            />
            {errors.bio && <p className="mt-1 text-xs text-destructive">{errors.bio}</p>}
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label className="field-label" htmlFor="area">
                Area you serve
              </label>
              <input
                id="area"
                className="field"
                list="pk-cities"
                placeholder="Gulberg III, Lahore"
                value={form.area}
                onChange={(e) => setForm({ ...form, area: e.target.value })}
              />
              <datalist id="pk-cities">
                {PK_CITIES.map((c) => (
                  <option key={c} value={c} />
                ))}
              </datalist>
              {errors.area && <p className="mt-1 text-xs text-destructive">{errors.area}</p>}
            </div>
            <div>
              <label className="field-label" htmlFor="response">
                Typical response time
              </label>
              <input
                id="response"
                className="field"
                placeholder="Within 1 hour"
                value={form.response_time}
                onChange={(e) => setForm({ ...form, response_time: e.target.value })}
              />
            </div>
          </div>

          <div>
            <label className="field-label" htmlFor="skills">
              Skills (comma separated)
            </label>
            <input
              id="skills"
              className="field"
              placeholder="Wiring, UPS installation, Fan repair"
              value={skillsText}
              onChange={(e) => setSkillsText(e.target.value)}
            />
            {errors.skills && <p className="mt-1 text-xs text-destructive">{errors.skills}</p>}
          </div>

          <div className="flex flex-wrap gap-3 pt-2">
            <button type="submit" className="btn-primary" disabled={save.isPending}>
              {save.isPending && <Loader2 className="size-4 animate-spin" />}
              Save listing
            </button>
            <Link to="/dashboard" className="btn-outline">
              Back to dashboard
            </Link>
          </div>
        </form>
      )}
    </div>
  );
}
