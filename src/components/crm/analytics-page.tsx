'use client'

import { useEffect, useState } from 'react'
import {
  IndianRupee,
  Clock,
  TrendingUp,
  Users,
  Download,
  Trophy,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Progress } from '@/components/ui/progress'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'
import { motion } from 'framer-motion'
import { exportToCSV } from '@/lib/export-csv'

// ===== Types =====

type AnalyticsData = {
  monthlyPlacements: { month: string; count: number }[]
  candidateSources: { source: string; count: number }[]
  departmentDistribution: { department: string; count: number }[]
  weeklyInterviews: { total: number; completed: number }
  topRecruiters: { rank: number; name: string; placements: number }[]
  avgTimeToHire: number
  revenueTrend: { month: string; revenue: number }[]
  totalRevenue: number
  activeRecruitersCount: number
}

// ===== Color Constants =====

const SOURCE_COLORS = [
  '#0ea5e9', // sky-500
  '#10b981', // emerald-500
  '#f59e0b', // amber-500
  '#8b5cf6', // violet-500
  '#ec4899', // pink-500
  '#f97316', // orange-500
  '#06b6d4', // cyan-500
  '#6b7280', // gray-500
]

const DEPT_COLORS = [
  '#10b981',
  '#0ea5e9',
  '#f59e0b',
  '#8b5cf6',
  '#ec4899',
  '#f97316',
  '#06b6d4',
  '#ef4444',
  '#84cc16',
  '#6366f1',
]

// ===== Custom Tooltip =====

function ChartTooltip({
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
          {entry.name}: {typeof entry.value === 'number' && entry.name?.toLowerCase().includes('revenue')
            ? `\u20b9${(entry.value / 100000).toFixed(1)}L`
            : entry.value.toLocaleString('en-IN')}
        </p>
      ))}
    </div>
  )
}

// ===== Stat Cards =====

function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  iconBg,
  iconColor,
  accentColor,
  isLoading,
  index,
}: {
  icon: React.ElementType
  label: string
  value: string
  sub?: string
  iconBg: string
  iconColor: string
  accentColor: string
  isLoading: boolean
  index: number
}) {
  if (isLoading) {
    return (
      <Card className="rounded-xl shadow-sm">
        <CardContent className="flex items-center gap-4 p-4">
          <Skeleton className="h-12 w-12 shrink-0 rounded-xl" />
          <div className="flex flex-col gap-2">
            <Skeleton className="h-3 w-28" />
            <Skeleton className="h-7 w-20" />
            <Skeleton className="h-3 w-16" />
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.06, ease: 'easeOut' }}
    >
      <Card
        className={`relative overflow-hidden rounded-xl border-l-2 ${accentColor} bg-gradient-to-r from-green-50/80 dark:from-green-950/50 to-transparent shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg`}
      >
        <CardContent className="flex items-center gap-4 p-4">
          <div
            className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${iconBg}`}
          >
            <Icon className={`h-6 w-6 ${iconColor}`} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm text-muted-foreground">{label}</p>
            <p className="text-2xl font-bold tracking-tight">{value}</p>
            {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

// ===== Main Component =====

export function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [dateRange, setDateRange] = useState('6m')

  useEffect(() => {
    async function fetchAnalytics() {
      try {
        setIsLoading(true)
        setError(null)
        const res = await fetch('/api/analytics')
        if (!res.ok) throw new Error(`Failed: ${res.status}`)
        const json = await res.json()
        setData(json)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unexpected error')
      } finally {
        setIsLoading(false)
      }
    }
    fetchAnalytics()
  }, [])

  const handleExport = () => {
    if (!data) return
    const rows: Record<string, unknown>[] = []
    // Monthly placements
    data.monthlyPlacements.forEach((m) => {
      rows.push({ 'Month': m.month, 'Placements': m.count })
    })
    // Revenue trend
    data.revenueTrend.forEach((m) => {
      rows.push({ 'Month': m.month, 'Revenue (INR)': m.revenue })
    })
    // Candidate sources
    data.candidateSources.forEach((s) => {
      rows.push({ 'Source': s.source, 'Candidates': s.count })
    })
    // Department distribution
    data.departmentDistribution.forEach((d) => {
      rows.push({ 'Department': d.department, 'Job Openings': d.count })
    })
    // Top recruiters
    data.topRecruiters.forEach((r) => {
      rows.push({ 'Rank': r.rank, 'Recruiter': r.name, 'Placements': r.placements })
    })
    exportToCSV(rows, 'analytics-report')
  }

  const interviewRate =
    data && data.weeklyInterviews.total > 0
      ? Math.round((data.weeklyInterviews.completed / data.weeklyInterviews.total) * 100)
      : 0

  const maxRecruiterPlacements =
    data && data.topRecruiters.length > 0
      ? Math.max(...data.topRecruiters.map((r) => r.placements))
      : 1

  if (error) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 p-8">
        <p className="text-lg font-medium text-destructive">Failed to load analytics</p>
        <p className="text-sm text-muted-foreground">{error}</p>
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className="flex flex-1 flex-col gap-6 p-4 md:p-6"
    >
      {/* Header with date range and export */}
      <div className="space-y-3">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 dark:bg-emerald-950">
              <TrendingUp className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Analytics & Reports</h1>
              <p className="mt-1 text-sm text-muted-foreground">Comprehensive insights into your recruitment performance</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Select value={dateRange} onValueChange={setDateRange}>
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7d">Last 7 days</SelectItem>
                <SelectItem value="30d">Last 30 days</SelectItem>
                <SelectItem value="3m">Last 3 months</SelectItem>
                <SelectItem value="6m">Last 6 months</SelectItem>
                <SelectItem value="all">All Time</SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              size="sm"
              onClick={handleExport}
              disabled={isLoading || !data}
              className="gap-2"
            >
              <Download className="h-4 w-4" />
              Export Report
            </Button>
          </div>
        </motion.div>
        <div className="h-1 w-16 rounded-full bg-gradient-to-r from-emerald-400 to-teal-400" />
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatCard
          icon={IndianRupee}
          label="Total Revenue"
          value={data ? `\u20b9${(data.totalRevenue / 100000).toFixed(1)}L` : '--'}
          sub="All time commission"
          iconBg="bg-green-100 dark:bg-green-950"
          iconColor="text-green-600 dark:text-green-400"
          accentColor="border-l-green-500"
          isLoading={isLoading}
          index={0}
        />
        <StatCard
          icon={Clock}
          label="Avg Time to Hire"
          value={data ? `${data.avgTimeToHire} days` : '--'}
          sub="Creation to hired"
          iconBg="bg-amber-100 dark:bg-amber-950"
          iconColor="text-amber-600 dark:text-amber-400"
          accentColor="border-l-amber-500"
          isLoading={isLoading}
          index={1}
        />
        <StatCard
          icon={TrendingUp}
          label="Interview Rate"
          value={isLoading ? '--' : `${interviewRate}%`}
          sub={`This week (${data?.weeklyInterviews.completed ?? 0}/${data?.weeklyInterviews.total ?? 0})`}
          iconBg="bg-emerald-100 dark:bg-emerald-950"
          iconColor="text-emerald-600 dark:text-emerald-400"
          accentColor="border-l-emerald-500"
          isLoading={isLoading}
          index={2}
        />
        <StatCard
          icon={Users}
          label="Active Recruiters"
          value={data ? String(data.activeRecruitersCount) : '--'}
          sub="Currently active"
          iconBg="bg-violet-100 dark:bg-violet-950"
          iconColor="text-violet-600 dark:text-violet-400"
          accentColor="border-l-violet-500"
          isLoading={isLoading}
          index={3}
        />
      </div>

      {/* Charts 2x2 Grid */}
      <section>
        <div className="mb-4 flex items-center gap-3">
          <TrendingUp className="h-5 w-5 text-muted-foreground" />
          <h2 className="text-lg font-semibold tracking-tight">Trends & Distribution</h2>
          <div className="h-px flex-1 bg-border" />
        </div>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Monthly Placements Trend - Area Chart */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3, ease: 'easeOut' }}
          >
            <Card className="rounded-xl border-l-4 border-l-emerald-400 shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-semibold">Monthly Placements Trend</CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <Skeleton className="h-[300px] w-full" />
                ) : (
                  <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart
                        data={data?.monthlyPlacements ?? []}
                        margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
                      >
                        <defs>
                          <linearGradient id="placementGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="#14b8a6" stopOpacity={0.02} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                        <YAxis tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                        <Tooltip content={<ChartTooltip />} />
                        <Area
                          type="monotone"
                          dataKey="count"
                          name="Placements"
                          stroke="#10b981"
                          strokeWidth={2}
                          fill="url(#placementGradient)"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Candidate Sources - Horizontal Bar Chart */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4, ease: 'easeOut' }}
          >
            <Card className="rounded-xl border-l-4 border-l-sky-400 shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-semibold">Candidate Sources</CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <Skeleton className="h-[300px] w-full" />
                ) : (
                  <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={data?.candidateSources ?? []}
                        layout="vertical"
                        margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                        <XAxis type="number" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                        <YAxis
                          type="category"
                          dataKey="source"
                          tick={{ fontSize: 12 }}
                          width={70}
                          stroke="hsl(var(--muted-foreground))"
                        />
                        <Tooltip content={<ChartTooltip />} />
                        <Bar dataKey="count" name="Candidates" radius={[0, 6, 6, 0]} barSize={24}>
                          {(data?.candidateSources ?? []).map((_, index) => (
                            <Cell key={`source-${index}`} fill={SOURCE_COLORS[index % SOURCE_COLORS.length]} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Revenue Trend - Bar Chart */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.5, ease: 'easeOut' }}
          >
            <Card className="rounded-xl border-l-4 border-l-green-400 shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-semibold">Revenue Trend</CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <Skeleton className="h-[300px] w-full" />
                ) : (
                  <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={data?.revenueTrend ?? []}
                        margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                        <YAxis tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" tickFormatter={(v) => `\u20b9${(v / 100000).toFixed(0)}L`} />
                        <Tooltip content={<ChartTooltip />} />
                        <Bar dataKey="revenue" name="Revenue" fill="#22c55e" radius={[6, 6, 0, 0]} barSize={32} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Department Distribution - Donut Chart */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.6, ease: 'easeOut' }}
          >
            <Card className="rounded-xl border-l-4 border-l-amber-400 shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-semibold">Department Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <Skeleton className="h-[300px] w-full" />
                ) : (
                  <div className="flex flex-col items-center gap-4 lg:flex-row">
                    <div className="h-[280px] w-full max-w-[280px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={data?.departmentDistribution ?? []}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={100}
                            paddingAngle={3}
                            dataKey="count"
                            nameKey="department"
                            stroke="none"
                          >
                            {(data?.departmentDistribution ?? []).map((_, index) => (
                              <Cell key={`dept-${index}`} fill={DEPT_COLORS[index % DEPT_COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip content={<ChartTooltip />} />
                          <Legend
                            verticalAlign="bottom"
                            height={36}
                            formatter={(value: string) => (
                              <span className="text-xs text-muted-foreground">{value}</span>
                            )}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    {(data?.departmentDistribution ?? []).length > 0 && (
                      <div className="flex flex-wrap justify-center gap-3 lg:flex-col lg:justify-start lg:gap-2">
                        {data!.departmentDistribution.map((entry, idx) => (
                          <div key={entry.department} className="flex items-center gap-2 text-sm">
                            <span
                              className="h-3 w-3 shrink-0 rounded-full"
                              style={{ backgroundColor: DEPT_COLORS[idx % DEPT_COLORS.length] }}
                            />
                            <span className="text-muted-foreground">{entry.department}</span>
                            <Badge variant="secondary" className="text-xs font-semibold">
                              {entry.count}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </section>

      {/* Bottom Section: Top Recruiters + Interview Completion */}
      <section>
        <div className="mb-4 flex items-center gap-3">
          <Trophy className="h-5 w-5 text-muted-foreground" />
          <h2 className="text-lg font-semibold tracking-tight">Performance</h2>
          <div className="h-px flex-1 bg-border" />
        </div>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Top Recruiters Table */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.7, ease: 'easeOut' }}
            className="lg:col-span-2"
          >
            <Card className="rounded-xl shadow-sm">
              <div className="h-1.5 rounded-t-xl bg-gradient-to-r from-amber-400 via-yellow-400 to-orange-400" />
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-semibold">Top Recruiters</CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="space-y-3">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Skeleton key={i} className="h-10 w-full" />
                    ))}
                  </div>
                ) : data && data.topRecruiters.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-16">Rank</TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead className="w-32">Placements</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data.topRecruiters.map((recruiter) => (
                        <TableRow key={recruiter.rank}>
                          <TableCell>
                            <Badge
                              variant={recruiter.rank <= 3 ? 'default' : 'secondary'}
                              className={
                                recruiter.rank === 1
                                  ? 'bg-amber-500 text-white hover:bg-amber-500'
                                  : recruiter.rank === 2
                                    ? 'bg-gray-400 text-white hover:bg-gray-400'
                                    : recruiter.rank === 3
                                      ? 'bg-orange-700 text-white hover:bg-orange-700'
                                      : ''
                              }
                            >
                              #{recruiter.rank}
                            </Badge>
                          </TableCell>
                          <TableCell className="font-medium">{recruiter.name}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Progress
                                value={(recruiter.placements / maxRecruiterPlacements) * 100}
                                className="h-2 flex-1"
                              />
                              <span className="text-sm font-semibold tabular-nums">
                                {recruiter.placements}
                              </span>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <p className="py-8 text-center text-sm text-muted-foreground">
                    No placement data available.
                  </p>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Interview Completion Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.8, ease: 'easeOut' }}
          >
            <Card className="rounded-xl shadow-sm">
              <div className="h-1.5 rounded-t-xl bg-gradient-to-r from-emerald-400 to-teal-400" />
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-semibold">Interview Completion</CardTitle>
                <p className="text-xs text-muted-foreground">This week&apos;s performance</p>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="space-y-4">
                    <Skeleton className="h-16 w-full rounded-lg" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-8 w-32" />
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-6">
                    <div className="relative flex h-32 w-32 items-center justify-center">
                      <svg className="h-32 w-32 -rotate-90" viewBox="0 0 120 120">
                        <circle
                          cx="60"
                          cy="60"
                          r="52"
                          fill="none"
                          stroke="hsl(var(--muted))"
                          strokeWidth="10"
                        />
                        <circle
                          cx="60"
                          cy="60"
                          r="52"
                          fill="none"
                          stroke="#10b981"
                          strokeWidth="10"
                          strokeDasharray={`${(interviewRate / 100) * 326.73} 326.73`}
                          strokeLinecap="round"
                          className="transition-all duration-1000 ease-out"
                        />
                      </svg>
                      <div className="absolute flex flex-col items-center">
                        <span className="text-3xl font-bold">{interviewRate}%</span>
                        <span className="text-xs text-muted-foreground">completed</span>
                      </div>
                    </div>
                    <div className="w-full space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Completed</span>
                        <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                          {data?.weeklyInterviews.completed ?? 0}
                        </span>
                      </div>
                      <Progress value={interviewRate} className="h-2" />
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Total Scheduled</span>
                        <span className="font-semibold">{data?.weeklyInterviews.total ?? 0}</span>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </section>
    </motion.div>
  )
}
