'use client'

import { motion, type HTMLMotionProps } from 'motion/react'
import { forwardRef } from 'react'
import { cn } from '@/lib/utils'

interface AnimatedCardProps extends Omit<HTMLMotionProps<'div'>, 'children'> {
  children: React.ReactNode
  delay?: number
  hover?: boolean
  tap?: boolean
  variant?: 'glass' | 'solid' | 'outline' | 'minimal'
}

/**
 * AnimatedCard - A card component with built-in entrance and interaction animations.
 * 
 * Features:
 * - Fade + slide entrance animation
 * - Optional hover: subtle scale (1.02) + shadow lift
 * - Optional tap: quick scale down feedback
 * - Configurable delay for staggered lists
 */
export const AnimatedCard = forwardRef<HTMLDivElement, AnimatedCardProps>(
  ({ 
    children, 
    className, 
    delay = 0, 
    hover = true, 
    tap = true,
    variant = 'glass',
    ...props 
  }, ref) => {
    const variantStyles = {
      glass: 'bg-black/40 backdrop-blur-sm border border-white/20',
      solid: 'bg-white border border-gray-200 shadow-md',
      outline: 'bg-transparent border-2 border-white/30',
      minimal: 'bg-transparent'
    }

    return (
      <motion.div
        ref={ref}
        className={cn(
          'rounded-xl overflow-hidden transition-shadow duration-300',
          variantStyles[variant],
          className
        )}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 10 }}
        transition={{
          duration: 0.35,
          delay,
          ease: [0.25, 0.46, 0.45, 0.94]
        }}
        whileHover={hover ? { 
          scale: 1.02,
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.25)',
          borderColor: 'rgba(255, 255, 255, 0.4)',
          transition: { duration: 0.2, ease: 'easeOut' }
        } : undefined}
        whileTap={tap ? { 
          scale: 0.98,
          transition: { duration: 0.1 }
        } : undefined}
        {...props}
      >
        {children}
      </motion.div>
    )
  }
)

AnimatedCard.displayName = 'AnimatedCard'

/**
 * AnimatedCardList - Wrapper for staggered card animations
 */
interface AnimatedCardListProps {
  children: React.ReactNode
  className?: string
  staggerDelay?: number
}

export function AnimatedCardList({ 
  children, 
  className,
  staggerDelay = 0.08 
}: AnimatedCardListProps) {
  return (
    <motion.div
      className={className}
      initial="hidden"
      animate="visible"
      variants={{
        hidden: { opacity: 0 },
        visible: {
          opacity: 1,
          transition: {
            staggerChildren: staggerDelay
          }
        }
      }}
    >
      {children}
    </motion.div>
  )
}

/**
 * Card item variant for use inside AnimatedCardList
 */
export const cardItemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: {
      duration: 0.35,
      ease: [0.25, 0.46, 0.45, 0.94]
    }
  }
}
