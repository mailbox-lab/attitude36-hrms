'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useInfiniteQuery, useQuery } from '@tanstack/react-query'
import { useCRMStore, type CRMView } from '@/stores/crm-store'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Bell,
  Activity,
  BellDot,
  Clock,
  CheckCheck,
  Filter,
  X,
  Loader2,
  ChevronDown,
  Eye,
  EyeOff,
  ExternalLink,
  Users,
  Building2,
  Briefcase,
  Video,
  Award,
  UserCog,
  CalendarOff,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

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
  view: CRMView
}> = {
  candidate: {
    icon: Users,
    label: 'Candidate',
    color: 'text-emerald-600 dark:text-emerald-400',
    bgClass: 'bg-emerald-100 dark:bg-emerald-950/50',
    badgeClass: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400',
    view: 'candidates',
  },
  client: {
    icon: Building2,
    label: 'Client',
    color: 'text-amber-600 dark:text-amber-400',
    bgClass: 'bg-amber-100 dark:bg-amber-950/50',
    badgeClass: 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400',
    view: 'clients',
  },
  job: {
    icon: Briefcase,
    label: 'Job',
    color: 'text-violet-600 dark:text-violet-400',
    bgClass: 'bg-violet-100 dark:bg-violet-950/50',
    badgeClass: 'bg-violet-100 text-violet-700 dark:bg-violet-500/15 dark:text-violet-400',
    view: 'jobs',
  },
  interview: {
    icon: Video,
    label: 'Interview',
    color: 'text-cyan-600 dark:text-cyan-400',
    bgClass: 'bg-cyan-100 dark:bg-cyan-950/50',
    badgeClass: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-500/15 dark:text-cyan-400',
    view: 'interviews',
  },
  placement: {
    icon: Award,
    label: 'Placement',
    color: 'text-rose-600 dark:text-rose-400',
    bgClass: 'bg-rose-100 dark:bg-rose-950/50',
    badgeClass: 'bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-400',
    view: 'placements',
  },
  employee: {
    icon: UserCog,
    label: 'Employee',
    color: 'text-teal-600 dark:text-teal-400',
    bgClass: 'bg-teal-100 dark:bg-teal-950/50',
    badgeClass: 'bg-teal-100 text-teal-700 dark:bg-teal-500/15 dark:text-teal-400',
    view: 'employees',
  },
  leave: {
    icon: CalendarOff,
    label: 'Leave',
    color: 'text-orange-600 dark:text-orange-400',
    bgClass: 'bg-orange-100 dark:bg-orange-950/50',
    badgeClass: 'bg-orange-100 text-orange-700 dark:bg-orange-500/15 dark:text-orange-400',
    view: 'leave',
  },
  attendance: {
    icon: Clock,
    label: 'Attendance',
    color: 'text-teal-600 dark:text-teal-400',
    bgClass: 'bg-teal-100 dark:bg-teal-950/50',
    badgeClass: 'bg-teal-100 text-teal-700 dark:bg-teal-500/15 dark:text-teal-400',
    view: 'attendance',
  },
}

const ACTION_LABELS: Record<string, string> = {
  created: 'Created',
  status_updated: 'Status Updated',
  interview_scheduled: 'Interview Scheduled',
  skills_updated: 'Skills Updated',
  moved_to_pipeline: 'Moved to Pipeline',
  note_added: 'Note Added',
  resume_updated: 'Resume Updated',
  rating_updated: 'Rating Updated',
  contact_updated: 'Contact Updated',
  status_changed: 'Status Changed',
  job_posted: 'Job Posted',
  meeting_scheduled: 'Meeting Scheduled',
  priority_changed: 'Priority Changed',
  requirement_updated: 'Requirements Updated',
  salary_updated: 'Salary Updated',
  candidate_assigned: 'Candidates Assigned',
  closed: 'Closed',
  scheduled: 'Scheduled',
  completed: 'Completed',
  rescheduled: 'Rescheduled',
  feedback_added: 'Feedback Added',
  cancelled: 'Cancelled',
  reminder_sent: 'Reminder Sent',
  offered: 'Offered',
  accepted: 'Accepted',
  joined: 'Joined',
  backed_out: 'Backed Out',
  commission_generated: 'Commission Generated',
  profile_updated: 'Profile Updated',
  role_changed: 'Role Changed',
  department_changed: 'Department Changed',
  deactivated: 'Deactivated',
  requested: 'Requested',
  approved: 'Approved',
  rejected: 'Rejected',
  balance_updated: 'Balance Updated',
  clocked_in: 'Clocked In',
  clocked_out: 'Clocked Out',
  late_marked: 'Late Marked',
  half_day: 'Half Day',
  absent_marked: 'Absent Marked',
}

const ENTITY_ACTIONS: Record<string, string[]> = {
  candidate: ['created', 'status_updated', 'interview_scheduled', 'skills_updated', 'moved_to_pipeline', 'note_added', 'resume_updated', 'rating_updated'],
  client: ['created', 'contact_updated', 'status_changed', 'job_posted', 'meeting_scheduled'],
  job: ['created', 'priority_changed', 'status_updated', 'requirement_updated', 'salary_updated', 'candidate_assigned', 'closed'],
  interview: ['scheduled', 'completed', 'rescheduled', 'feedback_added', 'cancelled', 'reminder_sent'],
  placement: ['offered', 'accepted', 'joined', 'backed_out', 'commission_generated'],
  employee: ['created', 'profile_updated', 'role_changed', 'department_changed', 'deactivated'],
  leave: ['requested', 'approved', 'rejected', 'cancelled', 'balance_updated'],
  attendance: ['clocked_in', 'clocked_out', 'late_marked', 'half_day', 'absent_marked'],
}

// ===== Helpers =====

function getRelativeTime(dateStr: string): string {
  const now = Date.now()
  const then = new Date(dateStr).getTime()
  const diffMs = now - then
  const diffSeconds = Math.floor(diffMs / 1000)
  const diffMinutes = Math.floor(diffSeconds / 60)
  const diffHours = Math.floor(diffMinutes / 60)
  const diffDays = Math.floor(diffHours / 24)
  const diffWeeks = Math.floor(diffDays / 7)

  if (diffSeconds < 60) return 'Just now'
  if (diffMinutes === 1) return '1 min ago'
  if (diffMinutes < 60) return `${diffMinutes} min ago`
  if (diffHours === 1) return '1 hour ago'
  if (diffHours < 24) return `${diffHours} hours ago`
  if (diffDays === 1) return 'Yesterday'
  if (diffDays < 7) return `${diffDays} days ago`
  if (diffWeeks === 1) return '1 week ago'
  return `${diffWeeks} weeks ago`
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

function isThisMonth(dateStr: string): boolean {
  const d = new Date(dateStr)
  const now = new Date()
  return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
}

function getDateRangeFilter(dateRange: string, customFrom?: string, customTo?: string): { from?: string; to?: string } {
  if (dateRange === 'today') {
    const today = new Date().toISOString().split('T')[0]
    return { from: today, to: today }
  }
  if (dateRange === 'week') {
    const now = new Date()
    const start = new Date(now)
    start.setDate(now.getDate() - now.getDay())
    start.setHours(0, 0, 0, 0)
    return { from: start.toISOString().split('T')[0], to: now.toISOString().split('T')[0] }
  }
  if (dateRange === 'month' && !customFrom && !customTo) {
    const now = new Date()
    const start = new Date(now.getFullYear(), now.getMonth(), 1)
    return { from: start.toISOString().split('T')[0], to: now.toISOString().split('T')[0] }
  }
  if (dateRange === 'custom' && customFrom && customTo) {
    return { from: customFrom, to: customTo }
  }
  return {}
}

// ===== Animation Variants =====

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.04 },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: {
    opacity: 1,
    y: 0,
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

function NotificationSkeleton() {
  return (
    <div className="flex items-start gap-3 rounded-xl border bg-card p-4">
      <Skeleton className="h-5 w-5 shrink-0 rounded" />
      <Skeleton className="h-10 w-10 shrink-0 rounded-full" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
      </div>
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
        <div className="absolute inset-0 rounded-full bg-gradient-to-br from-amber-500/20 to-rose-500/20 blur-2xl scale-150" />
        <div className="relative flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-amber-100 to-rose-100 dark:from-amber-500/20 dark:to-rose-500/20">
          <Bell className="h-9 w-9 text-amber-600 dark:text-amber-400" />
        </div>
      </div>
      <h3 className="text-lg font-semibold mb-2">No Notifications</h3>
      <p className="text-sm text-muted-foreground max-w-sm">
        Notifications will appear here as you interact with the recruitment pipeline. Start by adding candidates, scheduling interviews, or managing placements.
      </p>
    </motion.div>
  )
}

// ===== Main Component =====

export function NotificationCenter() {
  const { navigate } = useCRMStore()

  // Filters
  const [entityTypeFilter, setEntityTypeFilter] = useState<string>('all')
  const [actionFilter, setActionFilter] = useState<string>('all')
  const [readFilter, setReadFilter] = useState<'all' | 'unread' | 'read'>('all')
  const [dateRange, setDateRange] = useState<string>('all')
  const [customFrom, setCustomFrom] = useState<string>('')
  const [customTo, setCustomTo] = useState<string>('')

  // Client-side read tracking
  const [readIds, setReadIds] = useState<Set<string>>(new Set())

  // Selection for batch actions
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  // Refs
  const observerRef = useRef<IntersectionObserver | null>(null)
  const loadMoreRef = useRef<HTMLDivElement>(null)

  // Build filter key for query invalidation
  const filterKey = useMemo(
    () => `${entityTypeFilter}-${actionFilter}-${dateRange}-${customFrom}-${customTo}`,
    [entityTypeFilter, actionFilter, dateRange, customFrom, customTo]
  )

  // Fetch notifications with infinite query
  const fetchPage = useCallback(async ({ pageParam = 1 }: { pageParam?: number }): Promise<ActivityResponse> => {
    const params = new URLSearchParams()
    params.set('page', String(pageParam))
    params.set('limit', '25')
    if (entityTypeFilter !== 'all') params.set('entityType', entityTypeFilter)
    if (actionFilter !== 'all') params.set('action', actionFilter)
    const res = await fetch(`/api/activity?${params.toString()}`)
    if (!res.ok) throw new Error('Failed to fetch activities')
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
    queryKey: ['notifications', filterKey],
    queryFn: fetchPage,
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      return lastPage.pagination.page < lastPage.pagination.totalPages
        ? lastPage.pagination.page + 1
        : undefined
    },
    staleTime: 30_000,
  })

  // Flatten pages
  const allActivities = useMemo(() => {
    return data?.pages.flatMap(p => p.data) ?? []
  }, [data])

  const totalRecords = data?.pages[0]?.pagination.total ?? 0

  // Stats query (unfiltered)
  const { data: statsData } = useQuery({
    queryKey: ['notifications-stats'],
    queryFn: async () => {
      const res = await fetch('/api/activity?page=1&limit=1000')
      if (!res.ok) throw new Error('Failed')
      const json = await res.json()
      return json.data as ActivityItem[]
    },
    staleTime: 60_000,
  })

  const stats = useMemo(() => {
    const items = statsData ?? []
    const totalCount = items.length
    const unreadCount = items.filter(a => !readIds.has(a.id)).length
    const todayCount = items.filter(a => isToday(a.createdAt)).length
    return { totalCount, unreadCount, todayCount }
  }, [statsData, readIds])

  // Available actions based on entity type
  const availableActions = useMemo(() => {
    if (entityTypeFilter === 'all') return Object.keys(ACTION_LABELS)
    return ENTITY_ACTIONS[entityTypeFilter] || []
  }, [entityTypeFilter])

  // Apply client-side filters (read/unread, date range)
  const filteredActivities = useMemo(() => {
    let filtered = allActivities

    // Date range filter (client-side since API doesn't support it)
    if (dateRange !== 'all') {
      const range = getDateRangeFilter(dateRange, customFrom, customTo)
      if (range.from && range.to) {
        filtered = filtered.filter(a => {
          const dateStr = a.createdAt.split('T')[0]
          return dateStr >= range.from! && dateStr <= range.to!
        })
      }
    }

    // Read/unread filter
    if (readFilter === 'unread') {
      filtered = filtered.filter(a => !readIds.has(a.id))
    } else if (readFilter === 'read') {
      filtered = filtered.filter(a => readIds.has(a.id))
    }

    return filtered
  }, [allActivities, dateRange, customFrom, customTo, readFilter, readIds])

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

  // Handlers
  const hasActiveFilters = entityTypeFilter !== 'all' || actionFilter !== 'all' || readFilter !== 'all' || dateRange !== 'all'

  const clearFilters = () => {
    setEntityTypeFilter('all')
    setActionFilter('all')
    setReadFilter('all')
    setDateRange('all')
    setCustomFrom('')
    setCustomTo('')
    setSelectedIds(new Set())
  }

  const handleMarkAllRead = () => {
    if (allActivities.length === 0) return
    setReadIds(new Set(allActivities.map(a => a.id)))
    toast.success('All notifications marked as read')
  }

  const handleToggleRead = (id: string) => {
    setReadIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  const handleNotificationClick = (item: ActivityItem) => {
    setReadIds(prev => new Set(prev).add(item.id))
    const config = ENTITY_CONFIG[item.entityType]
    if (config) {
      navigate(config.view)
    }
  }

  const handleToggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  const handleSelectAll = () => {
    if (selectedIds.size === filteredActivities.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(filteredActivities.map(a => a.id)))
    }
  }

  const handleBatchMarkRead = () => {
    setReadIds(prev => {
      const next = new Set(prev)
      selectedIds.forEach(id => next.add(id))
      return next
    })
    toast.success(`${selectedIds.size} notification${selectedIds.size !== 1 ? 's' : ''} marked as read`)
    setSelectedIds(new Set())
  }

  const handleBatchMarkUnread = () => {
    setReadIds(prev => {
      const next = new Set(prev)
      selectedIds.forEach(id => next.delete(id))
      return next
    })
    toast.success(`${selectedIds.size} notification${selectedIds.size !== 1 ? 's' : ''} marked as unread`)
    setSelectedIds(new Set())
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
      >
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 dark:bg-amber-950 text-amber-600 dark:text-amber-400">
            <Bell className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">Notification Center</h1>
            <p className="text-sm text-muted-foreground">View and manage all system activities</p>
          </div>
        </div>
        <div className="h-1 w-16 rounded-full bg-gradient-to-r from-amber-400 to-rose-400 sm:hidden" />
        <Button
          variant="outline"
          size="sm"
          className="hidden sm:flex items-center gap-1.5"
          onClick={handleMarkAllRead}
          disabled={stats.unreadCount === 0}
        >
          <CheckCheck className="h-3.5 w-3.5" />
          Mark All Read
        </Button>
        {/* Mobile mark all read */}
        <Button
          variant="outline"
          size="sm"
          className="sm:hidden self-end"
          onClick={handleMarkAllRead}
          disabled={stats.unreadCount === 0}
        >
          <CheckCheck className="h-3.5 w-3.5 mr-1" />
          Mark All Read
        </Button>
      </motion.div>

      {/* Gradient accent line (desktop) */}
      <div className="hidden sm:block h-1 w-16 rounded-full bg-gradient-to-r from-amber-400 to-rose-400" />

      {/* Stats Row */}
      {!isLoading && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            {
              icon: Activity,
              label: 'Total Notifications',
              value: stats.totalCount,
              gradient: 'from-emerald-500 to-teal-500',
              bgGradient: 'from-emerald-500/10 to-teal-500/10',
              accentLine: 'bg-gradient-to-r from-emerald-500 to-teal-500',
            },
            {
              icon: BellDot,
              label: 'Unread',
              value: stats.unreadCount,
              gradient: 'from-amber-500 to-orange-500',
              bgGradient: 'from-amber-500/10 to-orange-500/10',
              accentLine: 'bg-gradient-to-r from-amber-500 to-orange-500',
            },
            {
              icon: Clock,
              label: "Today's Activity",
              value: stats.todayCount,
              gradient: 'from-teal-500 to-cyan-500',
              bgGradient: 'from-teal-500/10 to-cyan-500/10',
              accentLine: 'bg-gradient-to-r from-teal-500 to-cyan-500',
            },
          ].map((stat, i) => {
            const Icon = stat.icon
            return (
              <motion.div
                key={stat.label}
                custom={i}
                variants={statCardVariants}
                initial="hidden"
                animate="visible"
              >
                <Card className="relative overflow-hidden rounded-xl border bg-card p-4">
                  <div className={cn('absolute top-0 left-0 right-0 h-0.5', stat.accentLine)} />
                  <CardContent className="relative p-0 flex items-center gap-3">
                    <div className={cn(
                      'flex h-10 w-10 items-center justify-center rounded-full',
                      'bg-gradient-to-br text-white shadow-sm',
                      stat.gradient,
                    )}>
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
      )}

      {/* Stats loading skeleton */}
      {isLoading && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
      )}

      {/* Filter Bar */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15, duration: 0.3 }}
        className="rounded-xl border bg-card p-4 space-y-3"
      >
        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <Filter className="h-4 w-4" />
          <span className="font-medium">Filters</span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {/* Entity Type */}
          <Select value={entityTypeFilter} onValueChange={(v) => { setEntityTypeFilter(v); setActionFilter('all') }}>
            <SelectTrigger className="w-[160px] h-9 text-sm">
              <SelectValue placeholder="Entity Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Entities</SelectItem>
              {Object.entries(ENTITY_CONFIG).map(([key, cfg]) => (
                <SelectItem key={key} value={key}>{cfg.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Action Type */}
          <Select value={actionFilter} onValueChange={setActionFilter}>
            <SelectTrigger className="w-[180px] h-9 text-sm">
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

          {/* Read/Unread Toggle */}
          <Select value={readFilter} onValueChange={(v) => setReadFilter(v as 'all' | 'unread' | 'read')}>
            <SelectTrigger className="w-[120px] h-9 text-sm">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="unread">Unread</SelectItem>
              <SelectItem value="read">Read</SelectItem>
            </SelectContent>
          </Select>

          {/* Date Range */}
          <Select
            value={dateRange}
            onValueChange={(v) => {
              setDateRange(v)
              if (v !== 'custom') {
                setCustomFrom('')
                setCustomTo('')
              }
            }}
          >
            <SelectTrigger className="w-[140px] h-9 text-sm">
              <SelectValue placeholder="Date Range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Time</SelectItem>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="week">This Week</SelectItem>
              <SelectItem value="month">This Month</SelectItem>
              <SelectItem value="custom">Custom</SelectItem>
            </SelectContent>
          </Select>

          {/* Custom Date Inputs */}
          {dateRange === 'custom' && (
            <motion.div
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: 'auto' }}
              exit={{ opacity: 0, width: 0 }}
              className="flex items-center gap-2 overflow-hidden"
            >
              <div className="flex items-center gap-1.5">
                <Label className="text-xs text-muted-foreground whitespace-nowrap">From</Label>
                <Input
                  type="date"
                  className="h-9 w-[130px] text-sm"
                  value={customFrom}
                  onChange={(e) => setCustomFrom(e.target.value)}
                />
              </div>
              <div className="flex items-center gap-1.5">
                <Label className="text-xs text-muted-foreground whitespace-nowrap">To</Label>
                <Input
                  type="date"
                  className="h-9 w-[130px] text-sm"
                  value={customTo}
                  onChange={(e) => setCustomTo(e.target.value)}
                />
              </div>
            </motion.div>
          )}

          {/* Clear Filters */}
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
        </div>
      </motion.div>

      {/* Select All + Results Count */}
      {!isLoading && filteredActivities.length > 0 && (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Checkbox
              checked={selectedIds.size === filteredActivities.length && filteredActivities.length > 0}
              onCheckedChange={handleSelectAll}
              aria-label="Select all notifications"
            />
            <span className="text-xs text-muted-foreground">
              {selectedIds.size > 0
                ? `${selectedIds.size} of ${filteredActivities.length} selected`
                : `${filteredActivities.length} notification${filteredActivities.length !== 1 ? 's' : ''}`}
            </span>
          </div>
        </div>
      )}

      {/* Notification List */}
      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <NotificationSkeleton key={i} />
          ))}
        </div>
      ) : isError ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <p className="text-sm text-destructive">Failed to load notifications. Please try again.</p>
        </div>
      ) : filteredActivities.length === 0 ? (
        <EmptyState />
      ) : (
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          key={filterKey}
          className="space-y-2"
        >
          {filteredActivities.map((item) => {
            const config = ENTITY_CONFIG[item.entityType] || ENTITY_CONFIG.candidate
            const Icon = config.icon
            const isRead = readIds.has(item.id)
            const isSelected = selectedIds.has(item.id)
            const actionLabel = ACTION_LABELS[item.action] || item.action.replace(/_/g, ' ')
            const employeeName = item.employee?.name
            const initials = employeeName
              ? employeeName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
              : '??'

            return (
              <motion.div
                key={item.id}
                variants={itemVariants}
                className={cn(
                  'group relative flex items-start gap-3 rounded-xl border bg-card p-4 transition-all duration-200',
                  'hover:shadow-md hover:border-border/80',
                  !isRead && 'border-l-2 border-l-amber-400',
                )}
              >
                {/* Checkbox */}
                <div className="flex items-center pt-1">
                  <Checkbox
                    checked={isSelected}
                    onCheckedChange={() => handleToggleSelect(item.id)}
                    aria-label={`Select notification ${item.id}`}
                    className="opacity-0 group-hover:opacity-100 transition-opacity"
                  />
                </div>

                {/* Unread indicator dot */}
                {!isRead && (
                  <div className="flex items-center pt-1.5">
                    <span className="h-2 w-2 rounded-full bg-amber-400" />
                  </div>
                )}
                {isRead && <div className="w-2" />}

                {/* Entity icon */}
                <div
                  className={cn(
                    'flex h-10 w-10 shrink-0 items-center justify-center rounded-full',
                    config.bgClass,
                  )}
                >
                  <Icon className={cn('h-4.5 w-4.5', config.color)} />
                </div>

                {/* Content */}
                <div
                  className="flex-1 min-w-0 cursor-pointer"
                  onClick={() => handleNotificationClick(item)}
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className={cn(
                      'text-sm leading-relaxed',
                      !isRead ? 'font-medium text-foreground' : 'text-muted-foreground',
                    )}>
                      {employeeName
                        ? `${employeeName} ${actionLabel.toLowerCase()} a new ${config.label.toLowerCase()}`
                        : `${actionLabel} ${config.label.toLowerCase()}`}
                    </p>
                    <span className="shrink-0 text-xs text-muted-foreground whitespace-nowrap">
                      {getRelativeTime(item.createdAt)}
                    </span>
                  </div>

                  {/* Employee avatar + name + details */}
                  <div className="mt-1.5 flex items-center gap-2">
                    <div className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 text-[10px] font-semibold text-primary">
                      {initials}
                    </div>
                    {employeeName && (
                      <span className="text-xs text-muted-foreground">
                        {employeeName}
                      </span>
                    )}
                    {item.details && (
                      <span className="text-xs text-muted-foreground/60 truncate">
                        · {item.details}
                      </span>
                    )}
                  </div>

                  {/* Entity type badge */}
                  <div className="mt-2 flex items-center gap-2">
                    <Badge
                      variant="secondary"
                      className={cn('text-[10px] font-medium px-2 py-0 h-5 rounded-full', config.badgeClass)}
                    >
                      {config.label}
                    </Badge>
                    <Badge variant="outline" className="text-[10px] font-medium px-2 py-0 h-5 rounded-full">
                      {actionLabel}
                    </Badge>
                  </div>
                </div>

                {/* Hover actions */}
                <div className="flex shrink-0 items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={(e) => { e.stopPropagation(); handleToggleRead(item.id) }}
                    aria-label={isRead ? 'Mark as unread' : 'Mark as read'}
                  >
                    {isRead
                      ? <EyeOff className="h-3.5 w-3.5 text-muted-foreground" />
                      : <Eye className="h-3.5 w-3.5 text-muted-foreground" />}
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={(e) => { e.stopPropagation(); handleNotificationClick(item) }}
                    aria-label="Navigate to entity"
                  >
                    <ExternalLink className="h-3.5 w-3.5 text-muted-foreground" />
                  </Button>
                </div>
              </motion.div>
            )
          })}
        </motion.div>
      )}

      {/* Infinite scroll trigger / Load More */}
      {hasNextPage && allActivities.length > 0 && (
        <div ref={loadMoreRef} className="flex justify-center py-6">
          {isFetchingNextPage ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Loading more notifications...</span>
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
      {!hasNextPage && filteredActivities.length > 0 && (
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

      {/* Batch Actions Floating Bar */}
      <AnimatePresence>
        {selectedIds.size > 0 && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50"
          >
            <div className="flex items-center gap-3 rounded-xl border border-primary/20 bg-card/95 backdrop-blur-sm px-4 py-3 shadow-lg">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">{selectedIds.size} selected</span>
              </div>
              <div className="h-5 w-px bg-border" />
              <Button
                variant="outline"
                size="sm"
                className="h-8 text-xs gap-1.5"
                onClick={handleBatchMarkRead}
              >
                <Eye className="h-3.5 w-3.5" />
                Mark as Read
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-8 text-xs gap-1.5"
                onClick={handleBatchMarkUnread}
              >
                <EyeOff className="h-3.5 w-3.5" />
                Mark as Unread
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 text-xs gap-1.5 text-muted-foreground hover:text-foreground"
                onClick={() => setSelectedIds(new Set())}
              >
                <X className="h-3.5 w-3.5" />
                Deselect All
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
