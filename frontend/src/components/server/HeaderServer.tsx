import { Suspense } from 'react'
import { UserNavigation } from './UserNavigation'

interface HeaderServerProps {
  className?: string
}

// Header Server Component - no interactivity, pure server-side rendering
export async function HeaderServer({ className = "" }: HeaderServerProps) {
  return (
    <div className={`absolute top-0 left-0 right-0 z-30 p-3 md:p-4 lg:p-6 ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center text-white font-muli">
          <span className="text-lg sm:text-xl md:text-2xl font-bold tracking-wide">SPONTRA</span>
          <span className="mx-1 sm:mx-2 text-base sm:text-lg md:text-xl text-white/60">|</span>
          <span className="text-base sm:text-lg md:text-xl font-normal tracking-wide">EXPLORE</span>
        </div>
        
        {/* User navigation wrapped in Suspense for hydration */}
        <Suspense fallback={<UserNavigationSkeleton />}>
          <UserNavigation />
        </Suspense>
      </div>
    </div>
  )
}

// Loading skeleton for user navigation
function UserNavigationSkeleton() {
  return (
    <div className="w-16 h-6 bg-white/20 rounded animate-pulse"></div>
  )
}