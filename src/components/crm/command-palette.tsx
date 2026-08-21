'use client'

import { useCallback, useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useCRMStore, type CRMView } from '@/stores/crm-store'
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from '@/components/ui/command'
import {
  LayoutDashboard,
  Users,
  Building2,
  Briefcase,
  Clock,
  CalendarOff,
  Video,
  Award,
  UserCog,
  Activity,
  UserPlus,
  BarChart3,
  Bell,
  Settings,
  Plus,
  Search,
} from 'lucide-react'
import { toast } from 'sonner'

type NavEntry = {
  icon: typeof LayoutDashboard
  label: string
  view: CRMView
  shortcut: string
}

type QuickAction = {
  icon: typeof Plus
  label: string
  view: CRMView
  action: string
  shortcut: string
}

const navItems: NavEntry[] = [
  { icon: LayoutDashboard, label: 'Dashboard', view: 'dashboard', shortcut: 'G then D' },
  { icon: Users, label: 'Candidates', view: 'candidates', shortcut: 'G then C' },
  { icon: Building2, label: 'Clients', view: 'clients', shortcut: 'G then L' },
  { icon: Briefcase, label: 'Job Openings', view: 'jobs', shortcut: 'G then J' },
  { icon: Clock, label: 'Attendance', view: 'attendance', shortcut: 'G then A' },
  { icon: CalendarOff, label: 'Leave Mgmt', view: 'leave', shortcut: 'G then V' },
  { icon: Video, label: 'Interviews', view: 'interviews', shortcut: 'G then I' },
  { icon: Award, label: 'Placements', view: 'placements', shortcut: 'G then P' },
  { icon: Activity, label: 'Activity Feed', view: 'activity-feed', shortcut: 'G then T' },
  { icon: Bell, label: 'Notification Center', view: 'notifications', shortcut: 'G then N' },
  { icon: UserCog, label: 'Employees', view: 'employees', shortcut: 'G then E' },
  { icon: BarChart3, label: 'Analytics', view: 'analytics', shortcut: 'G then R' },
  { icon: Settings, label: 'Settings', view: 'settings', shortcut: 'G then S' },
]

const quickActions: QuickAction[] = [
  { icon: UserPlus, label: 'Add Candidate', view: 'candidates', action: 'add-candidate', shortcut: 'N then C' },
  { icon: Building2, label: 'Add Client', view: 'clients', action: 'add-client', shortcut: 'N then L' },
  { icon: Briefcase, label: 'Add Job', view: 'jobs', action: 'add-job', shortcut: 'N then J' },
  { icon: UserCog, label: 'Add Employee', view: 'employees', action: 'add-employee', shortcut: 'N then E' },
]

const overlayVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
  exit: { opacity: 0 },
}

const dialogVariants = {
  hidden: { opacity: 0, scale: 0.96, y: -10 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { type: 'spring', stiffness: 400, damping: 30 },
  },
  exit: {
    opacity: 0,
    scale: 0.96,
    y: -10,
    transition: { duration: 0.15 },
  },
}

const itemTapVariants = {
  tap: { scale: 0.97, transition: { duration: 0.1 } },
}

export function CommandPalette() {
  const [open, setOpen] = useState(false)
  const { navigate, currentView } = useCRMStore()

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setOpen((prev) => !prev)
      }
    },
    []
  )

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  const handleNavSelect = useCallback(
    (view: CRMView, label: string) => {
      navigate(view)
      setOpen(false)
      toast.success(`Navigated to ${label}`, {
        description: `You are now viewing the ${label} section.`,
        duration: 2000,
      })
    },
    [navigate]
  )

  const handleQuickAction = useCallback(
    (view: CRMView, label: string) => {
      navigate(view)
      setOpen(false)
      toast.info(`${label}`, {
        description: 'The add form will be available in the section.',
        duration: 2000,
      })
    },
    [navigate]
  )

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Animated backdrop overlay */}
          <motion.div
            className="fixed inset-0 z-[99] bg-black/60 backdrop-blur-sm"
            variants={overlayVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            transition={{ duration: 0.2 }}
            onClick={() => setOpen(false)}
            aria-hidden="true"
          />

          {/* Animated dialog container */}
          <motion.div
            className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh]"
            variants={dialogVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            <div className="w-full max-w-[640px] mx-4">
              <CommandDialog open={open} onOpenChange={setOpen}>
                <CommandInput placeholder="Search pages, actions, or type a command..." />
                <CommandList className="max-h-[380px]">
                  <CommandEmpty>
                    <motion.div
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex flex-col items-center gap-2 py-6 text-muted-foreground"
                    >
                      <Search className="h-8 w-8 opacity-30" />
                      <p className="text-sm">No results found.</p>
                      <p className="text-xs opacity-60">Try a different search term.</p>
                    </motion.div>
                  </CommandEmpty>

                  <CommandGroup heading="Navigation">
                    {navItems.map((item) => {
                      const Icon = item.icon
                      const isActive = currentView === item.view
                      return (
                        <CommandItem
                          key={item.view}
                          value={item.label}
                          onSelect={() => handleNavSelect(item.view, item.label)}
                          className={
                            isActive
                              ? 'bg-primary/10 text-primary'
                              : ''
                          }
                        >
                          <motion.div
                            variants={itemTapVariants}
                            whileTap="tap"
                            className="flex w-full items-center gap-3"
                          >
                            <Icon className="h-4 w-4 shrink-0" />
                            <span className="flex-1">{item.label}</span>
                            {isActive && (
                              <span className="text-[10px] font-medium text-primary bg-primary/10 px-1.5 py-0.5 rounded">
                                Current
                              </span>
                            )}
                            <CommandShortcut className="text-[10px]">
                              {item.shortcut}
                            </CommandShortcut>
                          </motion.div>
                        </CommandItem>
                      )
                    })}
                  </CommandGroup>

                  <CommandSeparator />

                  <CommandGroup heading="Quick Actions">
                    {quickActions.map((item) => {
                      const Icon = item.icon
                      return (
                        <CommandItem
                          key={item.action}
                          value={item.label}
                          onSelect={() => handleQuickAction(item.view, item.label)}
                        >
                          <motion.div
                            variants={itemTapVariants}
                            whileTap="tap"
                            className="flex w-full items-center gap-3"
                          >
                            <div className="flex h-6 w-6 items-center justify-center rounded-md bg-primary/10">
                              <Icon className="h-3.5 w-3.5 text-primary" />
                            </div>
                            <span className="flex-1">{item.label}</span>
                            <CommandShortcut className="text-[10px]">
                              {item.shortcut}
                            </CommandShortcut>
                          </motion.div>
                        </CommandItem>
                      )
                    })}
                  </CommandGroup>
                </CommandList>

                <div className="border-t px-3 py-2 flex items-center justify-between text-[11px] text-muted-foreground">
                  <span className="flex items-center gap-1.5">
                    <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
                      <span className="text-xs">⌘</span>K
                    </kbd>
                    <span>to toggle</span>
                  </span>
                  <span className="flex items-center gap-1.5">
                    <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
                      <span className="text-xs">↑↓</span>
                    </kbd>
                    <span>navigate</span>
                    <span className="mx-0.5">·</span>
                    <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
                      ↵
                    </kbd>
                    <span>select</span>
                    <span className="mx-0.5">·</span>
                    <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
                      esc
                    </kbd>
                    <span>close</span>
                  </span>
                </div>
              </CommandDialog>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
