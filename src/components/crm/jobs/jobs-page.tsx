'use client'

import { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useCRMStore } from '@/stores/crm-store'
import { JobDetail } from './job-detail'
import { AddJobDialog } from './add-job-dialog'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
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
import { Search, Plus, Briefcase, MoreHorizontal, Pencil, Trash2, Eye } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { toast } from 'sonner'
import { useMutation, useQueryClient } from '@tanstack/react-query'

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

const STATUS_COLORS: Record<string, string> = {
  Open: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400',
  Closed: 'bg-gray-100 text-gray-700 dark:bg-gray-950 dark:text-gray-400',
  Paused: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400',
  Filled: 'bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-400',
  Cancelled: 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400',
}

const PRIORITY_COLORS: Record<string, string> = {
  Low: 'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400',
  Medium: 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400',
  High: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400',
  Urgent: 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400',
}

const CURRENCY_SYMBOLS: Record<string, string> = {
  INR: '₹',
  USD: '$',
  EUR: '€',
  GBP: '£',
  SGD: 'S$',
  AED: 'AED',
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
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
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
        <Button onClick={() => setAddDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Job
        </Button>
      </div>

      {/* Filters */}
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

      {/* Jobs Table */}
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
          <CardContent className="flex flex-col items-center gap-3 py-12">
            <Briefcase className="h-10 w-10 text-muted-foreground/40" />
            <p className="text-sm font-medium text-muted-foreground">No jobs found</p>
            <p className="text-xs text-muted-foreground/70">
              {jobFilter.search || jobFilter.status !== 'All' || jobFilter.priority !== 'All'
                ? 'Try adjusting your filters'
                : 'Click "Add Job" to create a new opening'}
            </p>
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
                        className="cursor-pointer"
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
                          <Badge className={`text-[10px] ${PRIORITY_COLORS[job.priority] || ''}`}>
                            {job.priority}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge className={`text-[10px] ${STATUS_COLORS[job.status] || ''}`}>
                            {job.status}
                          </Badge>
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

      {/* Add/Edit Dialog */}
      <AddJobDialog
        open={addDialogOpen}
        onOpenChange={handleCloseDialog}
        editJob={editJob}
      />
    </div>
  )
}
