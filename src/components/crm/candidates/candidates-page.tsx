'use client'

import { useState, useMemo } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useCRMStore } from '@/stores/crm-store'
import { CandidateDetail } from './candidate-detail'
import { AddCandidateDialog } from './add-candidate-dialog'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
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
} from 'lucide-react'
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
  Screening: 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400',
  Interview: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400',
  Offer: 'bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-400',
  Hired: 'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400',
  Rejected: 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400',
  'On-Hold': 'bg-gray-100 text-gray-700 dark:bg-gray-950 dark:text-gray-400',
}

const STATUS_BORDER_COLORS: Record<string, string> = {
  New: 'border-l-emerald-500',
  Screening: 'border-l-blue-500',
  Interview: 'border-l-amber-500',
  Offer: 'border-l-violet-500',
  Hired: 'border-l-green-500',
  Rejected: 'border-l-red-500',
  'On-Hold': 'border-l-gray-500',
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
}: {
  candidate: Candidate
  onView: () => void
  onEdit: () => void
}) {
  const skills = parseSkills(candidate.skills)
  const initials = getInitials(candidate.firstName, candidate.lastName)

  return (
    <div
      className={`group rounded-lg border border-l-4 bg-card p-3 shadow-sm transition-all hover:shadow-md ${
        STATUS_BORDER_COLORS[candidate.status] || 'border-l-gray-500'
      }`}
    >
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
}: {
  status: string
  candidates: Candidate[]
  onViewCandidate: (id: string) => void
  onEditCandidate: (candidate: Candidate) => void
}) {
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
        <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-muted px-1.5 text-[10px] font-semibold text-muted-foreground">
          {candidates.length}
        </span>
      </div>
      <div className="flex max-h-[calc(100vh-320px)] min-h-[120px] flex-col gap-2 overflow-y-auto rounded-lg bg-muted/30 p-2">
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

  const [addDialogOpen, setAddDialogOpen] = useState(false)
  const [editCandidate, setEditCandidate] = useState<Candidate | null>(null)
  const [activeTab, setActiveTab] = useState('list')

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
      const res = await fetch(`/api/candidates?${params.toString()}`)
      if (!res.ok) throw new Error('Failed to fetch candidates')
      return res.json()
    },
  })

  const candidates = data?.data || []

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

  // If a candidate is selected, show detail view
  if (selectedId) {
    return <CandidateDetail candidateId={selectedId} />
  }

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
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
        <Button onClick={() => setAddDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Candidate
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1 sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search candidates..."
            className="pl-9"
            value={candidateFilter.search}
            onChange={(e) => setCandidateFilter({ search: e.target.value })}
          />
        </div>
        <Select
          value={candidateFilter.status}
          onValueChange={(val) => setCandidateFilter({ status: val })}
        >
          <SelectTrigger className="w-full sm:w-[160px]">
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
          <SelectTrigger className="w-full sm:w-[160px]">
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
              <CardContent className="p-6">
                <div className="flex items-center justify-center gap-3">
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                  <p className="text-sm text-muted-foreground">Loading candidates...</p>
                </div>
              </CardContent>
            </Card>
          ) : error ? (
            <Card>
              <CardContent className="p-6">
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
              <div className="max-h-96 overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
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
                    {candidates.map((candidate) => {
                      const initials = getInitials(
                        candidate.firstName,
                        candidate.lastName
                      )
                      return (
                        <TableRow
                          key={candidate.id}
                          className="cursor-pointer transition-colors"
                          onClick={() => handleViewCandidate(candidate.id)}
                        >
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <Avatar className="h-8 w-8 shrink-0 text-xs">
                                <AvatarFallback className="bg-primary/10 text-primary text-[10px]">
                                  {initials}
                                </AvatarFallback>
                              </Avatar>
                              <div className="min-w-0">
                                <p className="truncate text-sm font-medium">
                                  {candidate.firstName} {candidate.lastName}
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
                          <TableCell>
                            <Badge
                              className={`text-[10px] ${
                                STATUS_COLORS[candidate.status] || ''
                              }`}
                            >
                              {candidate.status}
                            </Badge>
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
                                  className="h-8 w-8"
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
              <CardContent className="p-6">
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
    </div>
  )
}
