'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useCRMStore, type CRMView } from '@/stores/crm-store'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import {
  Bell,
  UserPlus,
  Briefcase,
  Video,
  Award,
  Clock,
  CheckCheck,
  ArrowRight,
} from 'lucide-react'
import { cn } from '@/lib/utils'

type ActivityType = 'candidate' | 'job' | 'interview' | 'placement' | 'attendance'

type ActivityItem = {
  id: string
  type: ActivityType
  icon: typeof UserPlus
  iconColor: string
  iconBg: string
  description: string
  time: string
  view: CRMView
  unread: boolean
}

const mockActivities: ActivityItem[] = [
  {
    id: '1',
    type: 'candidate',
    icon: UserPlus,
    iconColor: 'text-emerald-600',
    iconBg: 'bg-emerald-100',
    description: 'Sarah Johnson submitted her application for Senior Developer role',
    time: '2 min ago',
    view: 'candidates',
    unread: true,
  },
  {
    id: '2',
    type: 'job',
    icon: Briefcase,
    iconColor: 'text-amber-600',
    iconBg: 'bg-amber-100',
    description: 'New job opening "Product Manager" created by TechCorp Inc.',
    time: '15 min ago',
    view: 'jobs',
    unread: true,
  },
  {
    id: '3',
    type: 'interview',
    icon: Video,
    iconColor: 'text-violet-600',
    iconBg: 'bg-violet-100',
    description: 'Interview scheduled with Mike Chen for 3:00 PM today',
    time: '1 hour ago',
    view: 'interviews',
    unread: true,
  },
  {
    id: '4',
    type: 'placement',
    icon: Award,
    iconColor: 'text-rose-600',
    iconBg: 'bg-rose-100',
    description: 'Emily Davis was successfully placed at DataFlow Solutions',
    time: '3 hours ago',
    view: 'placements',
    unread: false,
  },
  {
    id: '5',
    type: 'attendance',
    icon: Clock,
    iconColor: 'text-sky-600',
    iconBg: 'bg-sky-100',
    description: 'Team attendance report generated for this week',
    time: '5 hours ago',
    view: 'attendance',
    unread: false,
  },
  {
    id: '6',
    type: 'candidate',
    icon: UserPlus,
    iconColor: 'text-emerald-600',
    iconBg: 'bg-emerald-100',
    description: 'Alex Rivera moved to "Offer Stage" in the hiring pipeline',
    time: 'Yesterday',
    view: 'candidates',
    unread: false,
  },
]

export function NotificationBell() {
  const [activities, setActivities] = useState(mockActivities)
  const [open, setOpen] = useState(false)
  const { navigate } = useCRMStore()

  const unreadCount = activities.filter((a) => a.unread).length

  const handleMarkAllRead = () => {
    setActivities((prev) => prev.map((a) => ({ ...a, unread: false })))
  }

  const handleActivityClick = (activity: ActivityItem) => {
    setActivities((prev) =>
      prev.map((a) => (a.id === activity.id ? { ...a, unread: false } : a))
    )
    navigate(activity.view)
    setOpen(false)
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative h-8 w-8 hover:bg-accent"
          aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ''}`}
        >
          <motion.div
            animate={unreadCount > 0 ? { rotate: [0, -10, 10, -5, 5, 0] } : {}}
            transition={{ duration: 0.5, ease: 'easeInOut' }}
            key={unreadCount}
          >
            <Bell className="h-4 w-4" />
          </motion.div>
          <AnimatePresence>
            {unreadCount > 0 && (
              <motion.span
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                transition={{ type: 'spring', stiffness: 500, damping: 25 }}
                className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold text-destructive-foreground"
              >
                {unreadCount > 9 ? '9+' : unreadCount}
              </motion.span>
            )}
          </AnimatePresence>
        </Button>
      </PopoverTrigger>

      <PopoverContent
        align="end"
        sideOffset={8}
        className="w-80 p-0 rounded-xl shadow-xl border-border/50"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold">Notifications</h3>
            {unreadCount > 0 && (
              <Badge
                variant="secondary"
                className="h-5 px-1.5 text-[10px] font-medium"
              >
                {unreadCount} new
              </Badge>
            )}
          </div>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-auto px-2 py-1 text-xs text-muted-foreground hover:text-foreground"
              onClick={handleMarkAllRead}
            >
              <CheckCheck className="mr-1 h-3 w-3" />
              Mark all read
            </Button>
          )}
        </div>

        <Separator />

        {/* Activity List */}
        <ScrollArea className="max-h-[360px]">
          <div className="flex flex-col">
            <AnimatePresence initial={false}>
              {activities.map((activity, index) => {
                const Icon = activity.icon
                return (
                  <motion.div
                    key={activity.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 10, height: 0 }}
                    transition={{
                      duration: 0.2,
                      delay: index * 0.03,
                    }}
                    className={cn(
                      'flex items-start gap-3 px-4 py-3 cursor-pointer transition-colors hover:bg-accent/50',
                      activity.unread && 'bg-primary/[0.03]'
                    )}
                    onClick={() => handleActivityClick(activity)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault()
                        handleActivityClick(activity)
                      }
                    }}
                  >
                    <div
                      className={cn(
                        'mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg',
                        activity.iconBg
                      )}
                    >
                      <Icon className={cn('h-4 w-4', activity.iconColor)} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p
                        className={cn(
                          'text-sm leading-snug',
                          activity.unread ? 'font-medium text-foreground' : 'text-muted-foreground'
                        )}
                      >
                        {activity.description}
                      </p>
                      <p className="mt-0.5 text-[11px] text-muted-foreground/70">
                        {activity.time}
                      </p>
                    </div>
                    {activity.unread && (
                      <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-primary" />
                    )}
                  </motion.div>
                )
              })}
            </AnimatePresence>
          </div>
        </ScrollArea>

        <Separator />

        {/* Footer */}
        <div className="px-4 py-2.5">
          <Button
            variant="ghost"
            className="h-auto w-full justify-center gap-1.5 py-2 text-xs font-medium text-muted-foreground hover:text-foreground"
            onClick={() => {
              setOpen(false)
              navigate('dashboard')
            }}
          >
            View all notifications
            <ArrowRight className="h-3 w-3" />
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  )
}
