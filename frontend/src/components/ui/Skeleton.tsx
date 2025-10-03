import { cn } from '@/lib/utils'

interface SkeletonProps {
  className?: string
}

export function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      className={cn(
        'rounded-lg bg-white/10 animate-shimmer',
        className
      )}
    />
  )
}

export function CountryCardSkeleton() {
  return (
    <div className="bg-white/5 backdrop-blur-xl rounded-2xl overflow-hidden border border-white/10">
      {/* Image skeleton */}
      <Skeleton className="w-full h-64" />

      {/* Content skeleton */}
      <div className="p-6 space-y-4">
        {/* Country name */}
        <Skeleton className="h-8 w-3/4" />

        {/* Stats */}
        <div className="flex gap-4">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-32" />
        </div>

        {/* Description */}
        <div className="space-y-2">
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-5/6" />
        </div>

        {/* Button */}
        <Skeleton className="h-12 w-full rounded-xl" />
      </div>
    </div>
  )
}

export function DestinationCardSkeleton() {
  return (
    <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-6 border border-white/20">
      {/* Header */}
      <div className="mb-4">
        <Skeleton className="h-6 w-32 mb-2" />
        <div className="flex items-center gap-2">
          <Skeleton className="h-4 w-4 rounded-full" />
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-12 rounded-full" />
        </div>
      </div>

      {/* Description */}
      <div className="mb-6 space-y-2">
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-3/4" />
      </div>

      {/* Metadata */}
      <div className="space-y-3 mb-6">
        <div className="flex items-center gap-2">
          <Skeleton className="h-4 w-4 rounded-full" />
          <Skeleton className="h-4 w-20" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-4 w-4 rounded-full" />
          <Skeleton className="h-4 w-16" />
        </div>
      </div>

      {/* Button */}
      <div className="pt-4 border-t border-white/10">
        <Skeleton className="h-10 w-full rounded-lg" />
      </div>
    </div>
  )
}

export function SearchResultsSkeleton() {
  return (
    <div className="min-h-screen p-4 py-8">
      <div className="max-w-6xl mx-auto">
        {/* Header skeleton */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Skeleton className="h-10 w-24 rounded-xl" />
            <div>
              <Skeleton className="h-9 w-64 mb-2" />
              <Skeleton className="h-5 w-48" />
            </div>
          </div>
          <Skeleton className="h-10 w-32 rounded-xl" />
        </div>

        {/* Grid skeleton */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <DestinationCardSkeleton key={i} />
          ))}
        </div>
      </div>
    </div>
  )
}

export function CountryGridSkeleton() {
  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <CountryCardSkeleton key={i} />
      ))}
    </div>
  )
}
