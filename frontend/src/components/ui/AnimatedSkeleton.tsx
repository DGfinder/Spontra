'use client'

import { motion } from 'motion/react'
import { cn } from '@/lib/utils'

interface AnimatedSkeletonProps {
  className?: string
  variant?: 'default' | 'circular' | 'text'
}

/**
 * AnimatedSkeleton - Enhanced skeleton loader with smooth pulse animation.
 * Uses motion for smoother, more controllable animations than CSS animate-pulse.
 */
export function AnimatedSkeleton({ className, variant = 'default' }: AnimatedSkeletonProps) {
  return (
    <motion.div
      className={cn(
        'bg-white/10 backdrop-blur-sm',
        variant === 'circular' && 'rounded-full',
        variant === 'text' && 'rounded h-4',
        variant === 'default' && 'rounded-lg',
        className
      )}
      animate={{
        opacity: [0.3, 0.6, 0.3],
      }}
      transition={{
        duration: 1.5,
        repeat: Infinity,
        ease: 'easeInOut',
      }}
    />
  )
}

/**
 * AnimatedSkeletonCard - Pre-built skeleton for card loading states
 */
export function AnimatedSkeletonCard() {
  return (
    <motion.div
      className="rounded-xl border border-white/10 bg-black/20 backdrop-blur-sm p-6 space-y-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex items-center gap-4">
        <AnimatedSkeleton variant="circular" className="h-12 w-12" />
        <div className="space-y-2 flex-1">
          <AnimatedSkeleton variant="text" className="w-1/3" />
          <AnimatedSkeleton variant="text" className="w-1/2" />
        </div>
      </div>
      <AnimatedSkeleton className="h-24 w-full" />
      <div className="flex gap-2">
        <AnimatedSkeleton className="h-8 w-20" />
        <AnimatedSkeleton className="h-8 w-20" />
      </div>
    </motion.div>
  )
}

/**
 * AnimatedSkeletonList - Staggered skeleton list for loading states
 */
export function AnimatedSkeletonList({ count = 3 }: { count?: number }) {
  return (
    <motion.div
      className="space-y-4"
      initial="hidden"
      animate="visible"
      variants={{
        hidden: { opacity: 0 },
        visible: {
          opacity: 1,
          transition: {
            staggerChildren: 0.1
          }
        }
      }}
    >
      {Array.from({ length: count }).map((_, i) => (
        <motion.div
          key={i}
          className="flex items-center space-x-4 p-4 bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl"
          variants={{
            hidden: { opacity: 0, y: 10 },
            visible: { opacity: 1, y: 0 }
          }}
        >
          <AnimatedSkeleton variant="circular" className="h-10 w-10" />
          <div className="flex-1 space-y-2">
            <AnimatedSkeleton variant="text" className="w-3/4" />
            <AnimatedSkeleton variant="text" className="w-1/2" />
          </div>
          <AnimatedSkeleton className="h-8 w-20" />
        </motion.div>
      ))}
    </motion.div>
  )
}

/**
 * FlightSearchLoader - Animated airplane loading indicator for search states
 */
export function FlightSearchLoader() {
  return (
    <div className="text-center py-12">
      <div className="relative w-48 h-16 mx-auto mb-6">
        {/* Flight path line */}
        <motion.div
          className="absolute top-1/2 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-white/30 to-transparent"
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: 0.5 }}
        />
        
        {/* Animated airplane */}
        <motion.div
          className="absolute top-1/2 -translate-y-1/2 text-3xl"
          animate={{
            x: [0, 180, 0],
            y: [0, -15, 0, -10, 0],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        >
          ✈️
        </motion.div>
      </div>
      
      {/* Pulsing dots */}
      <div className="flex justify-center gap-1 mb-4">
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className="w-2 h-2 rounded-full bg-white/60"
            animate={{
              scale: [1, 1.5, 1],
              opacity: [0.5, 1, 0.5],
            }}
            transition={{
              duration: 1,
              repeat: Infinity,
              delay: i * 0.2,
            }}
          />
        ))}
      </div>
      
      <motion.p
        className="text-white/70 text-lg"
        animate={{ opacity: [0.5, 1, 0.5] }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        Finding the best flights...
      </motion.p>
    </div>
  )
}
