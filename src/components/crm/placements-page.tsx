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
  Plus,
  Trophy,
  MoreHorizontal,
  Pencil,
  Trash2,
  Loader2,
  IndianRupee,
  Users,
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

// ===== Types =====

type Placement = {
  id: string
  candidateId: string
  candidate: { id: string; firstName: string; lastName: string }
  jobId: string | null
  job: { id: string; title: string } | null
  clientId: string | null
  client: { id: string; name: string } | null
  recruiterId: string | null
  recruiter: { id: string; name: string } | null
  offeredCTC: number | null
  joinedDate: string | null
  status: string
  commission: number | null
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

type ClientOption = {
  id: string
  name: string
}

type EmployeeOption = {
  id: string
  name: string
}

// ===== Constants =====

const STATUS_OPTIONS = ['All', 'Offered', 'Accepted', 'Joined', 'Backed-Out']
const PLACEMENT_STATUSES = ['Offered', 'Accepted', 'Joined', 'Backed-Out']

const STATUS_COLORS: Record<string, string> = {
  Offered: 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400',
  Accepted: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400',
  Joined: 'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400',
  'Backed-Out': 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400',
}

const STATUS_BORDER_COLORS: Record<string, string> = {
  Offered: 'border-l-blue-500',
  Accepted: 'border-l-amber-500',
  Joined: 'border-l-green-500',
  'Backed-Out': 'border-l-red-500',
}

// ===== Schema =====

const placementSchema = z.object({
  candidateId: z.string().min(1, 'Candidate is required'),
  jobId: z.string().optional(),
  clientId: z.string().optional(),
  recruiterId: z.string().optional(),
  offeredCTC: z.coerce.number().min(0, 'CTC must be positive').optional(),
  joinedDate: z.string().optional(),
  status: z.string().min(1, 'Status is required'),
  commission: z.coerce.number().min(0, 'Commission must be positive').optional(),
})

type PlacementFormData = z.infer<typeof placementSchema>

// ===== Helpers =====

function formatCurrency(amount: number | null | undefined) {
  if (amount == null) return '—'
  if (amount >= 100000) {
    return `₹${(amount / 100000).toFixed(2)} LPA`
  }
  return `₹${amount.toLocaleString('en-IN')}`
}

function formatDate(dateStr: string | null) {
  if (!dateStr) return '—'
  const date = new Date(dateStr)
  return date.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

// ===== Add Placement Dialog =====

function AddPlacementDialog({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const queryClient = useQueryClient()

  const form = useForm<PlacementFormData>({
    resolver: zodResolver(placementSchema),
    defaultValues: {
      candidateId: '',
      jobId: '',
      clientId: '',
      recruiterId: '',
      offeredCTC: undefined,
      joinedDate: '',
      status: 'Offered',
      commission: undefined,
    },
  })

  const { data: candidates } = useQuery<{ data: CandidateOption[] }>({
    queryKey: ['candidates-hired'],
    queryFn: async () => {
      const res = await fetch('/api/candidates?status=Hired')
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

  const { data: clients } = useQuery<{ data: ClientOption[] }>({
    queryKey: ['clients-list'],
    queryFn: async () => {
      const res = await fetch('/api/clients')
      if (!res.ok) throw new Error('Failed to fetch clients')
      return res.json()
    },
    enabled: open,
  })

  const { data: employees } = useQuery<{ data: EmployeeOption[] }>({
    queryKey: ['employees-list'],
    queryFn: async () => {
      const res = await fetch('/api/employees')
      if (!res.ok) throw new Error('Failed to fetch employees')
      return res.json()
    },
    enabled: open,
  })

  const mutation = useMutation({
    mutationFn: async (data: PlacementFormData) => {
      const res = await fetch('/api/placements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) throw new Error('Failed to add placement')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['placements'] })
      toast.success('Placement added successfully')
      onOpenChange(false)
      form.reset()
    },
    onError: () => {
      toast.error('Failed to add placement')
    },
  })

  function onSubmit(data: PlacementFormData) {
    mutation.mutate(data)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Add Placement</DialogTitle>
          <DialogDescription>
            Record a new placement for a hired candidate.
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
                        <SelectValue placeholder="Select hired candidate" />
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

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="jobId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Job Opening</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value || ''}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select job" />
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
                name="clientId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Client</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value || ''}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select client" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {(clients?.data || []).map((c) => (
                          <SelectItem key={c.id} value={c.id}>
                            {c.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="recruiterId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Recruiter</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value || ''}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select recruiter" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {(employees?.data || []).map((e) => (
                        <SelectItem key={e.id} value={e.id}>
                          {e.name}
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
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Status *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {PLACEMENT_STATUSES.map((s) => (
                        <SelectItem key={s} value={s}>
                          {s}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="offeredCTC"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Offered CTC (₹)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={0}
                        placeholder="e.g. 1200000"
                        {...field}
                        value={field.value ?? ''}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="joinedDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Joined Date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} value={field.value || ''} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="commission"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Commission (₹)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min={0}
                      placeholder="e.g. 50000"
                      {...field}
                      value={field.value ?? ''}
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
              >
                Cancel
              </Button>
              <Button type="submit" disabled={mutation.isPending}>
                {mutation.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Add Placement
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

// ===== Main Component =====

export function PlacementsPage() {
  const queryClient = useQueryClient()
  const [statusFilter, setStatusFilter] = useState('All')
  const [addDialogOpen, setAddDialogOpen] = useState(false)

  const { data, isLoading, error } = useQuery<{ data: Placement[] }>({
    queryKey: ['placements', statusFilter],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (statusFilter !== 'All') params.set('status', statusFilter)
      const res = await fetch(`/api/placements?${params.toString()}`)
      if (!res.ok) throw new Error('Failed to fetch placements')
      return res.json()
    },
  })

  const placements = data?.data || []

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/placements/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to delete placement')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['placements'] })
      toast.success('Placement deleted successfully')
    },
    onError: () => {
      toast.error('Failed to delete placement')
    },
  })

  // Summary stats
  const totalCommission = placements.reduce((sum, p) => sum + (p.commission || 0), 0)
  const joinedCount = placements.filter((p) => p.status === 'Joined').length

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Placements</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Track candidate placements and commissions
            {data && (
              <span className="ml-1 font-medium text-foreground">
                ({placements.length} total)
              </span>
            )}
          </p>
        </div>
        <Button onClick={() => setAddDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Placement
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100/50 border-blue-200 dark:from-blue-950/40 dark:to-blue-900/20 dark:border-blue-900">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-200 dark:bg-blue-800">
                <Trophy className="h-5 w-5 text-blue-700 dark:text-blue-300" />
              </div>
              <div>
                <p className="text-2xl font-bold">{placements.length}</p>
                <p className="text-xs text-blue-600 dark:text-blue-400">Total Placements</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-green-50 to-green-100/50 border-green-200 dark:from-green-950/40 dark:to-green-900/20 dark:border-green-900">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-200 dark:bg-green-800">
                <Users className="h-5 w-5 text-green-700 dark:text-green-300" />
              </div>
              <div>
                <p className="text-2xl font-bold">{joinedCount}</p>
                <p className="text-xs text-green-600 dark:text-green-400">Joined</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-amber-50 to-amber-100/50 border-amber-200 dark:from-amber-950/40 dark:to-amber-900/20 dark:border-amber-900">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-200 dark:bg-amber-800">
                <IndianRupee className="h-5 w-5 text-amber-700 dark:text-amber-300" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {totalCommission > 0
                    ? `₹${(totalCommission / 1000).toFixed(1)}K`
                    : '₹0'}
                </p>
                <p className="text-xs text-amber-600 dark:text-amber-400">Total Commission</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-emerald-50 to-emerald-100/50 border-emerald-200 dark:from-emerald-950/40 dark:to-emerald-900/20 dark:border-emerald-900">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-200 dark:bg-emerald-800">
                <Trophy className="h-5 w-5 text-emerald-700 dark:text-emerald-300" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {placements.length > 0
                    ? `${((joinedCount / placements.length) * 100).toFixed(0)}%`
                    : '0%'}
                </p>
                <p className="text-xs text-emerald-600 dark:text-emerald-400">Success Rate</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="rounded-lg bg-muted/50 p-2">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-[180px]">
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
        </div>
      </div>

      {/* Table */}
      {isLoading ? (
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-center gap-3">
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              <p className="text-sm text-muted-foreground">Loading placements...</p>
            </div>
          </CardContent>
        </Card>
      ) : error ? (
        <Card>
          <CardContent className="p-6">
            <p className="text-center text-sm text-destructive">
              Failed to load placements. Please try again.
            </p>
          </CardContent>
        </Card>
      ) : placements.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-12">
            <Trophy className="h-10 w-10 text-muted-foreground/40" />
            <p className="text-sm font-medium text-muted-foreground">No placements found</p>
            <p className="text-xs text-muted-foreground/70">
              {statusFilter !== 'All'
                ? 'Try adjusting your filters'
                : 'Click "Add Placement" to get started'}
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
                  <TableHead className="hidden text-xs sm:table-cell">Client</TableHead>
                  <TableHead className="hidden text-xs md:table-cell">Job Title</TableHead>
                  <TableHead className="hidden text-xs lg:table-cell">Recruiter</TableHead>
                  <TableHead className="text-xs">Offered CTC</TableHead>
                  <TableHead className="hidden text-xs md:table-cell">Joined Date</TableHead>
                  <TableHead className="text-xs">Status</TableHead>
                  <TableHead className="hidden text-xs sm:table-cell">Commission</TableHead>
                  <TableHead className="w-12 text-xs">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {placements.map((placement, idx) => (
                  <TableRow key={placement.id} className={`border-l-4 ${STATUS_BORDER_COLORS[placement.status] || 'border-l-gray-300'} ${idx % 2 === 1 ? 'bg-muted/30' : ''}`}>
                    <TableCell>
                      <span className="truncate text-sm font-medium">
                        {placement.candidate.firstName} {placement.candidate.lastName}
                      </span>
                    </TableCell>
                    <TableCell className="hidden max-w-[150px] truncate text-xs sm:table-cell">
                      {placement.client?.name || '—'}
                    </TableCell>
                    <TableCell className="hidden max-w-[150px] truncate text-xs md:table-cell">
                      {placement.job?.title || '—'}
                    </TableCell>
                    <TableCell className="hidden text-xs lg:table-cell">
                      {placement.recruiter?.name || '—'}
                    </TableCell>
                    <TableCell className="text-xs font-medium">
                      {formatCurrency(placement.offeredCTC)}
                    </TableCell>
                    <TableCell className="hidden text-xs md:table-cell">
                      {formatDate(placement.joinedDate)}
                    </TableCell>
                    <TableCell>
                      <Badge
                        className={`text-[10px] ${
                          STATUS_COLORS[placement.status] || ''
                        }`}
                      >
                        {placement.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="hidden text-xs font-medium text-emerald-600 dark:text-emerald-400 sm:table-cell">
                      {formatCurrency(placement.commission)}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            className="text-destructive focus:text-destructive"
                            onClick={() => deleteMutation.mutate(placement.id)}
                          >
                            <Trash2 className="mr-2 h-3.5 w-3.5" />
                            Delete
                          </DropdownMenuItem>
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

      {/* Add Dialog */}
      <AddPlacementDialog
        open={addDialogOpen}
        onOpenChange={setAddDialogOpen}
      />
    </div>
  )
}
