'use client'

import { useEffect, useState } from 'react'
import {
  Users,
  Briefcase,
  Building2,
  Video,
  Award,
  UserCheck,
  CalendarOff,
  IndianRupee,
  TrendingUp,
  TrendingDown,
  ArrowRight,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { useCRMStore } from '@/stores/crm-store'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts'

// ===== Types =====

type DashboardStats = {
  totalCandidates: number
  openPositions: number
  activeClients: number
  interviewsThisWeek: number
  placementsThisMonth: number
  todaysAttendance: number
  pendingLeaves: number
  monthlyRevenue: number
  // percentage changes
  totalCandidatesChange: number
  openPositionsChange: number
  activeClientsChange: number
  interviewsThisWeekChange: number
  placementsThisMonthChange: number
  todaysAttendanceChange: number
  pendingLeavesChange: number
  monthlyRevenueChange: number
}

type PipelineData = {
  status: string
  count: number
}[]

type PriorityData = {
  priority: string
  count: number
}[]

type RecentActivity = {
  id: string
  action: string
  entityType: string
  details: string
  employeeName: string
  createdAt: string
}

type UpcomingInterview = {
  id: string
  candidateName: string
  jobTitle: string
  type: string
  date: string
  time: string
  status: string
}

type DashboardData = {
  stats: DashboardStats
  pipeline: PipelineData
  priorityDistribution: PriorityData
  recentActivities: RecentActivity[]
  upcomingInterviews: UpcomingInterview[]
}

// ===== Constants =====

const PIPELINE_COLORS: Record<string, string> = {
  New: '#10b981',
  Screening: '#3b82f6',
  Interview: '#f59e0b',
  Offer: '#8b5cf6',
  Hired: '#ef4444',
  Rejected: '#6b7280',
}

const PRIORITY_COLORS: Record<string, string> = {
  Low: '#22c55e',
  Medium: '#3b82f6',
  High: '#f59e0b',
  Urgent: '#ef4444',
}

// ===== Stat Card Config =====

type StatCardConfig = {
  key: keyof DashboardStats
  label: string
  icon: React.ElementType
  iconBg: string
  iconColor: string
  format?: (value: number) => string
  changeKey: keyof DashboardStats
}

const STAT_CARDS: StatCardConfig[] = [
  {
    key: 'totalCandidates',
    label: 'Total Candidates',
    icon: Users,
    iconBg: 'bg-emerald-100 dark:bg-emerald-950',
    iconColor: 'text-emerald-600 dark:text-emerald-400',
    changeKey: 'totalCandidatesChange',
  },
  {
    key: 'openPositions',
    label: 'Open Positions',
    icon: Briefcase,
    iconBg: 'bg-amber-100 dark:bg-amber-950',
    iconColor: 'text-amber-600 dark:text-amber-400',
    changeKey: 'openPositionsChange',
  },
  {
    key: 'activeClients',
    label: 'Active Clients',
    icon: Building2,
    iconBg: 'bg-violet-100 dark:bg-violet-950',
    iconColor: 'text-violet-600 dark:text-violet-400',
    changeKey: 'activeClientsChange',
  },
  {
    key: 'interviewsThisWeek',
    label: 'Interviews This Week',
    icon: Video,
    iconBg: 'bg-cyan-100 dark:bg-cyan-950',
    iconColor: 'text-cyan-600 dark:text-cyan-400',
    changeKey: 'interviewsThisWeekChange',
  },
  {
    key: 'placementsThisMonth',
    label: 'Placements This Month',
    icon: Award,
    iconBg: 'bg-rose-100 dark:bg-rose-950',
    iconColor: 'text-rose-600 dark:text-rose-400',
    changeKey: 'placementsThisMonthChange',
  },
  {
    key: 'todaysAttendance',
    label: "Today's Attendance",
    icon: UserCheck,
    iconBg: 'bg-blue-100 dark:bg-blue-950',
    iconColor: 'text-blue-600 dark:text-blue-400',
    changeKey: 'todaysAttendanceChange',
  },
  {
    key: 'pendingLeaves',
    label: 'Pending Leaves',
    icon: CalendarOff,
    iconBg: 'bg-orange-100 dark:bg-orange-950',
    iconColor: 'text-orange-600 dark:text-orange-400',
    changeKey: 'pendingLeavesChange',
  },
  {
    key: 'monthlyRevenue',
    label: 'Monthly Revenue',
    icon: IndianRupee,
    iconBg: 'bg-green-100 dark:bg-green-950',
    iconColor: 'text-green-600 dark:text-green-400',
    format: (v) => `₹${(v / 100000).toFixed(1)}L`,
    changeKey: 'monthlyRevenueChange',
  },
]

// ===== Sub-components =====

function ChangeIndicator({ value }: { value: number }) {
  if (value === 0) return null
  const isPositive = value > 0
  return (
    <span
      className={`inline-flex items-center gap-0.5 text-xs font-medium ${
        isPositive ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500 dark:text-red-400'
      }`}
    >
      {isPositive ? (
        <TrendingUp className="h-3 w-3" />
      ) : (
        <TrendingDown className="h-3 w-3" />
      )}
      {Math.abs(value).toFixed(1)}%
    </span>
  )
}

function StatCard({ config, stats, isLoading }: { config: StatCardConfig; stats: DashboardStats | null; isLoading: boolean }) {
  const Icon = config.icon
  if (isLoading || !stats) {
    return (
      <Card>
        <CardContent className="flex items-center gap-4 p-4">
          <Skeleton className="h-12 w-12 shrink-0 rounded-xl" />
          <div className="flex flex-col gap-2">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-7 w-16" />
            <Skeleton className="h-3 w-14" />
          </div>
        </CardContent>
      </Card>
    )
  }

  const value = stats[config.key] as number
  const change = stats[config.changeKey] as number
  const displayValue = config.format ? config.format(value) : value.toLocaleString('en-IN')

  return (
    <Card className="transition-shadow hover:shadow-md">
      <CardContent className="flex items-center gap-4 p-4">
        <div
          className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${config.iconBg}`}
        >
          <Icon className={`h-6 w-6 ${config.iconColor}`} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm text-muted-foreground">{config.label}</p>
          <p className="text-2xl font-bold tracking-tight">{displayValue}</p>
          <ChangeIndicator value={change} />
        </div>
      </CardContent>
    </Card>
  )
}

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number; name: string; color: string }>; label?: string }) {
  if (!active || !payload || payload.length === 0) return null
  return (
    <div className="rounded-lg border bg-background px-3 py-2 text-sm shadow-md">
      <p className="font-medium">{label}</p>
      {payload.map((entry, idx) => (
        <p key={idx} style={{ color: entry.color }} className="text-sm">
          {entry.name}: {entry.value}
        </p>
      ))}
    </div>
  )
}

function CandidatePipelineChart({
  data,
  isLoading,
}: {
  data: PipelineData
  isLoading: boolean
}) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Candidate Pipeline</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[300px] w-full" />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Candidate Pipeline</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
              layout="vertical"
              margin={{ top: 5, right: 30, left: 10, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 12 }} />
              <YAxis
                type="category"
                dataKey="status"
                tick={{ fontSize: 12 }}
                width={80}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar
                dataKey="count"
                name="Candidates"
                radius={[0, 6, 6, 0]}
                barSize={28}
              >
                {data.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={PIPELINE_COLORS[entry.status] || '#6b7280'}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}

function JobPriorityChart({
  data,
  isLoading,
}: {
  data: PriorityData
  isLoading: boolean
}) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Job Priority Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[300px] w-full" />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Job Priority Distribution</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col items-center gap-4 lg:flex-row">
          <div className="h-[280px] w-full max-w-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={3}
                  dataKey="count"
                  nameKey="priority"
                  stroke="none"
                >
                  {data.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={PRIORITY_COLORS[entry.priority] || '#6b7280'}
                    />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex flex-wrap justify-center gap-3 lg:flex-col lg:justify-start lg:gap-2">
            {data.map((entry) => (
              <div key={entry.priority} className="flex items-center gap-2 text-sm">
                <span
                  className="h-3 w-3 shrink-0 rounded-full"
                  style={{ backgroundColor: PRIORITY_COLORS[entry.priority] || '#6b7280' }}
                />
                <span className="text-muted-foreground">{entry.priority}</span>
                <span className="font-semibold">{entry.count}</span>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function formatRelativeTime(dateStr: string): string {
  const now = new Date()
  const date = new Date(dateStr)
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`
  return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
}

function RecentActivities({
  activities,
  isLoading,
}: {
  activities: RecentActivity[]
  isLoading: boolean
}) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recent Activities</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-start gap-3">
                <Skeleton className="h-8 w-8 shrink-0 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (activities.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recent Activities</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-center text-sm text-muted-foreground py-8">
            No recent activities to show.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Activities</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="max-h-[360px] space-y-1 overflow-y-auto pr-1">
          {activities.map((activity) => (
            <div
              key={activity.id}
              className="flex items-start gap-3 rounded-lg px-2 py-3 transition-colors hover:bg-muted/50"
            >
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                {activity.employeeName?.charAt(0)?.toUpperCase() || '?'}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm leading-snug">
                  <span className="font-medium">{activity.employeeName}</span>{' '}
                  <span className="text-muted-foreground">{activity.action.toLowerCase()}</span>{' '}
                  <Badge variant="secondary" className="mx-0.5 text-xs font-normal">
                    {activity.entityType}
                  </Badge>
                </p>
                {activity.details && (
                  <p className="mt-0.5 truncate text-xs text-muted-foreground">
                    {activity.details}
                  </p>
                )}
                <p className="mt-1 text-xs text-muted-foreground/70">
                  {formatRelativeTime(activity.createdAt)}
                </p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

function UpcomingInterviewsList({
  interviews,
  isLoading,
}: {
  interviews: UpcomingInterview[]
  isLoading: boolean
}) {
  const navigate = useCRMStore((s) => s.navigate)

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Upcoming Interviews</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <Skeleton className="h-10 w-10 shrink-0 rounded-lg" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-2/3" />
                  <Skeleton className="h-3 w-1/3" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (interviews.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Upcoming Interviews</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-center text-sm text-muted-foreground py-8">
            No upcoming interviews scheduled.
          </p>
        </CardContent>
      </Card>
    )
  }

  const statusVariant = (status: string) => {
    switch (status) {
      case 'Scheduled':
        return 'default' as const
      case 'Confirmed':
        return 'secondary' as const
      case 'Rescheduled':
        return 'outline' as const
      default:
        return 'secondary' as const
    }
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Upcoming Interviews</CardTitle>
        <button
          onClick={() => navigate('interviews')}
          className="flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-primary"
        >
          View all
          <ArrowRight className="h-3.5 w-3.5" />
        </button>
      </CardHeader>
      <CardContent>
        <div className="max-h-[360px] space-y-2 overflow-y-auto pr-1">
          {interviews.map((interview) => (
            <div
              key={interview.id}
              className="flex items-center gap-3 rounded-lg border p-3 transition-colors hover:bg-muted/50"
            >
              <div className="flex h-10 w-10 shrink-0 flex-col items-center justify-center rounded-lg bg-cyan-100 text-cyan-700 dark:bg-cyan-950 dark:text-cyan-400">
                <span className="text-[10px] font-medium uppercase leading-none">
                  {interview.date
                    ? new Date(interview.date).toLocaleDateString('en-IN', {
                        month: 'short',
                      })
                    : ''}
                </span>
                <span className="text-sm font-bold leading-tight">
                  {interview.date
                    ? new Date(interview.date).getDate()
                    : ''}
                </span>
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">
                  {interview.candidateName}
                </p>
                <p className="truncate text-xs text-muted-foreground">
                  {interview.jobTitle}
                </p>
                <div className="mt-1 flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">
                    {interview.time} · {interview.type}
                  </span>
                </div>
              </div>
              <Badge variant={statusVariant(interview.status)} className="shrink-0 text-xs">
                {interview.status}
              </Badge>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

// ===== Main Dashboard Page =====

export function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchDashboardData() {
      try {
        setIsLoading(true)
        setError(null)
        const res = await fetch('/api/dashboard')
        if (!res.ok) {
          throw new Error(`Failed to fetch dashboard data: ${res.status}`)
        }
        const json = await res.json()
        setData(json)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An unexpected error occurred')
      } finally {
        setIsLoading(false)
      }
    }
    fetchDashboardData()
  }, [])

  if (error) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 p-8">
        <p className="text-lg font-medium text-destructive">Failed to load dashboard</p>
        <p className="text-sm text-muted-foreground">{error}</p>
      </div>
    )
  }

  // Build pipeline data array ensuring all statuses are present
  const pipelineData: PipelineData = data?.pipeline ??
    ['New', 'Screening', 'Interview', 'Offer', 'Hired', 'Rejected'].map((status) => ({
      status,
      count: 0,
    }))

  // Build priority data array ensuring all priorities are present
  const priorityData: PriorityData = data?.priorityDistribution ??
    ['Low', 'Medium', 'High', 'Urgent'].map((priority) => ({
      priority,
      count: 0,
    }))

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Dashboard</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Overview of your recruitment operations
        </p>
      </div>

      {/* Stat Cards Grid */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {STAT_CARDS.map((config) => (
          <StatCard
            key={config.key}
            config={config}
            stats={data?.stats ?? null}
            isLoading={isLoading}
          />
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <CandidatePipelineChart data={pipelineData} isLoading={isLoading} />
        <JobPriorityChart data={priorityData} isLoading={isLoading} />
      </div>

      {/* Bottom Section: Recent Activities + Upcoming Interviews */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <RecentActivities
          activities={data?.recentActivities ?? []}
          isLoading={isLoading}
        />
        <UpcomingInterviewsList
          interviews={data?.upcomingInterviews ?? []}
          isLoading={isLoading}
        />
      </div>
    </div>
  )
}