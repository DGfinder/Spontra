interface LoadingSkeletonProps {
  count?: number
}

export function LoadingSkeleton({ count = 6 }: LoadingSkeletonProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 max-w-6xl mx-auto">
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={index}
          className="bg-white/10 backdrop-blur-sm rounded-xl p-4 md:p-6 border border-white/20 animate-pulse"
          style={{
            animationDelay: `${index * 100}ms`,
          }}
        >
          {/* Header skeleton */}
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-8 h-8 bg-white/20 rounded-full"></div>
            <div className="flex-1">
              <div className="h-4 bg-white/20 rounded mb-2"></div>
              <div className="h-3 bg-white/10 rounded w-3/4"></div>
            </div>
            <div className="w-16 h-6 bg-white/20 rounded"></div>
          </div>

          {/* Flight info skeleton */}
          <div className="space-y-3 mb-4">
            <div className="flex justify-between items-center">
              <div className="h-3 bg-white/20 rounded w-20"></div>
              <div className="flex items-center space-x-2">
                <div className="w-16 h-1 bg-white/20 rounded-full"></div>
                <div className="h-3 bg-white/20 rounded w-8"></div>
              </div>
            </div>
            <div className="flex justify-between items-center">
              <div className="h-3 bg-white/20 rounded w-24"></div>
              <div className="h-3 bg-white/20 rounded w-16"></div>
            </div>
          </div>

          {/* Tags skeleton */}
          <div className="mb-4">
            <div className="h-3 bg-white/20 rounded w-16 mb-2"></div>
            <div className="flex gap-2">
              <div className="h-6 bg-white/20 rounded w-16"></div>
              <div className="h-6 bg-white/20 rounded w-12"></div>
              <div className="h-6 bg-white/20 rounded w-20"></div>
            </div>
          </div>

          {/* Description skeleton */}
          <div className="mb-4">
            <div className="h-3 bg-white/10 rounded w-full mb-1"></div>
            <div className="h-3 bg-white/10 rounded w-2/3"></div>
          </div>

          {/* Button skeleton */}
          <div className="h-12 bg-white/20 rounded-lg"></div>
        </div>
      ))}
    </div>
  )
}