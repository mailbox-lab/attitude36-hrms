'use client'

import { useState, useMemo, useCallback } from 'react'
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
import { Search, Plus, Building2, MapPin, Mail, Phone, Briefcase, UserCheck, Cpu, Heart, GraduationCap, Factory, ShoppingBag, Landmark, Radio, Tv, Lightbulb, Truck, Car, Pill, Zap, CalendarDays, X } from 'lucide-react'
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

const STATUS_GRADIENT: Record<string, string> = {
  Active: 'from-emerald-400 to-emerald-600',
  Inactive: 'from-red-400 to-red-600',
  Prospect: 'from-amber-400 to-amber-600',
}

const INDUSTRY_ICONS: Record<string, { icon: typeof Cpu; color: string }> = {
  'Information Technology': { icon: Cpu, color: 'bg-violet-100 text-violet-600 dark:bg-violet-950 dark:text-violet-400' },
  'Healthcare': { icon: Heart, color: 'bg-rose-100 text-rose-600 dark:bg-rose-950 dark:text-rose-400' },
  'Finance & Banking': { icon: Landmark, color: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400' },
  'Education': { icon: GraduationCap, color: 'bg-cyan-100 text-cyan-600 dark:bg-cyan-950 dark:text-cyan-400' },
  'Manufacturing': { icon: Factory, color: 'bg-orange-100 text-orange-600 dark:bg-orange-950 dark:text-orange-400' },
  'Retail & E-commerce': { icon: ShoppingBag, color: 'bg-pink-100 text-pink-600 dark:bg-pink-950 dark:text-pink-400' },
  'Real Estate': { icon: Building2, color: 'bg-amber-100 text-amber-600 dark:bg-amber-950 dark:text-amber-400' },
  'Telecommunications': { icon: Radio, color: 'bg-cyan-100 text-cyan-600 dark:bg-cyan-950 dark:text-cyan-400' },
  'Media & Entertainment': { icon: Tv, color: 'bg-fuchsia-100 text-fuchsia-600 dark:bg-fuchsia-950 dark:text-fuchsia-400' },
  'Consulting': { icon: Lightbulb, color: 'bg-yellow-100 text-yellow-600 dark:bg-yellow-950 dark:text-yellow-400' },
  'Logistics & Supply Chain': { icon: Truck, color: 'bg-teal-100 text-teal-600 dark:bg-teal-950 dark:text-teal-400' },
  'Automotive': { icon: Car, color: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400' },
  'Pharmaceuticals': { icon: Pill, color: 'bg-red-100 text-red-600 dark:bg-red-950 dark:text-red-400' },
  'Energy & Utilities': { icon: Zap, color: 'bg-lime-100 text-lime-600 dark:bg-lime-950 dark:text-lime-400' },
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
  const industryInfo = client.industry ? INDUSTRY_ICONS[client.industry] : null
  const IndustryIcon = industryInfo?.icon || Building2

  return (
    <Card
      className={`group cursor-pointer overflow-hidden transition-all duration-200 hover:shadow-lg hover:-translate-y-1`}
      onClick={onClick}
    >
      {/* Gradient top border */}
      <div className={`h-[3px] bg-gradient-to-r ${STATUS_GRADIENT[client.status] || 'from-gray-400 to-gray-500'}`} />
      <CardContent className="p-4">
        {/* Company Name & Status */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-3 min-w-0">
            <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${industryInfo?.color || 'bg-primary/10 text-primary'}`}>
              <IndustryIcon className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <h3 className="truncate text-sm font-semibold leading-tight group-hover:underline">
                {client.name}
              </h3>
              {client.industry && (
                <Badge
                  variant="secondary"
                  className={`mt-1 text-[10px] font-medium ${industryInfo?.color || ''}`}
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
        <div className="mt-3 flex items-center gap-3 border-t pt-3">
          <div className="flex items-center gap-1.5 rounded-md bg-primary/5 px-2 py-1 text-xs">
            <Briefcase className="h-3.5 w-3.5 text-primary/70" />
            <span className="font-semibold text-foreground">
              {client._count.jobs}
            </span>
            <span className="text-muted-foreground">Jobs</span>
          </div>
          <div className="flex items-center gap-1.5 rounded-md bg-emerald-50 px-2 py-1 text-xs dark:bg-emerald-950/30">
            <UserCheck className="h-3.5 w-3.5 text-emerald-600/70 dark:text-emerald-400/70" />
            <span className="font-semibold text-foreground">
              {client._count.placements}
            </span>
            <span className="text-muted-foreground">Placements</span>
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
  const clientFilter = useCRMStore((s) => s.clientFilter)
  const setClientFilter = useCRMStore((s) => s.setClientFilter)

  const [addDialogOpen, setAddDialogOpen] = useState(false)
  const [editClient, setEditClient] = useState<Client | null>(null)
  const [industryFilter, setIndustryFilter] = useState('All')

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
  const hasDateFilter = !!(clientFilter.fromDate && clientFilter.toDate)

  // Fetch clients (note: /api/clients as specified)
  const { data, isLoading, error } = useQuery<{
    data: Client[]
    pagination: { page: number; limit: number; total: number; totalPages: number }
  }>({
    queryKey: ['clients', clientFilter, industryFilter],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (clientFilter.search) params.set('search', clientFilter.search)
      if (clientFilter.status && clientFilter.status !== 'All') params.set('status', clientFilter.status)
      if (industryFilter && industryFilter !== 'All') params.set('industry', industryFilter)
      if (clientFilter.fromDate) params.set('fromDate', clientFilter.fromDate)
      if (clientFilter.toDate) params.set('toDate', clientFilter.toDate)
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
      <div className="space-y-3">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 dark:bg-amber-950">
              <Building2 className="h-5 w-5 text-amber-600 dark:text-amber-400" />
            </div>
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
          </div>
          <Button onClick={() => setAddDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Client
          </Button>
        </div>
        <div className="h-1 w-16 rounded-full bg-gradient-to-r from-amber-400 to-orange-400" />
      </div>

      {/* Filters */}
      <div className="rounded-lg bg-muted/50 p-2">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1 sm:max-w-xs">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search clients..."
              className="pl-9"
              value={clientFilter.search}
              onChange={(e) => setClientFilter({ search: e.target.value })}
            />
          </div>
          <Select value={clientFilter.status} onValueChange={(val) => setClientFilter({ status: val })}>
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
      </div>

      {/* Date Range Filter */}
      <div className="rounded-lg bg-muted/50 p-3">
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
                value={clientFilter.fromDate || ''}
                placeholder="From"
                onChange={(e) => {
                  setClientFilter({ fromDate: e.target.value, toDate: clientFilter.toDate })
                }}
              />
              <Input
                type="date"
                className="w-full sm:w-[160px]"
                value={clientFilter.toDate || ''}
                placeholder="To"
                onChange={(e) => {
                  setClientFilter({ fromDate: clientFilter.fromDate, toDate: e.target.value })
                }}
              />
            </div>
            <div className="flex flex-wrap items-center gap-1.5">
              <Button
                variant={clientFilter.fromDate === todayStr && clientFilter.toDate === todayStr ? 'default' : 'outline'}
                size="sm"
                className="h-7 text-xs px-2.5 btn-press"
                onClick={() => setClientFilter(getTodayRange())}
              >
                Today
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-xs px-2.5 btn-press"
                onClick={() => setClientFilter(getThisWeekRange())}
              >
                This Week
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-xs px-2.5 btn-press"
                onClick={() => setClientFilter(getThisMonthRange())}
              >
                This Month
              </Button>
              {hasDateFilter && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 gap-1 text-xs px-2.5 text-muted-foreground hover:text-destructive btn-press"
                  onClick={() => setClientFilter({ fromDate: '', toDate: '' })}
                >
                  <X className="h-3 w-3" />
                  Clear
                </Button>
              )}
            </div>
          </div>
        </div>
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
          <CardContent className="flex flex-col items-center gap-4 py-12">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-50 dark:bg-amber-950/50">
              <Building2 className="h-6 w-6 text-amber-400" />
            </div>
            <div className="text-center">
              <p className="text-sm font-medium text-muted-foreground">No clients found</p>
              <p className="mt-1 text-xs text-muted-foreground/70">
                {clientFilter.search || clientFilter.status !== 'All' || industryFilter !== 'All'
                  ? 'Try adjusting your search or filter criteria'
                  : 'Add your first client company to begin managing hiring relationships'}
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 max-h-[600px] overflow-y-auto">
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
