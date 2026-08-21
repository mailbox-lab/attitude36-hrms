'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
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
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from '@/components/ui/form'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Plus,
  Search,
  CalendarClock,
  MoreHorizontal,
  MessageSquare,
  Pencil,
  Loader2,
  Video,
  MapPin,
  Clock,
  User,
} from 'lucide-react'

// ===== Types =====

type Interview = {
  id: string
  candidateId: string
  candidate: { id: string; firstName: string; lastName: string }
  jobId: string | null
  job: { id: string; title: string } | null
  type: string
  interviewer: string | null
  date: string
  duration: number
  location: string | null
  meetingLink: string | null
  status: string
  feedback: string | null
  rating: number | null
  createdAt: string
  updatedAt: string
}

type CandidateOption = {
  id: string
  firstName: string
  lastName: string
}

type JobOption = {
  id: string
  title: string
}

// ===== Constants =====

const STATUS_OPTIONS = ['All', 'Scheduled', 'Completed', 'Cancelled', 'No-Show']
const TYPE_OPTIONS = ['All', 'Phone', 'Technical', 'HR', 'Managerial', 'Final']
const INTERVIEW_TYPES = ['Phone', 'Technical', 'HR', 'Managerial', 'Final']
const EDITABLE_STATUSES = ['Scheduled', 'Completed', 'Cancelled', 'No-Show']

const STATUS_COLORS: Record<string, string> = {
  Scheduled: 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400',
  Completed: 'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400',
  Cancelled: 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400',
  'No-Show': 'bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-400',
}

// ===== Schema =====

const interviewSchema = z.object({
  candidateId: z.string().min(1, 'Candidate is required'),
  jobId: z.string().optional(),
  type: z.string().min(1, 'Interview type is required'),
  interviewer: z.string().min(1, 'Interviewer name is required'),
  date: z.string().min(1, 'Date and time is required'),
  duration: z.coerce.number().min(15, 'Min 15 minutes').max(480, 'Max 8 hours'),
  location: z.string().optional(),
  meetingLink: z.string().url('Must be a valid URL').optional().or(z.literal('')),
})

type InterviewFormData = z.infer<typeof interviewSchema>

const feedbackSchema = z.object({
  feedback: z.string().min(1, 'Feedback is required'),
  rating: z.coerce.number().min(1).max(5),
})

type FeedbackFormData = z.infer<typeof feedbackSchema>

// ===== Helpers =====

function formatDate(dateStr: string) {
  const date = new Date(dateStr)
  return date.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

function formatTime(dateStr: string) {
  const date = new Date(dateStr)
  return date.toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  })
}

function formatDuration(minutes: number) {
  if (minutes < 60) return `${minutes}m`
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return m > 0 ? `${h}h ${m}m` : `${h}h`
}

// ===== Schedule Interview Dialog =====

function ScheduleInterviewDialog({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const queryClient = useQueryClient()

  const form = useForm<InterviewFormData>({
    resolver: zodResolver(interviewSchema),
    defaultValues: {
      candidateId: '',
      jobId: '',
      type: 'Technical',
      interviewer: '',
      date: '',
      duration: 60,
      location: '',
      meetingLink: '',
    },
  })

  const { data: candidates } = useQuery<{ data: CandidateOption[] }>({
    queryKey: ['candidates-list'],
    queryFn: async () => {
      const res = await fetch('/api/candidates')
      if (!res.ok) throw new Error('Failed to fetch candidates')
      return res.json()
    },
    enabled: open,
  })

  const { data: jobs } = useQuery<{ data: JobOption[] }>({
    queryKey: ['jobs-list'],
    queryFn: async () => {
      const res = await fetch('/api/jobs')
      if (!res.ok) throw new Error('Failed to fetch jobs')
      return res.json()
    },
    enabled: open,
  })

  const mutation = useMutation({
    mutationFn: async (data: InterviewFormData) => {
      const res = await fetch('/api/interviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) throw new Error('Failed to schedule interview')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['interviews'] })
      toast.success('Interview scheduled successfully')
      onOpenChange(false)
      form.reset()
    },
    onError: () => {
      toast.error('Failed to schedule interview')
    },
  })

  function onSubmit(data: InterviewFormData) {
    mutation.mutate(data)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Schedule Interview</DialogTitle>
          <DialogDescription>
            Fill in the details to schedule a new interview.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="candidateId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Candidate *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select candidate" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {(candidates?.data || []).map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.firstName} {c.lastName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="jobId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Job Opening</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value || ''}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select job (optional)" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {(jobs?.data || []).map((j) => (
                        <SelectItem key={j.id} value={j.id}>
                          {j.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Interview Type *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {INTERVIEW_TYPES.map((t) => (
                        <SelectItem key={t} value={t}>
                          {t}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="interviewer"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Interviewer *</FormLabel>
                  <FormControl>
                    <Input placeholder="Interviewer name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Date & Time *</FormLabel>
                    <FormControl>
                      <Input type="datetime-local" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="duration"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Duration (min) *</FormLabel>
                    <FormControl>
                      <Input type="number" min={15} max={480} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="location"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Location</FormLabel>
                  <FormControl>
                    <Input placeholder="Interview location" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="meetingLink"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Meeting Link</FormLabel>
                  <FormControl>
                    <Input placeholder="https://meet.google.com/..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={mutation.isPending}>
                {mutation.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Schedule Interview
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

// ===== Feedback Dialog =====

function FeedbackDialog({
  open,
  onOpenChange,
  interview,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  interview: Interview | null
}) {
  const queryClient = useQueryClient()

  const form = useForm<FeedbackFormData>({
    resolver: zodResolver(feedbackSchema),
    defaultValues: {
      feedback: '',
      rating: 3,
    },
  })

  const mutation = useMutation({
    mutationFn: async (data: FeedbackFormData) => {
      const res = await fetch(`/api/interviews/${interview?.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ feedback: data.feedback, rating: data.rating }),
      })
      if (!res.ok) throw new Error('Failed to save feedback')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['interviews'] })
      toast.success('Feedback saved successfully')
      onOpenChange(false)
      form.reset()
    },
    onError: () => {
      toast.error('Failed to save feedback')
    },
  })

  function onSubmit(data: FeedbackFormData) {
    mutation.mutate(data)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Feedback</DialogTitle>
          <DialogDescription>
            {interview
              ? `Feedback for ${interview.candidate.firstName} ${interview.candidate.lastName} — ${interview.type} interview`
              : ''}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="feedback"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Feedback *</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Enter interview feedback..."
                      rows={4}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="rating"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Rating (1-5) *</FormLabel>
                  <FormControl>
                    <Input type="number" min={1} max={5} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={mutation.isPending}>
                {mutation.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Save Feedback
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

// ===== Main Component =====

export function InterviewsPage() {
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('All')
  const [typeFilter, setTypeFilter] = useState('All')
  const [scheduleDialogOpen, setScheduleDialogOpen] = useState(false)
  const [feedbackInterview, setFeedbackInterview] = useState<Interview | null>(null)

  const { data, isLoading, error } = useQuery<{ data: Interview[] }>({
    queryKey: ['interviews', statusFilter, typeFilter, search],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (statusFilter !== 'All') params.set('status', statusFilter)
      if (typeFilter !== 'All') params.set('type', typeFilter)
      if (search) params.set('search', search)
      const res = await fetch(`/api/interviews?${params.toString()}`)
      if (!res.ok) throw new Error('Failed to fetch interviews')
      return res.json()
    },
  })

  const interviews = data?.data || []

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const res = await fetch(`/api/interviews/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })
      if (!res.ok) throw new Error('Failed to update status')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['interviews'] })
      toast.success('Interview status updated')
    },
    onError: () => {
      toast.error('Failed to update status')
    },
  })

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Interviews</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Schedule and manage candidate interviews
            {data && (
              <span className="ml-1 font-medium text-foreground">
                ({interviews.length} interviews)
              </span>
            )}
          </p>
        </div>
        <Button onClick={() => setScheduleDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Schedule Interview
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1 sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search interviews..."
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-[160px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            {STATUS_OPTIONS.map((status) => (
              <SelectItem key={status} value={status}>
                {status}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-full sm:w-[160px]">
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent>
            {TYPE_OPTIONS.map((type) => (
              <SelectItem key={type} value={type}>
                {type}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      {isLoading ? (
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-center gap-3">
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              <p className="text-sm text-muted-foreground">Loading interviews...</p>
            </div>
          </CardContent>
        </Card>
      ) : error ? (
        <Card>
          <CardContent className="p-6">
            <p className="text-center text-sm text-destructive">
              Failed to load interviews. Please try again.
            </p>
          </CardContent>
        </Card>
      ) : interviews.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-12">
            <CalendarClock className="h-10 w-10 text-muted-foreground/40" />
            <p className="text-sm font-medium text-muted-foreground">No interviews found</p>
            <p className="text-xs text-muted-foreground/70">
              {search || statusFilter !== 'All' || typeFilter !== 'All'
                ? 'Try adjusting your filters'
                : 'Click "Schedule Interview" to get started'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <div className="max-h-96 overflow-y-auto">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="text-xs">Candidate</TableHead>
                  <TableHead className="hidden text-xs sm:table-cell">Job Title</TableHead>
                  <TableHead className="text-xs">Type</TableHead>
                  <TableHead className="hidden text-xs md:table-cell">Interviewer</TableHead>
                  <TableHead className="hidden text-xs lg:table-cell">Date</TableHead>
                  <TableHead className="hidden text-xs md:table-cell">Duration</TableHead>
                  <TableHead className="text-xs">Status</TableHead>
                  <TableHead className="w-12 text-xs">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {interviews.map((interview) => (
                  <TableRow key={interview.id} className="transition-colors">
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 shrink-0 text-muted-foreground" />
                        <span className="truncate text-sm font-medium">
                          {interview.candidate.firstName} {interview.candidate.lastName}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="hidden max-w-[180px] truncate text-xs sm:table-cell">
                      {interview.job?.title || '—'}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-[10px] font-medium">
                        {interview.type}
                      </Badge>
                    </TableCell>
                    <TableCell className="hidden text-xs md:table-cell">
                      <div className="flex items-center gap-1.5">
                        <User className="h-3.5 w-3.5 text-muted-foreground" />
                        {interview.interviewer || '—'}
                      </div>
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      <div className="text-xs">
                        <div className="flex items-center gap-1.5">
                          <CalendarClock className="h-3.5 w-3.5 text-muted-foreground" />
                          {formatDate(interview.date)}
                        </div>
                        <div className="mt-0.5 text-muted-foreground">
                          {formatTime(interview.date)}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <div className="flex items-center gap-1.5 text-xs">
                        <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                        {formatDuration(interview.duration)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        className={`text-[10px] ${
                          STATUS_COLORS[interview.status] || ''
                        }`}
                      >
                        {interview.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel className="text-xs text-muted-foreground">
                            Update Status
                          </DropdownMenuLabel>
                          {EDITABLE_STATUSES.map((status) => (
                            <DropdownMenuItem
                              key={status}
                              onClick={() =>
                                updateStatusMutation.mutate({
                                  id: interview.id,
                                  status,
                                })
                              }
                              disabled={interview.status === status}
                            >
                              <Pencil className="mr-2 h-3.5 w-3.5" />
                              Mark as {status}
                            </DropdownMenuItem>
                          ))}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => setFeedbackInterview(interview)}
                          >
                            <MessageSquare className="mr-2 h-3.5 w-3.5" />
                            Add Feedback
                          </DropdownMenuItem>
                          {interview.meetingLink && (
                            <DropdownMenuItem asChild>
                              <a
                                href={interview.meetingLink}
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                <Video className="mr-2 h-3.5 w-3.5" />
                                Open Meeting Link
                              </a>
                            </DropdownMenuItem>
                          )}
                          {interview.location && (
                            <DropdownMenuItem disabled>
                              <MapPin className="mr-2 h-3.5 w-3.5" />
                              {interview.location}
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </Card>
      )}

      {/* Dialogs */}
      <ScheduleInterviewDialog
        open={scheduleDialogOpen}
        onOpenChange={setScheduleDialogOpen}
      />
      <FeedbackDialog
        open={!!feedbackInterview}
        onOpenChange={(open) => {
          if (!open) setFeedbackInterview(null)
        }}
        interview={feedbackInterview}
      />
    </div>
  )
}
