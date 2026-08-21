'use client'

import { useState, useMemo, useRef } from 'react'
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
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
  MoreHorizontal,
  CalendarCheck,
  UserCheck,
  Send,
  CalendarDays,
  IndianRupee,
  Tag,
  Timer,
  Check,
} from 'lucide-react'
import { motion } from 'framer-motion'
import { Textarea } from '@/components/ui/textarea'

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
  Screening: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400',
  Interview: 'bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-400',
  Offer: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-950 dark:text-cyan-400',
  Hired: 'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400',
  Rejected: 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400',
  'On-Hold': 'bg-gray-100 text-gray-700 dark:bg-gray-950 dark:text-gray-400',
}

const STATUS_DOT_COLORS: Record<string, string> = {
  New: 'bg-emerald-500',
  Screening: 'bg-amber-500',
  Interview: 'bg-violet-500',
  Offer: 'bg-cyan-500',
  Hired: 'bg-green-500',
  Rejected: 'bg-red-500',
  'On-Hold': 'bg-gray-500',
}

const INTERVIEW_STATUS_COLORS: Record<string, string> = {
  Scheduled: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400',
  Completed: 'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400',
  Cancelled: 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400',
  Rescheduled: 'bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-400',
  'No Show': 'bg-gray-100 text-gray-700 dark:bg-gray-950 dark:text-gray-400',
}

// ===== Skill Color Helper =====

const SKILL_COLORS = [
  'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400',
  'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400',
  'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-400',
  'bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-400',
  'bg-cyan-100 text-cyan-700 dark:bg-cyan-950 dark:text-cyan-400',
  'bg-teal-100 text-teal-700 dark:bg-teal-950 dark:text-teal-400',
  'bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-400',
  'bg-pink-100 text-pink-700 dark:bg-pink-950 dark:text-pink-400',
]

function getSkillColor(index: number): string {
  return SKILL_COLORS[index % SKILL_COLORS.length]
}

// ===== Match Score Circle =====

function MatchScoreCircle({ score }: { score: number }) {
  const radius = 28
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (score / 100) * circumference
  const color = score >= 80 ? 'text-emerald-500' : score >= 65 ? 'text-amber-500' : 'text-rose-500'
  const strokeColor = score >= 80 ? 'stroke-emerald-500' : score >= 65 ? 'stroke-amber-500' : 'stroke-rose-500'

  return (
    <div className="relative flex h-[72px] w-[72px] items-center justify-center">
      <svg className="h-full w-full -rotate-90" viewBox="0 0 72 72">
        <circle cx="36" cy="36" r={radius} fill="none" strokeWidth="4" className="stroke-muted/30" />
        <motion.circle
          cx="36" cy="36" r={radius} fill="none" strokeWidth="4" strokeLinecap="round"
          className={strokeColor}
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.2, ease: 'easeOut', delay: 0.3 }}
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className={`text-base font-bold leading-none ${color}`}>{score}%</span>
        <span className="text-[8px] text-muted-foreground">Match</span>
      </div>
    </div>
  )
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
    <div className="flex items-center gap-0 overflow-x-auto pb-2">
      {STATUS_PIPELINE.map((status, idx) => {
        const isCompleted = !isTerminal && idx < currentIndex
        const isCurrent = status === currentStatus
        const isFuture = idx > currentIndex && !isTerminal
        const isTerminalDone = isTerminal && (status === currentStatus || idx < STATUS_PIPELINE.indexOf(currentStatus))
        const dotColor = STATUS_DOT_COLORS[status]

        return (
          <div key={status} className="group flex items-center">
            <div className="flex flex-col items-center gap-1.5">
              <div
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[11px] font-bold transition-all group-hover:scale-110 ${
                  isCurrent || isTerminalDone
                    ? `${dotColor} text-white ring-4 ring-white shadow-md dark:ring-background`
                    : isFuture
                      ? 'border-2 border-dashed border-muted-foreground/25 text-muted-foreground/40'
                      : `${dotColor} text-white ring-2 ring-white/60 dark:ring-background/60`
                }`}
              >
                {isCompleted || isTerminalDone ? '✓' : idx + 1}
              </div>
              <span
                className={`whitespace-nowrap text-[10px] font-medium transition-colors ${
                  isCurrent ? 'text-foreground' : 'text-muted-foreground'
                }`}
              >
                {status}
              </span>
            </div>
            {idx < STATUS_PIPELINE.length - 1 && (
              <div
                className={`mx-0.5 h-1 w-5 rounded-full transition-colors sm:w-8 ${
                  (isCompleted && !isTerminal) || isTerminalDone
                    ? dotColor.replace('bg-', 'bg-')
                    : 'bg-muted-foreground/15'
                }`}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}

// ===== Quick Info Card =====

function QuickInfoItem({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3 rounded-lg border bg-card p-3 transition-shadow hover:shadow-md">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/5">
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-[11px] text-muted-foreground">{label}</p>
        <p className="truncate text-sm font-semibold">{value || '—'}</p>
      </div>
    </div>
  )
}

// ===== Notes Editor =====

function NotesEditor({
  candidateId,
  initialNotes,
}: {
  candidateId: string
  initialNotes: string
}) {
  const queryClient = useQueryClient()
  const [notes, setNotes] = useState(initialNotes)
  const [showSaved, setShowSaved] = useState(false)
  const savedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const saveMutation = useMutation({
    mutationFn: async (newNotes: string) => {
      const res = await fetch(`/api/candidates/${candidateId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes: newNotes }),
      })
      if (!res.ok) throw new Error('Failed to save notes')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['candidate', candidateId] })
      queryClient.invalidateQueries({ queryKey: ['candidates'] })
      toast.success('Notes saved')
      setShowSaved(true)
      if (savedTimerRef.current) clearTimeout(savedTimerRef.current)
      savedTimerRef.current = setTimeout(() => setShowSaved(false), 2000)
    },
    onError: () => {
      toast.error('Failed to save notes')
    },
  })

  const hasNotes = notes.trim().length > 0
  const isDirty = notes !== initialNotes

  return (
    <div className="space-y-3">
      <Textarea
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        rows={4}
        placeholder={!hasNotes ? 'No notes yet. Add internal notes about this candidate...' : 'Add internal notes about this candidate...'}
        className="resize-y"
      />
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground">
          {notes.length} character{notes.length !== 1 ? 's' : ''}
        </span>
        <div className="flex items-center gap-2">
          {showSaved && (
            <motion.span
              className="flex items-center gap-1 text-xs font-medium text-emerald-600 dark:text-emerald-400"
              initial={{ opacity: 0, x: 8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0 }}
            >
              <Check className="h-3.5 w-3.5" />
              Saved
            </motion.span>
          )}
          <Button
            size="sm"
            disabled={!isDirty || saveMutation.isPending}
            onClick={() => saveMutation.mutate(notes)}
          >
            <Pencil className="mr-1.5 h-3.5 w-3.5" />
            {saveMutation.isPending ? 'Saving...' : 'Save Notes'}
          </Button>
        </div>
      </div>
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

  // Stable match score based on candidateId
  const matchScore = useMemo(() => {
    let hash = 0
    for (let i = 0; i < candidateId.length; i++) {
      hash = ((hash << 5) - hash) + candidateId.charCodeAt(i)
      hash |= 0
    }
    return 60 + Math.abs(hash) % 36 // 60-95
  }, [candidateId])

  if (isLoading) {
    return (
      <div className="flex flex-1 items-center justify-center p-8">
        <div className="text-center">
          <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <p className="text-sm text-muted-foreground">Loading candidate details...</p>
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

  const handleScheduleInterview = () => {
    navigate('interviews')
    toast.info('Select a job to schedule interview')
  }

  return (
    <motion.div
      className="flex flex-1 flex-col gap-6 p-4 md:p-6"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Back Button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => navigate('candidates')}
        className="w-fit"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Candidates
      </Button>

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-4">
          <Avatar className="mt-0.5 h-14 w-14 text-xl font-bold ring-4 ring-background shadow-sm">
            <AvatarFallback className="bg-gradient-to-br from-emerald-500 to-teal-600 text-white">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight md:text-3xl">{fullName}</h1>
              <Badge className={STATUS_COLORS[candidate.status] || ''}>
                {candidate.status}
              </Badge>
              {candidate.source && (
                <Badge variant="outline" className="text-xs">
                  <Tag className="mr-1 h-3 w-3" />
                  {candidate.source}
                </Badge>
              )}
              {candidate.experience != null && (
                <Badge variant="secondary" className="text-xs">
                  <Briefcase className="mr-1 h-3 w-3" />
                  {candidate.experience} yrs exp
                </Badge>
              )}
              {candidate.notes && (
                <Badge variant="outline" className="text-xs text-amber-600 dark:text-amber-400">
                  <MessageSquare className="mr-1 h-3 w-3" />
                  {candidate.notes.length}
                </Badge>
              )}
            </div>
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
          <MatchScoreCircle score={matchScore} />
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
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon" className="h-8 w-8">
                <MoreHorizontal className="h-4 w-4" />
                <span className="sr-only">Actions</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleScheduleInterview}>
                <CalendarCheck className="mr-2 h-4 w-4" />
                Schedule Interview
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => toast.info('Feature coming soon')}>
                <UserCheck className="mr-2 h-4 w-4" />
                Create Placement
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => toast.info('Feature coming soon')}>
                <Send className="mr-2 h-4 w-4" />
                Send Email
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left Column: Profile Card + Skills + Status */}
        <div className="flex flex-col gap-6 lg:col-span-1">
          {/* Profile Card */}
          <Card className="overflow-hidden">
            <div className="h-20 bg-gradient-to-br from-emerald-500/20 via-teal-500/20 to-cyan-500/20 dark:from-emerald-500/10 dark:via-teal-500/10 dark:to-cyan-500/10" />
            <CardContent className="relative flex flex-col items-center gap-4 px-6 pb-6 pt-0">
              <div className="-mt-10">
                <Avatar className="h-20 w-20 text-2xl font-bold ring-4 ring-background">
                  <AvatarFallback className="bg-gradient-to-br from-emerald-500 to-teal-600 text-white">
                    {initials}
                  </AvatarFallback>
                </Avatar>
              </div>
              <div className="text-center">
                <h2 className="text-lg font-semibold">{fullName}</h2>
                <p className="text-sm text-muted-foreground">{candidate.title || '—'}</p>
              </div>
              <StarRating rating={candidate.rating} />
            </CardContent>
          </Card>

          {/* Contact Info Card */}
          <Card className="border-l-4 border-l-emerald-500/40 transition-shadow hover:shadow-md">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Contact Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3.5">
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

          {/* Skills Card */}
          <Card className="border-l-4 border-l-violet-500/40 transition-shadow hover:shadow-md">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Skills</CardTitle>
            </CardHeader>
            <CardContent>
              {skills.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {skills.map((skill, index) => (
                    <span
                      key={skill}
                      className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${getSkillColor(index)}`}
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No skills listed</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Middle Column: Status Timeline, Interview History, Notes */}
        <div className="flex flex-col gap-6 lg:col-span-2">
          {/* Quick Info Sidebar Section */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Quick Info</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-3">
                <QuickInfoItem
                  icon={<CalendarDays className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />}
                  label="Applied Date"
                  value={new Date(candidate.createdAt).toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })}
                />
                <QuickInfoItem
                  icon={<Tag className="h-4 w-4 text-amber-600 dark:text-amber-400" />}
                  label="Source"
                  value={candidate.source || '—'}
                />
                <QuickInfoItem
                  icon={<Briefcase className="h-4 w-4 text-violet-600 dark:text-violet-400" />}
                  label="Experience"
                  value={candidate.experience != null ? `${candidate.experience} years` : '—'}
                />
                <QuickInfoItem
                  icon={<IndianRupee className="h-4 w-4 text-rose-600 dark:text-rose-400" />}
                  label="Current CTC"
                  value={candidate.currentCTC ? `₹${candidate.currentCTC} LPA` : '—'}
                />
                <QuickInfoItem
                  icon={<IndianRupee className="h-4 w-4 text-cyan-600 dark:text-cyan-400" />}
                  label="Expected CTC"
                  value={candidate.expectedCTC ? `₹${candidate.expectedCTC} LPA` : '—'}
                />
                <QuickInfoItem
                  icon={<Timer className="h-4 w-4 text-orange-600 dark:text-orange-400" />}
                  label="Notice Period"
                  value={candidate.noticePeriod != null ? `${candidate.noticePeriod} days` : '—'}
                />
              </div>
            </CardContent>
          </Card>

          {/* Status Timeline Card */}
          <Card className="transition-shadow hover:shadow-md">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Status Timeline</CardTitle>
            </CardHeader>
            <CardContent>
              <StatusTimeline currentStatus={candidate.status} />
            </CardContent>
          </Card>

          {/* Interview History Card */}
          <Card className="transition-shadow hover:shadow-md">
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
                        <TableRow key={interview.id} className="transition-colors hover:bg-muted/50">
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
          <Card className="transition-shadow hover:shadow-md">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-sm font-medium">
                <MessageSquare className="h-4 w-4" />
                Notes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <NotesEditor
                candidateId={candidate.id}
                initialNotes={candidate.notes || ''}
              />
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
    </motion.div>
  )
}
