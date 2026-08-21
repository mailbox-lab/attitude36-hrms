'use client'

import { useState, useEffect, useCallback } from 'react'
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
import { Clock, LogIn, LogOut, CalendarDays, Download, X } from 'lucide-react'
import { toast } from 'sonner'
import { exportToCSV } from '@/lib/export-csv'

// ===== Types =====

type Employee = {
  id: string
  name: string
  email: string
  role: string
  department: string | null
}

type AttendanceRecord = {
  id: string
  employeeId: string
  date: string
  clockIn: string | null
  clockOut: string | null
  status: string
  totalHours: number | null
  notes: string | null
  employee: {
    id: string
    name: string
    role: string
    department: string | null
  }
}

type ClockState = 'idle' | 'clocked-in' | 'clocked-out'

// ===== Constants =====

const STATUS_OPTIONS = ['All', 'Present', 'Absent', 'Half-Day', 'Work-From-Home']

const STATUS_COLORS: Record<string, string> = {
  Present: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400',
  Absent: 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400',
  'Half-Day': 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400',
  'Work-From-Home': 'bg-teal-100 text-teal-700 dark:bg-teal-950 dark:text-teal-400',
}

const STATUS_BORDER_COLORS: Record<string, string> = {
  Present: 'border-l-emerald-500',
  Absent: 'border-l-red-500',
  'Half-Day': 'border-l-amber-500',
  'Work-From-Home': 'border-l-teal-500',
}

const STATUS_DOT_COLORS: Record<string, string> = {
  Present: 'bg-emerald-500',
  Absent: 'bg-red-500',
  'Half-Day': 'bg-amber-500',
  'Work-From-Home': 'bg-teal-500',
}

// ===== Helpers =====

function formatTime(dateStr: string | null): string {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  })
}

function formatHours(hours: number | null): string {
  if (hours === null || hours === undefined) return '—'
  const h = Math.floor(hours)
  const m = Math.round((hours - h) * 60)
  return `${h}h ${m}m`
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

// ===== Live Clock Component =====

function LiveClock() {
  const [now, setNow] = useState(new Date())

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  const timeStr = now.toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  })

  const dateStr = now.toLocaleDateString('en-IN', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })

  return (
    <div className="flex flex-col items-center">
      <span className="text-5xl font-extrabold tracking-tight tabular-nums sm:text-6xl">
        {timeStr}
      </span>
      <span className="mt-1.5 text-sm text-muted-foreground">{dateStr}</span>
    </div>
  )
}

// ===== Clock In/Out Card =====

function ClockCard({
  employee,
  clockState,
  clockInTime,
  onClockIn,
  onClockOut,
  isLoading,
}: {
  employee: Employee | null
  clockState: ClockState
  clockInTime: string | null
  onClockIn: () => void
  onClockOut: () => void
  isLoading: boolean
}) {
  return (
    <Card className="relative overflow-hidden rounded-xl border-2 border-primary/20 bg-gradient-to-br from-primary/5 via-background to-primary/5 shadow-lg">
      {/* Gradient border glow effect */}
      <div className="pointer-events-none absolute inset-0 rounded-xl ring-2 ring-inset ring-primary/10" />
      <CardContent className="relative flex flex-col items-center gap-6 p-6 sm:flex-row sm:items-start sm:gap-8">
        {/* Clock Icon + Live Time */}
        <div className="flex flex-col items-center gap-3">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
            <Clock className="h-7 w-7 text-primary" />
          </div>
          <LiveClock />
        </div>

        {/* Divider */}
        <div className="hidden h-28 w-px bg-border sm:block" />
        <div className="h-px w-full bg-border sm:hidden" />

        {/* Employee Info + Actions */}
        <div className="flex flex-1 flex-col items-center gap-4 sm:items-start">
          <div className="text-center sm:text-left">
            <p className="text-sm text-muted-foreground">Current Employee</p>
            <div className="mt-0.5 flex items-center gap-2">
              <p className="text-lg font-semibold">
                {employee ? employee.name : 'Loading...'}
              </p>
              {/* Pulsing green dot when clocked in */}
              {clockState === 'clocked-in' && (
                <span className="relative flex h-3 w-3">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex h-3 w-3 rounded-full bg-emerald-500" />
                </span>
              )}
            </div>
            {employee && employee.department && (
              <p className="mt-0.5 text-xs text-muted-foreground">{employee.department} · {employee.role}</p>
            )}
          </div>

          {/* Clock In Time Display */}
          {clockState === 'clocked-in' && clockInTime && (
            <div className="flex items-center gap-2 rounded-lg bg-emerald-100 px-3 py-2 dark:bg-emerald-950">
              <LogIn className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              <span className="text-sm font-medium text-emerald-700 dark:text-emerald-400">
                Clocked in at {formatTime(clockInTime)}
              </span>
            </div>
          )}

          {clockState === 'clocked-out' && clockInTime && (
            <div className="flex items-center gap-2 rounded-lg bg-muted px-3 py-2">
              <LogOut className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                Shift completed for today
              </span>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3">
            {(clockState === 'idle' || clockState === 'clocked-out') && (
              <Button
                size="lg"
                className="gap-2 px-6"
                disabled={isLoading || !employee}
                onClick={onClockIn}
              >
                <LogIn className="h-5 w-5" />
                Clock In
              </Button>
            )}
            {clockState === 'clocked-in' && (
              <Button
                size="lg"
                variant="destructive"
                className="gap-2 px-6"
                disabled={isLoading}
                onClick={onClockOut}
              >
                <LogOut className="h-5 w-5" />
                Clock Out
              </Button>
            )}
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

// ===== Attendance Table =====

function AttendanceTable({
  records,
  isLoading,
}: {
  records: AttendanceRecord[]
  isLoading: boolean
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
                <Skeleton className="h-4 w-[80px]" />
                <Skeleton className="h-4 w-[80px]" />
                <Skeleton className="h-4 w-[70px]" />
                <Skeleton className="h-5 w-[80px]" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (records.length === 0) {
    return (
      <Card className="rounded-xl shadow-md">
        <CardContent className="flex flex-col items-center gap-3 py-12">
          <CalendarDays className="h-10 w-10 text-muted-foreground/40" />
          <p className="text-sm font-medium text-muted-foreground">No attendance records found</p>
          <p className="text-xs text-muted-foreground/70">
            Try adjusting your filters or check back later.
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
              <TableHead className="sticky top-0 z-10 bg-card text-xs font-semibold uppercase tracking-wider">Employee Name</TableHead>
              <TableHead className="sticky top-0 z-10 bg-card text-xs font-semibold uppercase tracking-wider">Date</TableHead>
              <TableHead className="sticky top-0 z-10 bg-card text-xs font-semibold uppercase tracking-wider">Clock In</TableHead>
              <TableHead className="sticky top-0 z-10 bg-card text-xs font-semibold uppercase tracking-wider">Clock Out</TableHead>
              <TableHead className="sticky top-0 z-10 bg-card text-xs font-semibold uppercase tracking-wider">Total Hours</TableHead>
              <TableHead className="sticky top-0 z-10 bg-card text-xs font-semibold uppercase tracking-wider">Status</TableHead>
              <TableHead className="sticky top-0 z-10 bg-card text-xs font-semibold uppercase tracking-wider">Notes</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {records.map((record, index) => (
              <TableRow
                key={record.id}
                className={`border-l-4 transition-colors hover:bg-muted/50 ${STATUS_BORDER_COLORS[record.status] || 'border-l-gray-300'} ${index % 2 === 1 ? 'bg-muted/30' : ''}`}
              >
                <TableCell>
                  <div className="flex items-center gap-2">
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                      {record.employee.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{record.employee.name}</p>
                      <p className="truncate text-xs text-muted-foreground">{record.employee.role}</p>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="text-sm">{formatDate(record.date)}</TableCell>
                <TableCell className="text-sm tabular-nums">{formatTime(record.clockIn)}</TableCell>
                <TableCell className="text-sm tabular-nums">{formatTime(record.clockOut)}</TableCell>
                <TableCell className="text-sm font-medium tabular-nums">{formatHours(record.totalHours)}</TableCell>
                <TableCell>
                  <StatusBadge status={record.status} />
                </TableCell>
                <TableCell className="max-w-[200px]">
                  <span className="block truncate text-xs text-muted-foreground">
                    {record.notes || '—'}
                  </span>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </Card>
  )
}

// ===== Main Attendance Page =====

export function AttendancePage() {
  const queryClient = useQueryClient()
  const { attendanceFilter, setAttendanceFilter } = useCRMStore()

  // Fetch current employee (first active employee)
  const { data: employeesData } = useQuery<{ data: Employee[] }>({
    queryKey: ['employees-first'],
    queryFn: async () => {
      const res = await fetch('/api/employees')
      if (!res.ok) throw new Error('Failed to fetch employees')
      return res.json()
    },
    staleTime: 1000 * 60 * 5,
  })

  const currentEmployee = employeesData?.data?.[0] ?? null

  // Fetch today's attendance for the current employee to determine clock state
  const todayStr = new Date().toISOString().split('T')[0]
  const { data: todayAttendanceData, isLoading: todayLoading } = useQuery<{
    data: AttendanceRecord[]
  }>({
    queryKey: ['attendance-today', currentEmployee?.id],
    queryFn: async () => {
      if (!currentEmployee) return { data: [] }
      const params = new URLSearchParams()
      params.set('date', todayStr)
      params.set('employeeId', currentEmployee.id)
      const res = await fetch(`/api/attendance?${params.toString()}`)
      if (!res.ok) throw new Error("Failed to fetch today's attendance")
      return res.json()
    },
    enabled: !!currentEmployee,
  })

  const todayRecord = todayAttendanceData?.data?.[0] ?? null
  const clockState: ClockState = todayRecord
    ? todayRecord.clockOut
      ? 'clocked-out'
      : 'clocked-in'
    : 'idle'

  // Fetch attendance records based on filters
  const { data: filteredData, isLoading: tableLoading } = useQuery<{
    data: AttendanceRecord[]
  }>({
    queryKey: ['attendance', attendanceFilter.date, attendanceFilter.status, attendanceFilter.fromDate, attendanceFilter.toDate],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (attendanceFilter.fromDate && attendanceFilter.toDate) {
        params.set('startDate', attendanceFilter.fromDate)
        params.set('endDate', attendanceFilter.toDate)
      } else if (attendanceFilter.date) {
        params.set('date', attendanceFilter.date)
      }
      if (attendanceFilter.status && attendanceFilter.status !== 'All') {
        params.set('status', attendanceFilter.status)
      }
      const res = await fetch(`/api/attendance?${params.toString()}`)
      if (!res.ok) throw new Error('Failed to fetch attendance')
      return res.json()
    },
  })

  const records = filteredData?.data ?? []

  // Date range helpers
  const getTodayRange = useCallback(() => {
    return { fromDate: todayStr, toDate: todayStr, date: '' }
  }, [todayStr])

  const getThisWeekRange = useCallback(() => {
    const now = new Date()
    const dayOfWeek = now.getDay()
    const monday = new Date(now)
    monday.setDate(now.getDate() - ((dayOfWeek + 6) % 7))
    const sunday = new Date(monday)
    sunday.setDate(monday.getDate() + 6)
    return {
      fromDate: monday.toISOString().split('T')[0],
      toDate: sunday.toISOString().split('T')[0],
      date: '',
    }
  }, [])

  const getThisMonthRange = useCallback(() => {
    const now = new Date()
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1)
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0)
    return {
      fromDate: firstDay.toISOString().split('T')[0],
      toDate: lastDay.toISOString().split('T')[0],
      date: '',
    }
  }, [])

  const hasCustomRange = !!(attendanceFilter.fromDate && attendanceFilter.toDate)

  // Clock In mutation
  const clockInMutation = useMutation({
    mutationFn: async () => {
      if (!currentEmployee) throw new Error('No employee selected')
      const res = await fetch('/api/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ employeeId: currentEmployee.id }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to clock in')
      return data
    },
    onSuccess: () => {
      toast.success('Clocked in successfully!')
      queryClient.invalidateQueries({ queryKey: ['attendance-today'] })
      queryClient.invalidateQueries({ queryKey: ['attendance'] })
    },
    onError: (err: Error) => {
      toast.error(err.message)
    },
  })

  // Clock Out mutation
  const clockOutMutation = useMutation({
    mutationFn: async () => {
      if (!currentEmployee) throw new Error('No employee selected')
      const res = await fetch('/api/attendance/clock-out', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ employeeId: currentEmployee.id }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to clock out')
      return data
    },
    onSuccess: () => {
      toast.success('Clocked out successfully!')
      queryClient.invalidateQueries({ queryKey: ['attendance-today'] })
      queryClient.invalidateQueries({ queryKey: ['attendance'] })
    },
    onError: (err: Error) => {
      toast.error(err.message)
    },
  })

  const isClockLoading = clockInMutation.isPending || clockOutMutation.isPending

  const handleClockIn = useCallback(() => {
    clockInMutation.mutate()
  }, [clockInMutation])

  const handleClockOut = useCallback(() => {
    clockOutMutation.mutate()
  }, [clockOutMutation])

  const recordCount = records.length

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
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-100 dark:bg-cyan-950">
              <CalendarDays className="h-5 w-5 text-cyan-600 dark:text-cyan-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Attendance</h1>
              <p className="mt-1 text-sm text-muted-foreground">Track daily employee attendance and working hours</p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5"
            onClick={() => {
              const csvData = records.map((r) => ({
                'Employee Name': r.employee.name,
                Role: r.employee.role,
                Department: r.employee.department || '',
                Date: formatDate(r.date),
                'Clock In': formatTime(r.clockIn),
                'Clock Out': formatTime(r.clockOut),
                'Total Hours': formatHours(r.totalHours),
                Status: r.status,
                Notes: r.notes || '',
              }))
              exportToCSV(csvData, 'attendance')
            }}
          >
            <Download className="h-4 w-4" />
            Export CSV
          </Button>
        </div>
        <div className="h-1 w-16 rounded-full bg-gradient-to-r from-cyan-400 to-teal-400" />
        {records.length > 0 && (
          <p className="text-sm text-muted-foreground">
            {recordCount} record{recordCount !== 1 ? 's' : ''}
          </p>
        )}
      </div>

      {/* Clock In/Out Card */}
      <ClockCard
        employee={currentEmployee}
        clockState={clockState}
        clockInTime={todayRecord?.clockIn ?? null}
        onClockIn={handleClockIn}
        onClockOut={handleClockOut}
        isLoading={isClockLoading || todayLoading}
      />

      {/* Date Range Filter */}
      <div className="rounded-lg bg-muted/50 p-3">
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="flex items-center gap-2">
              <CalendarDays className="h-4 w-4 text-muted-foreground" />
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Date Range</span>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-2">
              <Input
                type="date"
                className="w-full sm:w-[160px]"
                value={attendanceFilter.fromDate || ''}
                placeholder="From"
                onChange={(e) => {
                  setAttendanceFilter({ fromDate: e.target.value, toDate: attendanceFilter.toDate, date: '' })
                }}
              />
              <Input
                type="date"
                className="w-full sm:w-[160px]"
                value={attendanceFilter.toDate || ''}
                placeholder="To"
                onChange={(e) => {
                  setAttendanceFilter({ fromDate: attendanceFilter.fromDate, toDate: e.target.value, date: '' })
                }}
              />
            </div>
            <div className="flex flex-wrap items-center gap-1.5">
              <Button
                variant={attendanceFilter.fromDate === todayStr && attendanceFilter.toDate === todayStr ? 'default' : 'outline'}
                size="sm"
                className="h-7 text-xs px-2.5"
                onClick={() => setAttendanceFilter(getTodayRange())}
              >
                Today
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-xs px-2.5"
                onClick={() => setAttendanceFilter(getThisWeekRange())}
              >
                This Week
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-xs px-2.5"
                onClick={() => setAttendanceFilter(getThisMonthRange())}
              >
                This Month
              </Button>
              {(hasCustomRange || attendanceFilter.date) && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 gap-1 text-xs px-2.5 text-muted-foreground hover:text-destructive"
                  onClick={() => setAttendanceFilter({ fromDate: '', toDate: '', date: '', status: attendanceFilter.status })}
                >
                  <X className="h-3 w-3" />
                  Clear
                </Button>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Select
              value={attendanceFilter.status}
              onValueChange={(value) => setAttendanceFilter({ status: value })}
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
      </div>

      {/* Attendance Table */}
      <AttendanceTable records={records} isLoading={tableLoading} />
    </motion.div>
  )
}
