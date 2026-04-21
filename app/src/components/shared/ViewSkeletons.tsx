import { Skeleton, SkeletonCircle, SkeletonRect, SkeletonText } from './Skeleton';

export function DashboardSkeleton() {
  return (
    <div className="space-y-12">
      {/* Hero Skeleton */}
      <div className="text-left py-12 md:py-20 max-w-4xl space-y-6">
        <SkeletonRect className="h-20 w-3/4 md:h-32" />
        <SkeletonRect className="h-6 w-1/2" />
      </div>

      {/* Stats Grid Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
          <SkeletonRect key={i} className="h-32 rounded-3xl" />
        ))}
      </div>

      {/* Charts Row Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <SkeletonRect className="h-80 rounded-3xl" />
        <SkeletonRect className="h-80 rounded-3xl" />
      </div>

      {/* Bottom Row Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <SkeletonRect className="h-64 rounded-3xl" />
        <SkeletonRect className="h-64 rounded-3xl" />
      </div>
    </div>
  );
}

export function ApplicationListSkeleton() {
  return (
    <div className="space-y-12 pb-20">
      {/* Header Skeleton */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-4 w-full max-w-md">
          <SkeletonRect className="h-16 w-3/4" />
          <SkeletonRect className="h-6 w-1/2" />
        </div>
        <SkeletonRect className="h-14 w-40 rounded-full" />
      </div>

      {/* Search Bar Skeleton */}
      <SkeletonRect className="h-16 rounded-full w-full" />

      {/* Grid Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="p-8 space-y-8 rounded-[40px] border border-black/5 dark:border-white/5 bg-white dark:bg-zinc-900/50">
            <div className="flex items-start justify-between">
              <SkeletonCircle size={80} />
              <div className="flex gap-2">
                {[...Array(5)].map((_, j) => <SkeletonCircle key={j} size={8} />)}
              </div>
            </div>
            <div className="space-y-4">
              <SkeletonRect className="h-6 w-1/3" />
              <SkeletonRect className="h-10 w-3/4" />
              <div className="space-y-2 pt-4">
                <SkeletonRect className="h-4 w-1/2" />
                <SkeletonRect className="h-4 w-2/3" />
              </div>
            </div>
            <div className="flex justify-between pt-6 border-t border-black/5 dark:border-white/5">
              <SkeletonRect className="h-10 w-32 rounded-full" />
              <div className="flex gap-2">
                <SkeletonCircle size={40} />
                <SkeletonCircle size={40} />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function DocumentsSkeleton() {
  return (
    <div className="space-y-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-12">
        <div className="space-y-4">
          <SkeletonRect className="h-20 w-80" />
          <SkeletonRect className="h-6 w-64" />
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="p-10 rounded-[40px] border border-black/5 dark:border-white/5 space-y-8 bg-white dark:bg-zinc-900/50">
            <div className="flex items-start justify-between">
              <SkeletonRect className="w-20 h-20 rounded-3xl" />
              <SkeletonCircle size={40} />
            </div>
            <div className="space-y-4">
               <SkeletonRect className="h-8 w-3/4" />
               <SkeletonRect className="h-4 w-1/3" />
            </div>
            <div className="pt-6 border-t border-black/5 dark:border-white/5 flex justify-between">
              <SkeletonRect className="h-4 w-1/4" />
              <SkeletonRect className="h-6 w-1/4" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function CalendarSkeleton() {
  return (
    <div className="space-y-12">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-12">
        <div className="space-y-4">
          <SkeletonRect className="h-20 w-80" />
          <SkeletonRect className="h-6 w-64" />
        </div>
      </div>
      <div className="mc-stadium-card bg-white dark:bg-zinc-900/50 p-8 border border-black/5 dark:border-white/5">
        <div className="grid grid-cols-7 gap-px bg-zinc-200 dark:bg-zinc-700 rounded-3xl overflow-hidden border border-black/5 dark:border-white/5">
           {[...Array(35)].map((_, i) => (
             <div key={i} className="bg-white dark:bg-zinc-900/80 p-4 min-h-[120px]">
               <SkeletonCircle size={24} className="mb-4" />
               <SkeletonRect className="h-4 w-3/4 mb-2" />
               <SkeletonRect className="h-4 w-1/2" />
             </div>
           ))}
        </div>
      </div>
    </div>
  );
}
