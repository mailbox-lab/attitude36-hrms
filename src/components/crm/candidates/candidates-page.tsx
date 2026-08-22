'use client'

import { useState, useMemo, useCallback } from 'react'
import { motion } from 'framer-motion'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useCRMStore } from '@/stores/crm-store'
import { CandidateDetail } from './candidate-detail'
import { AddCandidateDialog } from './add-candidate-dialog'
import { BulkActionsBar } from './bulk-actions-bar'
import { CandidateComparison } from './candidate-comparison'
import { CsvImportDialog } from './csv-import-dialog'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
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
  Plus,
  Search,
  LayoutList,
  Kanban,
  MoreHorizontal,
  Pencil,
  Trash2,
  Eye,
  Users,
  MapPin,
  Download,
  MessageSquare,
  Upload,
  CalendarDays,
  X,
  GripVertical,
} from 'lucide-react'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { exportToCSV } from '@/lib/export-csv'
import { toast } from 'sonner'
import { useMutation } from '@tanstack/react-query'

// ===== Types =====

type Candidate = {
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
  status: string
  jobId: string | null
  rating: number
  notes: string | null
  createdAt: string
  updatedAt: string
  job: { id: string; title: string } | null
}

// ===== Constants =====

const ALL_STATUSES = ['New', 'Screening', 'Interview', 'Offer', 'Hired', 'Rejected', 'On-Hold']

const STATUS_COLORS: Record<string, string> = {
  New: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400',
  Screening: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-950 dark:text-cyan-400',
  Interview: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400',
  Offer: 'bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-400',
  Hired: 'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400',
  Rejected: 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400',
  'On-Hold': 'bg-gray-100 text-gray-700 dark:bg-gray-950 dark:text-gray-400',
}

const STATUS_BORDER_COLORS: Record<string, string> = {
  New: 'border-l-emerald-500',
  Screening: 'border-l-cyan-500',
  Interview: 'border-l-amber-500',
  Offer: 'border-l-violet-500',
  Hired: 'border-l-green-500',
  Rejected: 'border-l-red-500',
  'On-Hold': 'border-l-gray-500',
}

const STATUS_DOT_COLORS: Record<string, string> = {
  New: 'bg-emerald-500',
  Screening: 'bg-cyan-500',
  Interview: 'bg-amber-500',
  Offer: 'bg-violet-500',
  Hired: 'bg-green-500',
  Rejected: 'bg-red-500',
  'On-Hold': 'bg-gray-500',
}

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

// ===== Helper =====

function getInitials(firstName: string, lastName: string) {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase()
}

function parseSkills(skills: string): string[] {
  return skills
    ? skills
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean)
        .slice(0, 4)
    : []
}

// ===== Kanban Candidate Card =====

function KanbanCard({
  candidate,
  onView,
  onEdit,
  isSelected,
  onToggleSelect,
}: {
  candidate: Candidate
  onView: () => void
  onEdit: () => void
  isSelected: boolean
  onToggleSelect: () => void
}) {
  const skills = parseSkills(candidate.skills)
  const initials = getInitials(candidate.firstName, candidate.lastName)

  function handleDragStart(e: React.DragEvent<HTMLDivElement>) {
    e.dataTransfer.setData('text/plain', candidate.id)
    e.dataTransfer.effectAllowed = 'move'
    e.currentTarget.classList.add('kanban-card-dragging')
  }

  function handleDragEnd(e: React.DragEvent<HTMLDivElement>) {
    e.currentTarget.classList.remove('kanban-card-dragging')
  }

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      className={`group relative cursor-grab active:cursor-grabbing rounded-lg border border-l-4 bg-card p-3.5 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md ${
        STATUS_BORDER_COLORS[candidate.status] || 'border-l-gray-500'
      } ${isSelected ? 'ring-2 ring-primary/50 bg-primary/5' : ''}`}
    >
      <div className="absolute left-2 top-2 z-10 opacity-0 transition-opacity group-hover:opacity-60">
        <GripVertical className="h-4 w-4 text-muted-foreground" />
      </div>
      <div className={`absolute right-2 top-2 z-10 transition-opacity ${isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
        <Checkbox
          checked={isSelected}
          onCheckedChange={(e) => {
            e.stopPropagation()
            onToggleSelect()
          }}
          aria-label={`Select ${candidate.firstName} ${candidate.lastName}`}
          onClick={(e) => e.stopPropagation()}
        />
      </div>
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <Avatar className="h-7 w-7 shrink-0 text-xs">
            <AvatarFallback className="bg-primary/10 text-primary text-[10px]">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <button
              onClick={onView}
              className="truncate text-sm font-medium leading-tight hover:underline"
            >
              {candidate.firstName} {candidate.lastName}
            </button>
            {candidate.title && (
              <p className="truncate text-[11px] text-muted-foreground">{candidate.title}</p>
            )}
          </div>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 shrink-0 opacity-0 transition-opacity group-hover:opacity-100"
            >
              <MoreHorizontal className="h-3.5 w-3.5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={onView}>
              <Eye className="mr-2 h-3.5 w-3.5" /> View Details
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onEdit}>
              <Pencil className="mr-2 h-3.5 w-3.5" /> Edit
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      {skills.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1">
          {skills.map((skill) => (
            <span
              key={skill}
              className="inline-flex items-center rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground"
            >
              {skill}
            </span>
          ))}
        </div>
      )}
      {(candidate.location || candidate.experience != null) && (
        <div className="mt-2 flex items-center gap-3 text-[10px] text-muted-foreground">
          {candidate.experience != null && (
            <span>{candidate.experience} yrs exp</span>
          )}
          {candidate.location && (
            <span className="flex items-center gap-0.5">
              <MapPin className="h-2.5 w-2.5" /> {candidate.location}
            </span>
          )}
        </div>
      )}
    </div>
  )
}

// ===== Kanban Column =====

function KanbanColumn({
  status,
  candidates,
  onViewCandidate,
  onEditCandidate,
  selectedIds,
  onToggleSelect,
  onDropCandidate,
}: {
  status: string
  candidates: Candidate[]
  onViewCandidate: (id: string) => void
  onEditCandidate: (candidate: Candidate) => void
  selectedIds: Set<string>
  onToggleSelect: (id: string) => void
  onDropCandidate: (candidateId: string, newStatus: string) => void
}) {
  function handleDragOver(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    e.currentTarget.classList.add('kanban-column-drag-over')
  }

  function handleDragLeave(e: React.DragEvent<HTMLDivElement>) {
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      e.currentTarget.classList.remove('kanban-column-drag-over')
    }
  }

  function handleDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault()
    const candidateId = e.dataTransfer.getData('text/plain')
    if (candidateId) {
      onDropCandidate(candidateId, status)
    }
    e.currentTarget.classList.remove('kanban-column-drag-over')
  }

  return (
    <div className="flex w-72 shrink-0 flex-col">
      <div className="mb-3 flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <div
            className={`h-2.5 w-2.5 rounded-full ${
              STATUS_COLORS[status]
                ?.replace(/bg-\w+-\d+/, 'bg-\$&')
                ?.split(' ')[0] || 'bg-gray-400'
            }`}
            style={{
              backgroundColor:
                status === 'New'
                  ? '#10b981'
                  : status === 'Screening'
                    ? '#3b82f6'
                    : status === 'Interview'
                      ? '#f59e0b'
                      : status === 'Offer'
                        ? '#8b5cf6'
                        : status === 'Hired'
                          ? '#22c55e'
                          : status === 'Rejected'
                            ? '#ef4444'
                            : '#6b7280',
            }}
          />
          <span className="text-sm font-semibold">{status}</span>
        </div>
        <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-primary/10 px-1.5 text-[10px] font-bold text-primary">
          {candidates.length}
        </span>
      </div>
      <div
        className="rounded-t-lg border-t-2 flex max-h-[calc(100vh-320px)] min-h-[120px] flex-col gap-2.5 overflow-y-auto rounded-b-lg bg-muted/30 p-2.5 transition-colors"
        style={{
          borderTopColor:
            status === 'New'
              ? '#10b981'
              : status === 'Screening'
                ? '#3b82f6'
                : status === 'Interview'
                  ? '#f59e0b'
                  : status === 'Offer'
                    ? '#8b5cf6'
                    : status === 'Hired'
                      ? '#22c55e'
                      : status === 'Rejected'
                        ? '#ef4444'
                        : '#6b7280',
        }}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {candidates.length === 0 ? (
          <div className="flex flex-1 items-center justify-center py-8">
            <p className="text-xs text-muted-foreground/60">No candidates</p>
          </div>
        ) : (
          candidates.map((c) => (
            <KanbanCard
              key={c.id}
              candidate={c}
              onView={() => onViewCandidate(c.id)}
              onEdit={() => onEditCandidate(c)}
              isSelected={selectedIds.has(c.id)}
              onToggleSelect={() => onToggleSelect(c.id)}
            />
          ))
        )}
      </div>
    </div>
  )
}

// ===== Main Component =====

export function CandidatesPage() {
  const navigate = useCRMStore((s) => s.navigate)
  const selectedId = useCRMStore((s) => s.selectedId)
  const candidateFilter = useCRMStore((s) => s.candidateFilter)
  const setCandidateFilter = useCRMStore((s) => s.setCandidateFilter)
  const queryClient = useQueryClient()

  // Date range helpers
  const todayStr = new Date().toISOString().split('T')[0]
  const getTodayRange = useCallback(() => ({ fromDate: todayStr, toDate: todayStr }), [todayStr])
  const getThisWeekRange = useCallback(() => {
    const now = new Date()
    const dayOfWeek = now.getDay()
    const monday = new Date(now)
    monday.setDate(now.getDate() - ((dayOfWeek + 6) % 7))
    const sunday = new Date(monday)
    sunday.setDate(monday.getDate() + 6)
    return { fromDate: monday.toISOString().split('T')[0], toDate: sunday.toISOString().split('T')[0] }
  }, [])
  const getThisMonthRange = useCallback(() => {
    const now = new Date()
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1)
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0)
    return { fromDate: firstDay.toISOString().split('T')[0], toDate: lastDay.toISOString().split('T')[0] }
  }, [])
  const hasDateFilter = !!(candidateFilter.fromDate && candidateFilter.toDate)

  const [addDialogOpen, setAddDialogOpen] = useState(false)
  const [importOpen, setImportOpen] = useState(false)
  const [editCandidate, setEditCandidate] = useState<Candidate | null>(null)
  const [activeTab, setActiveTab] = useState('list')
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [compareIds, setCompareIds] = useState<string[] | null>(null)

  const selectedIdsArray = useMemo(() => Array.from(selectedIds), [selectedIds])

  const toggleSelect = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }, [])

  const deselectAll = useCallback(() => {
    setSelectedIds(new Set())
  }, [])

  function handleBulkSuccess() {
    setSelectedIds(new Set())
    queryClient.invalidateQueries({ queryKey: ['candidates'] })
  }

  // Fetch candidates with filters
  const { data, isLoading, error } = useQuery<{
    data: Candidate[]
    pagination: { page: number; limit: number; total: number; totalPages: number }
  }>({
    queryKey: ['candidates', candidateFilter],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (candidateFilter.search) params.set('search', candidateFilter.search)
      if (candidateFilter.status && candidateFilter.status !== 'All')
        params.set('status', candidateFilter.status)
      if (candidateFilter.source && candidateFilter.source !== 'All')
        params.set('source', candidateFilter.source)
      if (candidateFilter.fromDate) params.set('fromDate', candidateFilter.fromDate)
      if (candidateFilter.toDate) params.set('toDate', candidateFilter.toDate)
      const res = await fetch(`/api/candidates?${params.toString()}`)
      if (!res.ok) throw new Error('Failed to fetch candidates')
      return res.json()
    },
  })

  const candidates = data?.data || []

  const selectAll = useCallback(() => {
    setSelectedIds(new Set(candidates.map((c) => c.id)))
  }, [candidates])

  const isAllSelected = candidates.length > 0 && candidates.every((c) => selectedIds.has(c.id))
  const isSomeSelected = !isAllSelected && candidates.some((c) => selectedIds.has(c.id))

  // Quick status change mutation
  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const res = await fetch(`/api/candidates/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })
      if (!res.ok) throw new Error('Failed to update status')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['candidates'] })
      toast.success('Candidate status updated')
    },
    onError: () => {
      toast.error('Failed to update candidate status')
    },
  })

  // Drag-and-drop status change mutation
  const dropStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const res = await fetch(`/api/candidates/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })
      if (!res.ok) throw new Error('Failed to update status')
      return res.json()
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['candidates'] })
      const candidate = candidates.find((c) => c.id === variables.id)
      const name = candidate ? `${candidate.firstName} ${candidate.lastName}` : 'Candidate'
      toast.success(`Moved ${name} to ${variables.status}`)
    },
    onError: () => {
      toast.error('Failed to move candidate')
    },
  })

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/candidates/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to delete candidate')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['candidates'] })
      toast.success('Candidate deleted successfully')
    },
    onError: () => {
      toast.error('Failed to delete candidate')
    },
  })

  // Group candidates by status for Kanban
  const kanbanData = useMemo(() => {
    const groups: Record<string, Candidate[]> = {}
    ALL_STATUSES.forEach((s) => {
      groups[s] = []
    })
    candidates.forEach((c) => {
      if (groups[c.status]) {
        groups[c.status].push(c)
      } else {
        groups['New'].push(c)
      }
    })
    return groups
  }, [candidates])

  function handleViewCandidate(id: string) {
    navigate('candidate-detail', id)
  }

  function handleEditCandidate(candidate: Candidate) {
    setEditCandidate(candidate)
    setAddDialogOpen(true)
  }

  function handleCloseDialog(open: boolean) {
    setAddDialogOpen(open)
    if (!open) setEditCandidate(null)
  }

  function handleCompare() {
    const ids = Array.from(selectedIds).slice(0, 4)
    setCompareIds(ids)
  }

  function handleCloseComparison() {
    setCompareIds(null)
  }

  // If a candidate is selected, show detail view
  if (selectedId) {
    return <CandidateDetail candidateId={selectedId} />
  }

  return (
    <div className="flex flex-1 flex-col gap-4 md:gap-6 p-3 md:p-6">
      {/* Header */}
      <div className="space-y-3">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 dark:bg-emerald-950">
              <Users className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Candidates</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Manage and track your candidate pipeline
                {data && (
                  <span className="ml-1 font-medium text-foreground">
                    ({data.pagination.total} total)
                  </span>
                )}
              </p>
            </div>
          </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5 border-emerald-300 text-emerald-700 hover:bg-emerald-50 hover:text-emerald-800 dark:border-emerald-700 dark:text-emerald-400 dark:hover:bg-emerald-950/50"
            onClick={() => setImportOpen(true)}
          >
            <Upload className="h-4 w-4" />
            Import
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5"
            onClick={() => {
              const csvData = candidates.map((c) => ({
                Name: `${c.firstName} ${c.lastName}`,
                Email: c.email || '',
                Phone: c.phone || '',
                Title: c.title || '',
                Status: c.status,
                Source: c.source || '',
                Experience: c.experience ?? '',
                Location: c.location || '',
                Skills: c.skills,
                'Current CTC': c.currentCTC ?? '',
                'Expected CTC': c.expectedCTC ?? '',
                'Notice Period': c.noticePeriod ?? '',
                'Job Title': c.job?.title || '',
              }))
              exportToCSV(csvData, 'candidates')
            }}
          >
            <Download className="h-4 w-4" />
            Export CSV
          </Button>
          <Button onClick={() => setAddDialogOpen(true)} className="bg-gradient-to-r from-primary to-primary/80 shadow-md hover:shadow-lg">
            <Plus className="mr-2 h-4 w-4" />
            {selectedIds.size > 0 ? `Add Candidate (${selectedIds.size} selected)` : 'Add Candidate'}
          </Button>
          {candidates.length > 0 && (
            <div className="flex items-center gap-2">
              <Checkbox
                checked={isAllSelected}
                ref={(el) => {
                  if (el) {
                    (el as unknown as { indeterminate: boolean }).indeterminate = isSomeSelected
                  }
                }}
                onCheckedChange={(checked) => {
                  if (checked) selectAll()
                  else deselectAll()
                }}
                aria-label="Select all candidates"
              />
              <span className="hidden text-xs text-muted-foreground sm:inline">Select All</span>
            </div>
          )}
        </div>
      </div>
      <div className="h-1 w-16 rounded-full bg-gradient-to-r from-emerald-400 to-teal-400" />
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 rounded-lg bg-muted/50 p-2 sm:flex-row sm:items-center">
        <div className="relative flex-1 sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search candidates..."
            className="border-0 bg-background pl-9 shadow-sm"
            value={candidateFilter.search}
            onChange={(e) => setCandidateFilter({ search: e.target.value })}
          />
        </div>
        <Select
          value={candidateFilter.status}
          onValueChange={(val) => setCandidateFilter({ status: val })}
        >
          <SelectTrigger className="w-full border-0 bg-background shadow-sm sm:w-[160px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="All">All Statuses</SelectItem>
            {ALL_STATUSES.map((status) => (
              <SelectItem key={status} value={status}>
                {status}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={candidateFilter.source}
          onValueChange={(val) => setCandidateFilter({ source: val })}
        >
          <SelectTrigger className="w-full border-0 bg-background shadow-sm sm:w-[160px]">
            <SelectValue placeholder="Source" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="All">All Sources</SelectItem>
            {SOURCE_OPTIONS.map((source) => (
              <SelectItem key={source} value={source}>
                {source}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Date Range Filter */}
      <div className="filter-bar rounded-lg bg-muted/50 p-2 md:p-3">
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="flex items-center gap-2">
              <CalendarDays className="h-4 w-4 text-muted-foreground" />
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Date Range</span>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-2">
              <Input
                type="date"
                className="w-full sm:w-[160px]"
                value={candidateFilter.fromDate || ''}
                placeholder="From"
                onChange={(e) => {
                  setCandidateFilter({ fromDate: e.target.value, toDate: candidateFilter.toDate })
                }}
              />
              <Input
                type="date"
                className="w-full sm:w-[160px]"
                value={candidateFilter.toDate || ''}
                placeholder="To"
                onChange={(e) => {
                  setCandidateFilter({ fromDate: candidateFilter.fromDate, toDate: e.target.value })
                }}
              />
            </div>
            <div className="flex flex-wrap items-center gap-1.5">
              <Button
                variant={candidateFilter.fromDate === todayStr && candidateFilter.toDate === todayStr ? 'default' : 'outline'}
                size="sm"
                className="h-7 text-xs px-2.5 btn-press"
                onClick={() => setCandidateFilter(getTodayRange())}
              >
                Today
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-xs px-2.5 btn-press"
                onClick={() => setCandidateFilter(getThisWeekRange())}
              >
                This Week
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-xs px-2.5 btn-press"
                onClick={() => setCandidateFilter(getThisMonthRange())}
              >
                This Month
              </Button>
              {hasDateFilter && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 gap-1 text-xs px-2.5 text-muted-foreground hover:text-destructive btn-press"
                  onClick={() => setCandidateFilter({ fromDate: '', toDate: '' })}
                >
                  <X className="h-3 w-3" />
                  Clear
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Bulk Actions Bar */}
      <BulkActionsBar
        selectedIds={selectedIdsArray}
        onClearSelection={deselectAll}
        onSuccess={handleBulkSuccess}
        onCompare={handleCompare}
      />

      {/* Tabs: List / Pipeline */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="list" className="gap-1.5">
            <LayoutList className="h-4 w-4" />
            List
          </TabsTrigger>
          <TabsTrigger value="pipeline" className="gap-1.5">
            <Kanban className="h-4 w-4" />
            Pipeline
          </TabsTrigger>
        </TabsList>

        {/* List View */}
        <TabsContent value="list" className="mt-4">
          {isLoading ? (
            <Card>
              <CardContent className="p-4 md:p-6">
                <div className="flex items-center justify-center gap-3">
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                  <p className="text-sm text-muted-foreground">Loading candidates...</p>
                </div>
              </CardContent>
            </Card>
          ) : error ? (
            <Card>
              <CardContent className="p-4 md:p-6">
                <p className="text-center text-sm text-destructive">
                  Failed to load candidates. Please try again.
                </p>
              </CardContent>
            </Card>
          ) : candidates.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center gap-3 py-12">
                <Users className="h-10 w-10 text-muted-foreground/40" />
                <p className="text-sm font-medium text-muted-foreground">No candidates found</p>
                <p className="text-xs text-muted-foreground/70">
                  {candidateFilter.search ||
                  candidateFilter.status !== 'All' ||
                  candidateFilter.source !== 'All'
                    ? 'Try adjusting your filters'
                    : 'Click "Add Candidate" to get started'}
                </p>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <div className="max-h-96 overflow-y-auto mobile-table-scroll">
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="w-10 text-xs">
                        <Checkbox
                          checked={isAllSelected}
                          ref={(el) => {
                            if (el) {
                              (el as unknown as { indeterminate: boolean }).indeterminate = isSomeSelected
                            }
                          }}
                          onCheckedChange={(checked) => {
                            if (checked) selectAll()
                            else deselectAll()
                          }}
                          aria-label="Select all candidates"
                        />
                      </TableHead>
                      <TableHead className="text-xs">Name</TableHead>
                      <TableHead className="hidden text-xs sm:table-cell">Email</TableHead>
                      <TableHead className="hidden text-xs md:table-cell">Phone</TableHead>
                      <TableHead className="hidden text-xs lg:table-cell">Title</TableHead>
                      <TableHead className="text-xs">Status</TableHead>
                      <TableHead className="hidden text-xs md:table-cell">Source</TableHead>
                      <TableHead className="w-12 text-xs">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {candidates.map((candidate, index) => {
                      const initials = getInitials(
                        candidate.firstName,
                        candidate.lastName
                      )
                      return (
                        <TableRow
                          key={candidate.id}
                          className={`table-row-hover cursor-pointer border-l-4 ${
                            STATUS_BORDER_COLORS[candidate.status] || 'border-l-gray-400'
                          } ${index % 2 === 1 ? 'bg-muted/30' : ''} ${selectedIds.has(candidate.id) ? 'bg-primary/5' : ''}`}
                          onClick={() => handleViewCandidate(candidate.id)}
                        >
                          <TableCell onClick={(e) => e.stopPropagation()}>
                            <Checkbox
                              checked={selectedIds.has(candidate.id)}
                              onCheckedChange={() => toggleSelect(candidate.id)}
                              aria-label={`Select ${candidate.firstName} ${candidate.lastName}`}
                            />
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <Avatar className="h-9 w-9 shrink-0 text-xs">
                                <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
                                  {initials}
                                </AvatarFallback>
                              </Avatar>
                              <div className="min-w-0">
                                <p className="truncate text-sm font-medium">
                                  {candidate.firstName} {candidate.lastName}
                                  {candidate.notes && (
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <span className="ml-1.5 inline-flex" onClick={(e) => e.stopPropagation()}>
                                          <MessageSquare className="h-3.5 w-3.5 text-amber-500" />
                                        </span>
                                      </TooltipTrigger>
                                      <TooltipContent side="top" className="max-w-[250px]">
                                        <p className="text-xs">{candidate.notes.length > 50 ? candidate.notes.slice(0, 50) + '...' : candidate.notes}</p>
                                      </TooltipContent>
                                    </Tooltip>
                                  )}
                                </p>
                                <p className="truncate text-xs text-muted-foreground sm:hidden">
                                  {candidate.email || '—'}
                                </p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="hidden max-w-[200px] truncate text-xs sm:table-cell">
                            {candidate.email || '—'}
                          </TableCell>
                          <TableCell className="hidden text-xs md:table-cell">
                            {candidate.phone || '—'}
                          </TableCell>
                          <TableCell className="hidden max-w-[180px] truncate text-xs lg:table-cell">
                            {candidate.title || '—'}
                          </TableCell>
                          <TableCell onClick={(e) => e.stopPropagation()}>
                            <Popover>
                              <PopoverTrigger asChild>
                                <Badge
                                  className={`cursor-pointer text-[10px] transition-transform hover:scale-105 ${
                                    STATUS_COLORS[candidate.status] || ''
                                  }`}
                                >
                                  {candidate.status}
                                </Badge>
                              </PopoverTrigger>
                              <PopoverContent className="w-40 p-1" align="start">
                                <div className="space-y-0.5">
                                  {ALL_STATUSES.map((status) => (
                                    <button
                                      key={status}
                                      onClick={() =>
                                        updateStatusMutation.mutate({
                                          id: candidate.id,
                                          status,
                                        })
                                      }
                                      className={`flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-xs transition-colors hover:bg-muted ${
                                        candidate.status === status
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
                          <TableCell className="hidden text-xs md:table-cell">
                            {candidate.source || '—'}
                          </TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-9 w-9 md:h-8 md:w-8"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleViewCandidate(candidate.id)
                                  }}
                                >
                                  <Eye className="mr-2 h-3.5 w-3.5" />
                                  View Details
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleEditCandidate(candidate)
                                  }}
                                >
                                  <Pencil className="mr-2 h-3.5 w-3.5" />
                                  Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  className="text-destructive focus:text-destructive"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    deleteMutation.mutate(candidate.id)
                                  }}
                                >
                                  <Trash2 className="mr-2 h-3.5 w-3.5" />
                                  Delete
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
            </Card>
          )}
        </TabsContent>

        {/* Pipeline / Kanban View */}
        <TabsContent value="pipeline" className="mt-4">
          {isLoading ? (
            <Card>
              <CardContent className="p-4 md:p-6">
                <div className="flex items-center justify-center gap-3">
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                  <p className="text-sm text-muted-foreground">Loading pipeline...</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="flex gap-4 overflow-x-auto pb-4">
              {ALL_STATUSES.map((status) => (
                <KanbanColumn
                  key={status}
                  status={status}
                  candidates={kanbanData[status] || []}
                  onViewCandidate={handleViewCandidate}
                  onEditCandidate={handleEditCandidate}
                  selectedIds={selectedIds}
                  onToggleSelect={toggleSelect}
                  onDropCandidate={(candidateId, newStatus) =>
                    dropStatusMutation.mutate({ id: candidateId, status: newStatus })
                  }
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Add/Edit Dialog */}
      <AddCandidateDialog
        open={addDialogOpen}
        onOpenChange={handleCloseDialog}
        editCandidate={editCandidate}
      />

      {/* CSV Import Dialog */}
      <CsvImportDialog open={importOpen} onOpenChange={setImportOpen} />

      {/* Candidate Comparison Overlay */}
      {compareIds && (
        <CandidateComparison
          candidateIds={compareIds}
          onClose={handleCloseComparison}
        />
      )}
    </div>
  )
}
