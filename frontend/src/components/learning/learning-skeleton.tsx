"use client";

export function LearningPageSkeleton() {
  return (
    <div className="animate-pulse space-y-6">
      <div className="aspect-video rounded-2xl bg-muted" />
      <div className="space-y-3">
        <div className="h-8 w-2/3 rounded-lg bg-muted" />
        <div className="h-4 w-full rounded bg-muted" />
        <div className="h-4 w-4/5 rounded bg-muted" />
      </div>
      <div className="flex gap-3">
        <div className="h-10 w-28 rounded-xl bg-muted" />
        <div className="h-10 w-28 rounded-xl bg-muted" />
      </div>
    </div>
  );
}

export function DashboardStatsSkeleton() {
  return (
    <div className="grid animate-pulse gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="h-28 rounded-2xl bg-muted" />
      ))}
    </div>
  );
}
