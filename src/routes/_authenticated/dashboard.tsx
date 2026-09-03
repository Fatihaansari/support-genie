import { createFileRoute, Link } from "@tanstack/react-router";

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
    ],
  }),
  component: DashboardPage,
});

function DashboardPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-16 text-center sm:px-6">
      <p className="eyebrow">Provider</p>
      <h1 className="mt-1 font-display text-3xl font-semibold tracking-tight">Dashboard coming next</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Your request queue with Accept, In Progress and Completed actions is being built.
      </p>
      <Link to="/" className="btn-primary mt-6">
        Browse professionals
      </Link>
    </div>
  );
}
