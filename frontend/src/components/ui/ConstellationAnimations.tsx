'use client'

import { motion, useMotionValue, useSpring, useTransform } from 'motion/react'
import { useEffect, useMemo, useState } from 'react'

interface FloatingStarProps {
  x: number
  y: number
  size?: number
  delay?: number
  duration?: number
  glowColor?: string
}

/**
 * FloatingStar - Individual star with floating animation and glow pulse
 */
export function FloatingStar({ 
  x, 
  y, 
  size = 3, 
  delay = 0, 
  duration = 3,
  glowColor = 'rgba(255, 255, 255, 0.8)'
}: FloatingStarProps) {
  return (
    <motion.div
      className="absolute rounded-full pointer-events-none"
      style={{
        left: `${x}%`,
        top: `${y}%`,
        width: size,
        height: size,
        backgroundColor: 'white',
        boxShadow: `0 0 ${size * 2}px ${glowColor}, 0 0 ${size * 4}px ${glowColor}`,
      }}
      animate={{
        y: [0, -8, 0],
        opacity: [0.4, 1, 0.4],
        scale: [1, 1.2, 1],
      }}
      transition={{
        duration,
        delay,
        repeat: Infinity,
        ease: 'easeInOut',
      }}
    />
  )
}

interface ConstellationBackgroundProps {
  starCount?: number
  children?: React.ReactNode
  className?: string
}

/**
 * ConstellationBackground - Animated starfield background with parallax effect
 */
export function ConstellationBackground({ 
  starCount = 40, 
  children,
  className 
}: ConstellationBackgroundProps) {
  const stars = useMemo(() => 
    Array.from({ length: starCount }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 2 + 1,
      delay: Math.random() * 3,
      duration: Math.random() * 2 + 2,
    })),
  [starCount])

  return (
    <div className={`relative overflow-hidden ${className}`}>
      {/* Star layer */}
      <div className="absolute inset-0 pointer-events-none">
        {stars.map((star) => (
          <FloatingStar
            key={star.id}
            x={star.x}
            y={star.y}
            size={star.size}
            delay={star.delay}
            duration={star.duration}
          />
        ))}
      </div>
      {children}
    </div>
  )
}

interface ParallaxStarFieldProps {
  mouseX?: number
  mouseY?: number
  intensity?: number
  starCount?: number
}

/**
 * ParallaxStarField - Star field that responds to mouse movement
 */
export function ParallaxStarField({ 
  intensity = 20,
  starCount = 30
}: ParallaxStarFieldProps) {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })
  
  const springConfig = { stiffness: 50, damping: 20 }
  const x = useSpring(0, springConfig)
  const y = useSpring(0, springConfig)

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const centerX = window.innerWidth / 2
      const centerY = window.innerHeight / 2
      x.set((e.clientX - centerX) / centerX * intensity)
      y.set((e.clientY - centerY) / centerY * intensity)
    }

    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [intensity, x, y])

  const stars = useMemo(() => 
    Array.from({ length: starCount }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 2 + 1,
      depth: Math.random() * 0.5 + 0.5, // Parallax depth multiplier
    })),
  [starCount])

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {stars.map((star) => (
        <motion.div
          key={star.id}
          className="absolute rounded-full bg-white"
          style={{
            left: `${star.x}%`,
            top: `${star.y}%`,
            width: star.size,
            height: star.size,
            boxShadow: `0 0 ${star.size * 2}px rgba(255, 255, 255, 0.5)`,
            x: useTransform(x, (v) => v * star.depth),
            y: useTransform(y, (v) => v * star.depth),
          }}
          animate={{
            opacity: [0.3, 0.8, 0.3],
          }}
          transition={{
            duration: 2 + Math.random() * 2,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      ))}
    </div>
  )
}

interface GlowingOrbProps {
  size?: number
  color?: string
  pulseIntensity?: number
  className?: string
}

/**
 * GlowingOrb - Animated glowing orb with pulse effect
 */
export function GlowingOrb({ 
  size = 100, 
  color = 'rgba(255, 214, 0, 0.6)',
  pulseIntensity = 1.3,
  className 
}: GlowingOrbProps) {
  return (
    <motion.div
      className={`rounded-full ${className}`}
      style={{
        width: size,
        height: size,
        background: `radial-gradient(circle, ${color} 0%, transparent 70%)`,
        filter: `blur(${size / 8}px)`,
      }}
      animate={{
        scale: [1, pulseIntensity, 1],
        opacity: [0.5, 0.8, 0.5],
      }}
      transition={{
        duration: 3,
        repeat: Infinity,
        ease: 'easeInOut',
      }}
    />
  )
}

interface ConnectionLineProps {
  from: { x: number; y: number }
  to: { x: number; y: number }
  animated?: boolean
}

/**
 * ConnectionLine - Animated line connecting constellation points
 */
export function ConnectionLine({ from, to, animated = true }: ConnectionLineProps) {
  return (
    <svg className="absolute inset-0 w-full h-full pointer-events-none">
      <motion.line
        x1={`${from.x}%`}
        y1={`${from.y}%`}
        x2={`${to.x}%`}
        y2={`${to.y}%`}
        stroke="rgba(255, 255, 255, 0.2)"
        strokeWidth="1"
        strokeLinecap="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: animated ? 1 : 0 }}
        transition={{ duration: 1, ease: 'easeOut' }}
      />
    </svg>
  )
}
