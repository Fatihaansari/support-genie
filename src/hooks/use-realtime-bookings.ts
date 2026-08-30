import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

/**
 * Subscribes to booking changes and refreshes booking queries in real time.
 * Providers also get a toast when a new request arrives.
 */
export function useRealtimeBookings(userId: string | undefined, opts?: { notifyOnNew?: boolean }) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel(`bookings-${userId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "bookings" }, (payload) => {
        queryClient.invalidateQueries({ queryKey: ["bookings"] });
        if (opts?.notifyOnNew && payload.eventType === "INSERT") {
          const row = payload.new as { provider_id?: string; service_category?: string };
          if (row.provider_id === userId) {
            toast.success(`New booking request: ${row.service_category}`, {
              description: "Review it in your request queue below.",
            });
          }
        }
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "reviews" }, () => {
        queryClient.invalidateQueries({ queryKey: ["reviews"] });
        queryClient.invalidateQueries({ queryKey: ["bookings"] });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, opts?.notifyOnNew, queryClient]);
}
