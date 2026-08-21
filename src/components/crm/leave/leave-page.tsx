'use client'

import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useCRMStore } from '@/stores/crm-store'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
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
  Plus,
  CalendarOff,
  Coffee,
  HeartPulse,
  Award,
  Baby,
  Download,
  Check,
  X,
  Search,
} from 'lucide-react'
import { toast } from 'sonner'
import { exportToCSV } from '@/lib/export-csv'
import { AddLeaveDialog } from './add-leave-dialog'

// ===== Types =====

type Employee = {
  id: string
  name: string
  email: string
  role: string
}

type LeaveBalance = {
  id: string
  employeeId: string
  year: number
  type: string
  total: number
  used: number
  remaining: number
}

type LeaveRequest = {
  id: string
  employeeId: string
  type: string
  startDate: string
  endDate: string
  totalDays: number
  reason: string | null
  status: string
  approvedBy: string | null
  approvedAt: string | null
  createdAt: string
  employee: {
    id: string
    name: string
    role: string
    department: string | null
  }
}

// ===== Constants =====

const STATUS_OPTIONS = ['All', 'Pending', 'Approved', 'Rejected', 'Cancelled']

const TYPE_OPTIONS = ['All', 'Casual Leave', 'Sick Leave', 'Earned Leave', 'Maternity Leave', 'Paternity Leave']

const STATUS_COLORS: Record<string, string> = {
  Pending: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400',
  Approved: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400',
  Rejected: 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400',
  Cancelled: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
}

const BALANCE_CARD_CONFIG = [
  { type: 'Casual Leave', label: 'Casual', icon: Coffee, color: 'text-orange-600 bg-orange-100 dark:bg-orange-950 dark:text-orange-400', accent: 'bg-orange-500', accentText: 'text-orange-500', accentStroke: 'stroke-orange-500', gradient: 'from-orange-50 to-amber-50 dark:from-orange-950/40 dark:to-amber-950/30', ringColor: 'ring-orange-500/20' },
  { type: 'Sick Leave', label: 'Sick', icon: HeartPulse, color: 'text-rose-600 bg-rose-100 dark:bg-rose-950 dark:text-rose-400', accent: 'bg-rose-500', accentText: 'text-rose-500', accentStroke: 'stroke-rose-500', gradient: 'from-rose-50 to-pink-50 dark:from-rose-950/40 dark:to-pink-950/30', ringColor: 'ring-rose-500/20' },
  { type: 'Earned Leave', label: 'Earned', icon: Award, color: 'text-emerald-600 bg-emerald-100 dark:bg-emerald-950 dark:text-emerald-400', accent: 'bg-emerald-500', accentText: 'text-emerald-500', accentStroke: 'stroke-emerald-500', gradient: 'from-emerald-50 to-teal-50 dark:from-emerald-950/40 dark:to-teal-950/30', ringColor: 'ring-emerald-500/20' },
  { type: 'Maternity Leave', label: 'Maternity', icon: Baby, color: 'text-pink-600 bg-pink-100 dark:bg-pink-950 dark:text-pink-400', accent: 'bg-pink-500', accentText: 'text-pink-500', accentStroke: 'stroke-pink-500', gradient: 'from-pink-50 to-fuchsia-50 dark:from-pink-950/40 dark:to-fuchsia-950/30', ringColor: 'ring-pink-500/20' },
]

const STATUS_BORDER_COLORS: Record<string, string> = {
  Pending: 'border-l-amber-500',
  Approved: 'border-l-emerald-500',
  Rejected: 'border-l-red-500',
  Cancelled: 'border-l-gray-400',
}

const STATUS_DOT_COLORS: Record<string, string> = {
  Pending: 'bg-amber-500',
  Approved: 'bg-emerald-500',
  Rejected: 'bg-red-500',
  Cancelled: 'bg-gray-400',
}

// ===== Helpers =====

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

function getBalanceForType(balances: LeaveBalance[], type: string): LeaveBalance | undefined {
  return balances.find((b) => b.type === type)
}

// ===== Balance Card =====

function BalanceCard({
  config,
  balance,
  isLoading,
}: {
  config: (typeof BALANCE_CARD_CONFIG)[number]
  balance?: LeaveBalance
  isLoading: boolean
}) {
  const Icon = config.icon
  const total = balance?.total ?? 0
  const used = balance?.used ?? 0
  const remaining = balance?.remaining ?? 0
  const percentage = total > 0 ? (used / total) * 100 : 0

  // SVG circular progress: radius=18, circumference ≈ 113.1
  const radius = 18
  const circumference = 2 * Math.PI * radius
  const strokeDashoffset = circumference * (1 - (isLoading ? 0 : percentage) / 100)

  return (
    <Card className={`relative overflow-hidden rounded-xl shadow-md ring-1 ${config.ringColor} bg-gradient-to-br ${config.gradient}`}>
      <CardContent className="p-4">
        <div className="flex items-center gap-4">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2.5">
              <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${config.color}`}>
                <Icon className="h-4.5 w-4.5" />
              </div>
              <p className="text-sm font-semibold text-muted-foreground">{config.label}</p>
            </div>
            {isLoading ? (
              <Skeleton className="mt-2 h-7 w-20" />
            ) : (
              <p className="mt-1.5 text-2xl font-extrabold tabular-nums tracking-tight">
                {remaining}
                <span className="ml-1.5 text-xs font-normal text-muted-foreground">/ {total} days</span>
              </p>
            )}
            <div className="mt-1.5 flex items-center gap-3 text-xs text-muted-foreground">
              <span>{used} used</span>
              <span className="text-border">·</span>
              <span>{remaining} remaining</span>
            </div>
          </div>
          {/* Circular progress indicator */}
          <div className="relative h-14 w-14 shrink-0">
            <svg className="h-14 w-14 -rotate-90" viewBox="0 0 48 48">
              {/* Track circle */}
              <circle
                cx="24"
                cy="24"
                r={radius}
                fill="none"
                strokeWidth="4"
                className="stroke-muted"
              />
              {/* Progress circle */}
              <circle
                cx="24"
                cy="24"
                r={radius}
                fill="none"
                strokeWidth="4"
                strokeLinecap="round"
                className={config.accentStroke}
                style={{
                  strokeDasharray: circumference,
                  strokeDashoffset,
                  transition: 'stroke-dashoffset 0.6s ease',
                }}
              />
            </svg>
            {/* Center percentage text */}
            <div className="absolute inset-0 flex items-center justify-center">
              <span className={`text-xs font-bold tabular-nums ${config.accentText}`}>
                {isLoading ? '—' : `${Math.round(percentage)}%`}
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// ===== Status Badge =====

function StatusBadge({ status }: { status: string }) {
  return (
    <Badge className={`gap-1.5 text-xs font-medium ${STATUS_COLORS[status] || 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400'}`}>
      <span className={`inline-block h-1.5 w-1.5 rounded-full ${STATUS_DOT_COLORS[status] || 'bg-gray-400'}`} />
      {status}
    </Badge>
  )
}

// ===== Leave Table =====

function LeaveTable({
  requests,
  isLoading,
  onApprove,
  onReject,
  isActionPending,
}: {
  requests: LeaveRequest[]
  isLoading: boolean
  onApprove: (id: string) => void
  onReject: (id: string) => void
  isActionPending: boolean
}) {
  if (isLoading) {
    return (
      <Card className="rounded-xl shadow-md">
        <CardContent className="p-4">
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4">
                <Skeleton className="h-4 w-[160px]" />
                <Skeleton className="h-4 w-[100px]" />
                <Skeleton className="h-4 w-[90px]" />
                <Skeleton className="h-4 w-[90px]" />
                <Skeleton className="h-4 w-[50px]" />
                <Skeleton className="h-4 w-[120px]" />
                <Skeleton className="h-5 w-[80px]" />
                <Skeleton className="h-5 w-[60px]" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (requests.length === 0) {
    return (
      <Card className="rounded-xl shadow-md">
        <CardContent className="flex flex-col items-center gap-3 py-12">
          <CalendarOff className="h-10 w-10 text-muted-foreground/40" />
          <p className="text-sm font-medium text-muted-foreground">No leave requests found</p>
          <p className="text-xs text-muted-foreground/70">
            Try adjusting your filters or apply for a new leave.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="rounded-xl shadow-md">
      <div className="max-h-96 overflow-y-auto">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="sticky top-0 z-10 bg-card text-xs font-semibold uppercase tracking-wider">Employee</TableHead>
              <TableHead className="sticky top-0 z-10 bg-card text-xs font-semibold uppercase tracking-wider">Leave Type</TableHead>
              <TableHead className="sticky top-0 z-10 bg-card text-xs font-semibold uppercase tracking-wider">From</TableHead>
              <TableHead className="sticky top-0 z-10 bg-card text-xs font-semibold uppercase tracking-wider">To</TableHead>
              <TableHead className="sticky top-0 z-10 bg-card text-xs font-semibold uppercase tracking-wider">Days</TableHead>
              <TableHead className="sticky top-0 z-10 bg-card text-xs font-semibold uppercase tracking-wider">Reason</TableHead>
              <TableHead className="sticky top-0 z-10 bg-card text-xs font-semibold uppercase tracking-wider">Status</TableHead>
              <TableHead className="sticky top-0 z-10 bg-card text-xs font-semibold uppercase tracking-wider">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {requests.map((req, index) => (
              <TableRow key={req.id} className={`table-row-hover border-l-4 ${STATUS_BORDER_COLORS[req.status] || 'border-l-gray-300'} ${index % 2 === 1 ? 'bg-muted/30' : ''}`}>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                      {req.employee.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{req.employee.name}</p>
                      <p className="truncate text-xs text-muted-foreground">{req.employee.role}</p>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="text-sm">{req.type}</TableCell>
                <TableCell className="whitespace-nowrap text-sm">{formatDate(req.startDate)}</TableCell>
                <TableCell className="whitespace-nowrap text-sm">{formatDate(req.endDate)}</TableCell>
                <TableCell className="text-sm font-medium tabular-nums">{req.totalDays}</TableCell>
                <TableCell className="max-w-[180px]">
                  <span className="block truncate text-xs text-muted-foreground">
                    {req.reason || '—'}
                  </span>
                </TableCell>
                <TableCell>
                  <StatusBadge status={req.status} />
                </TableCell>
                <TableCell>
                  {req.status === 'Pending' ? (
                    <div className="flex items-center gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 gap-1 px-2 text-xs text-emerald-600 hover:bg-emerald-100 hover:text-emerald-700 dark:text-emerald-400 dark:hover:bg-emerald-950"
                        disabled={isActionPending}
                        onClick={() => onApprove(req.id)}
                      >
                        <Check className="h-3.5 w-3.5" />
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 gap-1 px-2 text-xs text-red-600 hover:bg-red-100 hover:text-red-700 dark:text-red-400 dark:hover:bg-red-950"
                        disabled={isActionPending}
                        onClick={() => onReject(req.id)}
                      >
                        <X className="h-3.5 w-3.5" />
                        Reject
                      </Button>
                    </div>
                  ) : (
                    <span className="text-xs text-muted-foreground">—</span>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </Card>
  )
}

// ===== Main Leave Page =====

export function LeavePage() {
  const queryClient = useQueryClient()
  const { leaveFilter, setLeaveFilter } = useCRMStore()
  const [dialogOpen, setDialogOpen] = useState(false)

  // Fetch first employee for balance cards
  const { data: employeesData } = useQuery<{ data: Employee[] }>({
    queryKey: ['employees-first'],
    queryFn: async () => {
      const res = await fetch('/api/employees')
      if (!res.ok) throw new Error('Failed to fetch employees')
      return res.json()
    },
    staleTime: 1000 * 60 * 5,
  })

  const firstEmployee = employeesData?.data?.[0] ?? null

  // Fetch leave balances for the first employee
  const { data: balancesData, isLoading: balancesLoading } = useQuery<{
    data: LeaveBalance[]
  }>({
    queryKey: ['leave-balances', firstEmployee?.id],
    queryFn: async () => {
      if (!firstEmployee) return { data: [] }
      const params = new URLSearchParams()
      params.set('view', 'balances')
      params.set('employeeId', firstEmployee.id)
      const res = await fetch(`/api/leave?${params.toString()}`)
      if (!res.ok) throw new Error('Failed to fetch leave balances')
      return res.json()
    },
    enabled: !!firstEmployee,
    staleTime: 1000 * 60 * 2,
  })

  const balances = balancesData?.data ?? []

  // Fetch leave requests based on filters
  const { data: filteredData, isLoading: tableLoading } = useQuery<{
    data: LeaveRequest[]
  }>({
    queryKey: ['leave', leaveFilter.status, leaveFilter.type],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (leaveFilter.status && leaveFilter.status !== 'All') {
        params.set('status', leaveFilter.status)
      }
      if (leaveFilter.type && leaveFilter.type !== 'All') {
        params.set('type', leaveFilter.type)
      }
      const res = await fetch(`/api/leave?${params.toString()}`)
      if (!res.ok) throw new Error('Failed to fetch leave requests')
      return res.json()
    },
  })

  const allRequests = filteredData?.data ?? []

  // Client-side search filter
  const requests = useMemo(() => {
    const search = leaveFilter.search || ''
    if (!search) return allRequests
    return allRequests.filter((r) =>
      r.employee.name.toLowerCase().includes(search.toLowerCase())
    )
  }, [allRequests, leaveFilter.search])

  const recordCount = requests.length

  // Approve mutation
  const approveMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/leave/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'Approved' }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to approve leave')
      return data
    },
    onSuccess: () => {
      toast.success('Leave request approved')
      queryClient.invalidateQueries({ queryKey: ['leave'] })
      queryClient.invalidateQueries({ queryKey: ['leave-balances'] })
    },
    onError: (err: Error) => toast.error(err.message),
  })

  // Reject mutation
  const rejectMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/leave/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'Rejected' }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to reject leave')
      return data
    },
    onSuccess: () => {
      toast.success('Leave request rejected')
      queryClient.invalidateQueries({ queryKey: ['leave'] })
      queryClient.invalidateQueries({ queryKey: ['leave-balances'] })
    },
    onError: (err: Error) => toast.error(err.message),
  })

  const isActionPending = approveMutation.isPending || rejectMutation.isPending

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className="flex flex-1 flex-col gap-6 p-4 md:p-6"
    >
      {/* Header */}
      <div className="space-y-3">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-100 dark:bg-orange-950">
              <CalendarOff className="h-5 w-5 text-orange-600 dark:text-orange-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Leave Management</h1>
              <p className="mt-1 text-sm text-muted-foreground">Track leave balances and manage leave requests</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5"
              onClick={() => {
                const csvData = requests.map((r) => ({
                  'Employee Name': r.employee.name,
                  Role: r.employee.role,
                  Department: r.employee.department || '',
                  'Leave Type': r.type,
                  From: formatDate(r.startDate),
                  To: formatDate(r.endDate),
                  'Total Days': r.totalDays,
                  Reason: r.reason || '',
                  Status: r.status,
                  'Approved By': r.approvedBy || '',
                  'Approved At': r.approvedAt ? formatDate(r.approvedAt) : '',
                }))
                exportToCSV(csvData, 'leave-requests')
              }}
            >
              <Download className="h-4 w-4" />
              Export CSV
            </Button>
            <Button className="gap-2" onClick={() => setDialogOpen(true)}>
              <Plus className="h-4 w-4" />
              Apply for Leave
            </Button>
          </div>
        </div>
        <div className="h-1 w-16 rounded-full bg-gradient-to-r from-orange-400 to-amber-400" />
        {recordCount > 0 && (
          <p className="text-sm text-muted-foreground">
            {recordCount} request{recordCount !== 1 ? 's' : ''}
          </p>
        )}
      </div>

      {/* My Leave Balance Cards */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          My Leave Balance
          {firstEmployee && (
            <span className="ml-2 text-xs font-normal normal-case">
              — {firstEmployee.name}
            </span>
          )}
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {BALANCE_CARD_CONFIG.map((config) => (
            <BalanceCard
              key={config.type}
              config={config}
              balance={getBalanceForType(balances, config.type)}
              isLoading={balancesLoading}
            />
          ))}
        </div>
      </section>

      {/* Filters */}
      <div className="rounded-lg bg-muted/50 p-2">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1 sm:max-w-xs">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search employee name..."
              className="pl-9"
              value={leaveFilter.search}
              onChange={(e) => setLeaveFilter({ search: e.target.value })}
            />
          </div>
          <Select
            value={leaveFilter.type}
            onValueChange={(value) => setLeaveFilter({ type: value })}
          >
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Leave Type" />
            </SelectTrigger>
            <SelectContent>
              {TYPE_OPTIONS.map((type) => (
                <SelectItem key={type} value={type}>
                  {type === 'All' ? 'All Types' : type}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={leaveFilter.status}
            onValueChange={(value) => setLeaveFilter({ status: value })}
          >
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              {STATUS_OPTIONS.map((status) => (
                <SelectItem key={status} value={status}>
                  {status === 'All' ? 'All Statuses' : status}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Leave Requests Table */}
      <LeaveTable
        requests={requests}
        isLoading={tableLoading}
        onApprove={(id) => approveMutation.mutate(id)}
        onReject={(id) => rejectMutation.mutate(id)}
        isActionPending={isActionPending}
      />

      {/* Add Leave Dialog */}
      <AddLeaveDialog open={dialogOpen} onOpenChange={setDialogOpen} />
    </motion.div>
  )
}
