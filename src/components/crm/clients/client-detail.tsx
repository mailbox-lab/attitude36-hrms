'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { useCRMStore } from '@/stores/crm-store'
import { AddClientDialog } from './add-client-dialog'
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
  Globe,
  MapPin,
  Mail,
  Phone,
  User,
  Building2,
  Briefcase,
  Users,
  UserCheck,
  Calendar,
  ExternalLink,
} from 'lucide-react'

// ===== Types =====

type ClientDetailData = {
  id: string
  name: string
  industry: string | null
  website: string | null
  address: string | null
  city: string | null
  state: string | null
  country: string
  description: string | null
  contactName: string | null
  contactEmail: string | null
  contactPhone: string | null
  status: string
  createdAt: string
  updatedAt: string
  _count: {
    jobs: number
    placements: number
  }
}

type RelatedJob = {
  id: string
  title: string
  department: string | null
  location: string | null
  employmentType: string
  status: string
  priority: string
  openings: number
  createdAt: string
}

type RelatedPlacement = {
  id: string
  candidate: {
    id: string
    firstName: string
    lastName: string
  } | null
  job: {
    id: string
    title: string
  } | null
  offeredCTC: number | null
  joinedDate: string | null
  status: string
  createdAt: string
}

// ===== Constants =====

const STATUS_COLORS: Record<string, string> = {
  Active: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400',
  Inactive: 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400',
  Prospect: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400',
}

const JOB_STATUS_COLORS: Record<string, string> = {
  Open: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400',
  Closed: 'bg-gray-100 text-gray-700 dark:bg-gray-950 dark:text-gray-400',
  Paused: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400',
  Filled: 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400',
  Cancelled: 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400',
}

const PLACEMENT_STATUS_COLORS: Record<string, string> = {
  Offered: 'bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-400',
  Joined: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400',
  'Offer Declined': 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400',
  'On Hold': 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400',
}

// ===== Main Component =====

export function ClientDetail({
  clientId,
}: {
  clientId: string
}) {
  const navigate = useCRMStore((s) => s.navigate)
  const queryClient = useQueryClient()
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)

  // Fetch client detail
  const { data: client, isLoading, error } = useQuery<ClientDetailData>({
    queryKey: ['client', clientId],
    queryFn: async () => {
      const res = await fetch(`/api/clients/${clientId}`)
      if (!res.ok) throw new Error('Failed to fetch client')
      return res.json()
    },
    enabled: !!clientId,
  })

  // Fetch related jobs
  const { data: jobsData } = useQuery<{ data: RelatedJob[] }>({
    queryKey: ['client-jobs', clientId],
    queryFn: async () => {
      const res = await fetch(`/api/jobs?clientId=${clientId}`)
      if (!res.ok) throw new Error('Failed to fetch jobs')
      return res.json()
    },
    enabled: !!clientId,
  })

  // Fetch related placements
  const { data: placementsData } = useQuery<{ data: RelatedPlacement[] }>({
    queryKey: ['client-placements', clientId],
    queryFn: async () => {
      const res = await fetch(`/api/placements?clientId=${clientId}`)
      if (!res.ok) throw new Error('Failed to fetch placements')
      return res.json()
    },
    enabled: !!clientId,
  })

  // Count open jobs
  const openJobs = jobsData?.data?.filter((j) => j.status === 'Open').length ?? 0
  const totalCandidates = jobsData?.data?.reduce((sum, j) => sum + j.openings, 0) ?? 0
  const placements = placementsData?.data || []

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/clients/${clientId}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to delete client')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] })
      toast.success('Client deleted successfully')
      navigate('clients')
    },
    onError: () => {
      toast.error('Failed to delete client')
    },
  })

  if (isLoading) {
    return (
      <div className="flex flex-1 items-center justify-center p-8">
        <div className="text-center">
          <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <p className="text-sm text-muted-foreground">Loading client details...</p>
        </div>
      </div>
    )
  }

  if (error || !client) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 p-8">
        <p className="text-lg font-medium text-destructive">Client not found</p>
        <Button variant="outline" onClick={() => navigate('clients')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Clients
        </Button>
      </div>
    )
  }

  const location = [client.address, client.city, client.state, client.country].filter(Boolean).join(', ')

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('clients')}
            className="shrink-0"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold tracking-tight md:text-3xl">{client.name}</h1>
              <Badge className={`text-xs ${STATUS_COLORS[client.status] || ''}`}>
                {client.status}
              </Badge>
            </div>
            {client.industry && (
              <p className="mt-1 text-sm text-muted-foreground">{client.industry}</p>
            )}
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
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-100 dark:bg-emerald-950">
              <Briefcase className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <p className="text-2xl font-bold">{openJobs}</p>
              <p className="text-xs text-muted-foreground">Open Jobs</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-violet-100 dark:bg-violet-950">
              <Users className="h-5 w-5 text-violet-600 dark:text-violet-400" />
            </div>
            <div>
              <p className="text-2xl font-bold">{totalCandidates}</p>
              <p className="text-xs text-muted-foreground">Total Candidates Needed</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-amber-100 dark:bg-amber-950">
              <UserCheck className="h-5 w-5 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <p className="text-2xl font-bold">{placements.length}</p>
              <p className="text-xs text-muted-foreground">Placements</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left Column: Company Info */}
        <div className="flex flex-col gap-6 lg:col-span-1">
          {/* Company Info Card */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-sm font-medium">
                <Building2 className="h-4 w-4" />
                Company Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {client.industry && (
                <>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Industry</span>
                    <span className="font-medium">{client.industry}</span>
                  </div>
                  <Separator />
                </>
              )}
              {client.website && (
                <>
                  <div className="flex items-center justify-between gap-2 text-sm">
                    <span className="flex items-center gap-1.5 text-muted-foreground shrink-0">
                      <Globe className="h-3.5 w-3.5" />
                      Website
                    </span>
                    <a
                      href={
                        client.website.startsWith('http')
                          ? client.website
                          : `https://${client.website}`
                      }
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 truncate font-medium text-primary hover:underline"
                    >
                      {client.website.replace(/^https?:\/\//, '')}
                      <ExternalLink className="h-3 w-3 shrink-0" />
                    </a>
                  </div>
                  <Separator />
                </>
              )}
              {location && (
                <>
                  <div className="flex items-start justify-between gap-2 text-sm">
                    <span className="flex items-center gap-1.5 text-muted-foreground shrink-0">
                      <MapPin className="h-3.5 w-3.5" />
                      Address
                    </span>
                    <span className="text-right font-medium">{location}</span>
                  </div>
                  <Separator />
                </>
              )}
            </CardContent>
          </Card>

          {/* Contact Person Card */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-sm font-medium">
                <User className="h-4 w-4" />
                Contact Person
              </CardTitle>
            </CardHeader>
            <CardContent>
              {client.contactName || client.contactEmail || client.contactPhone ? (
                <div className="space-y-3">
                  {client.contactName && (
                    <>
                      <div className="flex items-center gap-3 text-sm">
                        <User className="h-4 w-4 shrink-0 text-muted-foreground" />
                        <span className="font-medium">{client.contactName}</span>
                      </div>
                      <Separator />
                    </>
                  )}
                  {client.contactEmail && (
                    <>
                      <div className="flex items-center gap-3 text-sm">
                        <Mail className="h-4 w-4 shrink-0 text-muted-foreground" />
                        <a
                          href={`mailto:${client.contactEmail}`}
                          className="truncate text-foreground hover:underline"
                        >
                          {client.contactEmail}
                        </a>
                      </div>
                      <Separator />
                    </>
                  )}
                  {client.contactPhone && (
                    <div className="flex items-center gap-3 text-sm">
                      <Phone className="h-4 w-4 shrink-0 text-muted-foreground" />
                      <span>{client.contactPhone}</span>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No contact person specified.</p>
              )}
            </CardContent>
          </Card>

          {/* Description Card */}
          {client.description && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">About</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">
                  {client.description}
                </p>
              </CardContent>
            </Card>
          )}

          {/* Metadata */}
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              Added: {new Date(client.createdAt).toLocaleDateString('en-IN', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
              })}
            </span>
            <span>
              Updated: {new Date(client.updatedAt).toLocaleDateString('en-IN', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
              })}
            </span>
          </div>
        </div>

        {/* Right Column: Jobs & Placements */}
        <div className="flex flex-col gap-6 lg:col-span-2">
          {/* Related Jobs Card */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="flex items-center gap-2 text-sm font-medium">
                <Briefcase className="h-4 w-4" />
                Related Jobs
              </CardTitle>
              <span className="text-xs text-muted-foreground">
                {jobsData?.data?.length ?? 0} job{(jobsData?.data?.length ?? 0) !== 1 ? 's' : ''}
              </span>
            </CardHeader>
            <CardContent>
              {jobsData?.data && jobsData.data.length > 0 ? (
                <div className="max-h-96 overflow-y-auto rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow className="hover:bg-transparent">
                        <TableHead className="text-xs">Title</TableHead>
                        <TableHead className="hidden text-xs sm:table-cell">Location</TableHead>
                        <TableHead className="hidden text-xs md:table-cell">Type</TableHead>
                        <TableHead className="hidden text-xs md:table-cell">Openings</TableHead>
                        <TableHead className="text-xs">Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {jobsData.data.map((job) => (
                        <TableRow key={job.id}>
                          <TableCell className="text-xs font-medium">{job.title}</TableCell>
                          <TableCell className="hidden text-xs sm:table-cell">
                            {job.location || '—'}
                          </TableCell>
                          <TableCell className="hidden text-xs md:table-cell">
                            {job.employmentType}
                          </TableCell>
                          <TableCell className="hidden text-xs md:table-cell">
                            {job.openings}
                          </TableCell>
                          <TableCell>
                            <Badge className={`text-[10px] ${JOB_STATUS_COLORS[job.status] || ''}`}>
                              {job.status}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2 py-8">
                  <Briefcase className="h-8 w-8 text-muted-foreground/40" />
                  <p className="text-sm text-muted-foreground">No job openings yet</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Related Placements Card */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="flex items-center gap-2 text-sm font-medium">
                <UserCheck className="h-4 w-4" />
                Related Placements
              </CardTitle>
              <span className="text-xs text-muted-foreground">
                {placements.length} placement{placements.length !== 1 ? 's' : ''}
              </span>
            </CardHeader>
            <CardContent>
              {placements.length > 0 ? (
                <div className="max-h-96 overflow-y-auto rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow className="hover:bg-transparent">
                        <TableHead className="text-xs">Candidate</TableHead>
                        <TableHead className="hidden text-xs sm:table-cell">Job</TableHead>
                        <TableHead className="hidden text-xs md:table-cell">Offered CTC</TableHead>
                        <TableHead className="hidden text-xs md:table-cell">Joined Date</TableHead>
                        <TableHead className="text-xs">Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {placements.map((placement) => (
                        <TableRow key={placement.id}>
                          <TableCell className="text-xs font-medium">
                            {placement.candidate
                              ? `${placement.candidate.firstName} ${placement.candidate.lastName}`
                              : '—'}
                          </TableCell>
                          <TableCell className="hidden text-xs sm:table-cell">
                            {placement.job?.title || '—'}
                          </TableCell>
                          <TableCell className="hidden text-xs md:table-cell">
                            {placement.offeredCTC ? `₹${placement.offeredCTC} LPA` : '—'}
                          </TableCell>
                          <TableCell className="hidden text-xs md:table-cell">
                            {placement.joinedDate
                              ? new Date(placement.joinedDate).toLocaleDateString('en-IN', {
                                  day: 'numeric',
                                  month: 'short',
                                  year: 'numeric',
                                })
                              : '—'}
                          </TableCell>
                          <TableCell>
                            <Badge
                              className={`text-[10px] ${PLACEMENT_STATUS_COLORS[placement.status] || ''}`}
                            >
                              {placement.status}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2 py-8">
                  <UserCheck className="h-8 w-8 text-muted-foreground/40" />
                  <p className="text-sm text-muted-foreground">No placements yet</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Edit Dialog */}
      <AddClientDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        editClient={client}
      />

      {/* Delete Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Client</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <strong>{client.name}</strong>? This action
              cannot be undone and will remove all associated job openings and placement
              records.
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
