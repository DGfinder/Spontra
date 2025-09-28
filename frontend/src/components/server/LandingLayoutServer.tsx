import { Suspense } from 'react'
import { HeaderServer } from './HeaderServer'
import { ThemeBlurbServer } from './ThemeBlurbServer'
import { ThemeBackgroundServer } from './ThemeBackgroundServer'

interface LandingLayoutServerProps {
  selectedTheme: string
  currentTheme: {
    id: string
    label: string
    background: string
    color: string
  }
  children: React.ReactNode
  isPending?: boolean
  isSubmitting?: boolean
}

// Main Server Component for static layout rendering
export async function LandingLayoutServer({ 
  selectedTheme, 
  currentTheme, 
  children,
  isPending = false,
  isSubmitting = false
}: LandingLayoutServerProps) {
  return (
    <div 
      className="h-screen w-full bg-cover bg-center bg-no-repeat relative overflow-hidden"
      style={{ 
        backgroundImage: `url('${currentTheme.background}')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center center',
        height: '100vh',
        width: '100vw'
      }}
    >
      {/* Theme Background Server Component */}
      <ThemeBackgroundServer />
      
      {/* Header Server Component */}
      <Suspense fallback={<HeaderSkeleton />}>
        <HeaderServer />
      </Suspense>
      
      {/* Client-side content */}
      {children}
      
      {/* Enhanced Blurb Server Component */}
      <Suspense fallback={<BlurbSkeleton />}>
        <ThemeBlurbServer 
          selectedTheme={selectedTheme}
          isPending={isPending}
          isSubmitting={isSubmitting}
        />
      </Suspense>
      
      {/* Modern CSS Animations with enhanced performance */}
      <style jsx>{`
        @keyframes slideInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes pulseGlow {
          0%, 100% {
            box-shadow: 0 0 5px rgba(249, 115, 22, 0.3);
          }
          50% {
            box-shadow: 0 0 20px rgba(249, 115, 22, 0.6);
          }
        }
        
        @keyframes fadeInUp {
          0% {
            opacity: 0;
            transform: translateY(20px);
          }
          100% {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .group:hover {
          animation: pulseGlow 2s ease-in-out infinite;
        }
        
        /* React 19 optimized transitions */
        .transition-optimized {
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          will-change: transform, opacity;
        }
        
        /* Server-side rendered animations */
        .animate-fade-in {
          animation: fadeInUp 0.6s ease-out;
        }
        
        /* Optimized backdrop blur for better performance */
        .backdrop-blur-optimized {
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
        }
      `}</style>
    </div>
  )
}

// Loading skeletons for Suspense boundaries
function HeaderSkeleton() {
  return (
    <div className="absolute top-0 left-0 right-0 z-30 p-3 md:p-4 lg:p-6">
      <div className="flex items-center justify-between">
        <div className="h-6 w-32 bg-white/20 rounded animate-pulse"></div>
        <div className="h-6 w-16 bg-white/20 rounded animate-pulse"></div>
      </div>
    </div>
  )
}

function BlurbSkeleton() {
  return (
    <div className="hidden md:flex" style={{ position: 'relative' }}>
      <div
        className="absolute top-16 md:top-20 lg:top-28 w-[min(560px,44vw)] bg-black/55 backdrop-blur-sm border border-white/10 rounded-xl p-5 md:p-6 lg:p-7 shadow-2xl"
        style={{ right: '5vw' }}
      >
        <div className="animate-pulse">
          <div className="h-6 bg-white/20 rounded mb-3"></div>
          <div className="space-y-2">
            <div className="h-4 bg-white/15 rounded w-full"></div>
            <div className="h-4 bg-white/15 rounded w-3/4"></div>
            <div className="h-4 bg-white/15 rounded w-1/2"></div>
          </div>
        </div>
      </div>
    </div>
  )
}