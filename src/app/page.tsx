'use client'

import { lazy, Suspense, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useCRMStore } from '@/stores/crm-store'
import { CRMLayout } from '@/components/crm/crm-layout'
import { Skeleton } from '@/components/ui/skeleton'
import { AuthProvider } from '@/components/auth/session-provider'
import { AuthPage } from '@/components/auth/auth-page'
import { Loader2 } from 'lucide-react'

// Lazy load all page components to avoid OOM during compilation
const DashboardPage = lazy(() => import('@/components/crm/dashboard/dashboard-page').then(m => ({ default: m.DashboardPage })))
const CandidatesPage = lazy(() => import('@/components/crm/candidates/candidates-page').then(m => ({ default: m.CandidatesPage })))
const CandidateDetail = lazy(() => import('@/components/crm/candidates/candidate-detail').then(m => ({ default: m.CandidateDetail })))
const ClientsPage = lazy(() => import('@/components/crm/clients/clients-page').then(m => ({ default: m.ClientsPage })))
const ClientDetail = lazy(() => import('@/components/crm/clients/client-detail').then(m => ({ default: m.ClientDetail })))
const JobsPage = lazy(() => import('@/components/crm/jobs/jobs-page').then(m => ({ default: m.JobsPage })))
const JobDetail = lazy(() => import('@/components/crm/jobs/job-detail').then(m => ({ default: m.JobDetail })))
const AttendancePage = lazy(() => import('@/components/crm/attendance/attendance-page').then(m => ({ default: m.AttendancePage })))
const LeavePage = lazy(() => import('@/components/crm/leave/leave-page').then(m => ({ default: m.LeavePage })))
const InterviewsPage = lazy(() => import('@/components/crm/interviews-page').then(m => ({ default: m.InterviewsPage })))
const PlacementsPage = lazy(() => import('@/components/crm/placements-page').then(m => ({ default: m.PlacementsPage })))
const EmployeesPage = lazy(() => import('@/components/crm/employees-page').then(m => ({ default: m.EmployeesPage })))
const EmployeeDetail = lazy(() => import('@/components/crm/employee-detail').then(m => ({ default: m.EmployeeDetail })))
const ActivityFeedPage = lazy(() => import('@/components/crm/activity-feed-page').then(m => ({ default: m.ActivityFeedPage })))
const NotificationCenter = lazy(() => import('@/components/crm/notification-center').then(m => ({ default: m.NotificationCenter })))
const AnalyticsPage = lazy(() => import('@/components/crm/analytics-page').then(m => ({ default: m.AnalyticsPage })))
const SettingsPage = lazy(() => import('@/components/crm/settings-page').then(m => ({ default: m.SettingsPage })))
const OrgHierarchyPage = lazy(() => import('@/components/crm/org-hierarchy-page').then(m => ({ default: m.OrgHierarchyPage })))

function PageLoader() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-8 w-48" />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-28 rounded-xl" />
        ))}
      </div>
      <Skeleton className="h-64 rounded-xl" />
      <Skeleton className="h-48 rounded-xl" />
    </div>
  )
}

function AuthLoadingScreen() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-background">
      <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-600 flex items-center justify-center text-white font-bold text-xl">
        A360
      </div>
      <div className="flex items-center gap-3 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" />
        <span className="text-sm">Loading Attitude360...</span>
      </div>
    </div>
  )
}

function CRMApp() {
  const { data: session, status } = useSession()
  const { currentView, selectedId, navigate } = useCRMStore()

  // Auto-seed on first load and set default view for employee role
  useEffect(() => {
    async function seedIfEmpty() {
      try {
        const res = await fetch('/api/dashboard')
        if (!res.ok) {
          await fetch('/api/seed', { method: 'POST' })
        }
      } catch {
        try {
          await fetch('/api/seed', { method: 'POST' })
        } catch {
          // Ignore
        }
      }
    }
    seedIfEmpty()
  }, [])

  // Set default view for employee role
  useEffect(() => {
    if (session && session.user.role === 'EMPLOYEE' && currentView === 'dashboard') {
      navigate('my-dashboard')
    }
  }, [session, currentView, navigate])

  if (status === 'loading') {
    return <AuthLoadingScreen />
  }

  if (!session) {
    return <AuthPage />
  }

  // Set default view based on role
  const role = session.user.role

  const renderView = () => {
    switch (currentView) {
      case 'dashboard':
      case 'my-dashboard':
        return <DashboardPage />
      case 'candidates':
        return <CandidatesPage />
      case 'candidate-detail':
        return selectedId ? <CandidateDetail candidateId={selectedId} /> : <CandidatesPage />
      case 'clients':
        return <ClientsPage />
      case 'client-detail':
        return selectedId ? <ClientDetail clientId={selectedId} /> : <ClientsPage />
      case 'jobs':
        return <JobsPage />
      case 'job-detail':
        return selectedId ? <JobDetail jobId={selectedId} /> : <JobsPage />
      case 'attendance':
      case 'my-attendance':
        return <AttendancePage />
      case 'leave':
      case 'my-leave':
        return <LeavePage />
      case 'interviews':
        return <InterviewsPage />
      case 'placements':
        return <PlacementsPage />
      case 'employees':
        return <EmployeesPage />
      case 'employee-detail':
        return selectedId ? <EmployeeDetail employeeId={selectedId} /> : <EmployeesPage />
      case 'activity-feed':
        return <ActivityFeedPage />
      case 'notifications':
        return <NotificationCenter />
      case 'analytics':
        return <AnalyticsPage />
      case 'org-hierarchy':
        return <OrgHierarchyPage />
      case 'settings':
      case 'my-profile':
        return <SettingsPage />
      default:
        return <DashboardPage />
    }
  }

  return (
    <CRMLayout>
      <Suspense fallback={<PageLoader />}>
        {renderView()}
      </Suspense>
    </CRMLayout>
  )
}

export default function CRMPage() {
  return (
    <AuthProvider>
      <CRMApp />
    </AuthProvider>
  )
}
