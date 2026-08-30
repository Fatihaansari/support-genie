import { cn } from "@/lib/utils";

export type BookingStatus = "pending" | "accepted" | "rejected" | "in_progress" | "completed";

const STATUS_STYLES: Record<BookingStatus, string> = {
  pending: "bg-accent/15 text-accent border border-accent/30",
  accepted: "bg-secondary text-secondary-foreground border border-border",
  in_progress: "bg-primary text-primary-foreground border border-primary",
  completed: "bg-success/15 text-success border border-success/30",
  rejected: "bg-destructive/10 text-destructive border border-destructive/25",
};

export const STATUS_LABELS: Record<BookingStatus, string> = {
  pending: "Pending",
  accepted: "Accepted",
  in_progress: "In Progress",
  completed: "Completed",
  rejected: "Rejected",
};

export function StatusPill({ status, className }: { status: BookingStatus; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.08em]",
        STATUS_STYLES[status],
        className,
      )}
    >
      {STATUS_LABELS[status]}
    </span>
  );
}
