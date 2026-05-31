import { DashboardStatsSkeleton } from "@/components/learning/learning-skeleton";
import { layout } from "@/lib/layout";

export default function DashboardLoading() {
  return (
    <div className={`${layout.dashboard} py-10`}>
      <DashboardStatsSkeleton />
    </div>
  );
}
