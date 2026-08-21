'use client'

import { AnimatePresence, motion } from 'framer-motion'

export function LoadingProgress({ isLoading }: { isLoading: boolean }) {
  return (
    <AnimatePresence>
      {isLoading && (
        <motion.div
          className="fixed top-0 left-0 right-0 z-50 h-0.5"
          initial={{ opacity: 0, x: '-100%' }}
          animate={{ opacity: 1, x: '0%' }}
          exit={{ opacity: 0, x: '100%' }}
          transition={{ duration: 0.3 }}
        >
          <div className="h-full w-full bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 animate-pulse" />
        </motion.div>
      )}
    </AnimatePresence>
  )
}
