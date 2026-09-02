import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

export function RatingStars({
  value,
  size = "sm",
  className,
}: {
  value: number;
  size?: "sm" | "md";
  className?: string;
}) {
  const px = size === "md" ? "size-5" : "size-4";
  return (
    <span className={cn("inline-flex items-center gap-0.5", className)} aria-label={`${value} out of 5`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          className={cn(px, i <= Math.round(value) ? "fill-gold text-gold" : "text-border")}
        />
      ))}
    </span>
  );
}

export function StarPicker({
  value,
  onChange,
  disabled,
}: {
  value: number;
  onChange: (v: number) => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((i) => (
        <button
          key={i}
          type="button"
          disabled={disabled}
          onClick={() => onChange(i)}
          aria-label={`${i} star${i > 1 ? "s" : ""}`}
          className="rounded-md p-0.5 transition-transform hover:scale-110 disabled:opacity-50"
        >
          <Star className={cn("size-7", i <= value ? "fill-gold text-gold" : "text-border")} />
        </button>
      ))}
    </div>
  );
}
