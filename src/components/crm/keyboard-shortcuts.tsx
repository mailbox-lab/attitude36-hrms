'use client'

import { useCallback, useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { EnhancedDialogHeader } from '@/components/crm/enhanced-dialog-header'
import { Compass, Zap, CircleHelp, Keyboard, ArrowRight } from 'lucide-react'
import { Separator } from '@/components/ui/separator'

// Custom event to allow external triggers (e.g. header button)
export function dispatchOpenShortcuts() {
  window.dispatchEvent(new CustomEvent('open-keyboard-shortcuts'))
}

type ShortcutEntry = {
  keys: string[]
  label: string
}

type ShortcutSection = {
  title: string
  icon: typeof Compass
  shortcuts: ShortcutEntry[]
}

const sections: ShortcutSection[] = [
  {
    title: 'Navigation',
    icon: Compass,
    shortcuts: [
      { keys: ['G', 'D'], label: 'Dashboard' },
      { keys: ['G', 'C'], label: 'Candidates' },
      { keys: ['G', 'L'], label: 'Clients' },
      { keys: ['G', 'J'], label: 'Job Openings' },
      { keys: ['G', 'A'], label: 'Attendance' },
      { keys: ['G', 'V'], label: 'Leave Mgmt' },
      { keys: ['G', 'I'], label: 'Interviews' },
      { keys: ['G', 'P'], label: 'Placements' },
      { keys: ['G', 'T'], label: 'Activity Feed' },
      { keys: ['G', 'N'], label: 'Notifications' },
      { keys: ['G', 'E'], label: 'Employees' },
      { keys: ['G', 'R'], label: 'Analytics' },
      { keys: ['G', 'S'], label: 'Settings' },
    ],
  },
  {
    title: 'Actions',
    icon: Zap,
    shortcuts: [
      { keys: ['N', 'C'], label: 'Add Candidate' },
      { keys: ['N', 'L'], label: 'Add Client' },
      { keys: ['N', 'J'], label: 'Add Job' },
      { keys: ['N', 'E'], label: 'Add Employee' },
      { keys: ['⌘K'], label: 'Command Palette' },
      { keys: ['?'], label: 'Show Shortcuts' },
    ],
  },
  {
    title: 'General',
    icon: CircleHelp,
    shortcuts: [
      { keys: ['Esc'], label: 'Close Dialog / Go Back' },
      { keys: ['↑↓'], label: 'Navigate Lists' },
      { keys: ['Enter'], label: 'Select / Confirm' },
    ],
  },
]

function Kbd({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="inline-flex h-6 min-w-6 items-center justify-center rounded border bg-muted px-1.5 font-mono text-[11px] font-medium text-muted-foreground">
      {children}
    </kbd>
  )
}

function ShortcutRow({ entry }: { entry: ShortcutEntry }) {
  return (
    <div className="flex items-center justify-between py-1.5">
      <span className="text-sm text-muted-foreground">{entry.label}</span>
      <div className="flex items-center gap-1">
        {entry.keys.map((key, i) => (
          <span key={i} className="flex items-center gap-1">
            {i > 0 && <ArrowRight className="h-3 w-3 text-muted-foreground/50" />}
            <Kbd>{key}</Kbd>
          </span>
        ))}
      </div>
    </div>
  )
}

function ShortcutSectionBlock({ section }: { section: ShortcutSection }) {
  const Icon = section.icon
  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <div className="flex h-6 w-6 items-center justify-center rounded-md bg-violet-500/10">
          <Icon className="h-3.5 w-3.5 text-violet-500" />
        </div>
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {section.title}
        </h3>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6">
        {section.shortcuts.map((entry, i) => (
          <ShortcutRow key={i} entry={entry} />
        ))}
      </div>
    </div>
  )
}

const contentVariants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { type: 'spring', stiffness: 400, damping: 30 },
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    transition: { duration: 0.15 },
  },
}

export function KeyboardShortcuts() {
  const [open, setOpen] = useState(false)

  const toggle = useCallback(() => {
    setOpen((prev) => !prev)
  }, [])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Open with ? (Shift+/)
      if (e.key === '?' && !e.metaKey && !e.ctrlKey && !e.altKey) {
        const target = e.target as HTMLElement
        if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
          return
        }
        e.preventDefault()
        toggle()
      }
    }

    const handleCustomEvent = () => {
      setOpen(true)
    }

    document.addEventListener('keydown', handleKeyDown)
    window.addEventListener('open-keyboard-shortcuts', handleCustomEvent)
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('open-keyboard-shortcuts', handleCustomEvent)
    }
  }, [toggle])

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent
        className="max-w-lg bg-gradient-to-br from-background via-background to-muted/30 p-0 overflow-hidden"
        showCloseButton={false}
      >
        <motion.div
          variants={contentVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
        >
          <div className="p-6 pb-4">
            <DialogHeader>
              <DialogTitle className="sr-only">Keyboard Shortcuts</DialogTitle>
              <DialogDescription className="sr-only">
                View all available keyboard shortcuts in RecruitPro CRM
              </DialogDescription>
              <EnhancedDialogHeader
                icon={Keyboard}
                title="Keyboard Shortcuts"
                description="Navigate and perform actions quickly using keyboard shortcuts."
                iconColor="text-violet-500"
              />
            </DialogHeader>
          </div>

          <Separator className="mx-6" />

          <div className="px-6 py-4 space-y-6 max-h-[400px] overflow-y-auto">
            {sections.map((section) => (
              <ShortcutSectionBlock key={section.title} section={section} />
            ))}
          </div>

          <Separator className="mx-6" />

          <DialogFooter className="px-6 py-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setOpen(false)}
              className="w-full sm:w-auto"
            >
              Close
            </Button>
          </DialogFooter>
        </motion.div>
      </DialogContent>
    </Dialog>
  )
}
