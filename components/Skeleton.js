import { classNames } from "@/lib/utils";

export function Skeleton({ className }) {
  return <div className={classNames("skeleton", className)} />;
}

export function StatCardSkeleton() {
  return (
    <div className="stat-card">
      <Skeleton className="h-3 w-20 mb-3" />
      <Skeleton className="h-7 w-24 mb-3" />
      <Skeleton className="h-3 w-16" />
    </div>
  );
}

export function TableRowSkeleton() {
  return (
    <div className="flex items-center gap-4 py-3.5 px-2">
      <Skeleton className="h-4 w-20" />
      <Skeleton className="h-4 w-24" />
      <Skeleton className="h-4 w-16" />
      <Skeleton className="h-4 w-16 ml-auto" />
    </div>
  );
}
