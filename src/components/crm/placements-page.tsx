'use client'

import { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm, Controller } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { motion, AnimatePresence } from 'framer-motion'
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
  DialogFooter,
} from '@/components/ui/dialog'
import { EnhancedDialogHeader } from '@/components/crm/enhanced-dialog-header'
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from '@/components/ui/form'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Plus,
  Award,
  MoreHorizontal,
  Trash2,
  Loader2,
  IndianRupee,
  TrendingUp,
  DollarSign,
  CheckCircle2,
  Download,
  ChevronsUpDown,
  Search,
} from 'lucide-react'
import { cn } from '@/lib/utils'

// ===== Types =====

type Placement = {
  id: string
  candidateId: string
  candidate: { id: string; firstName: string; lastName: string; email?: string; phone?: string }
  jobId: string | null
  job: { id: string; title: string } | null
  clientId: string | null
  client: { id: string; name: string; industry?: string } | null
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
  Offered: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400',
  Accepted: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-950 dark:text-cyan-400',
  Joined: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400',
  'Backed-Out': 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400',
}

const STATUS_BORDER_COLORS: Record<string, string> = {
  Offered: 'border-l-amber-500',
  Accepted: 'border-l-cyan-500',
  Joined: 'border-l-emerald-500',
  'Backed-Out': 'border-l-red-500',
}

const PIPELINE_COLORS: Record<string, string> = {
  Offered: 'bg-amber-500',
  Accepted: 'bg-cyan-500',
  Joined: 'bg-emerald-500',
  'Backed-Out': 'bg-red-500',
}

const PIPELINE_TEXT_COLORS: Record<string, string> = {
  Offered: 'text-amber-700 dark:text-amber-400',
  Accepted: 'text-cyan-700 dark:text-cyan-400',
  Joined: 'text-emerald-700 dark:text-emerald-400',
  'Backed-Out': 'text-red-700 dark:text-red-400',
}

const COMMISSION_RATE = 8.33

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

function formatCompactCurrency(amount: number) {
  if (amount >= 10000000) {
    return `₹${(amount / 10000000).toFixed(2)} Cr`
  }
  if (amount >= 100000) {
    return `₹${(amount / 100000).toFixed(1)} L`
  }
  if (amount >= 1000) {
    return `₹${(amount / 1000).toFixed(1)}K`
  }
  return `₹${amount.toFixed(0)}`
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

function getInitials(firstName: string, lastName: string) {
  return `${(firstName?.[0] || '').toUpperCase()}${(lastName?.[0] || '').toUpperCase()}`
}

function exportToCSV(placements: Placement[]) {
  const headers = ['Candidate', 'Client', 'Job Title', 'Recruiter', 'Offered CTC', 'Joined Date', 'Status', 'Commission']
  const rows = placements.map((p) => [
    `${p.candidate.firstName} ${p.candidate.lastName}`,
    p.client?.name || 'N/A',
    p.job?.title || 'N/A',
    p.recruiter?.name || 'N/A',
    p.offeredCTC ?? '',
    p.joinedDate ? formatDate(p.joinedDate) : '',
    p.status,
    p.commission ?? '',
  ])
  const csv = [headers, ...rows].map((row) => row.map((cell) => `"${cell}"`).join(',')).join('\n')
  const blob = new Blob([csv], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `placements-${new Date().toISOString().split('T')[0]}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

// ===== Animation Variants =====

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08 },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } },
}

// ===== Searchable Select Component =====

function SearchableSelect({
  options,
  value,
  onChange,
  placeholder,
  emptyMessage = 'No results found.',
}: {
  options: { id: string; label: string }[]
  value: string
  onChange: (value: string) => void
  placeholder: string
  emptyMessage?: string
}) {
  const [open, setOpen] = useState(false)
  const selected = options.find((o) => o.id === value)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between text-left font-normal"
        >
          {selected ? selected.label : placeholder}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0" align="start">
        <Command>
          <CommandInput placeholder={placeholder} />
          <CommandList>
            <CommandEmpty>{emptyMessage}</CommandEmpty>
            <CommandGroup>
              {options.map((option) => (
                <CommandItem
                  key={option.id}
                  value={option.label}
                  onSelect={() => {
                    onChange(option.id)
                    setOpen(false)
                  }}
                >
                  <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
                  <span>{option.label}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}

// ===== Revenue Overview Card =====

function RevenueCard({
  label,
  value,
  icon: Icon,
  gradient,
  index,
}: {
  label: string
  value: string
  icon: React.ElementType
  gradient: string
  index: number
}) {
  return (
    <motion.div variants={itemVariants}>
      <Card className={cn('rounded-xl border-0 shadow-sm', gradient)}>
        <CardContent className="p-5">
          <div className="flex items-center gap-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white/20">
              <Icon className="h-5 w-5 text-white" />
            </div>
            <div className="min-w-0">
              <p className="truncate text-2xl font-bold text-white">{value}</p>
              <p className="text-sm font-medium text-white/80">{label}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

// ===== Status Pipeline =====

function StatusPipeline({ placements }: { placements: Placement[] }) {
  const pipelineData = useMemo(() => {
    const total = placements.length || 1
    return ['Offered', 'Accepted', 'Joined', 'Backed-Out'].map((status) => {
      const count = placements.filter((p) => p.status === status).length
      return {
        status,
        count,
        percentage: Math.round((count / total) * 100),
      }
    })
  }, [placements])

  const hasData = placements.length > 0

  return (
    <motion.div variants={itemVariants}>
      <Card className="rounded-xl">
        <CardContent className="p-5">
          <h3 className="mb-3 text-sm font-semibold text-muted-foreground">Status Pipeline</h3>
          {hasData ? (
            <>
              <div className="flex h-10 overflow-hidden rounded-lg">
                {pipelineData.map((item) => (
                  <motion.div
                    key={item.status}
                    initial={{ width: 0 }}
                    animate={{ width: `${item.percentage}%` }}
                    transition={{ duration: 0.6, ease: 'easeOut', delay: 0.2 }}
                    className={cn(
                      'relative flex items-center justify-center overflow-hidden',
                      PIPELINE_COLORS[item.status],
                      item.percentage < 8 && 'min-w-[2rem]'
                    )}
                  >
                    {item.percentage >= 10 && (
                      <span className="text-xs font-bold text-white drop-shadow-sm">
                        {item.count}
                      </span>
                    )}
                  </motion.div>
                ))}
              </div>
              <div className="mt-2.5 flex">
                {pipelineData.map((item) => (
                  <div
                    key={item.status}
                    className="flex flex-col items-center"
                    style={{ width: `${item.percentage}%`, minWidth: item.percentage < 8 ? '2.5rem' : undefined }}
                  >
                    <span className={cn('text-xs font-semibold', PIPELINE_TEXT_COLORS[item.status])}>
                      {item.status}
                    </span>
                    <span className="text-[10px] text-muted-foreground">{item.percentage}%</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="flex h-10 items-center justify-center rounded-lg bg-muted/50">
              <span className="text-xs text-muted-foreground">No data yet</span>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  )
}

// ===== Empty State =====

function EmptyState({ isFiltered }: { isFiltered: boolean }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4 }}
    >
      <Card className="rounded-xl border-dashed">
        <CardContent className="flex flex-col items-center gap-4 py-16">
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.15, type: 'spring', stiffness: 200 }}
            className="flex h-20 w-20 items-center justify-center rounded-full bg-amber-50 dark:bg-amber-950/50"
          >
            <Award className="h-10 w-10 text-amber-500" />
          </motion.div>
          <div className="text-center">
            <h3 className="text-lg font-semibold text-foreground">No Placements Yet</h3>
            <p className="mt-1 max-w-sm text-sm text-muted-foreground">
              {isFiltered
                ? 'No placements match the selected filter. Try adjusting your criteria.'
                : 'Start tracking your successful placements here. Record candidate offers and commissions.'}
            </p>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
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

  const offeredCTC = form.watch('offeredCTC')
  const calculatedCommission = offeredCTC ? Math.round((offeredCTC * COMMISSION_RATE) / 100) : 0

  function onSubmit(data: PlacementFormData) {
    mutation.mutate(data)
  }

  const candidateOptions = (candidates?.data || []).map((c) => ({
    id: c.id,
    label: `${c.firstName} ${c.lastName}`,
  }))

  const jobOptions = (jobs?.data || []).map((j) => ({
    id: j.id,
    label: j.title,
  }))

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <EnhancedDialogHeader
          icon={Award}
          title="Add Placement"
          description="Record a new placement for a hired candidate."
          iconColor="text-rose-600 dark:text-rose-400"
        />
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="candidateId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Candidate *</FormLabel>
                  <SearchableSelect
                    options={candidateOptions}
                    value={field.value}
                    onChange={field.onChange}
                    placeholder="Search and select candidate..."
                    emptyMessage="No hired candidates found."
                  />
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
                    <SearchableSelect
                      options={jobOptions}
                      value={field.value || ''}
                      onChange={field.onChange}
                      placeholder="Search job..."
                      emptyMessage="No jobs found."
                    />
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
                    <div className="relative">
                      <Input
                        type="number"
                        min={0}
                        placeholder="e.g. 50000"
                        {...field}
                        value={field.value ?? ''}
                      />
                      {offeredCTC && offeredCTC > 0 && (
                        <button
                          type="button"
                          className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md bg-emerald-100 px-2 py-1 text-[10px] font-semibold text-emerald-700 hover:bg-emerald-200 dark:bg-emerald-900/50 dark:text-emerald-400 dark:hover:bg-emerald-900/70"
                          onClick={() => field.onChange(calculatedCommission)}
                          title={`Auto-calculate: ${COMMISSION_RATE}% of CTC (1 month salary)`}
                        >
                          {formatCompactCurrency(calculatedCommission)}
                        </button>
                      )}
                    </div>
                  </FormControl>
                  <p className="text-[10px] text-muted-foreground">
                    Tip: Click the badge to auto-fill {COMMISSION_RATE}% of CTC (≈ 1 month salary)
                  </p>
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

  // ===== Computed Revenue Stats =====
  const totalRevenue = useMemo(
    () => placements.reduce((sum, p) => sum + (p.commission || 0), 0),
    [placements]
  )

  const thisMonthRevenue = useMemo(() => {
    const now = new Date()
    const thisMonth = now.getMonth()
    const thisYear = now.getFullYear()
    return placements.reduce((sum, p) => {
      const date = new Date(p.createdAt)
      if (date.getMonth() === thisMonth && date.getFullYear() === thisYear) {
        return sum + (p.commission || 0)
      }
      return sum
    }, 0)
  }, [placements])

  const averagePackage = useMemo(() => {
    const withCTC = placements.filter((p) => p.offeredCTC != null && p.offeredCTC > 0)
    if (withCTC.length === 0) return 0
    return withCTC.reduce((sum, p) => sum + (p.offeredCTC || 0), 0) / withCTC.length
  }, [placements])

  const completionRate = useMemo(() => {
    if (placements.length === 0) return 0
    const joined = placements.filter((p) => p.status === 'Joined').length
    return Math.round((joined / placements.length) * 100)
  }, [placements])

  // All placements (unfiltered) for pipeline - we use current view data
  const pipelinePlacements = placements

  return (
    <motion.div
      className="flex flex-1 flex-col gap-6 p-4 md:p-6"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
    >
      {/* Header */}
      <div className="space-y-3">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 dark:bg-amber-950">
              <Award className="h-5 w-5 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Placements</h1>
              <p className="mt-1 text-sm text-muted-foreground">Track candidate placements and commissions</p>
            </div>
          </div>
          <div className="flex gap-2">
            {placements.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => exportToCSV(placements)}
              >
                <Download className="mr-2 h-4 w-4" />
                Export CSV
              </Button>
            )}
            <Button onClick={() => setAddDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add Placement
            </Button>
          </div>
        </div>
        <div className="h-1 w-16 rounded-full bg-gradient-to-r from-amber-400 to-yellow-400" />
        {data && (
          <p className="text-sm text-muted-foreground">
            {placements.length} total
          </p>
        )}
      </div>

      {/* Revenue Overview Cards */}
      <motion.div
        className="grid grid-cols-2 gap-4 lg:grid-cols-4"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <RevenueCard
          label="Total Revenue"
          value={formatCompactCurrency(totalRevenue)}
          icon={IndianRupee}
          gradient="bg-gradient-to-br from-emerald-500 to-emerald-600"
          index={0}
        />
        <RevenueCard
          label="This Month Revenue"
          value={formatCompactCurrency(thisMonthRevenue)}
          icon={TrendingUp}
          gradient="bg-gradient-to-br from-amber-500 to-amber-600"
          index={1}
        />
        <RevenueCard
          label="Average Package"
          value={averagePackage > 0 ? formatCompactCurrency(averagePackage) : '—'}
          icon={DollarSign}
          gradient="bg-gradient-to-br from-violet-500 to-violet-600"
          index={2}
        />
        <RevenueCard
          label="Completion Rate"
          value={`${completionRate}%`}
          icon={CheckCircle2}
          gradient="bg-gradient-to-br from-rose-500 to-rose-600"
          index={3}
        />
      </motion.div>

      {/* Status Pipeline */}
      <StatusPipeline placements={pipelinePlacements} />

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.3 }}
      >
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
      </motion.div>

      {/* Table / Empty State */}
      {isLoading ? (
        <Card className="rounded-xl">
          <CardContent className="p-6">
            <div className="flex items-center justify-center gap-3">
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              <p className="text-sm text-muted-foreground">Loading placements...</p>
            </div>
          </CardContent>
        </Card>
      ) : error ? (
        <Card className="rounded-xl">
          <CardContent className="p-6">
            <p className="text-center text-sm text-destructive">
              Failed to load placements. Please try again.
            </p>
          </CardContent>
        </Card>
      ) : placements.length === 0 ? (
        <EmptyState isFiltered={statusFilter !== 'All'} />
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35, duration: 0.35 }}
        >
          <Card className="rounded-xl">
            <div className="max-h-[28rem] overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="text-xs">Candidate</TableHead>
                    <TableHead className="hidden text-xs sm:table-cell">Client / Company</TableHead>
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
                  <AnimatePresence>
                    {placements.map((placement) => (
                      <motion.tr
                        key={placement.id}
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 8 }}
                        transition={{ duration: 0.2 }}
                        className={cn(
                          'border-l-4 hover:bg-muted/50',
                          STATUS_BORDER_COLORS[placement.status] || 'border-l-gray-300'
                        )}
                      >
                        <TableCell>
                          <div className="flex items-center gap-2.5">
                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 text-[11px] font-bold text-white">
                              {getInitials(placement.candidate.firstName, placement.candidate.lastName)}
                            </div>
                            <span className="truncate text-sm font-medium">
                              {placement.candidate.firstName} {placement.candidate.lastName}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="hidden max-w-[150px] truncate text-xs sm:table-cell">
                          {placement.client?.name || 'N/A'}
                        </TableCell>
                        <TableCell className="hidden max-w-[150px] truncate text-xs md:table-cell">
                          {placement.job?.title || 'N/A'}
                        </TableCell>
                        <TableCell className="hidden text-xs lg:table-cell">
                          {placement.recruiter?.name || 'N/A'}
                        </TableCell>
                        <TableCell className="text-xs font-medium">
                          {formatCurrency(placement.offeredCTC)}
                        </TableCell>
                        <TableCell className="hidden text-xs md:table-cell">
                          {formatDate(placement.joinedDate)}
                        </TableCell>
                        <TableCell>
                          <Badge
                            className={cn('text-[10px]', STATUS_COLORS[placement.status] || '')}
                          >
                            {placement.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="hidden text-xs font-semibold text-emerald-600 dark:text-emerald-400 sm:table-cell">
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
                      </motion.tr>
                    ))}
                  </AnimatePresence>
                </TableBody>
              </Table>
            </div>
          </Card>
        </motion.div>
      )}

      {/* Add Dialog */}
      <AddPlacementDialog
        open={addDialogOpen}
        onOpenChange={setAddDialogOpen}
      />
    </motion.div>
  )
}
