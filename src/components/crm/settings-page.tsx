'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { useTheme } from 'next-themes'
import { toast } from 'sonner'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import {
  User,
  Palette,
  Bell,
  Database,
  Info,
  Save,
  Download,
  Trash2,
  RotateCcw,
  Sun,
  Moon,
  Monitor,
  Check,
  Loader2,
  Settings as SettingsIcon,
} from 'lucide-react'
import { useCRMStore } from '@/stores/crm-store'
import { cn } from '@/lib/utils'

// ===================== Profile Tab =====================
function ProfileTab() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [role, setRole] = useState('')
  const [department, setDepartment] = useState('')
  const [saving, setSaving] = useState(false)
  const [employeeId, setEmployeeId] = useState<string | null>(null)

  useEffect(() => {
    async function loadMyProfile() {
      try {
        const res = await fetch('/api/auth/me')
        if (res.ok) {
          const json = await res.json()
          const emp = json.employee
          if (emp) {
            setEmployeeId(emp.id)
            setName(emp.name || '')
            setEmail(emp.email || '')
            setPhone(emp.phone || '')
            setRole(emp.role || '')
            setDepartment(emp.department || '')
          }
        }
      } catch {
        // silently fail
      }
    }
    loadMyProfile()
  }, [])

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  const handleSave = async () => {
    if (!employeeId) return
    setSaving(true)
    try {
      const res = await fetch(`/api/employees/${employeeId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, phone, department }),
      })
      if (!res.ok) throw new Error('Failed to save')
      toast.success('Profile updated successfully')
    } catch {
      toast.error('Failed to update profile')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <Card className="transition-all duration-200 hover:shadow-md hover:-translate-y-1">
        <CardHeader>
          <CardTitle className="text-lg">Profile Information</CardTitle>
          <CardDescription>Manage your account details and profile information.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-6">
            {/* Avatar Section */}
            <div className="flex flex-col items-center gap-3">
              <Avatar className="h-24 w-24">
                <AvatarFallback className="bg-primary/10 text-primary text-2xl font-bold">
                  {name ? getInitials(name) : 'RP'}
                </AvatarFallback>
              </Avatar>
              <Badge variant="secondary" className="text-xs">
                {role ? (role === 'FOUNDER' ? 'Founder' : role === 'COFOUNDER' ? 'Co-Founder' : role === 'HR' ? 'HR Manager' : 'Employee') : 'Employee'}
              </Badge>
            </div>

            {/* Form Fields */}
            <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter your name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="Enter your phone number"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="role">Role</Label>
                <Badge variant="secondary" className={cn(
                  'text-xs px-3 py-1 font-medium',
                  role === 'FOUNDER' && 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300',
                  role === 'COFOUNDER' && 'bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-300',
                  role === 'HR' && 'bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-300',
                  role === 'EMPLOYEE' && 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-400',
                )}>
                  {role === 'FOUNDER' ? 'Founder' : role === 'COFOUNDER' ? 'Co-Founder' : role === 'HR' ? 'HR Manager' : role || 'Employee'}
                </Badge>
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="department">Department</Label>
                <Input
                  id="department"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  placeholder="Enter your department"
                />
              </div>
            </div>
          </div>
          <Separator className="my-6" />
          <div className="flex justify-end">
            <Button onClick={handleSave} disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// ===================== Appearance Tab =====================
function AppearanceTab() {
  const { theme, setTheme } = useTheme()
  const [compactMode, setCompactMode] = useState(() => {
    if (typeof window === 'undefined') return false
    const cm = localStorage.getItem('attitude360-compact-mode')
    return cm === null ? false : cm === 'true'
  })
  const [sidebarDefault, setSidebarDefault] = useState(() => {
    if (typeof window === 'undefined') return true
    const sd = localStorage.getItem('attitude360-sidebar-default')
    return sd === null ? true : sd === 'true'
  })

  const handleCompactChange = (checked: boolean) => {
    setCompactMode(checked)
    localStorage.setItem('attitude360-compact-mode', String(checked))
    toast.success(checked ? 'Compact mode enabled' : 'Compact mode disabled')
  }

  const handleSidebarDefault = (checked: boolean) => {
    setSidebarDefault(checked)
    localStorage.setItem('attitude360-sidebar-default', String(checked))
    toast.success(checked ? 'Sidebar will default to expanded' : 'Sidebar will default to collapsed')
  }

  const themeOptions = [
    { value: 'light', label: 'Light', icon: Sun },
    { value: 'dark', label: 'Dark', icon: Moon },
    { value: 'system', label: 'System', icon: Monitor },
  ] as const

  return (
    <div className="space-y-6">
      {/* Theme Selection */}
      <Card className="transition-all duration-200 hover:shadow-md hover:-translate-y-1">
        <CardHeader>
          <CardTitle className="text-lg">Theme</CardTitle>
          <CardDescription>Select your preferred color theme for the application.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {themeOptions.map((option) => {
              const Icon = option.icon
              const isActive = theme === option.value
              return (
                <button
                  key={option.value}
                  onClick={() => setTheme(option.value)}
                  className={cn(
                    'card-glass relative flex flex-col items-center gap-3 rounded-xl border-2 p-6 transition-all duration-200 hover:bg-accent/50 hover:-translate-y-1 hover:shadow-md cursor-pointer',
                    isActive
                      ? 'border-primary bg-primary/5 shadow-sm'
                      : 'border-muted hover:border-muted-foreground/30'
                  )}
                >
                  {isActive && (
                    <div className="absolute top-2 right-2">
                      <div className="h-5 w-5 rounded-full bg-primary flex items-center justify-center">
                        <Check className="h-3 w-3 text-primary-foreground" />
                      </div>
                    </div>
                  )}
                  <Icon className={cn('h-8 w-8', isActive ? 'text-primary' : 'text-muted-foreground')} />
                  <span className={cn('text-sm font-medium', isActive ? 'text-primary' : 'text-foreground')}>
                    {option.label}
                  </span>
                </button>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Compact Mode */}
      <Card className="transition-all duration-200 hover:shadow-md hover:-translate-y-1">
        <CardHeader>
          <CardTitle className="text-lg">Display Options</CardTitle>
          <CardDescription>Customize the display density and layout preferences.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-sm font-medium">Compact Mode</Label>
              <p className="text-xs text-muted-foreground">Reduce spacing and padding for a denser layout.</p>
            </div>
            <Switch checked={compactMode} onCheckedChange={handleCompactChange} />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-sm font-medium">Sidebar Default State</Label>
              <p className="text-xs text-muted-foreground">
                {sidebarDefault ? 'Sidebar starts expanded on page load.' : 'Sidebar starts collapsed on page load.'}
              </p>
            </div>
            <Switch checked={sidebarDefault} onCheckedChange={handleSidebarDefault} />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// ===================== Notifications Tab =====================
function NotificationsTab() {
  const lsBool = (key: string, fallback: boolean) => {
    if (typeof window === 'undefined') return fallback
    const val = localStorage.getItem(key)
    return val === null ? fallback : val === 'true'
  }

  const [emailNotifications, setEmailNotifications] = useState(() => lsBool('attitude360-notif-email', true))
  const [interviewReminders, setInterviewReminders] = useState(() => lsBool('attitude360-notif-interview', true))
  const [leaveAlerts, setLeaveAlerts] = useState(() => lsBool('attitude360-notif-leave', true))
  const [placementUpdates, setPlacementUpdates] = useState(() => lsBool('attitude360-notif-placement', true))

  const toggleSetting = (
    key: string,
    value: boolean,
    setter: (v: boolean) => void,
    label: string
  ) => {
    setter(value)
    localStorage.setItem(key, String(value))
    toast.success(`${label} ${value ? 'enabled' : 'disabled'}`)
  }

  const notificationItems = [
    {
      label: 'Email Notifications',
      description: 'Receive email notifications for important events and updates.',
      value: emailNotifications,
      setter: (v: boolean) => toggleSetting('attitude360-notif-email', v, setEmailNotifications, 'Email Notifications'),
    },
    {
      label: 'Interview Reminders',
      description: 'Get reminded about upcoming interviews with candidates.',
      value: interviewReminders,
      setter: (v: boolean) => toggleSetting('attitude360-notif-interview', v, setInterviewReminders, 'Interview Reminders'),
    },
    {
      label: 'Leave Request Alerts',
      description: 'Receive alerts when new leave requests are submitted.',
      value: leaveAlerts,
      setter: (v: boolean) => toggleSetting('attitude360-notif-leave', v, setLeaveAlerts, 'Leave Request Alerts'),
    },
    {
      label: 'Placement Updates',
      description: 'Get notified about placement status changes and milestones.',
      value: placementUpdates,
      setter: (v: boolean) => toggleSetting('attitude360-notif-placement', v, setPlacementUpdates, 'Placement Updates'),
    },
  ]

  return (
    <div className="space-y-6">
      <Card className="transition-all duration-200 hover:shadow-md hover:-translate-y-1">
        <CardHeader>
          <CardTitle className="text-lg">Notification Preferences</CardTitle>
          <CardDescription>Choose which notifications you would like to receive.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {notificationItems.map((item, index) => (
            <div key={item.label}>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5 pr-4">
                  <Label className="text-sm font-medium">{item.label}</Label>
                  <p className="text-xs text-muted-foreground">{item.description}</p>
                </div>
                <Switch checked={item.value} onCheckedChange={item.setter} />
              </div>
              {index < notificationItems.length - 1 && <Separator className="mt-6" />}
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}

// ===================== Data Management Tab =====================
function DataManagementTab() {
  const [stats, setStats] = useState({
    totalCandidates: 0,
    totalClients: 0,
    totalJobs: 0,
    totalEmployees: 0,
  })
  const [statsLoading, setStatsLoading] = useState(true)
  const [exporting, setExporting] = useState(false)
  const [clearing, setClearing] = useState(false)
  const [reseeding, setReseeding] = useState(false)

  const fetchStats = useCallback(async () => {
    try {
      setStatsLoading(true)
      const [dashRes, clientRes, empRes] = await Promise.all([
        fetch('/api/dashboard'),
        fetch('/api/clients'),
        fetch('/api/employees?activeOnly=false'),
      ])

      const dashData = dashRes.ok ? await dashRes.json() : {}
      const clientData = clientRes.ok ? await clientRes.json() : { data: [] }
      const empData = empRes.ok ? await empRes.json() : { data: [] }

      const clientList = clientData.data || clientData || []
      const empList = empData.data || empData || []

      // Total clients from API (all, not just active)
      const totalClients = Array.isArray(clientList) ? clientList.length : 0
      const totalEmployees = Array.isArray(empList) ? empList.length : 0

      // Total jobs: we need open + closed. The dashboard gives us openJobs.
      // For total, we fetch from the jobs API
      const jobsRes = await fetch('/api/jobs')
      const jobsData = jobsRes.ok ? await jobsRes.json() : { data: [] }
      const jobList = jobsData.data || jobsData || []
      const totalJobs = Array.isArray(jobList) ? jobList.length : 0

      setStats({
        totalCandidates: dashData.totalCandidates || 0,
        totalClients,
        totalJobs,
        totalEmployees,
      })
    } catch {
      // silently fail
    } finally {
      setStatsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchStats()
  }, [fetchStats])

  const handleExport = async () => {
    setExporting(true)
    try {
      const res = await fetch('/api/candidates')
      if (!res.ok) throw new Error('Failed to fetch candidates')
      const json = await res.json()
      const candidates = json.data || json || []

      if (candidates.length === 0) {
        toast.error('No candidates to export')
        setExporting(false)
        return
      }

      // Build CSV
      const headers = ['Name', 'Email', 'Phone', 'Title', 'Location', 'Experience', 'Status', 'Source', 'Rating']
      const rows = candidates.map((c: Record<string, unknown>) => [
        `${c.firstName || ''} ${c.lastName || ''}`.trim(),
        c.email || '',
        c.phone || '',
        c.title || '',
        c.location || '',
        c.experience ?? '',
        c.status || '',
        c.source || '',
        c.rating ?? '',
      ])

      const csvContent = [headers, ...rows]
        .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
        .join('\n')

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `attitude360-candidates-${new Date().toISOString().split('T')[0]}.csv`
      link.click()
      URL.revokeObjectURL(url)

      toast.success(`Exported ${candidates.length} candidates to CSV`)
    } catch {
      toast.error('Failed to export data')
    } finally {
      setExporting(false)
    }
  }

  const handleClearAll = async () => {
    setClearing(true)
    try {
      // Delete all data by model type
      const models = ['placements', 'interviews', 'leave', 'attendance', 'candidates', 'jobs', 'clients', 'employees']
      await Promise.all(
        models.map(async (model) => {
          // Fetch all IDs first, then delete individually
          try {
            const res = await fetch(`/api/${model}`)
            if (!res.ok) return
            const json = await res.json()
            const items = json.data || json || []
            if (Array.isArray(items)) {
              await Promise.all(
                items.map((item: Record<string, unknown>) =>
                  fetch(`/api/${model}/${item.id}`, { method: 'DELETE' }).catch(() => {})
                )
              )
            }
          } catch {
            // continue
          }
        })
      )
      toast.success('All data has been cleared successfully')
      fetchStats()
    } catch {
      toast.error('Failed to clear data')
    } finally {
      setClearing(false)
    }
  }

  const handleReseed = async () => {
    setReseeding(true)
    try {
      const res = await fetch('/api/seed', { method: 'POST' })
      if (res.ok) {
        toast.success('Sample data has been reseeded successfully')
        fetchStats()
      } else {
        toast.error('Failed to reseed data')
      }
    } catch {
      toast.error('Failed to reseed data')
    } finally {
      setReseeding(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Database Info */}
      <Card className="transition-all duration-200 hover:shadow-md hover:-translate-y-1">
        <CardHeader>
          <CardTitle className="text-lg">Database Overview</CardTitle>
          <CardDescription>Current statistics for your Attitude360 database.</CardDescription>
        </CardHeader>
        <CardContent>
          {statsLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-20 rounded-lg bg-muted animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="rounded-lg border bg-card p-4 text-center">
                <p className="text-2xl font-bold text-primary">{stats.totalCandidates}</p>
                <p className="text-xs text-muted-foreground mt-1">Total Candidates</p>
              </div>
              <div className="rounded-lg border bg-card p-4 text-center">
                <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{stats.totalClients}</p>
                <p className="text-xs text-muted-foreground mt-1">Total Clients</p>
              </div>
              <div className="rounded-lg border bg-card p-4 text-center">
                <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">{stats.totalJobs}</p>
                <p className="text-xs text-muted-foreground mt-1">Total Jobs</p>
              </div>
              <div className="rounded-lg border bg-card p-4 text-center">
                <p className="text-2xl font-bold text-rose-600 dark:text-rose-400">{stats.totalEmployees}</p>
                <p className="text-xs text-muted-foreground mt-1">Total Employees</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Actions */}
      <Card className="transition-all duration-200 hover:shadow-md hover:-translate-y-1">
        <CardHeader>
          <CardTitle className="text-lg">Data Actions</CardTitle>
          <CardDescription>Export, clear, or reseed your application data.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              variant="outline"
              onClick={handleExport}
              disabled={exporting}
              className="flex-1 sm:flex-none"
            >
              {exporting ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Download className="h-4 w-4 mr-2" />
              )}
              Export All Data (CSV)
            </Button>

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="destructive"
                  disabled={clearing}
                  className="flex-1 sm:flex-none"
                >
                  {clearing ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4 mr-2" />
                  )}
                  Clear All Data
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete all candidates,
                    clients, jobs, interviews, placements, attendance records, leave requests,
                    and employees from your database.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleClearAll}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    Yes, delete everything
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>

            <Button
              variant="outline"
              onClick={handleReseed}
              disabled={reseeding}
              className="flex-1 sm:flex-none"
            >
              {reseeding ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <RotateCcw className="h-4 w-4 mr-2" />
              )}
              Reseed Sample Data
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// ===================== About Tab =====================
function AboutTab() {
  const techStack = [
    { name: 'Next.js 16', color: 'bg-foreground' },
    { name: 'TypeScript', color: 'bg-cyan-600' },
    { name: 'Tailwind CSS', color: 'bg-cyan-500' },
    { name: 'shadcn/ui', color: 'bg-neutral-800 dark:bg-neutral-200' },
    { name: 'Prisma', color: 'bg-violet-500' },
  ]

  return (
    <div className="space-y-6">
      {/* App Branding Card */}
      <Card className="overflow-hidden transition-all duration-200 hover:shadow-md hover:-translate-y-1">
        <div className="relative bg-gradient-to-br from-primary/20 via-primary/5 to-background p-8">
          <div className="flex flex-col items-center gap-4">
            <div className="h-20 w-20 rounded-2xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center shadow-lg">
              <span className="text-3xl font-bold text-primary-foreground">A</span>
            </div>
            <div className="text-center">
              <h2 className="text-2xl font-bold tracking-tight">Attitude360 HRMS</h2>
              <p className="text-sm text-muted-foreground mt-1">Modern HR Management System</p>
            </div>
          </div>
        </div>
        <Separator />
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Version</p>
              <p className="text-sm font-medium">1.0.0</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">License</p>
              <p className="text-sm font-medium">Proprietary</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Environment</p>
              <Badge variant="outline" className="text-xs">Production</Badge>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Database</p>
              <p className="text-sm font-medium">SQLite</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tech Stack Card */}
      <Card className="transition-all duration-200 hover:shadow-md hover:-translate-y-1">
        <CardHeader>
          <CardTitle className="text-lg">Built With</CardTitle>
          <CardDescription>The technologies powering Attitude360 HRMS.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {techStack.map((tech) => (
              <div
                key={tech.name}
                className="flex items-center gap-2 rounded-lg border px-3 py-2"
              >
                <div className={cn('h-2.5 w-2.5 rounded-full', tech.color)} />
                <span className="text-sm font-medium">{tech.name}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Copyright */}
      <p className="text-center text-xs text-muted-foreground">
        © 2025 Attitude360 HRMS. All rights reserved.
      </p>
    </div>
  )
}

// ===================== Main Settings Page =====================
export function SettingsPage() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className="flex flex-1 flex-col gap-6 p-4 md:p-6"
    >
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-100 dark:bg-rose-950">
            <SettingsIcon className="h-5 w-5 text-rose-600 dark:text-rose-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Settings</h1>
            <p className="mt-1 text-sm text-muted-foreground">Manage your application preferences and account settings</p>
          </div>
        </div>
        <div className="h-1 w-16 rounded-full bg-gradient-to-r from-rose-400 to-pink-400" />
      </div>

      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="w-full sm:w-auto">
          <TabsTrigger value="profile" className="gap-1.5">
            <User className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Profile</span>
          </TabsTrigger>
          <TabsTrigger value="appearance" className="gap-1.5">
            <Palette className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Appearance</span>
          </TabsTrigger>
          <TabsTrigger value="notifications" className="gap-1.5">
            <Bell className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Notifications</span>
          </TabsTrigger>
          <TabsTrigger value="data" className="gap-1.5">
            <Database className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Data</span>
          </TabsTrigger>
          <TabsTrigger value="about" className="gap-1.5">
            <Info className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">About</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="mt-6">
          <ProfileTab />
        </TabsContent>
        <TabsContent value="appearance" className="mt-6">
          <AppearanceTab />
        </TabsContent>
        <TabsContent value="notifications" className="mt-6">
          <NotificationsTab />
        </TabsContent>
        <TabsContent value="data" className="mt-6">
          <DataManagementTab />
        </TabsContent>
        <TabsContent value="about" className="mt-6">
          <AboutTab />
        </TabsContent>
      </Tabs>
    </motion.div>
  )
}