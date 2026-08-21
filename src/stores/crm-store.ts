import { create } from 'zustand'

export type CRMView =
  | 'dashboard'
  | 'candidates'
  | 'candidate-detail'
  | 'clients'
  | 'client-detail'
  | 'jobs'
  | 'job-detail'
  | 'attendance'
  | 'leave'
  | 'interviews'
  | 'placements'
  | 'employees'
  | 'analytics'
  | 'settings'

export type CandidateFilter = {
  status: string
  search: string
  source: string
}

export type JobFilter = {
  status: string
  priority: string
  search: string
}

export type AttendanceFilter = {
  date: string
  status: string
}

export type LeaveFilter = {
  status: string
  type: string
}

interface CRMState {
  currentView: CRMView
  selectedId: string | null
  sidebarOpen: boolean
  candidateFilter: CandidateFilter
  jobFilter: JobFilter
  attendanceFilter: AttendanceFilter
  leaveFilter: LeaveFilter

  navigate: (view: CRMView, id?: string) => void
  toggleSidebar: () => void
  setSidebarOpen: (open: boolean) => void
  setCandidateFilter: (filter: Partial<CandidateFilter>) => void
  setJobFilter: (filter: Partial<JobFilter>) => void
  setAttendanceFilter: (filter: Partial<AttendanceFilter>) => void
  setLeaveFilter: (filter: Partial<LeaveFilter>) => void
}

export const useCRMStore = create<CRMState>((set) => ({
  currentView: 'dashboard',
  selectedId: null,
  sidebarOpen: true,
  candidateFilter: { status: 'All', search: '', source: 'All' },
  jobFilter: { status: 'All', priority: 'All', search: '' },
  attendanceFilter: { date: new Date().toISOString().split('T')[0], status: 'All' },
  leaveFilter: { status: 'All', type: 'All' },

  navigate: (view, id) => set({ currentView: view, selectedId: id ?? null }),
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  setCandidateFilter: (filter) =>
    set((s) => ({ candidateFilter: { ...s.candidateFilter, ...filter } })),
  setJobFilter: (filter) =>
    set((s) => ({ jobFilter: { ...s.jobFilter, ...filter } })),
  setAttendanceFilter: (filter) =>
    set((s) => ({ attendanceFilter: { ...s.attendanceFilter, ...filter } })),
  setLeaveFilter: (filter) =>
    set((s) => ({ leaveFilter: { ...s.leaveFilter, ...filter } })),
}))
