"use client";

interface GrowthPoint {
  date: string;
  count: number;
}

interface StudentGrowthChartProps {
  series: GrowthPoint[];
  total: number;
}

export function StudentGrowthChart({ series, total }: StudentGrowthChartProps) {
  const max = Math.max(1, ...series.map((p) => p.count));
  const hasData = total > 0;

  if (!hasData) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-16 text-center">
        <p className="font-medium text-foreground">No student registrations yet</p>
        <p className="mt-1 max-w-sm text-sm text-muted-foreground">
          New student sign-ups will appear here once accounts are created on CognitiaX AI.
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-end justify-between gap-2">
        <div>
          <p className="font-serif text-3xl font-bold text-green-700 dark:text-green-400">{total}</p>
          <p className="text-sm text-muted-foreground">new students in selected period</p>
        </div>
      </div>
      <div className="mt-8 flex h-40 items-end gap-1 sm:gap-1.5" aria-hidden>
        {series.map((point) => {
          const height = point.count === 0 ? 4 : Math.max(8, (point.count / max) * 100);
          const label = new Date(`${point.date}T12:00:00`).toLocaleDateString(undefined, {
            month: "short",
            day: "numeric",
          });
          return (
            <div
              key={point.date}
              className="group relative flex flex-1 flex-col items-center justify-end"
              title={`${label}: ${point.count} registration(s)`}
            >
              <div
                className="w-full rounded-t-md bg-green-700/80 transition-colors group-hover:bg-green-600 dark:bg-green-500/70"
                style={{ height: `${height}%` }}
              />
            </div>
          );
        })}
      </div>
      <div className="mt-2 flex justify-between text-xs text-muted-foreground">
        <span>
          {new Date(`${series[0]?.date}T12:00:00`).toLocaleDateString(undefined, {
            month: "short",
            day: "numeric",
          })}
        </span>
        <span>
          {new Date(`${series[series.length - 1]?.date}T12:00:00`).toLocaleDateString(undefined, {
            month: "short",
            day: "numeric",
          })}
        </span>
      </div>
    </div>
  );
}
