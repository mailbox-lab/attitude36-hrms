'use client'

import { useState, useMemo } from 'react'
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
  UserCheck,
  Calendar,
  ExternalLink,
  IndianRupee,
  PhoneCall,
  Factory,
  Clock,
} from 'lucide-react'
import { motion } from 'framer-motion'

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
  Filled: 'bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-400',
  Cancelled: 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400',
}

const PLACEMENT_STATUS_COLORS: Record<string, string> = {
  Offered: 'bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-400',
  Joined: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400',
  'Offer Declined': 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400',
  'On Hold': 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400',
}

const PRIORITY_COLORS: Record<string, string> = {
  Low: 'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400',
  Medium: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400',
  High: 'bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-400',
  Urgent: 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400',
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

  const jobs = jobsData?.data || []
  const openJobs = jobs.filter((j) => j.status === 'Open').length
  const totalCandidates = jobs.reduce((sum, j) => sum + j.openings, 0)
  const placements = placementsData?.data || []

  // Calculate total revenue from joined placements
  const totalRevenue = useMemo(() => {
    return placements
      .filter((p) => p.status === 'Joined' && p.offeredCTC != null)
      .reduce((sum, p) => sum + (p.offeredCTC ?? 0), 0)
  }, [placements])

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

  // Recent jobs: sorted by createdAt desc, take first 4
  const recentJobs = [...jobs]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 4)

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
        onClick={() => navigate('clients')}
        className="w-fit"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Clients
      </Button>

      {/* Header */}
      <div className="rounded-lg bg-gradient-to-r from-emerald-500/10 via-emerald-500/5 to-transparent p-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex flex-col gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight md:text-3xl">{client.name}</h1>
              <Badge className={`text-xs ${STATUS_COLORS[client.status] || ''}`}>
                {client.status}
              </Badge>
              {client.industry && (
                <Badge variant="outline" className="text-xs">
                  <Factory className="mr-1 h-3 w-3" />
                  {client.industry}
                </Badge>
              )}
            </div>
            {client.industry && (
              <p className="text-sm text-muted-foreground">{client.industry}</p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => toast.info('Feature coming soon')}
            >
              <PhoneCall className="mr-2 h-3.5 w-3.5" />
              Contact
            </Button>
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
      </div>

      {/* Quick Stats Row */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Card className="border-l-4 border-l-emerald-500 transition-shadow hover:shadow-md">
          <CardContent className="flex items-center gap-4 p-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-100 dark:bg-emerald-950">
              <Briefcase className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <p className="text-2xl font-bold">{jobs.length}</p>
              <p className="text-xs text-muted-foreground">Total Jobs</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-amber-500 transition-shadow hover:shadow-md">
          <CardContent className="flex items-center gap-4 p-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-amber-100 dark:bg-amber-950">
              <Clock className="h-5 w-5 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <p className="text-2xl font-bold">{openJobs}</p>
              <p className="text-xs text-muted-foreground">Active Jobs</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-violet-500 transition-shadow hover:shadow-md">
          <CardContent className="flex items-center gap-4 p-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-violet-100 dark:bg-violet-950">
              <UserCheck className="h-5 w-5 text-violet-600 dark:text-violet-400" />
            </div>
            <div>
              <p className="text-2xl font-bold">{placements.length}</p>
              <p className="text-xs text-muted-foreground">Total Placements</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-rose-500 transition-shadow hover:shadow-md">
          <CardContent className="flex items-center gap-4 p-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-rose-100 dark:bg-rose-950">
              <IndianRupee className="h-5 w-5 text-rose-600 dark:text-rose-400" />
            </div>
            <div>
              <p className="text-2xl font-bold">{totalRevenue > 0 ? `₹${totalRevenue}L` : '—'}</p>
              <p className="text-xs text-muted-foreground">Total Revenue</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Jobs Section */}
      {recentJobs.length > 0 && (
        <Card className="transition-shadow hover:shadow-md">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="flex items-center gap-2 text-sm font-medium">
              <Briefcase className="h-4 w-4" />
              Recent Jobs
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              className="text-xs text-muted-foreground"
              onClick={() => navigate('jobs')}
            >
              View All →
            </Button>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {recentJobs.map((job) => (
                <div
                  key={job.id}
                  className="group cursor-pointer rounded-lg border p-3 transition-all hover:border-primary/30 hover:shadow-sm"
                  onClick={() => navigate('job-detail', job.id)}
                >
                  <div className="mb-2 flex items-start justify-between gap-2">
                    <h4 className="text-sm font-medium leading-tight group-hover:text-primary transition-colors">
                      {job.title}
                    </h4>
                    <Badge className={`shrink-0 text-[9px] ${PRIORITY_COLORS[job.priority] || ''}`}>
                      {job.priority}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    {job.location && (
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {job.location}
                      </span>
                    )}
                  </div>
                  <div className="mt-2 flex items-center justify-between">
                    <Badge className={`text-[9px] ${JOB_STATUS_COLORS[job.status] || ''}`}>
                      {job.status}
                    </Badge>
                    <span className="text-[11px] text-muted-foreground">
                      {job.openings} opening{job.openings !== 1 ? 's' : ''}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left Column: Company Info */}
        <div className="flex flex-col gap-6 lg:col-span-1">
          {/* Company Info Card */}
          <Card className="border-l-4 border-l-amber-500 transition-shadow hover:shadow-md">
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
          <Card className="border-l-4 border-l-emerald-500 transition-shadow hover:shadow-md">
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
            <Card className="border-l-4 border-l-violet-500 transition-shadow hover:shadow-md">
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
          <Card className="border-l-4 border-l-emerald-500 transition-shadow hover:shadow-md">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="flex items-center gap-2 text-sm font-medium">
                <Briefcase className="h-4 w-4" />
                All Job Openings
              </CardTitle>
              <span className="text-xs text-muted-foreground">
                {jobs.length} job{jobs.length !== 1 ? 's' : ''}
              </span>
            </CardHeader>
            <CardContent>
              {jobs.length > 0 ? (
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
                      {jobs.map((job) => (
                        <TableRow
                          key={job.id}
                          className="cursor-pointer transition-colors hover:bg-muted/50"
                          onClick={() => navigate('job-detail', job.id)}
                        >
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
          <Card className="border-l-4 border-l-violet-500 transition-shadow hover:shadow-md">
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
                        <TableRow key={placement.id} className="transition-colors hover:bg-muted/50">
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
    </motion.div>
  )
}
