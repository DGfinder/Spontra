'use client'

import { motion, AnimatePresence } from 'motion/react'

export default function Template({ children }: { children: React.ReactNode }) {
  return (
    <AnimatePresence mode="wait">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ 
          duration: 0.25, 
          ease: [0.25, 0.46, 0.45, 0.94] // Custom ease for smooth feel
        }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  )
}
