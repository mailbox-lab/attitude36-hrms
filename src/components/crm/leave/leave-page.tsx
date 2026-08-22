'use client'

import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useCRMStore } from '@/stores/crm-store'
import { useAuth } from '@/lib/use-auth'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { Textarea } from '@/components/ui/textarea'
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
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
  ChevronRight,
  Shield,
  Clock,
  AlertTriangle,
  MessageSquare,
  UserCheck,
} from 'lucide-react'
import { toast } from 'sonner'
import { exportToCSV } from '@/lib/export-csv'
import { AddLeaveDialog } from './add-leave-dialog'
import { canApproveLeave, getApprovalStatusLabel, ROLE_LABELS, ROLE_COLORS, type UserRole } from '@/lib/auth-utils'

// ===== Types =====

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
  approvalStep: number | null
  approverRole: string | null
  approvedByLevel1: string | null
  approvedAtLevel1: string | null
  remarkL1: string | null
  approvedByLevel2: string | null
  approvedAtLevel2: string | null
  remarkL2: string | null
  rejectionReason: string | null
  createdAt: string
  employee: {
    id: string
    name: string
    role: string
    department: string | null
    designation: string | null
  }
  approvedByL1?: { id: string; name: string; role: string } | null
  approvedByL2?: { id: string; name: string; role: string } | null
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

// ===== Approval Chain Badge =====

function ApprovalChainBadge({ request }: { request: LeaveRequest }) {
  if (request.status === 'Approved') {
    return (
      <div className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 text-xs">
        <Check className="h-3 w-3" />
        <span>Fully Approved</span>
        {request.approvedByL1 && (
          <span className="text-muted-foreground">by {request.approvedByL1.name}</span>
        )}
      </div>
    )
  }

  if (request.status === 'Rejected') {
    return (
      <div className="flex items-center gap-1 text-red-600 dark:text-red-400 text-xs">
        <X className="h-3 w-3" />
        <span>Rejected</span>
        {request.rejectionReason && (
          <span className="text-muted-foreground">— {request.rejectionReason}</span>
        )}
      </div>
    )
  }

  if (request.status === 'Cancelled') {
    return (
      <div className="text-xs text-muted-foreground">Cancelled by requester</div>
    )
  }

  // Pending - show approval chain
  const approverLabel = request.approverRole === 'HR' ? 'HR Manager' : 'Founder / Co-Founder'
  const requesterLevel = request.employee.role === 'HR' ? 'HR' : 'Employee'

  return (
    <div className="flex items-center gap-1.5 text-xs">
      <span className="text-muted-foreground">{requesterLevel}</span>
      <ChevronRight className="h-3 w-3 text-muted-foreground" />
      <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/50 text-amber-700 dark:text-amber-400">
        <Clock className="h-3 w-3" />
        <span>Needs {approverLabel}</span>
      </div>
    </div>
  )
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

  const radius = 18
  const circumference = 2 * Math.PI * radius
  const strokeDashoffset = circumference * (1 - (isLoading ? 0 : percentage) / 100)

  return (
    <Card className={`relative overflow-hidden rounded-xl shadow-md ring-1 transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5 ${config.ringColor} bg-gradient-to-br ${config.gradient}`}>
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
          <div className="relative h-14 w-14 shrink-0">
            <svg className="h-14 w-14 -rotate-90" viewBox="0 0 48 48">
              <circle cx="24" cy="24" r={radius} fill="none" strokeWidth="4" className="stroke-muted" />
              <circle
                cx="24" cy="24" r={radius} fill="none" strokeWidth="4" strokeLinecap="round"
                className={config.accentStroke}
                style={{ strokeDasharray: circumference, strokeDashoffset, transition: 'stroke-dashoffset 0.6s ease' }}
              />
            </svg>
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

// ===== Approval Status Badge =====

function ApprovalStatusBadge({ request }: { request: LeaveRequest }) {
  const label = getApprovalStatusLabel(request.approvalStep, request.approverRole, request.status)
  const isPending = request.status === 'Pending'
  const approverLabel = request.approverRole === 'HR' ? 'HR' : request.approverRole === 'FOUNDER_OR_COFOUNDER' ? 'Founder' : ''

  return (
    <div className="space-y-1">
      <Badge className={`gap-1.5 text-xs font-medium ${STATUS_COLORS[request.status] || 'bg-gray-100 text-gray-700'}`}>
        {isPending && <span className="inline-block h-1.5 w-1.5 rounded-full bg-amber-500 animate-subtle-pulse" />}
        {request.status}
      </Badge>
      {isPending && approverLabel && (
        <p className="text-[10px] text-muted-foreground flex items-center gap-1">
          <Shield className="h-2.5 w-2.5" />
          Awaiting {approverLabel}
        </p>
      )}
    </div>
  )
}

// ===== Leave Table =====

function LeaveTable({
  requests,
  isLoading,
  onApprove,
  onReject,
  onCancel,
  isActionPending,
  currentRole,
  currentEmployeeId,
}: {
  requests: LeaveRequest[]
  isLoading: boolean
  onApprove: (id: string) => void
  onReject: (id: string) => void
  onCancel: (id: string) => void
  isActionPending: boolean
  currentRole: UserRole
  currentEmployeeId: string | null
}) {
  if (isLoading) {
    return (
      <Card className="rounded-xl shadow-md card-glass">
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
      <Card className="rounded-xl shadow-md card-glass">
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
    <Card className="rounded-xl shadow-md card-glass">
      <div className="max-h-96 overflow-y-auto mobile-table-scroll">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="sticky top-0 z-10 bg-card text-xs font-semibold uppercase tracking-wider">Employee</TableHead>
              <TableHead className="sticky top-0 z-10 bg-card text-xs font-semibold uppercase tracking-wider">Leave Type</TableHead>
              <TableHead className="sticky top-0 z-10 bg-card text-xs font-semibold uppercase tracking-wider">From</TableHead>
              <TableHead className="sticky top-0 z-10 bg-card text-xs font-semibold uppercase tracking-wider">To</TableHead>
              <TableHead className="sticky top-0 z-10 bg-card text-xs font-semibold uppercase tracking-wider">Days</TableHead>
              <TableHead className="sticky top-0 z-10 bg-card text-xs font-semibold uppercase tracking-wider">Approval Chain</TableHead>
              <TableHead className="sticky top-0 z-10 bg-card text-xs font-semibold uppercase tracking-wider">Status</TableHead>
              <TableHead className="sticky top-0 z-10 bg-card text-xs font-semibold uppercase tracking-wider">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {requests.map((req, index) => {
              const canApprove = canApproveLeave(
                currentRole,
                req.employee.role as UserRole,
                req.approvalStep,
                req.approverRole
              )
              const canCancel = req.status === 'Pending' && req.employeeId === currentEmployeeId

              return (
                <TableRow
                  key={req.id}
                  className={`table-row-hover border-l-4 ${STATUS_BORDER_COLORS[req.status] || 'border-l-gray-300'} ${index % 2 === 1 ? 'bg-muted/30' : ''}`}
                >
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                        {req.employee.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">{req.employee.name}</p>
                        <p className="truncate text-xs text-muted-foreground">
                          {req.employee.designation || req.employee.role}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm">{req.type}</TableCell>
                  <TableCell className="whitespace-nowrap text-sm">{formatDate(req.startDate)}</TableCell>
                  <TableCell className="whitespace-nowrap text-sm">{formatDate(req.endDate)}</TableCell>
                  <TableCell className="text-sm font-medium tabular-nums">{req.totalDays}</TableCell>
                  <TableCell>
                    <ApprovalChainBadge request={req} />
                  </TableCell>
                  <TableCell>
                    <ApprovalStatusBadge request={req} />
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      {req.status === 'Pending' && canApprove && (
                        <>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 gap-1 px-2 text-xs text-emerald-600 hover:bg-emerald-100 hover:text-emerald-700 dark:text-emerald-400 dark:hover:bg-emerald-950"
                            disabled={isActionPending}
                            onClick={() => onApprove(req.id)}
                          >
                            <UserCheck className="h-3.5 w-3.5" />
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
                        </>
                      )}
                      {canCancel && !canApprove && (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 gap-1 px-2 text-xs text-amber-600 hover:bg-amber-100 hover:text-amber-700 dark:text-amber-400 dark:hover:bg-amber-950"
                          disabled={isActionPending}
                          onClick={() => onCancel(req.id)}
                        >
                          Cancel
                        </Button>
                      )}
                      {!canApprove && !canCancel && req.status !== 'Pending' && (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                      {req.status === 'Pending' && !canApprove && !canCancel && (
                        <span className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Shield className="h-3 w-3" />
                          <span className="hidden sm:inline">No authority</span>
                        </span>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>
    </Card>
  )
}

// ===== Hierarchy Info Card =====

function HierarchyInfoCard() {
  return (
    <Card className="rounded-xl shadow-sm border-dashed border-2 border-amber-200 dark:border-amber-900/50 bg-amber-50/50 dark:bg-amber-950/20">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-amber-100 dark:bg-amber-950">
            <Shield className="h-4.5 w-4.5 text-amber-600 dark:text-amber-400" />
          </div>
          <div className="space-y-2 flex-1 min-w-0">
            <h3 className="text-sm font-semibold text-amber-800 dark:text-amber-300">Approval Hierarchy</h3>
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center gap-2 text-xs">
                <Badge className={ROLE_COLORS.FOUNDER} variant="secondary">Founder/Co-Founder</Badge>
                <ChevronRight className="h-3 w-3 text-muted-foreground" />
                <span className="text-muted-foreground">Auto-approved (no approval needed)</span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <Badge className={ROLE_COLORS.HR} variant="secondary">HR Manager</Badge>
                <ChevronRight className="h-3 w-3 text-muted-foreground" />
                <span className="text-muted-foreground">Leave approved by Founder/Co-Founder</span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <Badge className={ROLE_COLORS.EMPLOYEE} variant="secondary">Employee</Badge>
                <ChevronRight className="h-3 w-3 text-muted-foreground" />
                <span className="text-muted-foreground">Leave approved by HR Manager</span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// ===== Main Leave Page =====

export function LeavePage() {
  const queryClient = useQueryClient()
  const { leaveFilter, setLeaveFilter } = useCRMStore()
  const { role, employeeId } = useAuth()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [remarkDialogOpen, setRemarkDialogOpen] = useState(false)
  const [remarkAction, setRemarkAction] = useState<'approve' | 'reject' | null>(null)
  const [remarkId, setRemarkId] = useState<string | null>(null)
  const [remark, setRemark] = useState('')

  // Fetch current user's balances
  const { data: balancesData, isLoading: balancesLoading } = useQuery<{
    data: LeaveBalance[]
  }>({
    queryKey: ['leave-balances', employeeId],
    queryFn: async () => {
      if (!employeeId) return { data: [] }
      const params = new URLSearchParams()
      params.set('view', 'balances')
      params.set('employeeId', employeeId)
      const res = await fetch(`/api/leave?${params.toString()}`)
      if (!res.ok) throw new Error('Failed to fetch leave balances')
      return res.json()
    },
    enabled: !!employeeId,
    staleTime: 1000 * 60 * 2,
  })

  const balances = balancesData?.data ?? []

  // Fetch pending approvals for current user's role
  const { data: pendingData } = useQuery<{ data: LeaveRequest[] }>({
    queryKey: ['pending-approvals', role],
    queryFn: async () => {
      if (role === 'EMPLOYEE') return { data: [] }
      const params = new URLSearchParams({ view: 'pending-approvals', pendingFor: role })
      const res = await fetch(`/api/leave?${params.toString()}`)
      if (!res.ok) throw new Error('Failed to fetch pending approvals')
      return res.json()
    },
    enabled: role !== 'EMPLOYEE',
    staleTime: 1000 * 30,
    refetchInterval: 1000 * 60,
  })

  const pendingCount = pendingData?.data?.length ?? 0

  // Fetch all leave requests
  const { data: filteredData, isLoading: tableLoading } = useQuery<{
    data: LeaveRequest[]
  }>({
    queryKey: ['leave', leaveFilter.status, leaveFilter.type],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (leaveFilter.status && leaveFilter.status !== 'All') params.set('status', leaveFilter.status)
      if (leaveFilter.type && leaveFilter.type !== 'All') params.set('type', leaveFilter.type)
      const res = await fetch(`/api/leave?${params.toString()}`)
      if (!res.ok) throw new Error('Failed to fetch leave requests')
      return res.json()
    },
  })

  const allRequests = filteredData?.data ?? []

  const requests = useMemo(() => {
    const search = leaveFilter.search || ''
    if (!search) return allRequests
    return allRequests.filter((r) =>
      r.employee.name.toLowerCase().includes(search.toLowerCase())
    )
  }, [allRequests, leaveFilter.search])

  const recordCount = requests.length

  // Open remark dialog for approve/reject
  const openRemarkDialog = (id: string, action: 'approve' | 'reject') => {
    setRemarkId(id)
    setRemarkAction(action)
    setRemark('')
    setRemarkDialogOpen(true)
  }

  // Approve mutation
  const approveMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/leave/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'Approved', approvedById: employeeId, userRole: role, remark }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to approve leave')
      return data
    },
    onSuccess: () => {
      toast.success('Leave request approved')
      queryClient.invalidateQueries({ queryKey: ['leave'] })
      queryClient.invalidateQueries({ queryKey: ['leave-balances'] })
      queryClient.invalidateQueries({ queryKey: ['pending-approvals'] })
      setRemarkDialogOpen(false)
    },
    onError: (err: Error) => toast.error(err.message),
  })

  // Reject mutation
  const rejectMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/leave/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'Rejected', approvedById: employeeId, userRole: role, remark }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to reject leave')
      return data
    },
    onSuccess: () => {
      toast.success('Leave request rejected')
      queryClient.invalidateQueries({ queryKey: ['leave'] })
      queryClient.invalidateQueries({ queryKey: ['leave-balances'] })
      queryClient.invalidateQueries({ queryKey: ['pending-approvals'] })
      setRemarkDialogOpen(false)
    },
    onError: (err: Error) => toast.error(err.message),
  })

  // Cancel mutation
  const cancelMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/leave/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'Cancelled', approvedById: employeeId }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to cancel leave')
      return data
    },
    onSuccess: () => {
      toast.success('Leave request cancelled')
      queryClient.invalidateQueries({ queryKey: ['leave'] })
      queryClient.invalidateQueries({ queryKey: ['leave-balances'] })
      queryClient.invalidateQueries({ queryKey: ['pending-approvals'] })
    },
    onError: (err: Error) => toast.error(err.message),
  })

  const isActionPending = approveMutation.isPending || rejectMutation.isPending || cancelMutation.isPending

  const handleApprove = (id: string) => openRemarkDialog(id, 'approve')
  const handleReject = (id: string) => openRemarkDialog(id, 'reject')
  const handleCancel = (id: string) => cancelMutation.mutate(id)

  const handleRemarkSubmit = () => {
    if (!remarkId || !remarkAction) return
    if (remarkAction === 'approve') {
      approveMutation.mutate(remarkId)
    } else {
      rejectMutation.mutate(remarkId)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className="flex flex-1 flex-col gap-4 md:gap-6 p-3 md:p-6"
    >
      {/* Header */}
      <div className="space-y-3">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-100 dark:bg-orange-950">
              <CalendarOff className="h-5 w-5 text-orange-600 dark:text-orange-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Leave Management</h1>
                {pendingCount > 0 && (
                  <Badge className="bg-amber-500 text-white text-xs px-2 py-0.5 animate-subtle-pulse">
                    {pendingCount} pending
                  </Badge>
                )}
              </div>
              <p className="mt-1 text-sm text-muted-foreground">Hierarchy-based leave approval system</p>
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
                  'Role': r.employee.role,
                  'Department': r.employee.department || '',
                  'Leave Type': r.type,
                  'From': formatDate(r.startDate),
                  'To': formatDate(r.endDate),
                  'Total Days': r.totalDays,
                  'Reason': r.reason || '',
                  'Status': r.status,
                  'Approval Step': r.approvalStep ?? 'N/A',
                  'Rejection Reason': r.rejectionReason || '',
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

      {/* Hierarchy Info */}
      <HierarchyInfoCard />

      {/* My Leave Balance Cards */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          My Leave Balance
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

      {/* Pending Approvals Alert */}
      {pendingCount > 0 && role !== 'EMPLOYEE' && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="rounded-xl border-2 border-amber-200 dark:border-amber-900/50 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20 p-4"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-950">
              <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-amber-800 dark:text-amber-300">
                {pendingCount} Pending Approval{pendingCount !== 1 ? 's' : ''}
              </p>
              <p className="text-xs text-amber-600/80 dark:text-amber-400/80">
                {role === 'HR' ? 'Employee leave requests awaiting your approval' : 'HR leave requests awaiting your approval'}
              </p>
            </div>
            <Button
              size="sm"
              variant="outline"
              className="border-amber-300 dark:border-amber-800 text-amber-700 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-950"
              onClick={() => setLeaveFilter({ status: 'Pending' })}
            >
              View All
            </Button>
          </div>
        </motion.div>
      )}

      {/* Filters */}
      <div className="filter-bar rounded-lg bg-muted/50 p-2">
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
          <Select value={leaveFilter.type} onValueChange={(value) => setLeaveFilter({ type: value })}>
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
          <Select value={leaveFilter.status} onValueChange={(value) => setLeaveFilter({ status: value })}>
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
        onApprove={handleApprove}
        onReject={handleReject}
        onCancel={handleCancel}
        isActionPending={isActionPending}
        currentRole={role}
        currentEmployeeId={employeeId}
      />

      {/* Add Leave Dialog */}
      <AddLeaveDialog open={dialogOpen} onOpenChange={setDialogOpen} />

      {/* Remark Dialog (for approve/reject) */}
      <Dialog open={remarkDialogOpen} onOpenChange={setRemarkDialogOpen}>
        <DialogContent className="sm:max-w-md max-w-[calc(100vw-1.5rem)]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {remarkAction === 'approve' ? (
                <><Check className="h-5 w-5 text-emerald-600" /> Approve Leave</>
              ) : (
                <><X className="h-5 w-5 text-red-600" /> Reject Leave</>
              )}
            </DialogTitle>
            <DialogDescription>
              {remarkAction === 'approve'
                ? 'Add an optional remark for this approval.'
                : 'Please provide a reason for rejecting this leave request.'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-2">
              <label className="text-sm font-medium">
                Remark {remarkAction === 'reject' && <span className="text-red-500">*</span>}
              </label>
              <Textarea
                placeholder={remarkAction === 'approve' ? 'Optional approval remark...' : 'Reason for rejection...'}
                value={remark}
                onChange={(e) => setRemark(e.target.value)}
                className="min-h-[80px]"
              />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setRemarkDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleRemarkSubmit}
              disabled={isActionPending || (remarkAction === 'reject' && !remark.trim())}
              className={remarkAction === 'approve'
                ? 'bg-emerald-600 hover:bg-emerald-700'
                : 'bg-red-600 hover:bg-red-700'
              }
            >
              {isActionPending ? (
                <span className="animate-spin">⟳</span>
              ) : remarkAction === 'approve' ? (
                'Confirm Approval'
              ) : (
                'Confirm Rejection'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  )
}
