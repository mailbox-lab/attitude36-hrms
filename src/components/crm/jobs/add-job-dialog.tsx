'use client'

import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogFooter,
} from '@/components/ui/dialog'
import { EnhancedDialogHeader } from '@/components/crm/enhanced-dialog-header'
import { Briefcase } from 'lucide-react'
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
import { Separator } from '@/components/ui/separator'
import { Loader2 } from 'lucide-react'

// ===== Types =====

type ClientOption = {
  id: string
  name: string
}

type EmployeeOption = {
  id: string
  name: string
}

type JobFormData = {
  title: string
  clientId: string
  recruiterId: string
  department: string
  location: string
  employmentType: string
  salaryMin: string
  salaryMax: string
  currency: string
  description: string
  requirements: string
  status: string
  priority: string
  openings: string
}

type EditJobData = {
  id: string
  title: string
  clientId: string
  recruiterId: string | null
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
  client: { id: string; name: string }
  recruiter: { id: string; name: string } | null
}

type AddJobDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  editJob?: EditJobData | null
}

// ===== Schema =====

const jobSchema = z.object({
  title: z.string().min(1, 'Job title is required'),
  clientId: z.string().min(1, 'Client is required'),
  recruiterId: z.string().default(''),
  department: z.string().default(''),
  location: z.string().default(''),
  employmentType: z.string().default('Full-Time'),
  salaryMin: z.string().default(''),
  salaryMax: z.string().default(''),
  currency: z.string().default('INR'),
  description: z.string().default(''),
  requirements: z.string().default(''),
  status: z.string().default('Open'),
  priority: z.string().default('Medium'),
  openings: z.string().default('1'),
})

// ===== Options =====

const EMPLOYMENT_TYPES = [
  'Full-Time',
  'Part-Time',
  'Contract',
  'Internship',
  'Freelance',
]

const CURRENCIES = ['INR', 'USD', 'EUR', 'GBP', 'SGD', 'AED']

const STATUS_OPTIONS = ['Open', 'Closed', 'Paused', 'Filled', 'Cancelled']

const PRIORITY_OPTIONS = ['Low', 'Medium', 'High', 'Urgent']

// ===== Default Values =====

const DEFAULT_VALUES: JobFormData = {
  title: '',
  clientId: '',
  recruiterId: '',
  department: '',
  location: '',
  employmentType: 'Full-Time',
  salaryMin: '',
  salaryMax: '',
  currency: 'INR',
  description: '',
  requirements: '',
  status: 'Open',
  priority: 'Medium',
  openings: '1',
}

// ===== Component =====

export function AddJobDialog({ open, onOpenChange, editJob }: AddJobDialogProps) {
  const queryClient = useQueryClient()

  const form = useForm<JobFormData>({
    resolver: zodResolver(jobSchema),
    defaultValues: DEFAULT_VALUES,
  })

  // Fetch active clients for select
  const { data: clientsData } = useQuery<{ data: ClientOption[] }>({
    queryKey: ['clients-select'],
    queryFn: async () => {
      const res = await fetch('/api/clients?status=Active')
      if (!res.ok) throw new Error('Failed to fetch clients')
      return res.json()
    },
    enabled: open,
  })

  // Fetch employees for recruiter select
  const { data: employeesData } = useQuery<{ data: EmployeeOption[] }>({
    queryKey: ['employees-select'],
    queryFn: async () => {
      const res = await fetch('/api/employees')
      if (!res.ok) throw new Error('Failed to fetch employees')
      return res.json()
    },
    enabled: open,
  })

  const clients = clientsData?.data || []
  const employees = employeesData?.data || []

  // Populate form when editing
  useEffect(() => {
    if (editJob && open) {
      form.reset({
        title: editJob.title || '',
        clientId: editJob.client?.id || editJob.clientId || '',
        recruiterId: editJob.recruiter?.id || editJob.recruiterId || '',
        department: editJob.department || '',
        location: editJob.location || '',
        employmentType: editJob.employmentType || 'Full-Time',
        salaryMin: editJob.salaryMin ? String(editJob.salaryMin) : '',
        salaryMax: editJob.salaryMax ? String(editJob.salaryMax) : '',
        currency: editJob.currency || 'INR',
        description: editJob.description || '',
        requirements: editJob.requirements || '',
        status: editJob.status || 'Open',
        priority: editJob.priority || 'Medium',
        openings: String(editJob.openings || 1),
      })
    } else if (!editJob && open) {
      form.reset(DEFAULT_VALUES)
    }
  }, [editJob, open, form])

  const isEditing = !!editJob

  const mutation = useMutation({
    mutationFn: async (data: JobFormData) => {
      const payload = {
        ...data,
        recruiterId: data.recruiterId || null,
        department: data.department || null,
        location: data.location || null,
        salaryMin: data.salaryMin ? parseFloat(data.salaryMin) : null,
        salaryMax: data.salaryMax ? parseFloat(data.salaryMax) : null,
        description: data.description || null,
        requirements: data.requirements || null,
        openings: parseInt(data.openings) || 1,
      }
      if (isEditing) {
        const res = await fetch(`/api/jobs/${editJob.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
        if (!res.ok) throw new Error('Failed to update job')
        return res.json()
      } else {
        const res = await fetch('/api/jobs', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
        if (!res.ok) throw new Error('Failed to create job')
        return res.json()
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['jobs'] })
      queryClient.invalidateQueries({ queryKey: ['job'] })
      toast.success(isEditing ? 'Job updated successfully' : 'Job added successfully')
      onOpenChange(false)
      form.reset(DEFAULT_VALUES)
    },
    onError: () => {
      toast.error(isEditing ? 'Failed to update job' : 'Failed to add job')
    },
  })

  function onSubmit(data: JobFormData) {
    mutation.mutate(data)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl max-w-[calc(100vw-1.5rem)]">
        <EnhancedDialogHeader
          icon={Briefcase}
          title={isEditing ? 'Edit Job Opening' : 'Add New Job Opening'}
          description={
            isEditing
              ? 'Update the job opening details below.'
              : 'Fill in the details to create a new job opening.'
          }
          iconColor="text-amber-600 dark:text-amber-400"
        />

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Title & Client */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Job Title *</FormLabel>
                    <FormControl>
                      <Input placeholder="Senior React Developer" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="clientId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Client *</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select client" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {clients.map((client) => (
                          <SelectItem key={client.id} value={client.id}>
                            {client.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Recruiter & Department */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="recruiterId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Assigned Recruiter</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select recruiter" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {employees.map((emp) => (
                          <SelectItem key={emp.id} value={emp.id}>
                            {emp.name}
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
                name="department"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Department</FormLabel>
                    <FormControl>
                      <Input placeholder="Engineering" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Location & Employment Type */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
              <FormField
                control={form.control}
                name="employmentType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Employment Type</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {EMPLOYMENT_TYPES.map((type) => (
                          <SelectItem key={type} value={type}>
                            {type}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <Separator />

            {/* Salary Section */}
            <div className="space-y-4">
              <h4 className="text-sm font-medium text-muted-foreground">Compensation</h4>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                <FormField
                  control={form.control}
                  name="salaryMin"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Min Salary</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="800000" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="salaryMax"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Max Salary</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="1200000" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="currency"
                  render={({ field }) => (
                    <FormItem className="col-span-2 sm:col-span-1">
                      <FormLabel>Currency</FormLabel>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Currency" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {CURRENCIES.map((c) => (
                            <SelectItem key={c} value={c}>
                              {c}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <Separator />

            {/* Description */}
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Job Description</FormLabel>
                  <FormControl>
                    <Textarea
                      rows={3}
                      placeholder="Describe the role, responsibilities, and what the ideal candidate would do..."
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Requirements */}
            <FormField
              control={form.control}
              name="requirements"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Requirements</FormLabel>
                  <FormControl>
                    <Textarea
                      rows={3}
                      placeholder="List the required skills, experience, and qualifications..."
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Separator />

            {/* Status, Priority, Openings */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {STATUS_OPTIONS.map((status) => (
                          <SelectItem key={status} value={status}>
                            {status}
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
                name="priority"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Priority</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Priority" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {PRIORITY_OPTIONS.map((p) => (
                          <SelectItem key={p} value={p}>
                            {p}
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
                name="openings"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Openings</FormLabel>
                    <FormControl>
                      <Input type="number" min="1" placeholder="1" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

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
                {isEditing ? 'Update Job' : 'Add Job'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
