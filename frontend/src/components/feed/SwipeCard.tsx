'use client'

import { useRef } from 'react'
import { motion, useMotionValue, useTransform, useAnimation, PanInfo } from 'framer-motion'
import { Heart, X, ChevronUp, MapPin, Clock, Plane } from 'lucide-react'
import { FeedDestination } from '@/store/feedStore'
import { getThemeColor } from '@/lib/theme'

interface SwipeCardProps {
  item: FeedDestination
  isTop: boolean         // Only the top card is interactive
  offset: number         // 0 = top, 1 = behind, 2 = further behind etc
  onSwipeUp: () => void
  onSwipeRight: () => void  // save
  onSwipeLeft: () => void   // skip
}

const SWIPE_THRESHOLD = 80
const UP_THRESHOLD = 100

export function SwipeCard({ item, isTop, offset, onSwipeUp, onSwipeRight, onSwipeLeft }: SwipeCardProps) {
  const x = useMotionValue(0)
  const y = useMotionValue(0)
  const controls = useAnimation()

  const rotate = useTransform(x, [-200, 0, 200], [-18, 0, 18])
  const cardOpacity = useTransform(x, [-200, -100, 0, 100, 200], [0, 1, 1, 1, 0])

  // Swipe indicators
  const saveOpacity  = useTransform(x, [0, SWIPE_THRESHOLD], [0, 1])
  const skipOpacity  = useTransform(x, [-SWIPE_THRESHOLD, 0], [1, 0])
  const upOpacity    = useTransform(y, [-UP_THRESHOLD, 0], [1, 0])

  const themeColor = getThemeColor(item.themeSlug as any)

  const handleDragEnd = async (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    const { offset: { x: ox, y: oy }, velocity: { x: vx, y: vy } } = info

    // Swipe UP — next card
    if (oy < -UP_THRESHOLD || vy < -500) {
      await controls.start({ y: -window.innerHeight, opacity: 0, transition: { duration: 0.3 } })
      onSwipeUp()
      return
    }

    // Swipe RIGHT — save
    if (ox > SWIPE_THRESHOLD || vx > 500) {
      await controls.start({ x: window.innerWidth + 200, rotate: 20, opacity: 0, transition: { duration: 0.35 } })
      onSwipeRight()
      return
    }

    // Swipe LEFT — skip
    if (ox < -SWIPE_THRESHOLD || vx < -500) {
      await controls.start({ x: -window.innerWidth - 200, rotate: -20, opacity: 0, transition: { duration: 0.35 } })
      onSwipeLeft()
      return
    }

    // Snap back
    controls.start({ x: 0, y: 0, rotate: 0, transition: { type: 'spring', stiffness: 300, damping: 25 } })
  }

  const scale = 1 - offset * 0.04
  const translateY = offset * 12

  return (
    <motion.div
      className="absolute inset-0"
      style={{
        x: isTop ? x : 0,
        y: isTop ? y : translateY,
        rotate: isTop ? rotate : 0,
        opacity: isTop ? cardOpacity : 1,
        scale,
        zIndex: 10 - offset,
      }}
      animate={isTop ? controls : { scale, y: translateY }}
      drag={isTop ? true : false}
      dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
      dragElastic={0.8}
      onDragEnd={handleDragEnd}
    >
      {/* ── Card ─────────────────────────────────────────────────────── */}
      <div className="w-full h-full rounded-3xl overflow-hidden relative select-none touch-none">

        {/* Hero image */}
        <img
          src={item.imageUrl}
          alt={item.cityName}
          className="absolute inset-0 w-full h-full object-cover"
          draggable={false}
        />

        {/* Gradient scrims */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-black/30" />
        <div
          className="absolute inset-0 opacity-20"
          style={{ background: `radial-gradient(ellipse at bottom left, ${themeColor}, transparent 60%)` }}
        />

        {/* ── Swipe indicators ────────────────────────────────────────── */}
        {isTop && (
          <>
            {/* SAVE — right */}
            <motion.div
              className="absolute top-16 left-8 flex items-center gap-2 bg-green-500/90 text-white font-black text-2xl tracking-widest px-5 py-2 rounded-xl border-4 border-green-400"
              style={{ opacity: saveOpacity, rotate: -15 }}
            >
              <Heart className="fill-white" size={20} />
              SAVE
            </motion.div>

            {/* SKIP — left */}
            <motion.div
              className="absolute top-16 right-8 flex items-center gap-2 bg-red-500/90 text-white font-black text-2xl tracking-widest px-5 py-2 rounded-xl border-4 border-red-400"
              style={{ opacity: skipOpacity, rotate: 15 }}
            >
              SKIP
              <X size={20} strokeWidth={3} />
            </motion.div>

            {/* NEXT — up */}
            <motion.div
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center gap-1 text-white/80"
              style={{ opacity: upOpacity }}
            >
              <ChevronUp size={48} strokeWidth={2.5} />
              <span className="text-sm font-bold tracking-widest uppercase">Next</span>
            </motion.div>
          </>
        )}

        {/* ── Bottom info ──────────────────────────────────────────────── */}
        <div className="absolute bottom-0 left-0 right-0 p-6 pb-8">
          {/* Theme badge */}
          <div
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest mb-3"
            style={{ backgroundColor: `${themeColor}33`, border: `1px solid ${themeColor}66`, color: themeColor }}
          >
            {item.themeSlug}
          </div>

          {/* City + country */}
          <h2 className="text-5xl font-black text-white leading-none mb-1 drop-shadow-lg">
            {item.cityName}
          </h2>
          <div className="flex items-center gap-1 text-white/70 text-sm mb-4">
            <MapPin size={13} />
            <span>{item.countryName}</span>
          </div>

          {/* Stats row */}
          <div className="flex items-center gap-4">
            {item.flightDurationMinutes && (
              <div className="flex items-center gap-1.5 text-white/80 text-sm">
                <Clock size={14} />
                <span>
                  {Math.floor(item.flightDurationMinutes / 60)}h
                  {item.flightDurationMinutes % 60 > 0 ? ` ${item.flightDurationMinutes % 60}m` : ''}
                </span>
              </div>
            )}
            {item.estimatedPrice && (
              <div
                className="flex items-center gap-1.5 text-sm font-bold px-3 py-1 rounded-full"
                style={{ backgroundColor: `${themeColor}33`, color: themeColor }}
              >
                <Plane size={13} />
                from {item.currency}{Math.round(item.estimatedPrice)}
              </div>
            )}
          </div>

          {item.caption && (
            <p className="text-white/55 text-sm mt-3 line-clamp-2 leading-relaxed">
              {item.caption}
            </p>
          )}
        </div>
      </div>
    </motion.div>
  )
}
