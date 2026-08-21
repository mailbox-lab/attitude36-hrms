'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { useCRMStore } from '@/stores/crm-store'
import { AddJobDialog } from './add-job-dialog'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
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
  MapPin,
  Briefcase,
  Building2,
  Users,
  Calendar,
  Clock,
  UserCheck,
  FileText,
  DollarSign,
  User,
  Video,
  MessageSquare,
} from 'lucide-react'

// ===== Types =====

type JobDetailData = {
  id: string
  title: string
  clientId: string
  client: { id: string; name: string; industry: string | null; city: string | null }
  recruiterId: string | null
  recruiter: { id: string; name: string; email: string } | null
  department: string | null
  location: string | null
  employmentType: string
  salaryMin: number | null
  salaryMax: number | null
  currency: string
  description: string | null
  requirements: string | null
  status: string
  priority: string
  openings: number
  createdAt: string
  updatedAt: string
  _count: {
    candidates: number
    interviews: number
    placements: number
  }
}

type CandidateRow = {
  id: string
  firstName: string
  lastName: string
  email: string | null
  phone: string | null
  title: string | null
  experience: number | null
  status: string
  rating: number
  createdAt: string
}

type InterviewRow = {
  id: string
  type: string
  interviewer: string | null
  date: string
  duration: number
  status: string
  candidate: { id: string; firstName: string; lastName: string }
}

// ===== Constants =====

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

const CANDIDATE_STATUS_COLORS: Record<string, string> = {
  New: 'bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-400',
  Screening: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400',
  Interview: 'bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-400',
  Offered: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400',
  Hired: 'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400',
  Rejected: 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400',
  'On Hold': 'bg-gray-100 text-gray-700 dark:bg-gray-950 dark:text-gray-400',
}

const INTERVIEW_STATUS_COLORS: Record<string, string> = {
  Scheduled: 'bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-400',
  Completed: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400',
  Cancelled: 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400',
  'No Show': 'bg-gray-100 text-gray-700 dark:bg-gray-950 dark:text-gray-400',
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

export function JobDetail({ jobId }: { jobId: string }) {
  const navigate = useCRMStore((s) => s.navigate)
  const queryClient = useQueryClient()
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)

  // Fetch job detail
  const { data: job, isLoading, error } = useQuery<JobDetailData>({
    queryKey: ['job', jobId],
    queryFn: async () => {
      const res = await fetch(`/api/jobs/${jobId}`)
      if (!res.ok) throw new Error('Failed to fetch job')
      return res.json()
    },
    enabled: !!jobId,
  })

  // Fetch candidates for this job
  const { data: candidatesData } = useQuery<{ data: CandidateRow[] }>({
    queryKey: ['job-candidates', jobId],
    queryFn: async () => {
      const res = await fetch(`/api/candidates?jobId=${jobId}`)
      if (!res.ok) throw new Error('Failed to fetch candidates')
      return res.json()
    },
    enabled: !!jobId,
  })

  const candidates = candidatesData?.data || []

  // Get interviews from the job detail (already included)
  const interviews: InterviewRow[] = (job?.interviews as unknown as InterviewRow[]) || []
  const scheduledInterviews = interviews.filter((i) => i.status === 'Scheduled').length
  const placementsCount = job?._count?.placements ?? 0

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/jobs/${jobId}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to delete job')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['jobs'] })
      toast.success('Job deleted successfully')
      navigate('jobs')
    },
    onError: () => {
      toast.error('Failed to delete job')
    },
  })

  if (isLoading) {
    return (
      <div className="flex flex-1 items-center justify-center p-8">
        <div className="text-center">
          <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <p className="text-sm text-muted-foreground">Loading job details...</p>
        </div>
      </div>
    )
  }

  if (error || !job) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 p-8">
        <p className="text-lg font-medium text-destructive">Job not found</p>
        <Button variant="outline" onClick={() => navigate('jobs')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Jobs
        </Button>
      </div>
    )
  }

  const currencySymbol = CURRENCY_SYMBOLS[job.currency] || job.currency
  const salaryRange =
    job.salaryMin || job.salaryMax
      ? `${currencySymbol}${(job.salaryMin ?? 0).toLocaleString('en-IN')} - ${currencySymbol}${(job.salaryMax ?? 0).toLocaleString('en-IN')}`
      : 'Not specified'

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('jobs')}
            className="shrink-0"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-2xl font-bold tracking-tight md:text-3xl">{job.title}</h1>
              <Badge className={`text-xs ${STATUS_COLORS[job.status] || ''}`}>
                {job.status}
              </Badge>
              <Badge className={`text-xs ${PRIORITY_COLORS[job.priority] || ''}`}>
                {job.priority}
              </Badge>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              {job.client.name}
              {job.department && ` · ${job.department}`}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setEditDialogOpen(true)}>
            <Pencil className="mr-2 h-3.5 w-3.5" />
            Edit
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="text-destructive hover:bg-destructive/10 hover:text-destructive"
            onClick={() => setDeleteDialogOpen(true)}
          >
            <Trash2 className="mr-2 h-3.5 w-3.5" />
            Delete
          </Button>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-violet-100 dark:bg-violet-950">
              <Users className="h-5 w-5 text-violet-600 dark:text-violet-400" />
            </div>
            <div>
              <p className="text-2xl font-bold">{job._count.candidates}</p>
              <p className="text-xs text-muted-foreground">Total Candidates</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-sky-100 dark:bg-sky-950">
              <Calendar className="h-5 w-5 text-sky-600 dark:text-sky-400" />
            </div>
            <div>
              <p className="text-2xl font-bold">{scheduledInterviews}</p>
              <p className="text-xs text-muted-foreground">Interviews Scheduled</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-100 dark:bg-emerald-950">
              <UserCheck className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <p className="text-2xl font-bold">{placementsCount}</p>
              <p className="text-xs text-muted-foreground">Placements</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left Column: Job Info */}
        <div className="flex flex-col gap-6 lg:col-span-1">
          {/* Job Info Card */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-sm font-medium">
                <Briefcase className="h-4 w-4" />
                Job Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <InfoRow icon={<Building2 className="h-3.5 w-3.5" />} label="Client" value={job.client.name} />
              <Separator />
              {job.recruiter && (
                <>
                  <InfoRow icon={<User className="h-3.5 w-3.5" />} label="Recruiter" value={job.recruiter.name} />
                  <Separator />
                </>
              )}
              {job.department && (
                <>
                  <InfoRow icon={<FileText className="h-3.5 w-3.5" />} label="Department" value={job.department} />
                  <Separator />
                </>
              )}
              {job.location && (
                <>
                  <InfoRow icon={<MapPin className="h-3.5 w-3.5" />} label="Location" value={job.location} />
                  <Separator />
                </>
              )}
              <InfoRow icon={<Briefcase className="h-3.5 w-3.5" />} label="Type" value={job.employmentType} />
              <Separator />
              <InfoRow icon={<DollarSign className="h-3.5 w-3.5" />} label="Salary" value={salaryRange} />
              <Separator />
              <InfoRow icon={<Users className="h-3.5 w-3.5" />} label="Openings" value={String(job.openings)} />
            </CardContent>
          </Card>

          {/* Description Card */}
          {job.description && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-sm font-medium">
                  <FileText className="h-4 w-4" />
                  Description
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">
                  {job.description}
                </p>
              </CardContent>
            </Card>
          )}

          {/* Requirements Card */}
          {job.requirements && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-sm font-medium">
                  <MessageSquare className="h-4 w-4" />
                  Requirements
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">
                  {job.requirements}
                </p>
              </CardContent>
            </Card>
          )}

          {/* Metadata */}
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              Created: {new Date(job.createdAt).toLocaleDateString('en-IN', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
              })}
            </span>
            <span>
              Updated: {new Date(job.updatedAt).toLocaleDateString('en-IN', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
              })}
            </span>
          </div>
        </div>

        {/* Right Column: Candidates & Interviews */}
        <div className="flex flex-col gap-6 lg:col-span-2">
          {/* Candidates Table */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="flex items-center gap-2 text-sm font-medium">
                <Users className="h-4 w-4" />
                Candidates
              </CardTitle>
              <span className="text-xs text-muted-foreground">
                {candidates.length} candidate{candidates.length !== 1 ? 's' : ''}
              </span>
            </CardHeader>
            <CardContent>
              {candidates.length > 0 ? (
                <div className="max-h-96 overflow-y-auto rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow className="hover:bg-transparent">
                        <TableHead className="text-xs">Name</TableHead>
                        <TableHead className="hidden text-xs sm:table-cell">Email</TableHead>
                        <TableHead className="hidden text-xs md:table-cell">Experience</TableHead>
                        <TableHead className="text-xs">Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {candidates.map((c) => (
                        <TableRow key={c.id} className="cursor-pointer" onClick={() => navigate('candidate-detail', c.id)}>
                          <TableCell className="text-xs font-medium">
                            {c.firstName} {c.lastName}
                          </TableCell>
                          <TableCell className="hidden text-xs sm:table-cell">
                            {c.email || '—'}
                          </TableCell>
                          <TableCell className="hidden text-xs md:table-cell">
                            {c.experience ? `${c.experience} yrs` : '—'}
                          </TableCell>
                          <TableCell>
                            <Badge className={`text-[10px] ${CANDIDATE_STATUS_COLORS[c.status] || ''}`}>
                              {c.status}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2 py-8">
                  <Users className="h-8 w-8 text-muted-foreground/40" />
                  <p className="text-sm text-muted-foreground">No candidates assigned yet</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Interviews List */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="flex items-center gap-2 text-sm font-medium">
                <Video className="h-4 w-4" />
                Interviews
              </CardTitle>
              <span className="text-xs text-muted-foreground">
                {interviews.length} interview{interviews.length !== 1 ? 's' : ''}
              </span>
            </CardHeader>
            <CardContent>
              {interviews.length > 0 ? (
                <div className="max-h-96 overflow-y-auto rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow className="hover:bg-transparent">
                        <TableHead className="text-xs">Candidate</TableHead>
                        <TableHead className="hidden text-xs sm:table-cell">Type</TableHead>
                        <TableHead className="hidden text-xs md:table-cell">Interviewer</TableHead>
                        <TableHead className="hidden text-xs md:table-cell">Date & Time</TableHead>
                        <TableHead className="text-xs">Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {interviews.map((interview) => (
                        <TableRow key={interview.id}>
                          <TableCell className="text-xs font-medium">
                            {interview.candidate.firstName} {interview.candidate.lastName}
                          </TableCell>
                          <TableCell className="hidden text-xs sm:table-cell">
                            <Badge variant="outline" className="text-[10px]">
                              {interview.type}
                            </Badge>
                          </TableCell>
                          <TableCell className="hidden text-xs md:table-cell">
                            {interview.interviewer || '—'}
                          </TableCell>
                          <TableCell className="hidden text-xs md:table-cell">
                            <div className="flex items-center gap-1.5">
                              <Calendar className="h-3 w-3 shrink-0 text-muted-foreground" />
                              <span>
                                {new Date(interview.date).toLocaleDateString('en-IN', {
                                  day: 'numeric',
                                  month: 'short',
                                  year: 'numeric',
                                })}
                              </span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <Clock className="h-3 w-3 shrink-0 text-muted-foreground" />
                              <span>
                                {new Date(interview.date).toLocaleTimeString('en-IN', {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </span>
                              <span className="text-muted-foreground">({interview.duration}m)</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge className={`text-[10px] ${INTERVIEW_STATUS_COLORS[interview.status] || ''}`}>
                              {interview.status}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2 py-8">
                  <Video className="h-8 w-8 text-muted-foreground/40" />
                  <p className="text-sm text-muted-foreground">No interviews scheduled yet</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Edit Dialog */}
      <AddJobDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        editJob={job}
      />

      {/* Delete Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Job</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <strong>{job.title}</strong>? This action
              cannot be undone and will remove all associated candidate and interview
              records for this job.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteMutation.mutate()}
              className="bg-destructive text-white hover:bg-destructive/90"
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

// ===== Helper Component =====

function InfoRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode
  label: string
  value: string
}) {
  return (
    <div className="flex items-center justify-between gap-2 text-sm">
      <span className="flex items-center gap-1.5 text-muted-foreground shrink-0">
        {icon}
        {label}
      </span>
      <span className="text-right font-medium">{value}</span>
    </div>
  )
}
