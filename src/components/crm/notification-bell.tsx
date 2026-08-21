'use client'

import { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import { useCRMStore, type CRMView } from '@/stores/crm-store'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Bell,
  UserPlus,
  Building2,
  Briefcase,
  Video,
  Award,
  UserCog,
  CalendarOff,
  Clock,
  CheckCheck,
  ArrowRight,
  AlertCircle,
} from 'lucide-react'
import { cn } from '@/lib/utils'

// --- Entity Type Config ---

type ApiEntityType = 'candidate' | 'client' | 'job' | 'interview' | 'placement' | 'employee' | 'leave' | 'attendance'

type EntityConfig = {
  icon: typeof UserPlus
  iconColor: string
  iconBg: string
  label: string
  view: CRMView
}

const ENTITY_CONFIG: Record<ApiEntityType, EntityConfig> = {
  candidate: {
    icon: UserPlus,
    iconColor: 'text-emerald-600 dark:text-emerald-400',
    iconBg: 'bg-emerald-100 dark:bg-emerald-950/50',
    label: 'candidate',
    view: 'candidates',
  },
  client: {
    icon: Building2,
    iconColor: 'text-amber-600 dark:text-amber-400',
    iconBg: 'bg-amber-100 dark:bg-amber-950/50',
    label: 'client',
    view: 'clients',
  },
  job: {
    icon: Briefcase,
    iconColor: 'text-violet-600 dark:text-violet-400',
    iconBg: 'bg-violet-100 dark:bg-violet-950/50',
    label: 'job',
    view: 'jobs',
  },
  interview: {
    icon: Video,
    iconColor: 'text-cyan-600 dark:text-cyan-400',
    iconBg: 'bg-cyan-100 dark:bg-cyan-950/50',
    label: 'interview',
    view: 'interviews',
  },
  placement: {
    icon: Award,
    iconColor: 'text-rose-600 dark:text-rose-400',
    iconBg: 'bg-rose-100 dark:bg-rose-950/50',
    label: 'placement',
    view: 'placements',
  },
  employee: {
    icon: UserCog,
    iconColor: 'text-teal-600 dark:text-teal-400',
    iconBg: 'bg-teal-100 dark:bg-teal-950/50',
    label: 'employee',
    view: 'employees',
  },
  leave: {
    icon: CalendarOff,
    iconColor: 'text-orange-600 dark:text-orange-400',
    iconBg: 'bg-orange-100 dark:bg-orange-950/50',
    label: 'leave',
    view: 'leave',
  },
  attendance: {
    icon: Clock,
    iconColor: 'text-teal-600 dark:text-teal-400',
    iconBg: 'bg-teal-100 dark:bg-teal-950/50',
    label: 'attendance',
    view: 'attendance',
  },
}

// --- API Types ---

type ApiActivity = {
  id: string
  entityType: string
  entityId: string
  action: string
  details: string
  employeeId: string
  createdAt: string
  employee: {
    id: string
    name: string
  } | null
}

type ActivityItem = {
  id: string
  entityType: ApiEntityType
  icon: typeof UserPlus
  iconColor: string
  iconBg: string
  description: string
  time: string
  view: CRMView
  unread: boolean
}

// --- Helpers ---

function getRelativeTime(dateString: string): string {
  const now = Date.now()
  const then = new Date(dateString).getTime()
  const diffMs = now - then
  const diffSeconds = Math.floor(diffMs / 1000)
  const diffMinutes = Math.floor(diffSeconds / 60)
  const diffHours = Math.floor(diffMinutes / 60)
  const diffDays = Math.floor(diffHours / 24)
  const diffWeeks = Math.floor(diffDays / 7)

  if (diffSeconds < 60) {
    return 'Just now'
  }
  if (diffMinutes === 1) return '1 min ago'
  if (diffMinutes < 60) return `${diffMinutes} min ago`
  if (diffHours === 1) return '1 hour ago'
  if (diffHours < 24) return `${diffHours} hours ago`
  if (diffDays === 1) return 'Yesterday'
  if (diffDays < 7) return `${diffDays} days ago`
  if (diffWeeks === 1) return '1 week ago'
  return `${diffWeeks} weeks ago`
}

function formatAction(action: string): string {
  return action
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ')
}

function generateDescription(activity: ApiActivity): string {
  const config = ENTITY_CONFIG[activity.entityType as ApiEntityType]
  const entityLabel = config?.label ?? activity.entityType
  const employeeName = activity.employee?.name
  const actionText = formatAction(activity.action)

  if (employeeName) {
    return `${employeeName} ${actionText} a new ${entityLabel}`
  }
  return `${actionText} ${entityLabel}`
}

function mapApiToActivityItem(api: ApiActivity): ActivityItem {
  const config = ENTITY_CONFIG[api.entityType as ApiEntityType] ?? {
    icon: Bell,
    iconColor: 'text-muted-foreground',
    iconBg: 'bg-muted',
    label: api.entityType,
    view: 'dashboard' as CRMView,
  }

  return {
    id: api.id,
    entityType: api.entityType as ApiEntityType,
    icon: config.icon,
    iconColor: config.iconColor,
    iconBg: config.iconBg,
    description: generateDescription(api),
    time: getRelativeTime(api.createdAt),
    view: config.view,
    unread: true,
  }
}

// --- Loading Skeleton ---

function NotificationSkeleton() {
  return (
    <div className="flex items-start gap-3 px-4 py-3">
      <Skeleton className="h-8 w-8 shrink-0 rounded-lg" />
      <div className="flex-1 space-y-1.5">
        <Skeleton className="h-3.5 w-full" />
        <Skeleton className="h-2.5 w-20" />
      </div>
    </div>
  )
}

// --- Main Component ---

export function NotificationBell() {
  const [readIds, setReadIds] = useState<Set<string>>(new Set())
  const [open, setOpen] = useState(false)
  const { navigate } = useCRMStore()

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['activities', 'notifications'],
    queryFn: async () => {
      const res = await fetch('/api/activity?page=1&limit=10')
      if (!res.ok) throw new Error('Failed to fetch activities')
      const json = await res.json()
      return json.data as ApiActivity[]
    },
    refetchInterval: 30000,
  })

  const activities = useMemo<ActivityItem[]>(() => {
    if (!data) return []
    return data.map(mapApiToActivityItem)
  }, [data])

  const unreadCount = activities.filter((a) => !readIds.has(a.id)).length

  const handleMarkAllRead = () => {
    if (activities.length === 0) return
    setReadIds(new Set(activities.map((a) => a.id)))
  }

  const handleActivityClick = (activity: ActivityItem) => {
    setReadIds((prev) => new Set(prev).add(activity.id))
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

        {/* Content Area */}
        <ScrollArea className="max-h-[360px]">
          {isLoading && (
            <div className="flex flex-col py-1">
              {Array.from({ length: 5 }).map((_, i) => (
                <NotificationSkeleton key={i} />
              ))}
            </div>
          )}

          {isError && (
            <div className="flex flex-col items-center justify-center gap-2 px-4 py-8 text-center">
              <AlertCircle className="h-8 w-8 text-destructive/60" />
              <p className="text-sm text-muted-foreground">
                Could not load notifications
              </p>
              <Button
                variant="outline"
                size="sm"
                className="mt-1 text-xs"
                onClick={() => refetch()}
              >
                Try again
              </Button>
            </div>
          )}

          {!isLoading && !isError && activities.length === 0 && (
            <div className="flex flex-col items-center justify-center gap-2 px-4 py-8 text-center">
              <Bell className="h-8 w-8 text-muted-foreground/40" />
              <p className="text-sm text-muted-foreground">No notifications yet</p>
            </div>
          )}

          {!isLoading && !isError && activities.length > 0 && (
            <div className="flex flex-col">
              <AnimatePresence initial={false}>
                {activities.map((activity, index) => {
                  const Icon = activity.icon
                  const isRead = readIds.has(activity.id)
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
                        !isRead && 'bg-primary/[0.03]'
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
                            !isRead ? 'font-medium text-foreground' : 'text-muted-foreground'
                          )}
                        >
                          {activity.description}
                        </p>
                        <p className="mt-0.5 text-[11px] text-muted-foreground/70">
                          {activity.time}
                        </p>
                      </div>
                      {!isRead && (
                        <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-primary" />
                      )}
                    </motion.div>
                  )
                })}
              </AnimatePresence>
            </div>
          )}
        </ScrollArea>

        <Separator />

        {/* Footer */}
        <div className="px-4 py-2.5">
          <Button
            variant="ghost"
            className="h-auto w-full justify-center gap-1.5 py-2 text-xs font-medium text-muted-foreground hover:text-foreground"
            onClick={() => {
              setOpen(false)
              navigate('notifications')
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
