'use client'

import { cn } from '@/lib/utils'

interface LoadingSkeletonProps {
  variant?: 'card' | 'text' | 'circle' | 'button' | 'image' | 'list' | 'constellation'
  size?: 'sm' | 'md' | 'lg' | 'xl'
  count?: number
  className?: string
  animate?: boolean
}

interface SkeletonLineProps {
  className?: string
  animate?: boolean
}

function SkeletonLine({ className = '', animate = true }: SkeletonLineProps) {
  return (
    <div 
      className={cn(
        "bg-gray-300/20 rounded",
        animate && "animate-pulse",
        className
      )}
    />
  )
}

interface SkeletonCircleProps {
  size?: 'sm' | 'md' | 'lg' | 'xl'
  className?: string
  animate?: boolean
}

function SkeletonCircle({ size = 'md', className = '', animate = true }: SkeletonCircleProps) {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12', 
    lg: 'w-16 h-16',
    xl: 'w-24 h-24'
  }

  return (
    <div 
      className={cn(
        "bg-gray-300/20 rounded-full",
        animate && "animate-pulse",
        sizeClasses[size],
        className
      )}
    />
  )
}

function CardSkeleton({ size = 'md', animate = true }: { size?: 'sm' | 'md' | 'lg', animate?: boolean }) {
  const cardSizes = {
    sm: 'p-4 space-y-3',
    md: 'p-6 space-y-4',
    lg: 'p-8 space-y-6'
  }

  return (
    <div className={cn("bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl", cardSizes[size])}>
      {/* Header with image placeholder */}
      <SkeletonLine className="h-32 w-full rounded-xl" animate={animate} />
      
      {/* Title */}
      <div className="space-y-2">
        <SkeletonLine className="h-6 w-3/4" animate={animate} />
        <SkeletonLine className="h-4 w-1/2" animate={animate} />
      </div>
      
      {/* Content lines */}
      <div className="space-y-2">
        <SkeletonLine className="h-4 w-full" animate={animate} />
        <SkeletonLine className="h-4 w-5/6" animate={animate} />
        <SkeletonLine className="h-4 w-2/3" animate={animate} />
      </div>
      
      {/* Footer with stats */}
      <div className="flex justify-between items-center pt-2">
        <SkeletonLine className="h-8 w-20" animate={animate} />
        <SkeletonLine className="h-8 w-24" animate={animate} />
      </div>
    </div>
  )
}

function ConstellationSkeleton({ animate = true }: { animate?: boolean }) {
  return (
    <div className="relative w-full h-96 flex items-center justify-center">
      {/* Central circle */}
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
        <SkeletonCircle size="xl" animate={animate} />
      </div>
      
      {/* Surrounding circles */}
      {Array.from({ length: 6 }).map((_, index) => {
        const angle = (index * 60) * (Math.PI / 180)
        const radius = 120
        const x = 50 + (radius / 4) * Math.cos(angle)
        const y = 50 + (radius / 4) * Math.sin(angle)
        
        return (
          <div
            key={index}
            className="absolute transform -translate-x-1/2 -translate-y-1/2"
            style={{ left: `${x}%`, top: `${y}%` }}
          >
            <SkeletonCircle size="lg" animate={animate} />
          </div>
        )
      })}
    </div>
  )
}

function ListSkeleton({ count = 3, animate = true }: { count?: number, animate?: boolean }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="flex items-center space-x-4 p-4 bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl">
          <SkeletonCircle size="md" animate={animate} />
          <div className="flex-1 space-y-2">
            <SkeletonLine className="h-5 w-3/4" animate={animate} />
            <SkeletonLine className="h-4 w-1/2" animate={animate} />
          </div>
          <SkeletonLine className="h-8 w-20" animate={animate} />
        </div>
      ))}
    </div>
  )
}

export function LoadingSkeleton({ 
  variant = 'card', 
  size = 'md', 
  count = 1, 
  className = '',
  animate = true
}: LoadingSkeletonProps) {
  const renderSkeleton = () => {
    switch (variant) {
      case 'card':
        return Array.from({ length: count }).map((_, index) => (
          <CardSkeleton key={index} size={size} animate={animate} />
        ))
      
      case 'text':
        const textHeights = { sm: 'h-3', md: 'h-4', lg: 'h-5', xl: 'h-6' }
        return Array.from({ length: count }).map((_, index) => (
          <SkeletonLine 
            key={index} 
            className={cn(textHeights[size], 'w-full')} 
            animate={animate}
          />
        ))
      
      case 'circle':
        return Array.from({ length: count }).map((_, index) => (
          <SkeletonCircle key={index} size={size} animate={animate} />
        ))
      
      case 'button':
        const buttonSizes = { sm: 'h-8 w-20', md: 'h-10 w-24', lg: 'h-12 w-32', xl: 'h-14 w-40' }
        return Array.from({ length: count }).map((_, index) => (
          <SkeletonLine 
            key={index} 
            className={cn(buttonSizes[size], 'rounded-lg')} 
            animate={animate}
          />
        ))
      
      case 'image':
        const imageSizes = { sm: 'h-24', md: 'h-32', lg: 'h-48', xl: 'h-64' }
        return Array.from({ length: count }).map((_, index) => (
          <SkeletonLine 
            key={index} 
            className={cn(imageSizes[size], 'w-full rounded-xl')} 
            animate={animate}
          />
        ))
      
      case 'list':
        return <ListSkeleton count={count} animate={animate} />
      
      case 'constellation':
        return <ConstellationSkeleton animate={animate} />
      
      default:
        return <CardSkeleton size={size} animate={animate} />
    }
  }

  return (
    <div className={cn("space-y-4", className)}>
      {renderSkeleton()}
    </div>
  )
}

// Specific component skeletons for common use cases
export function SearchResultsSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header skeleton */}
      <div className="space-y-3">
        <SkeletonLine className="h-8 w-1/2" />
        <SkeletonLine className="h-5 w-2/3" />
      </div>
      
      {/* Results grid skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <LoadingSkeleton variant="card" count={6} size="md" />
      </div>
    </div>
  )
}

export function CitySelectionSkeleton() {
  return (
    <div className="space-y-8">
      {/* Header skeleton */}
      <div className="text-center space-y-4">
        <SkeletonLine className="h-10 w-1/3 mx-auto" />
        <SkeletonLine className="h-5 w-1/2 mx-auto" />
      </div>
      
      {/* Cities grid skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <LoadingSkeleton variant="card" count={6} size="lg" />
      </div>
    </div>
  )
}

export function ActivityConstellationSkeleton() {
  return (
    <div className="space-y-8">
      {/* Header skeleton */}
      <div className="text-center space-y-4">
        <SkeletonLine className="h-8 w-1/4 mx-auto" />
        <SkeletonLine className="h-5 w-1/3 mx-auto" />
      </div>
      
      {/* Constellation skeleton */}
      <LoadingSkeleton variant="constellation" />
      
      {/* Instructions skeleton */}
      <div className="text-center">
        <SkeletonLine className="h-4 w-1/2 mx-auto" />
      </div>
    </div>
  )
}

export function FlightResultsSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header skeleton */}
      <div className="space-y-3">
        <SkeletonLine className="h-8 w-1/3" />
        <SkeletonLine className="h-5 w-1/2" />
      </div>
      
      {/* Flight list skeleton */}
      <LoadingSkeleton variant="list" count={5} />
    </div>
  )
}