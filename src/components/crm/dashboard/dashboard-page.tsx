'use client'

import { useEffect, useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  Users,
  Briefcase,
  Building2,
  Video,
  Award,
  UserCheck,
  UserPlus,
  CheckCircle2,
  Send,
  CalendarOff,
  IndianRupee,
  TrendingUp,
  TrendingDown,
  ArrowRight,
  BarChart3,
  Activity,
  Shield,
  ChevronRight,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { useCRMStore } from '@/stores/crm-store'
import type { CRMView } from '@/stores/crm-store'
import { useAuth } from '@/lib/use-auth'
import { motion } from 'framer-motion'
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

const ENTITY_TYPE_COLORS: Record<string, string> = {
  Candidate: 'border-l-emerald-400',
  Job: 'border-l-amber-400',
  Client: 'border-l-violet-400',
  Interview: 'border-l-cyan-400',
  Placement: 'border-l-rose-400',
  Employee: 'border-l-teal-400',
  Leave: 'border-l-orange-400',
  Attendance: 'border-l-teal-400',
}

const ENTITY_TYPE_ICONS: Record<string, React.ElementType> = {
  Candidate: Users,
  Client: Building2,
  Job: Briefcase,
  Placement: Award,
  Interview: Video,
  Employee: Users,
  Leave: CalendarOff,
  Attendance: UserCheck,
}

const ENTITY_ICON_COLORS: Record<string, string> = {
  Candidate: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400',
  Client: 'bg-amber-100 text-amber-600 dark:bg-amber-950 dark:text-amber-400',
  Job: 'bg-violet-100 text-violet-600 dark:bg-violet-950 dark:text-violet-400',
  Placement: 'bg-rose-100 text-rose-600 dark:bg-rose-950 dark:text-rose-400',
  Interview: 'bg-cyan-100 text-cyan-600 dark:bg-cyan-950 dark:text-cyan-400',
  Employee: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400',
  Leave: 'bg-orange-100 text-orange-600 dark:bg-orange-950 dark:text-orange-400',
  Attendance: 'bg-teal-100 text-teal-600 dark:bg-teal-950 dark:text-teal-400',
}

const INTERVIEW_TYPE_COLORS: Record<string, string> = {
  Phone: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400',
  Technical: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400',
  HR: 'bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-400',
  Managerial: 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-400',
  Final: 'bg-primary/10 text-primary',
}

// ===== Stat Card Config =====

type StatCardConfig = {
  key: keyof DashboardStats
  label: string
  icon: React.ElementType
  iconBg: string
  iconColor: string
  gradientFrom: string
  gradientTo: string
  accentColor: string
  sparklineColor: string
  format?: (value: number) => string
  changeKey: keyof DashboardStats
  viewKey: string
  hoverAccentColor: string
}

const STAT_CARDS: StatCardConfig[] = [
  {
    key: 'totalCandidates',
    label: 'Total Candidates',
    icon: Users,
    iconBg: 'bg-emerald-100 dark:bg-emerald-950',
    iconColor: 'text-emerald-600 dark:text-emerald-400',
    gradientFrom: 'from-emerald-50/80 dark:from-emerald-950/50',
    gradientTo: 'to-transparent',
    accentColor: 'border-l-emerald-400',
    sparklineColor: '#10b981',
    changeKey: 'totalCandidatesChange',
    viewKey: 'candidates',
    hoverAccentColor: 'hover:border-b-2 hover:border-b-emerald-400',
  },
  {
    key: 'openPositions',
    label: 'Open Positions',
    icon: Briefcase,
    iconBg: 'bg-amber-100 dark:bg-amber-950',
    iconColor: 'text-amber-600 dark:text-amber-400',
    gradientFrom: 'from-amber-50/80 dark:from-amber-950/50',
    gradientTo: 'to-transparent',
    accentColor: 'border-l-amber-400',
    sparklineColor: '#f59e0b',
    changeKey: 'openPositionsChange',
    viewKey: 'jobs',
    hoverAccentColor: 'hover:border-b-2 hover:border-b-amber-400',
  },
  {
    key: 'activeClients',
    label: 'Active Clients',
    icon: Building2,
    iconBg: 'bg-violet-100 dark:bg-violet-950',
    iconColor: 'text-violet-600 dark:text-violet-400',
    gradientFrom: 'from-violet-50/80 dark:from-violet-950/50',
    gradientTo: 'to-transparent',
    accentColor: 'border-l-violet-400',
    sparklineColor: '#8b5cf6',
    changeKey: 'activeClientsChange',
    viewKey: 'clients',
    hoverAccentColor: 'hover:border-b-2 hover:border-b-violet-400',
  },
  {
    key: 'interviewsThisWeek',
    label: 'Interviews This Week',
    icon: Video,
    iconBg: 'bg-cyan-100 dark:bg-cyan-950',
    iconColor: 'text-cyan-600 dark:text-cyan-400',
    gradientFrom: 'from-cyan-50/80 dark:from-cyan-950/50',
    gradientTo: 'to-transparent',
    accentColor: 'border-l-cyan-400',
    sparklineColor: '#06b6d4',
    changeKey: 'interviewsThisWeekChange',
    viewKey: 'interviews',
    hoverAccentColor: 'hover:border-b-2 hover:border-b-cyan-400',
  },
  {
    key: 'placementsThisMonth',
    label: 'Placements This Month',
    icon: Award,
    iconBg: 'bg-rose-100 dark:bg-rose-950',
    iconColor: 'text-rose-600 dark:text-rose-400',
    gradientFrom: 'from-rose-50/80 dark:from-rose-950/50',
    gradientTo: 'to-transparent',
    accentColor: 'border-l-rose-400',
    sparklineColor: '#f43f5e',
    changeKey: 'placementsThisMonthChange',
    viewKey: 'placements',
    hoverAccentColor: 'hover:border-b-2 hover:border-b-rose-400',
  },
  {
    key: 'todaysAttendance',
    label: "Today's Attendance",
    icon: UserCheck,
    iconBg: 'bg-teal-100 dark:bg-teal-950',
    iconColor: 'text-teal-600 dark:text-teal-400',
    gradientFrom: 'from-teal-50/80 dark:from-teal-950/50',
    gradientTo: 'to-transparent',
    accentColor: 'border-l-teal-400',
    sparklineColor: '#14b8a6',
    changeKey: 'todaysAttendanceChange',
    viewKey: 'attendance',
    hoverAccentColor: 'hover:border-b-2 hover:border-b-teal-400',
  },
  {
    key: 'pendingLeaves',
    label: 'Pending Leaves',
    icon: CalendarOff,
    iconBg: 'bg-orange-100 dark:bg-orange-950',
    iconColor: 'text-orange-600 dark:text-orange-400',
    gradientFrom: 'from-orange-50/80 dark:from-orange-950/50',
    gradientTo: 'to-transparent',
    accentColor: 'border-l-orange-400',
    sparklineColor: '#f97316',
    changeKey: 'pendingLeavesChange',
    viewKey: 'leave',
    hoverAccentColor: 'hover:border-b-2 hover:border-b-orange-400',
  },
  {
    key: 'monthlyRevenue',
    label: 'Monthly Revenue',
    icon: IndianRupee,
    iconBg: 'bg-green-100 dark:bg-green-950',
    iconColor: 'text-green-600 dark:text-green-400',
    gradientFrom: 'from-green-50/80 dark:from-green-950/50',
    gradientTo: 'to-transparent',
    accentColor: 'border-l-green-400',
    sparklineColor: '#22c55e',
    format: (v) => `\u20b9${(v / 100000).toFixed(1)}L`,
    changeKey: 'monthlyRevenueChange',
    viewKey: 'analytics',
    hoverAccentColor: 'hover:border-b-2 hover:border-b-green-400',
  },
]

// ===== Sub-components =====

function Sparkline({ color }: { color: string }) {
  return (
    <svg
      className="ml-auto h-8 w-16 opacity-40"
      viewBox="0 0 64 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M2 28 C10 24, 16 20, 22 18 C28 16, 32 22, 38 14 C44 6, 52 8, 62 4"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M2 28 C10 24, 16 20, 22 18 C28 16, 32 22, 38 14 C44 6, 52 8, 62 4 L62 32 L2 32 Z"
        fill={color}
        opacity="0.08"
      />
    </svg>
  )
}

function getGreeting(): string {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good Morning'
  if (hour < 17) return 'Good Afternoon'
  return 'Good Evening'
}

function formatInterviewTimeIndicator(dateStr: string, timeStr: string): { text: string; colorClass: string } {
  const now = new Date()
  const [hours, minutes] = timeStr.split(':').map(Number)
  const interviewDate = new Date(dateStr)
  interviewDate.setHours(hours, minutes, 0, 0)
  const diffMs = interviewDate.getTime() - now.getTime()
  const diffHours = diffMs / 3600000
  if (diffMs < 0) return { text: 'Started', colorClass: 'text-red-500' }
  if (diffHours < 2) return { text: `Starts in ${Math.ceil(diffHours)}h`, colorClass: 'text-amber-500' }
  const isToday = interviewDate.toDateString() === now.toDateString()
  if (isToday) return { text: `Today at ${timeStr}`, colorClass: 'text-emerald-500' }
  return { text: `Starts in ${Math.ceil(diffHours)}h`, colorClass: 'text-emerald-500' }
}

function ChangeIndicator({ value }: { value: number }) {
  if (value === 0) return null
  const isPositive = value > 0
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-xs font-medium ${
        isPositive
          ? 'bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400'
          : 'bg-red-500/10 text-red-500 dark:bg-red-500/20 dark:text-red-400'
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

function StatCard({
  config,
  stats,
  isLoading,
  index,
}: {
  config: StatCardConfig
  stats: DashboardStats | null
  isLoading: boolean
  index: number
}) {
  const Icon = config.icon
  const { navigate } = useCRMStore((s) => s.navigate)

  if (isLoading || !stats) {
    return (
      <Card className="rounded-xl shadow-sm">
        <CardContent className="flex items-center gap-3 md:gap-4 p-3 md:p-4">
          <Skeleton className="h-10 w-10 md:h-12 md:w-12 shrink-0 rounded-xl" />
          <div className="flex flex-col gap-2">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-6 md:h-7 w-16" />
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
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.06, ease: 'easeOut' }}
    >
      <Card
        className={`stat-card-hover relative overflow-hidden rounded-xl border-l-2 border-b-0 ${config.accentColor} ${config.hoverAccentColor} bg-gradient-to-r ${config.gradientFrom} ${config.gradientTo} shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg`}
      >
        <CardContent className="relative flex flex-col gap-1 p-3 md:p-4">
          <div className="flex items-center gap-3 md:gap-4">
            <div
              className={`flex h-10 w-10 md:h-12 md:w-12 shrink-0 items-center justify-center rounded-xl ${config.iconBg}`}
            >
              <Icon className={`h-5 w-5 md:h-6 md:w-6 ${config.iconColor}`} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm text-muted-foreground">{config.label}</p>
              <div className="flex items-center gap-2">
                <p className="text-xl md:text-2xl font-bold tracking-tight">{displayValue}</p>
              </div>
              <ChangeIndicator value={change} />
            </div>
            <Sparkline color={config.sparklineColor} />
          </div>
          <button
            onClick={() => navigate(config.viewKey as CRMView)}
            className="mt-1 self-start text-xs text-primary hover:underline cursor-pointer"
          >
            View Details →
          </button>
        </CardContent>
      </Card>
    </motion.div>
  )
}

function CustomTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean
  payload?: Array<{ value: number; name: string; color: string }>
  label?: string
}) {
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
  const navigate = useCRMStore((s) => s.navigate)

  if (isLoading) {
    return (
      <Card className="card-glass rounded-xl border-l-4 border-l-emerald-400 shadow-inner shadow-black/5">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-emerald-500" />
            <CardTitle className="text-base font-semibold">Candidate Pipeline</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[220px] md:h-[300px] w-full" />
        </CardContent>
      </Card>
    )
  }

  if (data.every((d) => d.count === 0)) {
    return (
      <Card className="card-glass rounded-xl border-l-4 border-l-emerald-400 shadow-inner shadow-black/5">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-emerald-500" />
            <CardTitle className="text-base font-semibold">Candidate Pipeline</CardTitle>
          </div>
          <button
            onClick={() => navigate('candidates')}
            className="flex items-center gap-1 text-sm text-muted-foreground transition-colors duration-200 hover:text-primary"
          >
            View All <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </CardHeader>
        <CardContent>
          <div className="flex h-[220px] md:h-[300px] items-center justify-center">
            <div className="text-center">
              <BarChart3 className="mx-auto mb-2 h-10 w-10 text-muted-foreground/30" />
              <p className="text-sm text-muted-foreground">No pipeline data yet</p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-50px' }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
    >
    <Card className="card-glass rounded-xl border-l-4 border-l-emerald-400 shadow-inner shadow-black/5 transition-all duration-300 hover:shadow-lg hover:shadow-emerald-500/5">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div className="flex items-center gap-2">
          <BarChart3 className="h-4 w-4 text-emerald-500" />
          <CardTitle className="text-base font-semibold">Candidate Pipeline</CardTitle>
        </div>
        <button
          onClick={() => navigate('candidates')}
          className="flex items-center gap-1 text-sm text-muted-foreground transition-colors duration-200 hover:text-primary"
        >
          View All <ArrowRight className="h-3.5 w-3.5" />
        </button>
      </CardHeader>
      <CardContent>
        <div className="h-[220px] md:h-[300px] w-full">
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
    </motion.div>
  )
}

function JobPriorityChart({
  data,
  isLoading,
}: {
  data: PriorityData
  isLoading: boolean
}) {
  const navigate = useCRMStore((s) => s.navigate)

  if (isLoading) {
    return (
      <Card className="card-glass rounded-xl border-l-4 border-l-amber-400 shadow-inner shadow-black/5">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <div className="flex items-center gap-2">
            <Activity className="h-4 w-4 text-amber-500" />
            <CardTitle className="text-base font-semibold">Job Priority Distribution</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[220px] md:h-[300px] w-full" />
        </CardContent>
      </Card>
    )
  }

  if (data.every((d) => d.count === 0)) {
    return (
      <Card className="card-glass rounded-xl border-l-4 border-l-amber-400 shadow-inner shadow-black/5">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <div className="flex items-center gap-2">
            <Activity className="h-4 w-4 text-amber-500" />
            <CardTitle className="text-base font-semibold">Job Priority Distribution</CardTitle>
          </div>
          <button
            onClick={() => navigate('jobs')}
            className="flex items-center gap-1 text-sm text-muted-foreground transition-colors duration-200 hover:text-primary"
          >
            View All <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </CardHeader>
        <CardContent>
          <div className="flex h-[220px] md:h-[300px] items-center justify-center">
            <div className="text-center">
              <Activity className="mx-auto mb-2 h-10 w-10 text-muted-foreground/30" />
              <p className="text-sm text-muted-foreground">No priority data yet</p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-50px' }}
      transition={{ duration: 0.5, ease: 'easeOut', delay: 0.1 }}
    >
    <Card className="card-glass rounded-xl border-l-4 border-l-amber-400 shadow-inner shadow-black/5 transition-all duration-300 hover:shadow-lg hover:shadow-amber-500/5">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div className="flex items-center gap-2">
          <Activity className="h-4 w-4 text-amber-500" />
          <CardTitle className="text-base font-semibold">Job Priority Distribution</CardTitle>
        </div>
        <button
          onClick={() => navigate('jobs')}
          className="flex items-center gap-1 text-sm text-muted-foreground transition-colors duration-200 hover:text-primary"
        >
          View All <ArrowRight className="h-3.5 w-3.5" />
        </button>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col items-center gap-4 lg:flex-row">
          <div className="h-[220px] md:h-[280px] w-full max-w-[280px]">
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
    </motion.div>
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

function formatInterviewDate(dateStr: string): { day: string; date: string; weekday: string } {
  const date = new Date(dateStr)
  return {
    day: date.toLocaleDateString('en-IN', { month: 'short' }),
    date: date.getDate().toString(),
    weekday: date.toLocaleDateString('en-IN', { weekday: 'short' }),
  }
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
      <Card className="rounded-xl shadow-sm">
        <div className="h-1.5 rounded-t-xl bg-gradient-to-r from-violet-400 via-cyan-400 to-emerald-400" />
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold">Recent Activities</CardTitle>
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
      <Card className="rounded-xl shadow-sm">
        <div className="h-1.5 rounded-t-xl bg-gradient-to-r from-violet-400 via-cyan-400 to-emerald-400" />
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold">Recent Activities</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center gap-3 py-8">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-cyan-50 dark:bg-cyan-950/50">
              <Activity className="h-6 w-6 text-cyan-400" />
            </div>
            <div className="text-center">
              <p className="text-sm font-medium text-muted-foreground">No recent activities</p>
              <p className="mt-1 text-xs text-muted-foreground/70">Actions like adding candidates and scheduling interviews will appear here</p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="rounded-xl shadow-sm">
      <div className="h-1.5 rounded-t-xl bg-gradient-to-r from-violet-400 via-cyan-400 to-emerald-400" />
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold">Recent Activities</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="custom-scrollbar max-h-96 space-y-1 overflow-y-auto pr-1">
          {activities.map((activity) => {
            const EntityIcon = ENTITY_TYPE_ICONS[activity.entityType] || Activity
            const iconColorClass = ENTITY_ICON_COLORS[activity.entityType] || 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
            return (
              <div
                key={activity.id}
                className="flex items-start gap-3 rounded-lg bg-muted/20 px-3 py-3 transition-colors duration-200 hover:bg-muted/50"
              >
                <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${iconColorClass}`}>
                  <EntityIcon className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm leading-snug">
                    <span className="font-medium">{activity.employeeName}</span>{' '}
                    <span className="text-muted-foreground">{activity.action.toLowerCase()}</span>{' '}
                    <Badge variant="secondary" className="badge-transition mx-0.5 text-xs font-normal">
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
            )
          })}
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
      <Card className="rounded-xl shadow-sm">
        <div className="h-1.5 rounded-t-xl bg-gradient-to-r from-cyan-400 via-teal-400 to-violet-400" />
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold">Upcoming Interviews</CardTitle>
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
      <Card className="rounded-xl shadow-sm">
        <div className="h-1.5 rounded-t-xl bg-gradient-to-r from-cyan-400 via-teal-400 to-violet-400" />
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold">Upcoming Interviews</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="py-8 text-center text-sm text-muted-foreground">
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
    <Card className="rounded-xl shadow-sm">
      <div className="h-1.5 rounded-t-xl bg-gradient-to-r from-cyan-400 via-teal-400 to-violet-400" />
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-base font-semibold">Upcoming Interviews</CardTitle>
        <button
          onClick={() => navigate('interviews')}
          className="flex items-center gap-1 text-sm text-muted-foreground transition-colors duration-200 hover:text-primary"
        >
          View all
          <ArrowRight className="h-3.5 w-3.5" />
        </button>
      </CardHeader>
      <CardContent>
        <div className="custom-scrollbar max-h-96 space-y-2 overflow-y-auto pr-1">
          {interviews.map((interview) => {
            const dateInfo = interview.date ? formatInterviewDate(interview.date) : null
            const timeIndicator = interview.date && interview.time
              ? formatInterviewTimeIndicator(interview.date, interview.time)
              : null
            const typeColorClass = INTERVIEW_TYPE_COLORS[interview.type] || 'bg-muted text-muted-foreground'
            return (
              <div
                key={interview.id}
                className={`flex items-center gap-3 rounded-lg border-l-[3px] border p-3 transition-all duration-200 hover:bg-muted/30 ${interview.type === 'Technical' ? 'border-l-cyan-400' : interview.type === 'HR' ? 'border-l-violet-400' : interview.type === 'Screening' ? 'border-l-teal-400' : interview.type === 'Final' ? 'border-l-rose-400' : 'border-l-cyan-400'}`}
              >
                <div className="relative flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-lg bg-gradient-to-b from-cyan-100 to-cyan-50 text-cyan-700 dark:from-cyan-950 dark:to-cyan-900/50 dark:text-cyan-400">
                  {dateInfo && (
                    <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-cyan-500 text-[8px] font-bold text-white animate-pulse">
                      {dateInfo.weekday.charAt(0)}
                    </span>
                  )}
                  <span className="text-[10px] font-medium uppercase leading-none">
                    {dateInfo?.day ?? ''}
                  </span>
                  <span className="text-sm font-bold leading-tight">{dateInfo?.date ?? ''}</span>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{interview.candidateName}</p>
                  <p className="truncate text-xs text-muted-foreground">{interview.jobTitle}</p>
                  <div className="mt-1.5 flex flex-wrap items-center gap-2">
                    <Badge variant="secondary" className={`badge-transition text-[10px] font-normal ${typeColorClass}`}>
                      {interview.type}
                    </Badge>
                    {timeIndicator && (
                      <span className={`inline-flex items-center gap-1 text-[11px] font-medium ${timeIndicator.colorClass}`}>
                        {interview.date && new Date(interview.date).toDateString() === new Date().toDateString() && (
                          <span className="animate-dot-pulse inline-block h-1.5 w-1.5 rounded-full bg-current" />
                        )}
                        {timeIndicator.text}
                      </span>
                    )}
                  </div>
                </div>
                <Badge variant={statusVariant(interview.status)} className="badge-transition shrink-0 text-xs">
                  {interview.status}
                </Badge>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}

// ===== Quick Action Button =====

function QuickActionButton({
  icon: Icon,
  label,
  description,
  colorClass,
  bgClass,
  onClick,
}: {
  icon: React.ElementType
  label: string
  description: string
  colorClass: string
  bgClass: string
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className={`card-glass group flex flex-col items-center gap-1.5 md:gap-2 rounded-xl border border-transparent bg-gradient-to-b ${bgClass} p-3 md:p-4 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-md hover:border-border/50`}
    >
      <div
        className={`flex h-10 w-10 md:h-12 md:w-12 items-center justify-center rounded-2xl shadow-sm transition-all duration-300 group-hover:scale-110 group-hover:shadow-[0_0_16px_rgba(16,185,129,0.2)] ${colorClass}`}
      >
        <Icon className="h-5 w-5" />
      </div>
      <div className="text-center">
        <span className="block text-xs font-medium text-muted-foreground transition-colors duration-200 group-hover:text-foreground">
          {label}
        </span>
        <span className="mt-0.5 block text-[10px] text-muted-foreground/60">
          {description}
        </span>
      </div>
    </button>
  )
}

// ===== Pending Approvals Widget =====

function PendingApprovalsWidget() {
  const { role } = useAuth()
  const navigate = useCRMStore((s) => s.navigate)

  const { data: pendingData, isLoading } = useQuery<{ data: Array<{ id: string; employee: { name: string; role: string; designation: string | null }; type: string; totalDays: number; startDate: string; approverRole: string | null }> }>({
    queryKey: ['dashboard-pending-approvals', role],
    queryFn: async () => {
      if (role === 'EMPLOYEE') return { data: [] }
      const params = new URLSearchParams({ view: 'pending-approvals', pendingFor: role })
      const res = await fetch(`/api/leave?${params.toString()}`)
      if (!res.ok) return { data: [] }
      return res.json()
    },
    enabled: role !== 'EMPLOYEE',
    staleTime: 1000 * 60,
    refetchInterval: 1000 * 60 * 2,
  })

  const pendingItems = pendingData?.data ?? []

  if (role === 'EMPLOYEE' || (pendingItems.length === 0 && !isLoading)) return null

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.3, ease: 'easeOut' }}
    >
      <Card className="card-glass border-2 border-amber-200/60 dark:border-amber-900/40 bg-gradient-to-r from-amber-50/50 to-orange-50/30 dark:from-amber-950/10 dark:to-orange-950/10">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-amber-100 dark:bg-amber-950">
                <Shield className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                {pendingItems.length > 0 && (
                  <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                    {pendingItems.length}
                  </span>
                )}
              </div>
              <div>
                <CardTitle className="text-base">Pending Approvals</CardTitle>
                <p className="text-xs text-muted-foreground">
                  {role === 'HR' ? 'Employee leaves awaiting your approval' : 'HR leaves awaiting your approval'}
                </p>
              </div>
            </div>
            <button
              onClick={() => navigate('leave')}
              className="flex items-center gap-1 text-xs text-amber-600 hover:text-amber-700 dark:text-amber-400 dark:hover:text-amber-300 transition-colors"
            >
              View All <ChevronRight className="h-3 w-3" />
            </button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full rounded-lg" />
              ))}
            </div>
          ) : pendingItems.length > 0 ? (
            <div className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar">
              {pendingItems.slice(0, 5).map((item) => (
                <div
                  key={item.id}
                  className="flex items-center gap-3 rounded-lg border border-amber-200/50 dark:border-amber-900/30 bg-white/50 dark:bg-white/5 p-2.5 hover:bg-amber-50 dark:hover:bg-amber-950/20 transition-colors cursor-pointer"
                  onClick={() => navigate('leave')}
                >
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                    {item.employee.name.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{item.employee.name}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {item.type} · {item.totalDays} day{item.totalDays > 1 ? 's' : ''}
                    </p>
                  </div>
                  <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400 text-[10px] shrink-0">
                    {item.approverRole === 'HR' ? '→ HR' : '→ Founder'}
                  </Badge>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">No pending approvals</p>
          )}
        </CardContent>
      </Card>
    </motion.div>
  )
}

// ===== Main Dashboard Page =====

export function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const navigate = useCRMStore((s) => s.navigate)
  const { user } = useAuth()
  const displayName = user?.name?.split(' ')[0] || 'User'

  const formattedDate = useMemo(() => {
    return new Date().toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }, [])

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
  const pipelineData: PipelineData =
    data?.pipeline ??
    ['New', 'Screening', 'Interview', 'Offer', 'Hired', 'Rejected'].map((status) => ({
      status,
      count: 0,
    }))

  // Build priority data array ensuring all priorities are present
  const priorityData: PriorityData =
    data?.priorityDistribution ??
    ['Low', 'Medium', 'High', 'Urgent'].map((priority) => ({
      priority,
      count: 0,
    }))

  return (
    <div className="flex flex-1 flex-col gap-4 md:gap-6 p-3 md:p-6">
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes gradient {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        @keyframes shimmer {
          0% { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
        .custom-scrollbar { scrollbar-width: thin; scrollbar-color: hsl(var(--border)) transparent; }
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background-color: hsl(var(--border)); border-radius: 9999px; }
      ` }} />
      {/* Welcome Banner */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
      >
        <div className="card-glass relative overflow-hidden rounded-xl bg-[length:200%_200%] animate-[gradient_8s_ease_infinite] bg-gradient-to-br from-emerald-500/10 via-teal-500/5 to-cyan-500/10 backdrop-blur-xl border border-white/20 dark:border-white/10 p-4 md:p-5 shadow-sm">
          {/* Floating decorative circles */}
          <div className="pointer-events-none absolute -left-6 -top-6 h-24 w-24 rounded-full bg-emerald-400/10 animate-bounce [animation-delay:0s] [animation-duration:3s]" />
          <div className="pointer-events-none absolute right-1/4 top-2 h-16 w-16 rounded-full bg-teal-400/8 animate-bounce [animation-delay:1s] [animation-duration:4s]" />
          <div className="pointer-events-none absolute -bottom-4 right-8 h-20 w-20 rounded-full bg-cyan-400/10 animate-bounce [animation-delay:2s] [animation-duration:3.5s]" />
          <div className="relative z-10">
            <h1 className="gradient-text text-xl font-bold tracking-tight md:text-3xl bg-[linear-gradient(110deg,transparent_25%,rgba(16,185,129,0.15)_50%,transparent_75%)] bg-[length:200%_100%] animate-[shimmer_3s_ease-in-out_infinite] dark:bg-[linear-gradient(110deg,transparent_25%,rgba(52,211,153,0.12)_50%,transparent_75%)]">
              {getGreeting()}, {displayName}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">{formattedDate}</p>
          </div>
          {/* Decorative chart pattern on right */}
          <div className="pointer-events-none hidden md:block absolute right-4 top-1/2 -translate-y-1/2 opacity-[0.12] dark:opacity-[0.08]">
            <svg width="120" height="80" viewBox="0 0 120 80" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="10" y="30" width="14" height="40" rx="4" fill="currentColor" className="text-emerald-600" />
              <rect x="30" y="20" width="14" height="50" rx="4" fill="currentColor" className="text-teal-600" />
              <rect x="50" y="35" width="14" height="35" rx="4" fill="currentColor" className="text-cyan-600" />
              <rect x="70" y="10" width="14" height="60" rx="4" fill="currentColor" className="text-emerald-600" />
              <rect x="90" y="25" width="14" height="45" rx="4" fill="currentColor" className="text-teal-600" />
              <path d="M17 28 L37 18 L57 33 L77 8 L97 23" stroke="currentColor" className="text-emerald-500" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
              <circle cx="17" cy="28" r="3" fill="currentColor" className="text-emerald-500" />
              <circle cx="37" cy="18" r="3" fill="currentColor" className="text-emerald-500" />
              <circle cx="57" cy="33" r="3" fill="currentColor" className="text-emerald-500" />
              <circle cx="77" cy="8" r="3" fill="currentColor" className="text-emerald-500" />
              <circle cx="97" cy="23" r="3" fill="currentColor" className="text-emerald-500" />
            </svg>
          </div>
        </div>
      </motion.div>

      {/* Quick Actions Bar */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1, ease: 'easeOut' }}
      >
        <div className="grid grid-cols-2 gap-2 md:gap-3 md:grid-cols-4">
          <QuickActionButton
            icon={Users}
            label="Add Candidate"
            description="Add new candidate to pipeline"
            colorClass="bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400"
            bgClass="from-emerald-50/60 to-transparent dark:from-emerald-950/20"
            onClick={() => navigate('candidates')}
          />
          <QuickActionButton
            icon={Briefcase}
            label="Post Job"
            description="Create a new job opening"
            colorClass="bg-amber-100 text-amber-600 dark:bg-amber-950 dark:text-amber-400"
            bgClass="from-amber-50/60 to-transparent dark:from-amber-950/20"
            onClick={() => navigate('jobs')}
          />
          <QuickActionButton
            icon={Video}
            label="Schedule Interview"
            description="Set up an interview slot"
            colorClass="bg-violet-100 text-violet-600 dark:bg-violet-950 dark:text-violet-400"
            bgClass="from-violet-50/60 to-transparent dark:from-violet-950/20"
            onClick={() => navigate('interviews')}
          />
          <QuickActionButton
            icon={BarChart3}
            label="View Reports"
            description="View analytics dashboard"
            colorClass="bg-rose-100 text-rose-600 dark:bg-rose-950 dark:text-rose-400"
            bgClass="from-rose-50/60 to-transparent dark:from-rose-950/20"
            onClick={() => navigate('analytics')}
          />
        </div>
      </motion.div>

      {/* Stat Cards Grid */}
      <div className="grid grid-cols-2 gap-3 md:gap-4 md:grid-cols-4">
        {STAT_CARDS.map((config, index) => (
          <StatCard
            key={config.key}
            config={config}
            stats={data?.stats ?? null}
            isLoading={isLoading}
            index={index}
          />
        ))}
      </div>

      {/* Weekly Summary */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.25, ease: 'easeOut' }}
      >
        <Card className="card-glass">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-100 dark:bg-teal-950">
                <TrendingUp className="h-4 w-4 text-teal-600 dark:text-teal-400" />
              </div>
              <div>
                <CardTitle className="text-base">Weekly Summary</CardTitle>
                <div className="mt-1 h-1 w-16 rounded-full bg-gradient-to-r from-teal-400 to-cyan-400" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              <div className="flex items-center gap-3 sm:after:content-[''] sm:after:absolute sm:after:right-0 sm:after:top-1/2 sm:after:h-8 sm:after:w-px sm:after:-translate-y-1/2 sm:after:bg-border relative card-section-divider">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-100 dark:bg-emerald-950">
                  <UserPlus className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div>
                  <p className="text-lg font-bold animate-count-up">{data?.stats?.totalCandidates ?? 0}</p>
                  <p className="text-xs text-muted-foreground">Total Candidates</p>
                </div>
              </div>
              <div className="flex items-center gap-3 sm:after:content-[''] sm:after:absolute sm:after:right-0 sm:after:top-1/2 sm:after:h-8 sm:after:w-px sm:after:-translate-y-1/2 sm:after:bg-border relative card-section-divider">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-teal-100 dark:bg-teal-950">
                  <CheckCircle2 className="h-4 w-4 text-teal-600 dark:text-teal-400" />
                </div>
                <div>
                  <p className="text-lg font-bold animate-count-up">{data?.stats?.interviewsThisWeek ?? 0}</p>
                  <p className="text-xs text-muted-foreground">Interviews Completed</p>
                </div>
              </div>
              <div className="flex items-center gap-3 sm:after:content-[''] sm:after:absolute sm:after:right-0 sm:after:top-1/2 sm:after:h-8 sm:after:w-px sm:after:-translate-y-1/2 sm:after:bg-border relative card-section-divider">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-100 dark:bg-amber-950">
                  <Send className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                </div>
                <div>
                  <p className="text-lg font-bold animate-count-up">{data?.stats?.placementsThisMonth ?? 0}</p>
                  <p className="text-xs text-muted-foreground">Placements</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-rose-100 dark:bg-rose-950">
                  <Award className="h-4 w-4 text-rose-600 dark:text-rose-400" />
                </div>
                <div>
                  <p className="text-lg font-bold animate-count-up">{data?.stats?.placementsThisMonth ?? 0}</p>
                  <p className="text-xs text-muted-foreground">Placements Made</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Pending Approvals Widget - for HR and above */}
      <PendingApprovalsWidget />
      {/* Charts Section */}
      <section>
        <div className="mb-4 flex items-center gap-3">
          <Activity className="h-5 w-5 text-muted-foreground" />
          <h2 className="text-lg font-semibold tracking-tight">Analytics Overview</h2>
          <div className="h-px flex-1 bg-border" />
        </div>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <CandidatePipelineChart data={pipelineData} isLoading={isLoading} />
          <JobPriorityChart data={priorityData} isLoading={isLoading} />
        </div>
      </section>

      {/* Bottom Section: Recent Activities + Upcoming Interviews */}
      <section>
        <div className="mb-4 flex items-center gap-3">
          <BarChart3 className="h-5 w-5 text-muted-foreground" />
          <h2 className="text-lg font-semibold tracking-tight">Activity & Schedule</h2>
          <div className="h-px flex-1 bg-border" />
        </div>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <RecentActivities activities={data?.recentActivities ?? []} isLoading={isLoading} />
          <UpcomingInterviewsList interviews={data?.upcomingInterviews ?? []} isLoading={isLoading} />
        </div>
      </section>
    </div>
  )
}