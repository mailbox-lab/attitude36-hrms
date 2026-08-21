'use client'

import { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useCRMStore } from '@/stores/crm-store'
import { ClientDetail } from './client-detail'
import { AddClientDialog } from './add-client-dialog'
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
import { Search, Plus, Building2, MapPin, Mail, Phone, Briefcase, UserCheck } from 'lucide-react'
import { toast } from 'sonner'

// ===== Types =====

type Client = {
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

// ===== Constants =====

const STATUS_OPTIONS = ['All', 'Active', 'Inactive', 'Prospect']

const INDUSTRY_OPTIONS = [
  'All',
  'Information Technology',
  'Healthcare',
  'Finance & Banking',
  'Education',
  'Manufacturing',
  'Retail & E-commerce',
  'Real Estate',
  'Telecommunications',
  'Media & Entertainment',
  'Consulting',
  'Logistics & Supply Chain',
  'Automotive',
  'Pharmaceuticals',
  'Energy & Utilities',
  'Other',
]

const STATUS_COLORS: Record<string, string> = {
  Active: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400',
  Inactive: 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400',
  Prospect: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400',
}

const STATUS_BORDER: Record<string, string> = {
  Active: 'border-t-emerald-500',
  Inactive: 'border-t-red-500',
  Prospect: 'border-t-amber-500',
}

// ===== Client Card =====

function ClientCard({
  client,
  onClick,
}: {
  client: Client
  onClick: () => void
}) {
  const location = [client.city, client.state].filter(Boolean).join(', ')

  return (
    <Card
      className={`group cursor-pointer border-t-4 transition-all hover:shadow-md ${STATUS_BORDER[client.status] || 'border-t-gray-400'}`}
      onClick={onClick}
    >
      <CardContent className="p-4">
        {/* Company Name & Status */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
              <Building2 className="h-5 w-5 text-primary" />
            </div>
            <div className="min-w-0">
              <h3 className="truncate text-sm font-semibold leading-tight group-hover:underline">
                {client.name}
              </h3>
              {client.industry && (
                <Badge
                  variant="secondary"
                  className="mt-1 text-[10px] font-medium"
                >
                  {client.industry}
                </Badge>
              )}
            </div>
          </div>
          <Badge className={`shrink-0 text-[10px] ${STATUS_COLORS[client.status] || ''}`}>
            {client.status}
          </Badge>
        </div>

        {/* Location */}
        {location && (
          <div className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground">
            <MapPin className="h-3 w-3 shrink-0" />
            <span className="truncate">{location}</span>
          </div>
        )}

        {/* Contact Info */}
        <div className="mt-2 space-y-1">
          {client.contactName && (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <span className="truncate font-medium text-foreground/80">
                {client.contactName}
              </span>
            </div>
          )}
          {client.contactEmail && (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Mail className="h-3 w-3 shrink-0" />
              <span className="truncate">{client.contactEmail}</span>
            </div>
          )}
          {client.contactPhone && (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Phone className="h-3 w-3 shrink-0" />
              <span className="truncate">{client.contactPhone}</span>
            </div>
          )}
        </div>

        {/* Stats Row */}
        <div className="mt-3 flex items-center gap-4 border-t pt-3">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Briefcase className="h-3.5 w-3.5" />
            <span className="font-medium text-foreground">
              {client._count.jobs}
            </span>
            <span>Jobs</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <UserCheck className="h-3.5 w-3.5" />
            <span className="font-medium text-foreground">
              {client._count.placements}
            </span>
            <span>Placements</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// ===== Main Component =====

export function ClientsPage() {
  const navigate = useCRMStore((s) => s.navigate)
  const selectedId = useCRMStore((s) => s.selectedId)
  const queryClient = useQueryClient()

  const [addDialogOpen, setAddDialogOpen] = useState(false)
  const [editClient, setEditClient] = useState<Client | null>(null)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('All')
  const [industryFilter, setIndustryFilter] = useState('All')

  // Fetch clients (note: /api/clients as specified)
  const { data, isLoading, error } = useQuery<{
    data: Client[]
    pagination: { page: number; limit: number; total: number; totalPages: number }
  }>({
    queryKey: ['clients', search, statusFilter, industryFilter],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (search) params.set('search', search)
      if (statusFilter && statusFilter !== 'All') params.set('status', statusFilter)
      if (industryFilter && industryFilter !== 'All') params.set('industry', industryFilter)
      const res = await fetch(`/api/clients?${params.toString()}`)
      if (!res.ok) throw new Error('Failed to fetch clients')
      return res.json()
    },
  })

  const clients = data?.data || []
  const total = data?.pagination?.total ?? clients.length

  // If a client is selected, show detail view
  if (selectedId) {
    return <ClientDetail clientId={selectedId} />
  }

  function handleViewClient(id: string) {
    navigate('client-detail', id)
  }

  function handleEditClient(client: Client) {
    setEditClient(client)
    setAddDialogOpen(true)
  }

  function handleCloseDialog(open: boolean) {
    setAddDialogOpen(open)
    if (!open) setEditClient(null)
  }

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Clients</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage hiring companies and client relationships
            {data && (
              <span className="ml-1 font-medium text-foreground">
                ({total} total)
              </span>
            )}
          </p>
        </div>
        <Button onClick={() => setAddDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Client
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1 sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search clients..."
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
                {status === 'All' ? 'All Statuses' : status}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={industryFilter} onValueChange={setIndustryFilter}>
          <SelectTrigger className="w-full sm:w-[200px]">
            <SelectValue placeholder="Industry" />
          </SelectTrigger>
          <SelectContent>
            {INDUSTRY_OPTIONS.map((industry) => (
              <SelectItem key={industry} value={industry}>
                {industry === 'All' ? 'All Industries' : industry}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Client Grid */}
      {isLoading ? (
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-center gap-3">
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              <p className="text-sm text-muted-foreground">Loading clients...</p>
            </div>
          </CardContent>
        </Card>
      ) : error ? (
        <Card>
          <CardContent className="p-6">
            <p className="text-center text-sm text-destructive">
              Failed to load clients. Please try again.
            </p>
          </CardContent>
        </Card>
      ) : clients.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-12">
            <Building2 className="h-10 w-10 text-muted-foreground/40" />
            <p className="text-sm font-medium text-muted-foreground">No clients found</p>
            <p className="text-xs text-muted-foreground/70">
              {search || statusFilter !== 'All' || industryFilter !== 'All'
                ? 'Try adjusting your filters'
                : 'Click "Add Client" to get started'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {clients.map((client) => (
            <ClientCard
              key={client.id}
              client={client}
              onClick={() => handleViewClient(client.id)}
            />
          ))}
        </div>
      )}

      {/* Add/Edit Dialog */}
      <AddClientDialog
        open={addDialogOpen}
        onOpenChange={handleCloseDialog}
        editClient={editClient}
      />
    </div>
  )
}
