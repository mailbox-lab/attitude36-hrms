'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { useCRMStore } from '@/stores/crm-store'
import { AddCandidateDialog } from './add-candidate-dialog'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
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
  Mail,
  Phone,
  MapPin,
  Building2,
  Briefcase,
  Clock,
  Star,
  Calendar,
  Video,
  MessageSquare,
} from 'lucide-react'
import { useState } from 'react'

// ===== Types =====

type InterviewRecord = {
  id: string
  type: string
  interviewer: string | null
  date: string
  duration: number
  location: string | null
  meetingLink: string | null
  status: string
  feedback: string | null
  rating: number | null
}

type CandidateDetail = {
  id: string
  firstName: string
  lastName: string
  email: string | null
  phone: string | null
  title: string | null
  location: string | null
  experience: number | null
  currentCompany: string | null
  currentCTC: number | null
  expectedCTC: number | null
  currency: string
  noticePeriod: number | null
  source: string | null
  skills: string
  status: string
  jobId: string | null
  rating: number
  notes: string | null
  createdAt: string
  updatedAt: string
  job: { id: string; title: string; client: { id: string; name: string } } | null
  interviews: InterviewRecord[]
}

// ===== Constants =====

const STATUS_PIPELINE = ['New', 'Screening', 'Interview', 'Offer', 'Hired', 'Rejected', 'On-Hold']

const STATUS_COLORS: Record<string, string> = {
  New: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400',
  Screening: 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400',
  Interview: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400',
  Offer: 'bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-400',
  Hired: 'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400',
  Rejected: 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400',
  'On-Hold': 'bg-gray-100 text-gray-700 dark:bg-gray-950 dark:text-gray-400',
}

const STATUS_DOT_COLORS: Record<string, string> = {
  New: 'bg-emerald-500',
  Screening: 'bg-blue-500',
  Interview: 'bg-amber-500',
  Offer: 'bg-violet-500',
  Hired: 'bg-green-500',
  Rejected: 'bg-red-500',
  'On-Hold': 'bg-gray-500',
}

const INTERVIEW_STATUS_COLORS: Record<string, string> = {
  Scheduled: 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400',
  Completed: 'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400',
  Cancelled: 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400',
  Rescheduled: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400',
  'No Show': 'bg-gray-100 text-gray-700 dark:bg-gray-950 dark:text-gray-400',
}

// ===== Star Rating =====

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={`h-4 w-4 ${
            i < rating
              ? 'fill-amber-400 text-amber-400'
              : 'fill-muted text-muted-foreground/30'
          }`}
        />
      ))}
      <span className="ml-1 text-sm text-muted-foreground">{rating}/5</span>
    </div>
  )
}

// ===== Status Timeline =====

function StatusTimeline({ currentStatus }: { currentStatus: string }) {
  const currentIndex = STATUS_PIPELINE.indexOf(currentStatus)
  const isTerminal = currentStatus === 'Hired' || currentStatus === 'Rejected'

  return (
    <div className="flex items-center gap-1 overflow-x-auto pb-2">
      {STATUS_PIPELINE.map((status, idx) => {
        const isCompleted = !isTerminal && idx < currentIndex
        const isCurrent = status === currentStatus
        const isFuture = idx > currentIndex && !isTerminal
        const isTerminalDone = isTerminal && (status === currentStatus || idx < STATUS_PIPELINE.indexOf(currentStatus))

        return (
          <div key={status} className="flex items-center">
            <div className="flex flex-col items-center gap-1">
              <div
                className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 text-[10px] font-semibold transition-colors ${
                  isCurrent || isTerminalDone
                    ? `${STATUS_DOT_COLORS[status]} border-transparent text-white`
                    : isFuture
                      ? 'border-muted-foreground/30 text-muted-foreground/40'
                      : 'border-emerald-500 bg-emerald-500 text-white'
                }`}
              >
                {isCompleted || isTerminalDone ? '✓' : idx + 1}
              </div>
              <span
                className={`whitespace-nowrap text-[10px] font-medium ${
                  isCurrent ? 'text-foreground' : 'text-muted-foreground'
                }`}
              >
                {status}
              </span>
            </div>
            {idx < STATUS_PIPELINE.length - 1 && (
              <div
                className={`mx-1 h-0.5 w-4 sm:w-6 ${
                  (isCompleted && !isTerminal) || isTerminalDone
                    ? 'bg-emerald-500'
                    : 'bg-muted-foreground/20'
                }`}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}

// ===== Main Component =====

export function CandidateDetail({
  candidateId,
}: {
  candidateId: string
}) {
  const navigate = useCRMStore((s) => s.navigate)
  const queryClient = useQueryClient()
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)

  const { data: candidate, isLoading, error } = useQuery<CandidateDetail>({
    queryKey: ['candidate', candidateId],
    queryFn: async () => {
      const res = await fetch(`/api/candidates/${candidateId}`)
      if (!res.ok) throw new Error('Failed to fetch candidate')
      return res.json()
    },
    enabled: !!candidateId,
  })

  const { data: interviewsData } = useQuery<{ data: InterviewRecord[] }>({
    queryKey: ['candidate-interviews', candidateId],
    queryFn: async () => {
      const res = await fetch(`/api/interviews?candidateId=${candidateId}`)
      if (!res.ok) throw new Error('Failed to fetch interviews')
      return res.json()
    },
    enabled: !!candidateId,
  })

  const deleteMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/candidates/${candidateId}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to delete candidate')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['candidates'] })
      toast.success('Candidate deleted successfully')
      navigate('candidates')
    },
    onError: () => {
      toast.error('Failed to delete candidate')
    },
  })

  if (isLoading) {
    return (
      <div className="flex flex-1 items-center justify-center p-8">
        <div className="text-center">
          <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />\n          <p className="text-sm text-muted-foreground">Loading candidate details...</p>
        </div>
      </div>
    )
  }

  if (error || !candidate) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 p-8">
        <p className="text-lg font-medium text-destructive">Candidate not found</p>
        <Button variant="outline" onClick={() => navigate('candidates')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Candidates
        </Button>
      </div>
    )
  }

  const fullName = `${candidate.firstName} ${candidate.lastName}`
  const initials = `${candidate.firstName.charAt(0)}${candidate.lastName.charAt(0)}`.toUpperCase()
  const skills = candidate.skills
    ? candidate.skills.split(',').map((s) => s.trim()).filter(Boolean)
    : []
  const interviews = interviewsData?.data || []

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('candidates')}
            className="shrink-0"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight md:text-3xl">{fullName}</h1>
            <p className="text-sm text-muted-foreground">
              {candidate.title || 'No title specified'}
              {candidate.job && (
                <>
                  {' '}&middot; {candidate.job.title}{' '}
                  <span className="text-muted-foreground/60">
                    at {candidate.job.client?.name}
                  </span>
                </>
              )}
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

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left Column: Profile Card + Skills + Status */}
        <div className="flex flex-col gap-6 lg:col-span-1">
          {/* Profile Card */}
          <Card>
            <CardContent className="flex flex-col items-center gap-4 p-6">
              <Avatar className="h-20 w-20 text-2xl font-bold">
                <AvatarFallback className="bg-primary/10 text-primary">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="text-center">
                <h2 className="text-lg font-semibold">{fullName}</h2>
                <p className="text-sm text-muted-foreground">{candidate.title || '—'}</p>
              </div>
              <Badge className={STATUS_COLORS[candidate.status] || ''}>
                {candidate.status}
              </Badge>
              <StarRating rating={candidate.rating} />
            </CardContent>
          </Card>

          {/* Contact Info Card */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Contact Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {candidate.email && (
                <div className="flex items-center gap-3 text-sm">
                  <Mail className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <a
                    href={`mailto:${candidate.email}`}
                    className="truncate text-foreground hover:underline"
                  >
                    {candidate.email}
                  </a>
                </div>
              )}
              {candidate.phone && (
                <div className="flex items-center gap-3 text-sm">
                  <Phone className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <span>{candidate.phone}</span>
                </div>
              )}
              {candidate.location && (
                <div className="flex items-center gap-3 text-sm">
                  <MapPin className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <span>{candidate.location}</span>
                </div>
              )}
              {candidate.currentCompany && (
                <div className="flex items-center gap-3 text-sm">
                  <Building2 className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <span>{candidate.currentCompany}</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Experience & CTC Card */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Experience & Compensation</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2 text-muted-foreground">
                  <Briefcase className="h-4 w-4" /> Experience
                </span>
                <span className="font-medium">
                  {candidate.experience != null ? `${candidate.experience} yrs` : '—'}
                </span>
              </div>
              <Separator />
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Current CTC</span>
                <span className="font-medium">
                  {candidate.currentCTC ? `₹${candidate.currentCTC} LPA` : '—'}
                </span>
              </div>
              <Separator />
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Expected CTC</span>
                <span className="font-medium">
                  {candidate.expectedCTC ? `₹${candidate.expectedCTC} LPA` : '—'}
                </span>
              </div>
              <Separator />
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2 text-muted-foreground">
                  <Clock className="h-4 w-4" /> Notice Period
                </span>
                <span className="font-medium">
                  {candidate.noticePeriod != null ? `${candidate.noticePeriod} days` : '—'}
                </span>
              </div>
              <Separator />
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Source</span>
                <span className="font-medium">{candidate.source || '—'}</span>
              </div>
            </CardContent>
          </Card>

          {/* Skills Card */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Skills</CardTitle>
            </CardHeader>
            <CardContent>
              {skills.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {skills.map((skill) => (
                    <Badge key={skill} variant="secondary" className="text-xs">
                      {skill}
                    </Badge>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No skills listed</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Status Timeline, Interview History, Notes */}
        <div className="flex flex-col gap-6 lg:col-span-2">
          {/* Status Timeline Card */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Status Timeline</CardTitle>
            </CardHeader>
            <CardContent>
              <StatusTimeline currentStatus={candidate.status} />
            </CardContent>
          </Card>

          {/* Interview History Card */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="flex items-center gap-2 text-sm font-medium">
                <Video className="h-4 w-4" />
                Interview History
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
                        <TableHead className="text-xs">Date</TableHead>
                        <TableHead className="text-xs">Type</TableHead>
                        <TableHead className="text-xs">Interviewer</TableHead>
                        <TableHead className="text-xs">Duration</TableHead>
                        <TableHead className="text-xs">Status</TableHead>
                        <TableHead className="text-xs">Rating</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {interviews.map((interview) => (
                        <TableRow key={interview.id}>
                          <TableCell className="text-xs">
                            {interview.date
                              ? new Date(interview.date).toLocaleDateString('en-IN', {
                                  day: 'numeric',
                                  month: 'short',
                                  year: 'numeric',
                                })
                              : '—'}
                          </TableCell>
                          <TableCell className="text-xs font-medium">
                            {interview.type}
                          </TableCell>
                          <TableCell className="text-xs">
                            {interview.interviewer || '—'}
                          </TableCell>
                          <TableCell className="text-xs">{interview.duration} min</TableCell>
                          <TableCell>
                            <Badge
                              className={`text-[10px] ${
                                INTERVIEW_STATUS_COLORS[interview.status] || ''
                              }`}
                            >
                              {interview.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-xs">
                            {interview.rating != null ? (
                              <div className="flex items-center gap-0.5">
                                <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                                <span>{interview.rating}</span>
                              </div>
                            ) : (
                              '—'
                            )}
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

          {/* Notes Card */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-sm font-medium">
                <MessageSquare className="h-4 w-4" />
                Notes
              </CardTitle>
            </CardHeader>
            <CardContent>
              {candidate.notes ? (
                <p className="whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">
                  {candidate.notes}
                </p>
              ) : (
                <p className="text-sm text-muted-foreground">No notes added.</p>
              )}
            </CardContent>
          </Card>

          {/* Metadata */}
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              Added: {new Date(candidate.createdAt).toLocaleDateString('en-IN', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
              })}
            </span>
            <span>
              Updated: {new Date(candidate.updatedAt).toLocaleDateString('en-IN', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
              })}
            </span>
          </div>
        </div>
      </div>

      {/* Edit Dialog */}
      <AddCandidateDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        editCandidate={candidate}
      />

      {/* Delete Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Candidate</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <strong>{fullName}</strong>? This action cannot be
              undone and will remove all associated interview records.
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
