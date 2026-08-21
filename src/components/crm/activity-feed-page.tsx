'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { useInfiniteQuery } from '@tanstack/react-query'
import {
  Activity,
  Users,
  Building2,
  Briefcase,
  Video,
  Award,
  UserCog,
  CalendarOff,
  Clock,
  Filter,
  X,
  Loader2,
  TrendingUp,
  Calendar,
  Database,
  ChevronDown,
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'

// ===== Types =====

interface ActivityItem {
  id: string
  entityType: string
  entityId: string | null
  action: string
  details: string | null
  employeeId: string | null
  employee: { id: string; name: string } | null
  createdAt: string
}

interface ActivityResponse {
  data: ActivityItem[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

// ===== Constants =====

const ENTITY_CONFIG: Record<string, {
  icon: typeof Users
  label: string
  color: string
  bgClass: string
  badgeClass: string
  borderClass: string
}> = {
  candidate: {
    icon: Users,
    label: 'Candidate',
    color: 'text-emerald-600 dark:text-emerald-400',
    bgClass: 'bg-emerald-50 dark:bg-emerald-500/10',
    badgeClass: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400',
    borderClass: 'border-emerald-200 dark:border-emerald-500/30',
  },
  client: {
    icon: Building2,
    label: 'Client',
    color: 'text-amber-600 dark:text-amber-400',
    bgClass: 'bg-amber-50 dark:bg-amber-500/10',
    badgeClass: 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400',
    borderClass: 'border-amber-200 dark:border-amber-500/30',
  },
  job: {
    icon: Briefcase,
    label: 'Job',
    color: 'text-violet-600 dark:text-violet-400',
    bgClass: 'bg-violet-50 dark:bg-violet-500/10',
    badgeClass: 'bg-violet-100 text-violet-700 dark:bg-violet-500/15 dark:text-violet-400',
    borderClass: 'border-violet-200 dark:border-violet-500/30',
  },
  interview: {
    icon: Video,
    label: 'Interview',
    color: 'text-cyan-600 dark:text-cyan-400',
    bgClass: 'bg-cyan-50 dark:bg-cyan-500/10',
    badgeClass: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-500/15 dark:text-cyan-400',
    borderClass: 'border-cyan-200 dark:border-cyan-500/30',
  },
  placement: {
    icon: Award,
    label: 'Placement',
    color: 'text-rose-600 dark:text-rose-400',
    bgClass: 'bg-rose-50 dark:bg-rose-500/10',
    badgeClass: 'bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-400',
    borderClass: 'border-rose-200 dark:border-rose-500/30',
  },
  employee: {
    icon: UserCog,
    label: 'Employee',
    color: 'text-teal-600 dark:text-teal-400',
    bgClass: 'bg-teal-50 dark:bg-teal-500/10',
    badgeClass: 'bg-teal-100 text-teal-700 dark:bg-teal-500/15 dark:text-teal-400',
    borderClass: 'border-teal-200 dark:border-teal-500/30',
  },
  leave: {
    icon: CalendarOff,
    label: 'Leave',
    color: 'text-orange-600 dark:text-orange-400',
    bgClass: 'bg-orange-50 dark:bg-orange-500/10',
    badgeClass: 'bg-orange-100 text-orange-700 dark:bg-orange-500/15 dark:text-orange-400',
    borderClass: 'border-orange-200 dark:border-orange-500/30',
  },
  attendance: {
    icon: Clock,
    label: 'Attendance',
    color: 'text-teal-600 dark:text-teal-400',
    bgClass: 'bg-teal-50 dark:bg-teal-500/10',
    badgeClass: 'bg-teal-100 text-teal-700 dark:bg-teal-500/15 dark:text-teal-400',
    borderClass: 'border-teal-200 dark:border-teal-500/30',
  },
}

const ACTION_LABELS: Record<string, string> = {
  created: 'Created new',
  status_updated: 'Status updated for',
  interview_scheduled: 'Interview scheduled for',
  skills_updated: 'Skills updated for',
  moved_to_pipeline: 'Moved to pipeline',
  note_added: 'Note added for',
  resume_updated: 'Resume updated for',
  rating_updated: 'Rating updated for',
  contact_updated: 'Contact updated for',
  status_changed: 'Status changed for',
  job_posted: 'Job posted by',
  meeting_scheduled: 'Meeting scheduled with',
  priority_changed: 'Priority changed for',
  requirement_updated: 'Requirements updated for',
  salary_updated: 'Salary updated for',
  candidate_assigned: 'Candidates assigned to',
  closed: 'Closed',
  scheduled: 'Scheduled',
  completed: 'Completed',
  rescheduled: 'Rescheduled',
  feedback_added: 'Feedback added for',
  cancelled: 'Cancelled',
  reminder_sent: 'Reminder sent for',
  offered: 'Offer sent for',
  accepted: 'Offer accepted for',
  joined: 'Successfully joined',
  backed_out: 'Backed out from',
  commission_generated: 'Commission generated for',
  profile_updated: 'Profile updated for',
  role_changed: 'Role changed for',
  department_changed: 'Department changed for',
  deactivated: 'Deactivated',
  requested: 'Leave requested by',
  approved: 'Leave approved for',
  rejected: 'Leave rejected for',
  balance_updated: 'Leave balance updated for',
  clocked_in: 'Clocked in',
  clocked_out: 'Clocked out',
  late_marked: 'Late arrival marked for',
  half_day: 'Half-day marked for',
  absent_marked: 'Absent marked for',
}

// ===== Helpers =====

function getRelativeTime(dateStr: string): string {
  const now = new Date()
  const date = new Date(dateStr)
  const diffMs = now.getTime() - date.getTime()
  const diffSecs = Math.floor(diffMs / 1000)
  const diffMins = Math.floor(diffSecs / 60)
  const diffHours = Math.floor(diffMins / 60)
  const diffDays = Math.floor(diffHours / 24)
  const diffWeeks = Math.floor(diffDays / 7)

  if (diffSecs < 60) return 'Just now'
  if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`
  if (diffDays === 1) return 'Yesterday'
  if (diffDays < 7) return `${diffDays} days ago`
  if (diffWeeks === 1) return 'Last week'
  if (diffWeeks < 4) return `${diffWeeks} weeks ago`
  return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
}

function getActionText(action: string, entityType: string): string {
  const actionLabel = ACTION_LABELS[action] || action.replace(/_/g, ' ')
  const entityLabel = ENTITY_CONFIG[entityType]?.label || entityType
  return `${actionLabel} ${entityLabel.toLowerCase()}`
}

function isToday(dateStr: string): boolean {
  const d = new Date(dateStr)
  const now = new Date()
  return d.getDate() === now.getDate() &&
    d.getMonth() === now.getMonth() &&
    d.getFullYear() === now.getFullYear()
}

function isThisWeek(dateStr: string): boolean {
  const d = new Date(dateStr)
  const now = new Date()
  const startOfWeek = new Date(now)
  startOfWeek.setDate(now.getDate() - now.getDay())
  startOfWeek.setHours(0, 0, 0, 0)
  return d >= startOfWeek
}

// ===== Animation Variants =====

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.06 },
  },
}

const itemVariants = {
  hidden: { opacity: 0, x: -16 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { type: 'spring', stiffness: 300, damping: 24 },
  },
}

const statCardVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.95 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { delay: i * 0.1, type: 'spring', stiffness: 300, damping: 24 },
  }),
}

// ===== Sub-components =====

function ActivityCard({ item, index }: { item: ActivityItem; index: number }) {
  const config = ENTITY_CONFIG[item.entityType] || ENTITY_CONFIG.candidate
  const Icon = config.icon
  const actionText = getActionText(item.action, item.entityType)
  const relativeTime = getRelativeTime(item.createdAt)

  return (
    <motion.div
      variants={itemVariants}
      className="relative flex gap-4"
    >
      {/* Timeline connector line */}
      <div className="relative flex flex-col items-center">
        <div className={cn(
          'relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full ring-4 ring-background transition-colors',
          config.bgClass,
        )}>
          <Icon className={cn('h-4.5 w-4.5', config.color)} />
        </div>
        <div className="absolute top-10 bottom-0 w-px bg-gradient-to-b from-border via-border/50 to-transparent" />
      </div>

      {/* Content card */}
      <motion.div
        className={cn(
          'flex-1 rounded-xl border bg-card p-4 mb-4 transition-all duration-200',
          'hover:shadow-md hover:border-border/80',
          config.borderClass,
        )}
        whileHover={{ y: -1, transition: { duration: 0.2 } }}
      >
        <div className="flex flex-col gap-2">
          {/* Top row: action text + timestamp */}
          <div className="flex items-start justify-between gap-2">
            <p className="text-sm font-medium leading-relaxed">
              {actionText}
            </p>
            <span className="shrink-0 text-xs text-muted-foreground whitespace-nowrap">
              {relativeTime}
            </span>
          </div>

          {/* Employee name */}
          {item.employee && (
            <div className="flex items-center gap-1.5">
              <div className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 text-[10px] font-semibold text-primary">
                {item.employee.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
              </div>
              <span className="text-xs text-muted-foreground">by <span className="font-medium text-foreground">{item.employee.name}</span></span>
            </div>
          )}

          {/* Details */}
          {item.details && (
            <p className="text-xs text-muted-foreground leading-relaxed">{item.details}</p>
          )}

          {/* Entity badge */}
          <Badge
            variant="secondary"
            className={cn('self-start text-[10px] font-medium px-2 py-0 h-5 rounded-full', config.badgeClass)}
          >
            {config.label}
          </Badge>
        </div>
      </motion.div>
    </motion.div>
  )
}

function StatsCards({ activities, total }: { activities: ActivityItem[]; total: number }) {
  const todayCount = useMemo(() => activities.filter(a => isToday(a.createdAt)).length, [activities])
  const weekCount = useMemo(() => activities.filter(a => isThisWeek(a.createdAt)).length, [activities])

  const stats = [
    {
      icon: TrendingUp,
      label: "Today's Activities",
      value: todayCount,
      gradient: 'from-emerald-500 to-teal-500',
      bgGradient: 'from-emerald-500/10 to-teal-500/10',
    },
    {
      icon: Calendar,
      label: 'This Week',
      value: weekCount,
      gradient: 'from-amber-500 to-orange-500',
      bgGradient: 'from-amber-500/10 to-orange-500/10',
    },
    {
      icon: Database,
      label: 'Total Records',
      value: total,
      gradient: 'from-rose-500 to-violet-500',
      bgGradient: 'from-rose-500/10 to-violet-500/10',
    },
  ]

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      {stats.map((stat, i) => {
        const Icon = stat.icon
        return (
          <motion.div
            key={stat.label}
            custom={i}
            variants={statCardVariants}
            initial="hidden"
            animate="visible"
          >
            <Card className="relative overflow-hidden border-0 shadow-sm">
              <div className={cn('absolute inset-0 bg-gradient-to-br opacity-50', stat.bgGradient)} />
              <CardContent className="relative p-4 flex items-center gap-3">
                <div className={cn('flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br text-white shadow-sm', stat.gradient)}>
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-2xl font-bold tracking-tight">{stat.value}</p>
                  <p className="text-xs text-muted-foreground">{stat.label}</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )
      })}
    </div>
  )
}

function EmptyState() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2, type: 'spring', stiffness: 200, damping: 20 }}
      className="flex flex-col items-center justify-center py-20 text-center"
    >
      <div className="relative mb-6">
        <div className="absolute inset-0 rounded-full bg-gradient-to-br from-emerald-500/20 to-teal-500/20 blur-2xl scale-150" />
        <div className="relative flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-emerald-100 to-teal-100 dark:from-emerald-500/20 dark:to-teal-500/20">
          <Activity className="h-9 w-9 text-emerald-600 dark:text-emerald-400" />
        </div>
      </div>
      <h3 className="text-lg font-semibold mb-2">No Activity Yet</h3>
      <p className="text-sm text-muted-foreground max-w-sm">
        Activity logs will appear here as you interact with the recruitment pipeline. Start by adding candidates, scheduling interviews, or managing placements.
      </p>
    </motion.div>
  )
}

// ===== Main Component =====

export function ActivityFeedPage() {
  const [entityTypeFilter, setEntityTypeFilter] = useState<string>('all')
  const [actionFilter, setActionFilter] = useState<string>('all')
  const observerRef = useRef<IntersectionObserver | null>(null)
  const loadMoreRef = useRef<HTMLDivElement>(null)

  // Build query key (filter changes auto-reset infinite query)
  const filterKey = useMemo(() => `${entityTypeFilter}-${actionFilter}`, [entityTypeFilter, actionFilter])

  const fetchPage = useCallback(async ({ pageParam = 1 }: { pageParam?: number }): Promise<ActivityResponse> => {
    const params = new URLSearchParams()
    params.set('page', String(pageParam))
    params.set('limit', '20')
    if (entityTypeFilter !== 'all') params.set('entityType', entityTypeFilter)
    if (actionFilter !== 'all') params.set('action', actionFilter)
    const res = await fetch(`/api/activity?${params.toString()}`)
    return res.json()
  }, [entityTypeFilter, actionFilter])

  const {
    data,
    isLoading,
    isFetchingNextPage,
    isError,
    hasNextPage,
    fetchNextPage,
  } = useInfiniteQuery({
    queryKey: ['activities', filterKey],
    queryFn: fetchPage,
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      return lastPage.pagination.page < lastPage.pagination.totalPages
        ? lastPage.pagination.page + 1
        : undefined
    },
    staleTime: 30_000,
  })

  // Flatten pages into single array
  const allActivities = useMemo(() => {
    return data?.pages.flatMap(p => p.data) ?? []
  }, [data])

  const totalRecords = data?.pages[0]?.pagination.total ?? 0

  // Infinite scroll with IntersectionObserver
  useEffect(() => {
    if (observerRef.current) observerRef.current.disconnect()
    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage()
        }
      },
      { rootMargin: '200px' }
    )
    if (loadMoreRef.current) observerRef.current.observe(loadMoreRef.current)
    return () => observerRef.current?.disconnect()
  }, [hasNextPage, isFetchingNextPage, fetchNextPage])

  const hasActiveFilters = entityTypeFilter !== 'all' || actionFilter !== 'all'

  const clearFilters = () => {
    setEntityTypeFilter('all')
    setActionFilter('all')
  }

  // Available actions based on entity type
  const availableActions = useMemo(() => {
    if (entityTypeFilter === 'all') return Object.keys(ACTION_LABELS)
    const typeActions: Record<string, string[]> = {
      candidate: ['created', 'status_updated', 'interview_scheduled', 'skills_updated', 'moved_to_pipeline', 'note_added', 'resume_updated', 'rating_updated'],
      client: ['created', 'contact_updated', 'status_changed', 'job_posted', 'meeting_scheduled'],
      job: ['created', 'priority_changed', 'status_updated', 'requirement_updated', 'salary_updated', 'candidate_assigned', 'closed'],
      interview: ['scheduled', 'completed', 'rescheduled', 'feedback_added', 'cancelled', 'reminder_sent'],
      placement: ['offered', 'accepted', 'joined', 'backed_out', 'commission_generated'],
      employee: ['created', 'profile_updated', 'role_changed', 'department_changed', 'deactivated'],
      leave: ['requested', 'approved', 'rejected', 'cancelled', 'balance_updated'],
      attendance: ['clocked_in', 'clocked_out', 'late_marked', 'half_day', 'absent_marked'],
    }
    return typeActions[entityTypeFilter] || []
  }, [entityTypeFilter])

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 text-white shadow-sm">
              <Activity className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight">Activity Feed</h1>
              <p className="text-sm text-muted-foreground">Track all actions and changes across your recruitment pipeline</p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Stats Summary */}
      {!isLoading && !isError && allActivities.length > 0 && (
        <StatsCards activities={allActivities} total={totalRecords} />
      )}

      {/* Loading stats skeleton */}
      {isLoading && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
      )}

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15, duration: 0.3 }}
        className="flex flex-wrap items-center gap-3"
      >
        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <Filter className="h-4 w-4" />
          <span className="font-medium">Filters</span>
        </div>
        <Select value={entityTypeFilter} onValueChange={setEntityTypeFilter}>
          <SelectTrigger className="w-[170px] h-9 text-sm">
            <SelectValue placeholder="Entity Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Entities</SelectItem>
            {Object.entries(ENTITY_CONFIG).map(([key, cfg]) => (
              <SelectItem key={key} value={key}>{cfg.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={actionFilter} onValueChange={setActionFilter}>
          <SelectTrigger className="w-[200px] h-9 text-sm">
            <SelectValue placeholder="Action Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Actions</SelectItem>
            {availableActions.map((action) => (
              <SelectItem key={action} value={action}>
                {ACTION_LABELS[action] || action.replace(/_/g, ' ')}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            className="h-9 text-xs gap-1 text-muted-foreground hover:text-foreground"
            onClick={clearFilters}
          >
            <X className="h-3 w-3" />
            Clear Filters
          </Button>
        )}
      </motion.div>

      {/* Activity Timeline */}
      <div className="relative">
        {/* Gradient timeline line (desktop) */}
        <div className="absolute left-[19px] top-0 bottom-0 w-px bg-gradient-to-b from-emerald-500/30 via-teal-500/20 to-transparent hidden sm:block" />

        {isLoading ? (
          <div className="space-y-4 pl-0 sm:pl-14">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex gap-4">
                <Skeleton className="h-10 w-10 rounded-full shrink-0 hidden sm:block" />
                <Skeleton className="h-24 flex-1 rounded-xl" />
              </div>
            ))}
          </div>
        ) : isError ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <p className="text-sm text-destructive">Failed to load activities. Please try again.</p>
          </div>
        ) : allActivities.length === 0 ? (
          <EmptyState />
        ) : (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            key={filterKey}
          >
            {allActivities.map((item, index) => (
              <ActivityCard key={item.id} item={item} index={index} />
            ))}
          </motion.div>
        )}

        {/* Infinite scroll trigger / Load More */}
        {hasNextPage && allActivities.length > 0 && (
          <div ref={loadMoreRef} className="flex justify-center py-6">
            {isFetchingNextPage ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Loading more activities...</span>
              </div>
            ) : (
              <Button
                variant="outline"
                size="sm"
                className="gap-2"
                onClick={() => fetchNextPage()}
              >
                <ChevronDown className="h-4 w-4" />
                Load More
              </Button>
            )}
          </div>
        )}

        {/* End of list indicator */}
        {!hasNextPage && allActivities.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center justify-center py-4 text-xs text-muted-foreground"
          >
            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-border to-transparent" />
            <span className="px-4">You&apos;ve reached the end</span>
            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-border to-transparent" />
          </motion.div>
        )}
      </div>
    </div>
  )
}
