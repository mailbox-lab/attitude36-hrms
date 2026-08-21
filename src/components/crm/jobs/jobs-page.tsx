'use client'

import { useState, useMemo } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useCRMStore } from '@/stores/crm-store'
import { JobDetail } from './job-detail'
import { AddJobDialog } from './add-job-dialog'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Search,
  Plus,
  Briefcase,
  MoreHorizontal,
  Pencil,
  Eye,
  LayoutList,
  KanbanSquare,
  MapPin,
  Clock,
  Users,
  User,
} from 'lucide-react'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { motion } from 'framer-motion'
import { toast } from 'sonner'
import { useMutation } from '@tanstack/react-query'

// ===== Types =====

type Job = {
  id: string
  title: string
  clientId: string
  client: { id: string; name: string }
  recruiterId: string | null
  recruiter: { id: string; name: string } | null
  department: string | null
  location: string | null
  employmentType: string
  salaryMin: number | null
  salaryMax: number | null
  currency: string
  status: string
  priority: string
  openings: number
  createdAt: string
  _count: {
    candidates: number
    interviews: number
    placements: number
  }
}

// ===== Constants =====

const STATUS_OPTIONS = ['All', 'Open', 'Closed', 'Paused', 'Filled', 'Cancelled']

const PRIORITY_OPTIONS = ['All', 'Low', 'Medium', 'High', 'Urgent']

const KANBAN_STATUSES = ['Open', 'Paused', 'Filled', 'Closed', 'Cancelled'] as const

const JOB_STATUSES = ['Open', 'Closed', 'Paused', 'Filled', 'Cancelled']

const STATUS_COLORS: Record<string, string> = {
  Open: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400',
  Closed: 'bg-gray-100 text-gray-700 dark:bg-gray-950 dark:text-gray-400',
  Paused: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400',
  Filled: 'bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-400',
  Cancelled: 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400',
}

const PRIORITY_COLORS: Record<string, string> = {
  Low: 'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400',
  Medium: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-950 dark:text-cyan-400',
  High: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400',
  Urgent: 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400',
}

const PRIORITY_DOT_COLORS: Record<string, string> = {
  Low: 'bg-green-500',
  Medium: 'bg-cyan-500',
  High: 'bg-amber-500',
  Urgent: 'bg-red-500',
}

const PRIORITY_BORDER_COLORS: Record<string, string> = {
  Low: 'border-l-green-500',
  Medium: 'border-l-cyan-500',
  High: 'border-l-amber-500',
  Urgent: 'border-l-red-500',
}

const STATUS_DOT_COLORS: Record<string, string> = {
  Open: 'bg-emerald-500',
  Closed: 'bg-gray-400',
  Paused: 'bg-amber-500',
  Filled: 'bg-violet-500',
  Cancelled: 'bg-red-500',
}

const KANBAN_GRADIENT: Record<string, string> = {
  Open: 'from-emerald-400 to-emerald-500',
  Paused: 'from-amber-400 to-amber-500',
  Filled: 'from-violet-400 to-violet-500',
  Closed: 'from-gray-400 to-gray-500',
  Cancelled: 'from-red-400 to-red-500',
}

const KANBAN_BORDER_COLOR: Record<string, string> = {
  Open: '#34d399',
  Paused: '#fbbf24',
  Filled: '#a78bfa',
  Closed: '#9ca3af',
  Cancelled: '#f87171',
}

const KANBAN_COUNT_COLORS: Record<string, string> = {
  Open: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400',
  Paused: 'bg-amber-500/15 text-amber-700 dark:text-amber-400',
  Filled: 'bg-violet-500/15 text-violet-700 dark:text-violet-400',
  Closed: 'bg-gray-500/15 text-gray-700 dark:text-gray-400',
  Cancelled: 'bg-red-500/15 text-red-700 dark:text-red-400',
}

const CURRENCY_SYMBOLS: Record<string, string> = {
  INR: '₹',
  USD: '$',
  EUR: '€',
  GBP: '£',
  SGD: 'S$',
  AED: 'AED',
}

// ===== Framer Motion Variants =====

const cardVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.05, duration: 0.3, ease: 'easeOut' },
  }),
}

const columnVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.35, ease: 'easeOut' },
  }),
}

// ===== Kanban Card =====

function KanbanCard({
  job,
  onView,
  onEdit,
  index,
}: {
  job: Job
  onView: () => void
  onEdit: () => void
  index: number
}) {
  const currencySymbol = CURRENCY_SYMBOLS[job.currency] || job.currency
  const hasSalary = job.salaryMin != null || job.salaryMax != null

  return (
    <motion.div
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      custom={index}
      className="group relative cursor-pointer rounded-lg border border-border/60 bg-card p-3.5 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
      onClick={onView}
    >
      {/* Actions menu */}
      <div className="absolute right-2 top-2 z-10 opacity-0 transition-opacity group-hover:opacity-100">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 shrink-0"
              onClick={(e) => e.stopPropagation()}
            >
              <MoreHorizontal className="h-3.5 w-3.5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              onClick={(e) => {
                e.stopPropagation()
                onView()
              }}
            >
              <Eye className="mr-2 h-3.5 w-3.5" />
              View Details
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={(e) => {
                e.stopPropagation()
                onEdit()
              }}
            >
              <Pencil className="mr-2 h-3.5 w-3.5" />
              Edit
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Title */}
      <p className="truncate pr-6 text-sm font-medium leading-tight">{job.title}</p>

      {/* Client */}
      <p className="mt-0.5 truncate text-xs text-muted-foreground">{job.client.name}</p>

      {/* Location + Type row */}
      <div className="mt-2.5 flex items-center gap-3 text-[10px] text-muted-foreground">
        {job.location && (
          <span className="flex items-center gap-0.5">
            <MapPin className="h-2.5 w-2.5" /> {job.location}
          </span>
        )}
        <span className="flex items-center gap-0.5">
          <Clock className="h-2.5 w-2.5" /> {job.employmentType}
        </span>
      </div>

      {/* Priority + Candidates row */}
      <div className="mt-2.5 flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <span
            className={`h-2 w-2 rounded-full ${PRIORITY_DOT_COLORS[job.priority] || 'bg-gray-400'}`}
          />
          <Badge
            className={`text-[10px] font-medium ${PRIORITY_COLORS[job.priority] || ''}`}
          >
            {job.priority}
          </Badge>
          {job.openings > 1 && (
            <span className="text-[10px] text-muted-foreground">
              ({job.openings} pos)
            </span>
          )}
        </div>
        <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
          <Users className="h-3 w-3" />
          {job._count.candidates} candidate{job._count.candidates !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Salary range */}
      {hasSalary && (
        <p className="mt-2 text-[10px] text-muted-foreground">
          {currencySymbol}
          {(job.salaryMin ?? 0).toLocaleString('en-IN')}
          {job.salaryMax
            ? ` – ${currencySymbol}${job.salaryMax.toLocaleString('en-IN')}`
            : '+'}
        </p>
      )}

      {/* Recruiter */}
      {job.recruiter && (
        <div className="mt-2 flex items-center gap-1 border-t border-border/50 pt-2 text-[10px] text-muted-foreground">
          <User className="h-2.5 w-2.5" />
          {job.recruiter.name}
        </div>
      )}
    </motion.div>
  )
}

// ===== Kanban Column =====

function KanbanColumn({
  status,
  jobs,
  onViewJob,
  onEditJob,
  columnIndex,
}: {
  status: string
  jobs: Job[]
  onViewJob: (id: string) => void
  onEditJob: (job: Job) => void
  columnIndex: number
}) {
  return (
    <motion.div
      variants={columnVariants}
      initial="hidden"
      animate="visible"
      custom={columnIndex}
      className="flex w-72 shrink-0 flex-col"
    >
      {/* Column header */}
      <div className="mb-3 flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <span
            className={`h-2.5 w-2.5 rounded-full ${STATUS_DOT_COLORS[status] || 'bg-gray-400'}`}
          />
          <span className="text-sm font-semibold">{status}</span>
        </div>
        <span
          className={`flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[10px] font-bold ${KANBAN_COUNT_COLORS[status] || 'bg-gray-500/15 text-gray-700'}`}
        >
          {jobs.length}
        </span>
      </div>

      {/* Column body with gradient top border */}
      <div
        className="flex max-h-[calc(100vh-320px)] min-h-[120px] flex-col gap-2.5 overflow-y-auto rounded-lg rounded-t-none bg-muted/30 p-2.5"
        style={{
          borderTop: `3px solid ${KANBAN_BORDER_COLOR[status] || '#9ca3af'}`,
        }}
      >
        {jobs.length === 0 ? (
          <div className="flex flex-1 items-center justify-center py-8">
            <p className="text-xs text-muted-foreground/60">No jobs</p>
          </div>
        ) : (
          jobs.map((job, i) => (
            <KanbanCard
              key={job.id}
              job={job}
              onView={() => onViewJob(job.id)}
              onEdit={() => onEditJob(job)}
              index={i}
            />
          ))
        )}
      </div>
    </motion.div>
  )
}

// ===== Main Component =====

export function JobsPage() {
  const navigate = useCRMStore((s) => s.navigate)
  const selectedId = useCRMStore((s) => s.selectedId)
  const jobFilter = useCRMStore((s) => s.jobFilter)
  const setJobFilter = useCRMStore((s) => s.setJobFilter)
  const queryClient = useQueryClient()

  const [addDialogOpen, setAddDialogOpen] = useState(false)
  const [editJob, setEditJob] = useState<Job | null>(null)
  const [viewMode, setViewMode] = useState<'table' | 'kanban'>('table')

  // Fetch jobs
  const { data, isLoading, error } = useQuery<{ data: Job[] }>({
    queryKey: ['jobs', jobFilter.search, jobFilter.status, jobFilter.priority],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (jobFilter.search) params.set('search', jobFilter.search)
      if (jobFilter.status && jobFilter.status !== 'All') params.set('status', jobFilter.status)
      if (jobFilter.priority && jobFilter.priority !== 'All') params.set('priority', jobFilter.priority)
      const res = await fetch(`/api/jobs?${params.toString()}`)
      if (!res.ok) throw new Error('Failed to fetch jobs')
      return res.json()
    },
  })

  const jobs = data?.data || []

  // Quick status change mutation
  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const res = await fetch(`/api/jobs/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })
      if (!res.ok) throw new Error('Failed to update status')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['jobs'] })
      toast.success('Job status updated')
    },
    onError: () => {
      toast.error('Failed to update job status')
    },
  })

  // Group jobs by status for Kanban
  const kanbanData = useMemo(() => {
    const groups: Record<string, Job[]> = {}
    KANBAN_STATUSES.forEach((s) => {
      groups[s] = []
    })
    jobs.forEach((j) => {
      if (groups[j.status]) {
        groups[j.status].push(j)
      }
    })
    return groups
  }, [jobs])

  // If a job is selected, show detail view
  if (selectedId) {
    return <JobDetail jobId={selectedId} />
  }

  function handleViewJob(id: string) {
    navigate('job-detail', id)
  }

  function handleEditJob(job: Job) {
    setEditJob(job)
    setAddDialogOpen(true)
  }

  function handleCloseDialog(open: boolean) {
    setAddDialogOpen(open)
    if (!open) setEditJob(null)
  }

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
      {/* Header */}
      <div className="space-y-3">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 dark:bg-amber-950">
              <Briefcase className="h-5 w-5 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Jobs</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Manage job openings and track recruitment pipeline
                {data && (
                  <span className="ml-1 font-medium text-foreground">
                    ({jobs.length} total)
                  </span>
                )}
              </p>
            </div>
          </div>
          <Button onClick={() => setAddDialogOpen(true)} className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground shadow-sm hover:from-primary/90 hover:to-primary/70">
            <Plus className="mr-2 h-4 w-4" />
            Add Job
          </Button>
        </div>
        <div className="h-1 w-16 rounded-full bg-gradient-to-r from-amber-400 to-orange-400" />
      </div>

      {/* Filters */}
      <div className="rounded-lg bg-muted/50 p-2">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1 sm:max-w-xs">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search jobs..."
              className="pl-9"
              value={jobFilter.search}
              onChange={(e) => setJobFilter({ search: e.target.value })}
            />
          </div>
          <Select
            value={jobFilter.status}
            onValueChange={(val) => setJobFilter({ status: val })}
          >
            <SelectTrigger className="w-full sm:w-[160px]">
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
          <Select
            value={jobFilter.priority}
            onValueChange={(val) => setJobFilter({ priority: val })}
          >
            <SelectTrigger className="w-full sm:w-[160px]">
              <SelectValue placeholder="Priority" />
            </SelectTrigger>
            <SelectContent>
              {PRIORITY_OPTIONS.map((priority) => (
                <SelectItem key={priority} value={priority}>
                  {priority === 'All' ? 'All Priorities' : priority}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* View Toggle + Content */}
      <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as 'table' | 'kanban')}>
        <TabsList>
          <TabsTrigger value="table" className="gap-1.5">
            <LayoutList className="h-4 w-4" />
            Table
          </TabsTrigger>
          <TabsTrigger value="kanban" className="gap-1.5">
            <KanbanSquare className="h-4 w-4" />
            Kanban
          </TabsTrigger>
        </TabsList>

        {/* Table View */}
        <TabsContent value="table" className="mt-4">
          {isLoading ? (
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-center gap-3">
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                  <p className="text-sm text-muted-foreground">Loading jobs...</p>
                </div>
              </CardContent>
            </Card>
          ) : error ? (
            <Card>
              <CardContent className="p-6">
                <p className="text-center text-sm text-destructive">
                  Failed to load jobs. Please try again.
                </p>
              </CardContent>
            </Card>
          ) : jobs.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center gap-4 py-12">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-50 dark:bg-amber-950/50">
                  <Briefcase className="h-6 w-6 text-amber-400" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-medium text-muted-foreground">No jobs found</p>
                  <p className="mt-1 text-xs text-muted-foreground/70">
                    {jobFilter.search || jobFilter.status !== 'All' || jobFilter.priority !== 'All'
                      ? 'Try adjusting your search or filter criteria'
                      : 'Create your first job opening to start receiving candidates'}
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-0">
                <div className="max-h-[500px] overflow-y-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="hover:bg-transparent">
                        <TableHead className="text-xs">Title</TableHead>
                        <TableHead className="hidden text-xs sm:table-cell">Client</TableHead>
                        <TableHead className="hidden text-xs md:table-cell">Location</TableHead>
                        <TableHead className="hidden text-xs md:table-cell">Type</TableHead>
                        <TableHead className="hidden text-xs lg:table-cell">Salary Range</TableHead>
                        <TableHead className="text-xs">Priority</TableHead>
                        <TableHead className="text-xs">Status</TableHead>
                        <TableHead className="hidden text-xs sm:table-cell">Candidates</TableHead>
                        <TableHead className="w-10 text-xs">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {jobs.map((job) => {
                        const currencySymbol = CURRENCY_SYMBOLS[job.currency] || job.currency
                        const salaryRange =
                          job.salaryMin || job.salaryMax
                            ? `${currencySymbol}${(job.salaryMin ?? 0).toLocaleString('en-IN')} - ${currencySymbol}${(job.salaryMax ?? 0).toLocaleString('en-IN')}`
                            : '—'

                        return (
                          <TableRow
                            key={job.id}
                            className={`cursor-pointer border-l-4 ${PRIORITY_BORDER_COLORS[job.priority] || 'border-l-gray-300'} ${jobs.indexOf(job) % 2 === 1 ? 'bg-muted/30' : ''}`}
                            onClick={() => handleViewJob(job.id)}
                          >
                            <TableCell>
                              <div className="flex flex-col">
                                <span className="text-xs font-medium">{job.title}</span>
                                {job.department && (
                                  <span className="text-[10px] text-muted-foreground">
                                    {job.department}
                                  </span>
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="hidden text-xs sm:table-cell">
                              {job.client.name}
                            </TableCell>
                            <TableCell className="hidden text-xs md:table-cell">
                              {job.location || '—'}
                            </TableCell>
                            <TableCell className="hidden text-xs md:table-cell">
                              {job.employmentType}
                            </TableCell>
                            <TableCell className="hidden text-xs lg:table-cell">
                              {salaryRange}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1.5">
                                <span className={`h-2 w-2 rounded-full ${PRIORITY_DOT_COLORS[job.priority] || 'bg-gray-400'}`} />
                                <Badge className={`text-[10px] ${PRIORITY_COLORS[job.priority] || ''}`}>
                                  {job.priority}
                                </Badge>
                              </div>
                            </TableCell>
                            <TableCell onClick={(e) => e.stopPropagation()}>
                              <Popover>
                                <PopoverTrigger asChild>
                                  <div className="flex items-center gap-1.5 cursor-pointer transition-transform hover:scale-105">
                                    <span className={`h-2 w-2 rounded-full ${STATUS_DOT_COLORS[job.status] || 'bg-gray-400'}`} />
                                    <Badge className={`text-[10px] ${STATUS_COLORS[job.status] || ''}`}>
                                      {job.status}
                                    </Badge>
                                  </div>
                                </PopoverTrigger>
                                <PopoverContent className="w-36 p-1" align="start">
                                  <div className="space-y-0.5">
                                    {JOB_STATUSES.map((status) => (
                                      <button
                                        key={status}
                                        onClick={() =>
                                          updateStatusMutation.mutate({
                                            id: job.id,
                                            status,
                                          })
                                        }
                                        className={`flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-xs transition-colors hover:bg-muted ${
                                          job.status === status
                                            ? 'font-semibold'
                                            : ''
                                        }`}
                                      >
                                        <span
                                          className={`h-2 w-2 rounded-full ${STATUS_DOT_COLORS[status] || 'bg-gray-400'}`}
                                        />
                                        {status}
                                      </button>
                                    ))}
                                  </div>
                                </PopoverContent>
                              </Popover>
                            </TableCell>
                            <TableCell className="hidden text-xs sm:table-cell">
                              <span className="font-medium">{job._count.candidates}</span>
                            </TableCell>
                            <TableCell>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-7 w-7"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    <MoreHorizontal className="h-3.5 w-3.5" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      handleViewJob(job.id)
                                    }}
                                  >
                                    <Eye className="mr-2 h-3.5 w-3.5" />
                                    View Details
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      handleEditJob(job)
                                    }}
                                  >
                                    <Pencil className="mr-2 h-3.5 w-3.5" />
                                    Edit
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                        )
                      })}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Kanban View */}
        <TabsContent value="kanban" className="mt-4">
          {isLoading ? (
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-center gap-3">
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                  <p className="text-sm text-muted-foreground">Loading board...</p>
                </div>
              </CardContent>
            </Card>
          ) : error ? (
            <Card>
              <CardContent className="p-6">
                <p className="text-center text-sm text-destructive">
                  Failed to load jobs. Please try again.
                </p>
              </CardContent>
            </Card>
          ) : jobs.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center gap-4 py-12">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-50 dark:bg-amber-950/50">
                  <Briefcase className="h-6 w-6 text-amber-400" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-medium text-muted-foreground">No jobs found</p>
                  <p className="mt-1 text-xs text-muted-foreground/70">
                    {jobFilter.search || jobFilter.status !== 'All' || jobFilter.priority !== 'All'
                      ? 'Try adjusting your search or filter criteria'
                      : 'Create your first job opening to start building your pipeline'}
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="flex gap-4 overflow-x-auto pb-4">
              {KANBAN_STATUSES.map((status, i) => (
                <KanbanColumn
                  key={status}
                  status={status}
                  jobs={kanbanData[status] || []}
                  onViewJob={handleViewJob}
                  onEditJob={handleEditJob}
                  columnIndex={i}
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Add/Edit Dialog */}
      <AddJobDialog
        open={addDialogOpen}
        onOpenChange={handleCloseDialog}
        editJob={editJob}
      />
    </div>
  )
}
