'use client'

import { lazy, Suspense, useEffect } from 'react'
import { useCRMStore } from '@/stores/crm-store'
import { CRMLayout } from '@/components/crm/crm-layout'
import { Skeleton } from '@/components/ui/skeleton'

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
const AnalyticsPage = lazy(() => import('@/components/crm/analytics-page').then(m => ({ default: m.AnalyticsPage })))
const SettingsPage = lazy(() => import('@/components/crm/settings-page').then(m => ({ default: m.SettingsPage })))

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

export default function CRMPage() {
  const { currentView, selectedId } = useCRMStore()

  // Auto-seed on first load
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

  const renderView = () => {
    switch (currentView) {
      case 'dashboard':
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
        return <AttendancePage />
      case 'leave':
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
      case 'analytics':
        return <AnalyticsPage />
      case 'settings':
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
