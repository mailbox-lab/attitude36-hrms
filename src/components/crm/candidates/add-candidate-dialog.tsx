'use client'

import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
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
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Loader2 } from 'lucide-react'

// ===== Types =====

type CandidateFormData = {
  firstName: string
  lastName: string
  email: string
  phone: string
  title: string
  location: string
  experience: number
  currentCompany: string
  currentCTC: number
  expectedCTC: number
  noticePeriod: number
  source: string
  skills: string
  jobId: string
  notes: string
}

// ===== Props =====

type AddCandidateDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  editCandidate?: {
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
    noticePeriod: number | null
    source: string | null
    skills: string
    jobId: string | null
    notes: string | null
  } | null
}

// ===== Schema =====

const candidateSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Invalid email').or(z.literal('')),
  phone: z.string().or(z.literal('')),
  title: z.string().or(z.literal('')),
  location: z.string().or(z.literal('')),
  experience: z.coerce.number().min(0).max(50).default(0),
  currentCompany: z.string().or(z.literal('')),
  currentCTC: z.coerce.number().min(0).default(0),
  expectedCTC: z.coerce.number().min(0).default(0),
  noticePeriod: z.coerce.number().min(0).max(365).default(30),
  source: z.string().default(''),
  skills: z.string().default(''),
  jobId: z.string().default(''),
  notes: z.string().default(''),
})

// ===== Source Options =====

const SOURCE_OPTIONS = [
  'LinkedIn',
  'Naukri',
  'Referral',
  'Job Portal',
  'Company Website',
  'Social Media',
  'Campus Drive',
  'Headhunting',
  'Other',
]

// ===== Component =====

export function AddCandidateDialog({
  open,
  onOpenChange,
  editCandidate,
}: AddCandidateDialogProps) {
  const queryClient = useQueryClient()

  const form = useForm<CandidateFormData>({
    resolver: zodResolver(candidateSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      title: '',
      location: '',
      experience: 0,
      currentCompany: '',
      currentCTC: 0,
      expectedCTC: 0,
      noticePeriod: 30,
      source: '',
      skills: '',
      jobId: '',
      notes: '',
    },
  })

  // Populate form when editing
  useEffect(() => {
    if (editCandidate && open) {
      form.reset({
        firstName: editCandidate.firstName || '',
        lastName: editCandidate.lastName || '',
        email: editCandidate.email || '',
        phone: editCandidate.phone || '',
        title: editCandidate.title || '',
        location: editCandidate.location || '',
        experience: editCandidate.experience || 0,
        currentCompany: editCandidate.currentCompany || '',
        currentCTC: editCandidate.currentCTC || 0,
        expectedCTC: editCandidate.expectedCTC || 0,
        noticePeriod: editCandidate.noticePeriod || 30,
        source: editCandidate.source || '',
        skills: editCandidate.skills || '',
        jobId: editCandidate.jobId || '',
        notes: editCandidate.notes || '',
      })
    } else if (!editCandidate && open) {
      form.reset({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        title: '',
        location: '',
        experience: 0,
        currentCompany: '',
        currentCTC: 0,
        expectedCTC: 0,
        noticePeriod: 30,
        source: '',
        skills: '',
        jobId: '',
        notes: '',
      })
    }
  }, [editCandidate, open, form])

  // Fetch jobs for the select dropdown
  const { data: jobsData } = useQuery({
    queryKey: ['jobs-select'],
    queryFn: async () => {
      const res = await fetch('/api/jobs?status=Open')
      if (!res.ok) throw new Error('Failed to fetch jobs')
      const json = await res.json()
      return json.data as Array<{ id: string; title: string; client: { id: string; name: string } }>
    },
  })

  const isEditing = !!editCandidate

  const mutation = useMutation({
    mutationFn: async (data: CandidateFormData) => {
      const payload = {
        ...data,
        currentCTC: data.currentCTC || null,
        expectedCTC: data.expectedCTC || null,
        noticePeriod: data.noticePeriod || null,
        experience: data.experience || null,
        jobId: data.jobId || null,
        source: data.source || null,
        title: data.title || null,
        location: data.location || null,
        currentCompany: data.currentCompany || null,
        notes: data.notes || null,
        email: data.email || null,
        phone: data.phone || null,
      }
      if (isEditing) {
        const res = await fetch(`/api/candidates/${editCandidate.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
        if (!res.ok) throw new Error('Failed to update candidate')
        return res.json()
      } else {
        const res = await fetch('/api/candidates', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
        if (!res.ok) throw new Error('Failed to create candidate')
        return res.json()
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['candidates'] })
      queryClient.invalidateQueries({ queryKey: ['candidate'] })
      toast.success(
        isEditing ? 'Candidate updated successfully' : 'Candidate added successfully'
      )
      onOpenChange(false)
      form.reset()
    },
    onError: () => {
      toast.error(isEditing ? 'Failed to update candidate' : 'Failed to add candidate')
    },
  })

  function onSubmit(data: CandidateFormData) {
    mutation.mutate(data)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Edit Candidate' : 'Add New Candidate'}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? 'Update candidate information below.'
              : 'Fill in the details to add a new candidate to the pipeline.'}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Name Row */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="firstName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>First Name *</FormLabel>
                    <FormControl>
                      <Input placeholder="John" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="lastName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Last Name *</FormLabel>
                    <FormControl>
                      <Input placeholder="Doe" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Contact Row */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="john@example.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone</FormLabel>
                    <FormControl>
                      <Input placeholder="+91 98765 43210" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Title & Location */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Job Title</FormLabel>
                    <FormControl>
                      <Input placeholder="Senior Software Engineer" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="location"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Location</FormLabel>
                    <FormControl>
                      <Input placeholder="Bangalore, India" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Experience & Company */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="experience"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Experience (years)</FormLabel>
                    <FormControl>
                      <Input type="number" min="0" max="50" placeholder="0" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="currentCompany"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Current Company</FormLabel>
                    <FormControl>
                      <Input placeholder="Acme Inc." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* CTC Row */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="currentCTC"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Current CTC (INR LPA)</FormLabel>
                    <FormControl>
                      <Input type="number" min="0" step="0.1" placeholder="0" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="expectedCTC"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Expected CTC (INR LPA)</FormLabel>
                    <FormControl>
                      <Input type="number" min="0" step="0.1" placeholder="0" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Notice Period & Source */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="noticePeriod"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notice Period (days)</FormLabel>
                    <FormControl>
                      <Input type="number" min="0" max="365" placeholder="30" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="source"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Source</FormLabel>
                    <FormControl>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select source" />
                        </SelectTrigger>
                        <SelectContent>
                          {SOURCE_OPTIONS.map((source) => (
                            <SelectItem key={source} value={source}>
                              {source}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Skills */}
            <FormField
              control={form.control}
              name="skills"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Skills</FormLabel>
                  <FormControl>
                    <Input placeholder="React, TypeScript, Node.js (comma separated)" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Job Selection */}
            <FormField
              control={form.control}
              name="jobId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Associated Job</FormLabel>
                  <FormControl>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a job opening" />
                      </SelectTrigger>
                      <SelectContent>
                        {jobsData?.map((job) => (
                          <SelectItem key={job.id} value={job.id}>
                            {job.title} — {job.client?.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Notes */}
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <Textarea
                      rows={3}
                      placeholder="Additional notes about this candidate..."
                      {...field}
                    />
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
                disabled={mutation.isPending}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={mutation.isPending}>
                {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isEditing ? 'Update Candidate' : 'Add Candidate'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
