'use client'

import { useEffect } from 'react'
import { useCRMStore } from '@/stores/crm-store'
import { CRMLayout } from '@/components/crm/crm-layout'
import { DashboardPage } from '@/components/crm/dashboard/dashboard-page'
import { CandidatesPage } from '@/components/crm/candidates/candidates-page'
import { CandidateDetail } from '@/components/crm/candidates/candidate-detail'
import { ClientsPage } from '@/components/crm/clients/clients-page'
import { ClientDetail } from '@/components/crm/clients/client-detail'
import { JobsPage } from '@/components/crm/jobs/jobs-page'
import { JobDetail } from '@/components/crm/jobs/job-detail'
import { AttendancePage } from '@/components/crm/attendance/attendance-page'
import { LeavePage } from '@/components/crm/leave/leave-page'
import { InterviewsPage } from '@/components/crm/interviews-page'
import { PlacementsPage } from '@/components/crm/placements-page'
import { EmployeesPage } from '@/components/crm/employees-page'

export default function CRMPage() {
  const { currentView, selectedId } = useCRMStore()

  // Auto-seed on first load
  useEffect(() => {
    async function seedIfEmpty() {
      try {
        const res = await fetch('/api/dashboard')
        if (!res.ok) {
          // Dashboard failed, try seeding
          await fetch('/api/seed', { method: 'POST' })
        }
      } catch {
        // Silently seed
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
      default:
        return <DashboardPage />
    }
  }

  return (
    <CRMLayout>
      {renderView()}
    </CRMLayout>
  )
}