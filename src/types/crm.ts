// Shared types for CRM

export type CandidateStatus =
  | 'New' | 'Screening' | 'Interview' | 'Offer' | 'Hired' | 'Rejected' | 'On-Hold'

export type JobStatus = 'Open' | 'On-Hold' | 'Closed' | 'Filled'

export type JobPriority = 'Low' | 'Medium' | 'High' | 'Urgent'

export type EmploymentType = 'Full-Time' | 'Part-Time' | 'Contract' | 'Remote'

export type InterviewType = 'Phone' | 'Technical' | 'HR' | 'Managerial' | 'Final'

export type InterviewStatus = 'Scheduled' | 'Completed' | 'Cancelled' | 'No-Show'

export type PlacementStatus = 'Offered' | 'Accepted' | 'Joined' | 'Backed-Out'

export type AttendanceStatus = 'Present' | 'Absent' | 'Half-Day' | 'Work-From-Home'

export type LeaveType = 'Casual' | 'Sick' | 'Earned' | 'Maternity' | 'Paternity'

export type LeaveStatus = 'Pending' | 'Approved' | 'Rejected' | 'Cancelled'

export type ClientStatus = 'Active' | 'Inactive' | 'Prospect'

export type EmployeeRole = 'Admin' | 'Manager' | 'Recruiter' | 'HR'

export const CANDIDATE_STATUSES: CandidateStatus[] = [
  'New', 'Screening', 'Interview', 'Offer', 'Hired', 'Rejected', 'On-Hold'
]

export const JOB_STATUSES: JobStatus[] = ['Open', 'On-Hold', 'Closed', 'Filled']

export const JOB_PRIORITIES: JobPriority[] = ['Low', 'Medium', 'High', 'Urgent']

export const EMPLOYMENT_TYPES: EmploymentType[] = ['Full-Time', 'Part-Time', 'Contract', 'Remote']

export const INTERVIEW_TYPES: InterviewType[] = ['Phone', 'Technical', 'HR', 'Managerial', 'Final']

export const ATTENDANCE_STATUSES: AttendanceStatus[] = ['Present', 'Absent', 'Half-Day', 'Work-From-Home']

export const LEAVE_TYPES: LeaveType[] = ['Casual', 'Sick', 'Earned', 'Maternity', 'Paternity']

export const LEAVE_STATUSES: LeaveStatus[] = ['Pending', 'Approved', 'Rejected', 'Cancelled']

export const CLIENT_STATUSES: ClientStatus[] = ['Active', 'Inactive', 'Prospect']

export const EMPLOYEE_ROLES: EmployeeRole[] = ['Admin', 'Manager', 'Recruiter', 'HR']

export const SOURCES = [
  'LinkedIn', 'Referral', 'Job Portal', 'Direct', 'Naukri', 'Indeed', 'Walk-in', 'Other'
]

export const INDUSTRIES = [
  'Information Technology', 'Banking & Finance', 'Healthcare', 'Manufacturing',
  'Retail', 'Education', 'Real Estate', 'Consulting', 'Telecom', 'Other'
]