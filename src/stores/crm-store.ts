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
  | 'employee-detail'
  | 'activity-feed'
  | 'notifications'
  | 'analytics'
  | 'settings'

export type CandidateFilter = {
  status: string
  search: string
  source: string
  fromDate: string
  toDate: string
}

export type JobFilter = {
  status: string
  priority: string
  search: string
}

export type AttendanceFilter = {
  date: string
  fromDate: string
  toDate: string
  status: string
}

export type LeaveFilter = {
  status: string
  type: string
  search: string
}

export type ClientFilter = {
  status: string
  search: string
  fromDate: string
  toDate: string
}

export type PlacementFilter = {
  status: string
  search: string
  fromDate: string
  toDate: string
}

interface CRMState {
  currentView: CRMView
  selectedId: string | null
  sidebarOpen: boolean
  candidateFilter: CandidateFilter
  jobFilter: JobFilter
  attendanceFilter: AttendanceFilter
  leaveFilter: LeaveFilter
  clientFilter: ClientFilter
  placementFilter: PlacementFilter

  navigate: (view: CRMView, id?: string) => void
  toggleSidebar: () => void
  setSidebarOpen: (open: boolean) => void
  setCandidateFilter: (filter: Partial<CandidateFilter>) => void
  setJobFilter: (filter: Partial<JobFilter>) => void
  setAttendanceFilter: (filter: Partial<AttendanceFilter>) => void
  setLeaveFilter: (filter: Partial<LeaveFilter>) => void
  setClientFilter: (filter: Partial<ClientFilter>) => void
  setPlacementFilter: (filter: Partial<PlacementFilter>) => void
}

export const useCRMStore = create<CRMState>((set) => ({
  currentView: 'dashboard',
  selectedId: null,
  sidebarOpen: true,
  candidateFilter: { status: 'All', search: '', source: 'All', fromDate: '', toDate: '' },
  jobFilter: { status: 'All', priority: 'All', search: '' },
  attendanceFilter: { date: new Date().toISOString().split('T')[0], fromDate: '', toDate: '', status: 'All' },
  leaveFilter: { status: 'All', type: 'All', search: '' },
  clientFilter: { status: 'All', search: '', fromDate: '', toDate: '' },
  placementFilter: { status: 'All', search: '', fromDate: '', toDate: '' },

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
  setClientFilter: (filter) =>
    set((s) => ({ clientFilter: { ...s.clientFilter, ...filter } })),
  setPlacementFilter: (filter) =>
    set((s) => ({ placementFilter: { ...s.placementFilter, ...filter } })),
}))
