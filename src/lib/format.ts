export function formatPkr(amount: number): string {
  return `Rs ${new Intl.NumberFormat("en-PK", { maximumFractionDigits: 0 }).format(amount)}`;
}

export function formatDate(dateStr: string): string {
  return new Date(`${dateStr}T00:00:00`).toLocaleDateString("en-PK", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function formatTime(time: string): string {
  const [h = "0", m = "00"] = time.split(":");
  const hour = Number(h);
  const suffix = hour >= 12 ? "PM" : "AM";
  const display = hour % 12 === 0 ? 12 : hour % 12;
  return `${display}:${m} ${suffix}`;
}

export const CATEGORIES = [
  "Electrician",
  "Plumber",
  "Tutor",
  "Dog Walker",
  "Cleaner",
  "Gardener",
  "AC Technician",
  "Carpenter",
] as const;

export const PK_CITIES = [
  "Karachi",
  "Lahore",
  "Islamabad",
  "Rawalpindi",
  "Faisalabad",
  "Multan",
  "Peshawar",
  "Quetta",
] as const;
