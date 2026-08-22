'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { useCRMStore } from '@/stores/crm-store'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  ArrowLeft,
  Pencil,
  Trash2,
  Mail,
  Phone,
  Briefcase,
  Video,
  UserCheck,
  CalendarOff,
  Clock,
  CheckCircle2,
  XCircle,
  Loader2,
  TrendingUp,
  Activity,
  CalendarDays,
  AlertCircle,
  CircleDot,
} from 'lucide-react'
import { motion } from 'framer-motion'
import { ROLE_COLORS as AUTH_ROLE_COLORS, ROLE_LABELS } from '@/lib/auth-utils'

// ===== Types =====

type PlacementRecord = {
  id: string
  candidate: { id: string; firstName: string; lastName: string } | null
  job: { id: string; title: string } | null
  client: { id: string; name: string } | null
  offeredCTC: number | null
  commission: number | null
  status: string
  createdAt: string
  joinedDate: string | null
}

type AttendanceRecord = {
  id: string
  date: string
  clockIn: string | null
  clockOut: string | null
  status: string
  totalHours: number | null
  notes: string | null
}

type LeaveBalanceRecord = {
  id: string
  type: string
  total: number
  used: number
  remaining: number
  year: number
}

type LeaveRequestRecord = {
  id: string
  type: string
  startDate: string
  endDate: string
  totalDays: number
  reason: string | null
  status: string
  createdAt: string
}

type ActivityRecord = {
  id: string
  entityType: string
  entityId: string | null
  action: string
  details: string | null
  createdAt: string
}

type EmployeeDetailData = {
  id: string
  name: string
  email: string
  phone: string | null
  role: string
  department: string | null
  avatar: string | null
  isActive: boolean
  createdAt: string
  updatedAt: string
  placements: PlacementRecord[]
  attendance: AttendanceRecord[]
  leaveBalances: LeaveBalanceRecord[]
  leaveRequests: LeaveRequestRecord[]
  activities: ActivityRecord[]
  stats: {
    totalPlacements: number
    interviewsConducted: number
    attendanceRate: number
    totalLeaveRemaining: number
    totalRevenue: number
  }
  attendanceSummary: {
    presentDays: number
    lateDays: number
    totalRecords: number
    totalHours: number
    avgHoursPerDay: number
  }
  leaveRequestsSummary: {
    pending: number
    approved: number
    rejected: number
    total: number
  }
}

// ===== Constants =====

const AVATAR_GRADIENTS: Record<string, string> = {
  FOUNDER: 'bg-gradient-to-br from-amber-400 to-amber-600',
  COFOUNDER: 'bg-gradient-to-br from-orange-400 to-orange-600',
  HR: 'bg-gradient-to-br from-teal-400 to-teal-600',
  EMPLOYEE: 'bg-gradient-to-br from-emerald-400 to-emerald-600',
}

const ROLE_COLORS: Record<string, string> = AUTH_ROLE_COLORS

const DEPT_COLORS: Record<string, string> = {
  Sales: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-400 dark:border-emerald-800',
  HR: 'bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-950 dark:text-violet-400 dark:border-violet-800',
  Recruitment: 'bg-teal-50 text-teal-700 border-teal-200 dark:bg-teal-950 dark:text-teal-400 dark:border-teal-800',
  Engineering: 'bg-cyan-50 text-cyan-700 border-cyan-200 dark:bg-cyan-950 dark:text-cyan-400 dark:border-cyan-800',
  Marketing: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950 dark:text-rose-400 dark:border-rose-800',
  Operations: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-400 dark:border-amber-800',
}

const PLACEMENT_STATUS_COLORS: Record<string, string> = {
  Offered: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400',
  Accepted: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-950 dark:text-cyan-400',
  Joined: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400',
  'Backed-Out': 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-400',
}

const ATTENDANCE_STATUS_COLORS: Record<string, string> = {
  Present: 'text-emerald-600 dark:text-emerald-400',
  Late: 'text-amber-600 dark:text-amber-400',
  Absent: 'text-rose-600 dark:text-rose-400',
  'Half-Day': 'text-cyan-600 dark:text-cyan-400',
}

const LEAVE_STATUS_COLORS: Record<string, string> = {
  Pending: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400',
  Approved: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400',
  Rejected: 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-400',
}

const LEAVE_TYPE_COLORS: Record<string, string> = {
  Casual: 'bg-emerald-500',
  Sick: 'bg-rose-500',
  Earned: 'bg-amber-500',
  Maternity: 'bg-violet-500',
  Paternity: 'bg-cyan-500',
  Compensatory: 'bg-teal-500',
}

const ACTIVITY_ENTITY_COLORS: Record<string, string> = {
  Candidate: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400',
  Client: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400',
  Job: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-950 dark:text-cyan-400',
  Placement: 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-400',
  Interview: 'bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-400',
  Employee: 'bg-teal-100 text-teal-700 dark:bg-teal-950 dark:text-teal-400',
}

// ===== Helpers =====

function getInitials(name: string) {
  return name
    .split(' ')
    .map((w) => w.charAt(0))
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

function formatDateTime(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function relativeTime(dateStr: string) {
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
  return formatDate(dateStr)
}

// ===== Circular Progress =====

function CircularProgress({
  value,
  total,
  color,
  size = 80,
}: {
  value: number
  total: number
  color: string
  size?: number
}) {
  const radius = (size - 8) / 2
  const circumference = 2 * Math.PI * radius
  const percentage = total > 0 ? Math.min((value / total) * 100, 100) : 0
  const offset = circumference - (percentage / 100) * circumference

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          className="stroke-muted"
          strokeWidth={4}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          className={color}
          strokeWidth={4}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 0.6s ease' }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-xs font-bold">{value}</span>
      </div>
    </div>
  )
}

// ===== Placements Tab =====

function PlacementsTab({ placements }: { placements: PlacementRecord[] }) {
  if (placements.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center gap-3 py-12">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
            <Briefcase className="h-6 w-6 text-muted-foreground/50" />
          </div>
          <p className="text-sm font-medium text-muted-foreground">
            No placements yet
          </p>
          <p className="text-xs text-muted-foreground/70">
            This employee hasn't made any placements
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardContent className="p-0">
        <div className="max-h-96 overflow-y-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Candidate</TableHead>
                <TableHead>Job</TableHead>
                <TableHead className="hidden md:table-cell">Client</TableHead>
                <TableHead className="text-right">Offered CTC</TableHead>
                <TableHead className="hidden sm:table-cell text-right">Commission</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="hidden lg:table-cell">Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {placements.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="font-medium">
                    {p.candidate
                      ? `${p.candidate.firstName} ${p.candidate.lastName}`
                      : 'N/A'}
                  </TableCell>
                  <TableCell>{p.job?.title || 'N/A'}</TableCell>
                  <TableCell className="hidden md:table-cell">
                    {p.client?.name || 'N/A'}
                  </TableCell>
                  <TableCell className="text-right">
                    {p.offeredCTC
                      ? `₹${p.offeredCTC} LPA`
                      : '—'}
                  </TableCell>
                  <TableCell className="hidden sm:table-cell text-right">
                    {p.commission ? (
                      <span className="font-medium text-emerald-600 dark:text-emerald-400">
                        ₹{p.commission.toLocaleString('en-IN')}
                      </span>
                    ) : (
                      '—'
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge
                      className={`text-[10px] ${
                        PLACEMENT_STATUS_COLORS[p.status] || ''
                      }`}
                    >
                      {p.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="hidden lg:table-cell text-xs text-muted-foreground">
                    {formatDate(p.createdAt)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}

// ===== Attendance Tab =====

function AttendanceTab({
  records,
  summary,
}: {
  records: AttendanceRecord[]
  summary: {
    presentDays: number
    lateDays: number
    totalRecords: number
    totalHours: number
    avgHoursPerDay: number
  }
}) {
  if (records.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center gap-3 py-12">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
            <Clock className="h-6 w-6 text-muted-foreground/50" />
          </div>
          <p className="text-sm font-medium text-muted-foreground">
            No attendance records
          </p>
          <p className="text-xs text-muted-foreground/70">
            No attendance data in the last 30 days
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Card className="stat-card-hover">
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-100 dark:bg-emerald-950">
                <CheckCircle2 className="h-4.5 w-4.5 text-emerald-600 dark:text-emerald-400" />
              </div>
            </div>
            <p className="mt-2 text-2xl font-bold animate-count-up">{summary.presentDays}</p>
            <p className="text-xs text-muted-foreground">Present Days</p>
          </CardContent>
        </Card>
        <Card className="stat-card-hover">
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-100 dark:bg-amber-950">
                <AlertCircle className="h-4.5 w-4.5 text-amber-600 dark:text-amber-400" />
              </div>
            </div>
            <p className="mt-2 text-2xl font-bold animate-count-up">{summary.lateDays}</p>
            <p className="text-xs text-muted-foreground">Late Days</p>
          </CardContent>
        </Card>
        <Card className="stat-card-hover">
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-teal-100 dark:bg-teal-950">
                <Clock className="h-4.5 w-4.5 text-teal-600 dark:text-teal-400" />
              </div>
            </div>
            <p className="mt-2 text-2xl font-bold data-cell-number">{summary.totalHours}h</p>
            <p className="text-xs text-muted-foreground">Total Hours</p>
          </CardContent>
        </Card>
        <Card className="stat-card-hover">
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-cyan-100 dark:bg-cyan-950">
                <TrendingUp className="h-4.5 w-4.5 text-cyan-600 dark:text-cyan-400" />
              </div>
            </div>
            <p className="mt-2 text-2xl font-bold data-cell-number">{summary.avgHoursPerDay}h</p>
            <p className="text-xs text-muted-foreground">Avg Hours/Day</p>
          </CardContent>
        </Card>
      </div>

      {/* Attendance Table */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium">Recent Attendance (Last 30 Days)</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="max-h-72 overflow-y-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Clock In</TableHead>
                  <TableHead>Clock Out</TableHead>
                  <TableHead className="text-right">Hours</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {records.map((a) => (
                  <TableRow key={a.id}>
                    <TableCell className="text-sm">
                      {formatDate(a.date)}
                    </TableCell>
                    <TableCell>
                      <span
                        className={`text-xs font-medium ${
                          ATTENDANCE_STATUS_COLORS[a.status] || ''
                        }`}
                      >
                        {a.status}
                      </span>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {a.clockIn
                        ? new Date(a.clockIn).toLocaleTimeString('en-IN', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })
                        : '—'}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {a.clockOut
                        ? new Date(a.clockOut).toLocaleTimeString('en-IN', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })
                        : '—'}
                    </TableCell>
                    <TableCell className="text-right text-sm">
                      {a.totalHours ? `${a.totalHours}h` : '—'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// ===== Leave Tab =====

function LeaveTab({
  balances,
  requests,
  onApprove,
  onReject,
  isUpdating,
}: {
  balances: LeaveBalanceRecord[]
  requests: LeaveRequestRecord[]
  onApprove: (id: string) => void
  onReject: (id: string) => void
  isUpdating: boolean
}) {
  return (
    <div className="space-y-6">
      {/* Leave Balance Cards */}
      <div>
        <h3 className="mb-3 text-sm font-medium">Leave Balances ({new Date().getFullYear()})</h3>
        {balances.length === 0 ? (
          <Card>
            <CardContent className="flex items-center gap-3 py-8">
              <CalendarOff className="h-5 w-5 text-muted-foreground/50" />
              <p className="text-sm text-muted-foreground">No leave balances configured</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {balances.map((b) => {
              const circleColor = LEAVE_TYPE_COLORS[b.type] || 'bg-gray-500'
              return (
                <Card key={b.id} className="overflow-hidden transition-all duration-200 hover:shadow-md hover:-translate-y-0.5">
                  <div className="h-1" style={{ backgroundColor: undefined }}>
                    <div className={`h-full w-full ${circleColor}`} />
                  </div>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-4">
                      <CircularProgress
                        value={b.remaining}
                        total={b.total}
                        color={circleColor.replace('bg-', 'stroke-')}
                        size={64}
                      />
                      <div className="min-w-0">
                        <p className="text-sm font-medium">{b.type}</p>
                        <p className="text-xs text-muted-foreground">
                          {b.used} used of {b.total}
                        </p>
                        <p className="mt-1 text-lg font-bold">{b.remaining} <span className="text-xs font-normal text-muted-foreground">left</span></p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </div>

      <Separator />

      {/* Leave Requests */}
      <div>
        <h3 className="mb-3 text-sm font-medium">Leave Requests</h3>
        {requests.length === 0 ? (
          <Card>
            <CardContent className="flex items-center gap-3 py-8">
              <CalendarDays className="h-5 w-5 text-muted-foreground/50" />
              <p className="text-sm text-muted-foreground">No leave requests</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {requests.map((r) => (
              <Card key={r.id}>
                <CardContent className="p-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">{r.type} Leave</span>
                        <Badge
                          className={`text-[10px] ${
                            LEAVE_STATUS_COLORS[r.status] || ''
                          }`}
                        >
                          {r.status}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(r.startDate)} — {formatDate(r.endDate)}
                        <span className="ml-2 font-medium text-foreground">
                          ({r.totalDays} day{r.totalDays !== 1 ? 's' : ''})
                        </span>
                      </p>
                      {r.reason && (
                        <p className="text-xs text-muted-foreground/80 italic">
                          &quot;{r.reason}&quot;
                        </p>
                      )}
                      <p className="text-[10px] text-muted-foreground/60">
                        Applied {relativeTime(r.createdAt)}
                      </p>
                    </div>
                    {r.status === 'Pending' && (
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          className="h-8 bg-emerald-600 text-white hover:bg-emerald-700"
                          onClick={() => onApprove(r.id)}
                          disabled={isUpdating}
                        >
                          {isUpdating && <Loader2 className="mr-1.5 h-3 w-3 animate-spin" />}
                          <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" />
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 text-rose-600 hover:bg-rose-50 hover:text-rose-700 dark:hover:bg-rose-950 dark:hover:text-rose-400"
                          onClick={() => onReject(r.id)}
                          disabled={isUpdating}
                        >
                          <XCircle className="mr-1.5 h-3.5 w-3.5" />
                          Reject
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// ===== Activity Tab =====

function ActivityTab({ activities }: { activities: ActivityRecord[] }) {
  if (activities.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center gap-3 py-12">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
            <Activity className="h-6 w-6 text-muted-foreground/50" />
          </div>
          <p className="text-sm font-medium text-muted-foreground">
            No activity recorded
          </p>
          <p className="text-xs text-muted-foreground/70">
            Activities will appear here as the employee interacts with the system
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardContent className="p-6">
        <div className="relative">
          {/* Timeline line */}
          <div className="absolute left-[15px] top-2 bottom-2 w-px bg-border" />
          <div className="space-y-6">
            {activities.map((a, index) => (
              <div key={a.id} className="relative flex gap-4">
                {/* Dot */}
                <div className="relative z-10 mt-1 flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-full bg-background border-2 border-border">
                  <CircleDot
                    className={`h-3 w-3 ${
                      ACTIVITY_ENTITY_COLORS[a.entityType]
                        ?.replace(/bg-\w+-\d+/g, 'text-\$&')
                        .replace(/dark:text-\w+-\d+/g, 'dark:text-\$&') ||
                      'text-muted-foreground'
                    }`}
                  />
                </div>
                <div className="flex-1 min-w-0 pb-1">
                  <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-2">
                    <Badge
                      className={`w-fit text-[10px] ${
                        ACTIVITY_ENTITY_COLORS[a.entityType] ||
                        'bg-muted text-muted-foreground'
                      }`}
                    >
                      {a.entityType}
                    </Badge>
                    <span className="text-[10px] text-muted-foreground">
                      {relativeTime(a.createdAt)}
                    </span>
                  </div>
                  <p className="mt-1 text-sm font-medium">{a.action}</p>
                  {a.details && (
                    <p className="mt-0.5 text-xs text-muted-foreground line-clamp-2">
                      {a.details}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// ===== Main Component =====

export function EmployeeDetail({ employeeId }: { employeeId: string }) {
  const { navigate } = useCRMStore()
  const queryClient = useQueryClient()
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)

  const { data, isLoading, error } = useQuery<EmployeeDetailData>({
    queryKey: ['employee', employeeId],
    queryFn: async () => {
      const res = await fetch(`/api/employees/${employeeId}`)
      if (!res.ok) throw new Error('Failed to fetch employee')
      return res.json()
    },
    enabled: !!employeeId,
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/employees/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to delete employee')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] })
      toast.success('Employee deleted successfully')
      navigate('employees')
    },
    onError: () => {
      toast.error('Failed to delete employee')
    },
  })

  const leaveActionMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: 'Approved' | 'Rejected' }) => {
      const res = await fetch(`/api/leave/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })
      if (!res.ok) throw new Error('Failed to update leave request')
      return res.json()
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['employee', employeeId] })
      toast.success(`Leave request ${variables.status.toLowerCase()}`)
    },
    onError: () => {
      toast.error('Failed to update leave request')
    },
  })

  if (isLoading) {
    return (
      <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 animate-pulse rounded-lg bg-muted" />
          <div className="h-6 w-40 animate-pulse rounded bg-muted" />
        </div>
        <div className="h-24 animate-pulse rounded-xl bg-muted" />
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-28 animate-pulse rounded-xl bg-muted" />
          ))}
        </div>
        <div className="h-64 animate-pulse rounded-xl bg-muted" />
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 p-4 md:p-6">
        <p className="text-sm text-destructive">
          Failed to load employee details. Please try again.
        </p>
        <Button variant="outline" onClick={() => navigate('employees')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Employees
        </Button>
      </div>
    )
  }

  const initials = getInitials(data.name)

  const statCards = [
    {
      label: 'Total Placements',
      value: data.stats.totalPlacements,
      icon: Briefcase,
      color: 'emerald',
      gradient: 'from-emerald-500 to-emerald-600',
      bgLight: 'bg-emerald-100 dark:bg-emerald-950',
      iconColor: 'text-emerald-600 dark:text-emerald-400',
    },
    {
      label: 'Interviews Conducted',
      value: data.stats.interviewsConducted,
      icon: Video,
      color: 'cyan',
      gradient: 'from-cyan-500 to-cyan-600',
      bgLight: 'bg-cyan-100 dark:bg-cyan-950',
      iconColor: 'text-cyan-600 dark:text-cyan-400',
    },
    {
      label: 'Attendance Rate',
      value: `${data.stats.attendanceRate}%`,
      icon: UserCheck,
      color: 'teal',
      gradient: 'from-teal-500 to-teal-600',
      bgLight: 'bg-teal-100 dark:bg-teal-950',
      iconColor: 'text-teal-600 dark:text-teal-400',
    },
    {
      label: 'Leave Remaining',
      value: data.stats.totalLeaveRemaining,
      icon: CalendarOff,
      color: 'amber',
      gradient: 'from-amber-500 to-amber-600',
      bgLight: 'bg-amber-100 dark:bg-amber-950',
      iconColor: 'text-amber-600 dark:text-amber-400',
    },
  ]

  return (
    <motion.div
      className="flex flex-1 flex-col gap-6 p-4 md:p-6"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Header Section */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-4">
          <Button
            variant="ghost"
            size="icon"
            className="mt-1 h-8 w-8 shrink-0"
            onClick={() => navigate('employees')}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <Avatar className="h-16 w-16">
            {data.avatar && <AvatarImage src={data.avatar} alt={data.name} />}
            <AvatarFallback
              className={`${
                AVATAR_GRADIENTS[data.role] ||
                'bg-gradient-to-br from-gray-400 to-gray-600'
              } text-lg font-bold text-white`}
            >
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl font-bold tracking-tight md:text-2xl">
                {data.name}
              </h1>
              <Badge
                className={`text-[10px] ${ROLE_COLORS[data.role] || ''}`}
              >
                {ROLE_LABELS[data.role as keyof typeof ROLE_LABELS] || data.role}
              </Badge>
              {data.department && (
                <Badge
                  variant="outline"
                  className={`text-[10px] border ${
                    DEPT_COLORS[data.department] || ''
                  }`}
                >
                  {data.department}
                </Badge>
              )}
              <Badge
                className={`text-[10px] ${
                  data.isActive
                    ? 'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400'
                    : 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400'
                }`}
              >
                {data.isActive ? 'Active' : 'Inactive'}
              </Badge>
            </div>
            <div className="mt-2 flex items-center gap-4 flex-wrap">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Mail className="h-3.5 w-3.5" />
                <span>{data.email}</span>
              </div>
              {data.phone && (
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Phone className="h-3.5 w-3.5" />
                  <span>{data.phone}</span>
                </div>
              )}
            </div>
            <p className="mt-1 text-[10px] text-muted-foreground/60">
              Joined {formatDate(data.createdAt)}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 sm:mt-1">
          <Button variant="outline" size="sm" className="h-8">
            <Pencil className="mr-1.5 h-3.5 w-3.5" />
            Edit
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-8 text-rose-600 hover:bg-rose-50 hover:text-rose-700 dark:hover:bg-rose-950 dark:hover:text-rose-400"
            onClick={() => setDeleteDialogOpen(true)}
          >
            <Trash2 className="mr-1.5 h-3.5 w-3.5" />
            Delete
          </Button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-4">
        {statCards.map((stat, i) => {
          const Icon = stat.icon
          return (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: i * 0.08 }}
            >
              <Card className="stat-card-hover relative overflow-hidden">
                <div
                  className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${stat.gradient}`}
                />
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div
                      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-transform duration-200 group-hover:scale-110 ${stat.bgLight}`}
                    >
                      <Icon className={`h-5 w-5 ${stat.iconColor}`} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-2xl font-bold">{stat.value}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        {stat.label}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )
        })}
      </div>

      {/* Tabbed Content */}
      <Tabs defaultValue="placements" className="flex-1">
        <TabsList className="w-full justify-start">
          <TabsTrigger value="placements" className="gap-1.5">
            <Briefcase className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Placements</span>
            <span className="sm:hidden">Plac.</span>
            {data.placements.length > 0 && (
              <Badge
                variant="secondary"
                className="ml-1 h-4 min-w-4 px-1 text-[10px]"
              >
                {data.placements.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="attendance" className="gap-1.5">
            <Clock className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Attendance</span>
            <span className="sm:hidden">Att.</span>
          </TabsTrigger>
          <TabsTrigger value="leave" className="gap-1.5">
            <CalendarOff className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Leave</span>
            {data.leaveRequestsSummary.pending > 0 && (
              <Badge className="ml-1 h-4 min-w-4 px-1 text-[10px] bg-amber-500 text-white hover:bg-amber-600">
                {data.leaveRequestsSummary.pending}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="activity" className="gap-1.5">
            <Activity className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Activity</span>
            <span className="sm:hidden">Act.</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="placements" className="mt-4 tab-content-enter">
          <PlacementsTab placements={data.placements} />
        </TabsContent>

        <TabsContent value="attendance" className="mt-4 tab-content-enter">
          <AttendanceTab
            records={data.attendance}
            summary={data.attendanceSummary}
          />
        </TabsContent>

        <TabsContent value="leave" className="mt-4 tab-content-enter">
          <LeaveTab
            balances={data.leaveBalances}
            requests={data.leaveRequests}
            onApprove={(id) =>
              leaveActionMutation.mutate({ id, status: 'Approved' })
            }
            onReject={(id) =>
              leaveActionMutation.mutate({ id, status: 'Rejected' })
            }
            isUpdating={leaveActionMutation.isPending}
          />
        </TabsContent>

        <TabsContent value="activity" className="mt-4 tab-content-enter">
          <ActivityTab activities={data.activities} />
        </TabsContent>
      </Tabs>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Employee</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <strong>{data.name}</strong>? This action
              cannot be undone. All associated data (attendance, leave records,
              placements) will also be deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-rose-600 text-white hover:bg-rose-700"
              onClick={() => deleteMutation.mutate(data.id)}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </motion.div>
  )
}
