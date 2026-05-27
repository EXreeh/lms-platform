import { DashboardStatsSkeleton } from "@/components/learning/learning-skeleton";

export default function DashboardLoading() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <DashboardStatsSkeleton />
    </div>
  );
}
