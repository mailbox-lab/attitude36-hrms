import type { Employee } from '@prisma/client'

export type UserRole = 'FOUNDER' | 'COFOUNDER' | 'HR' | 'EMPLOYEE'

export const ROLE_LABELS: Record<UserRole, string> = {
  FOUNDER: 'Founder',
  COFOUNDER: 'Co-Founder',
  HR: 'HR Manager',
  EMPLOYEE: 'Employee',
}

export const ROLE_COLORS: Record<UserRole, string> = {
  FOUNDER: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300',
  COFOUNDER: 'bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-300',
  HR: 'bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-300',
  EMPLOYEE: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-400',
}

export const ROLE_HIERARCHY: Record<UserRole, number> = {
  FOUNDER: 4,
  COFOUNDER: 3,
  HR: 2,
  EMPLOYEE: 1,
}

// Permission checks for navigation
export function canAccess(module: string, role: UserRole): boolean {
  const permissions: Record<UserRole, string[]> = {
    FOUNDER: ['dashboard', 'candidates', 'clients', 'jobs', 'attendance', 'leave', 'interviews', 'placements', 'employees', 'activity-feed', 'notifications', 'analytics', 'settings', 'org-hierarchy', 'my-attendance', 'my-leave', 'my-profile'],
    COFOUNDER: ['dashboard', 'candidates', 'clients', 'jobs', 'attendance', 'leave', 'interviews', 'placements', 'employees', 'activity-feed', 'notifications', 'analytics', 'settings', 'org-hierarchy', 'my-attendance', 'my-leave', 'my-profile'],
    HR: ['dashboard', 'candidates', 'clients', 'jobs', 'attendance', 'leave', 'interviews', 'placements', 'employees', 'activity-feed', 'notifications', 'analytics', 'org-hierarchy', 'my-attendance', 'my-leave', 'my-profile'],
    EMPLOYEE: ['my-dashboard', 'my-attendance', 'my-leave', 'my-profile', 'notifications', 'org-hierarchy'],
  }
  return permissions[role]?.includes(module) ?? false
}

export function isAdmin(role: UserRole): boolean {
  return role === 'FOUNDER' || role === 'COFOUNDER' || role === 'HR'
}

export function isTopLevel(role: UserRole): boolean {
  return role === 'FOUNDER' || role === 'COFOUNDER'
}

/**
 * Determine the approval chain for a leave request based on requester's role.
 * Returns the approval steps required.
 * 
 * Employee → Step 1: HR approval (final)
 * HR → Step 1: Founder/Co-Founder approval (final)
 * Founder/Co-Founder → No approval needed (auto-approved)
 */
export function getApprovalChain(requesterRole: UserRole): {
  steps: { level: number; approverRole: string; label: string }[]
  autoApprove: boolean
} {
  if (isTopLevel(requesterRole)) {
    return { steps: [], autoApprove: true }
  }

  if (requesterRole === 'HR') {
    return {
      steps: [{
        level: 1,
        approverRole: 'FOUNDER_OR_COFOUNDER',
        label: 'Founder / Co-Founder',
      }],
      autoApprove: false,
    }
  }

  // EMPLOYEE
  return {
    steps: [{
      level: 1,
      approverRole: 'HR',
      label: 'HR Manager',
    }],
    autoApprove: false,
  }
}

/**
 * Check if a user with given role can approve a leave request at a given approval step.
 */
export function canApproveAtStep(
  userRole: UserRole,
  approvalStep: number | null,
  approverRole: string | null
): boolean {
  if (!approvalStep || !approverRole) return false

  if (approverRole === 'HR' && userRole === 'HR') return true
  if (approverRole === 'FOUNDER_OR_COFOUNDER' && isTopLevel(userRole)) return true

  return false
}

/**
 * Get the next approval step info for a leave request.
 */
export function getNextApprovalInfo(
  requesterRole: UserRole,
  currentStep: number | null
): { level: number; approverRole: string; label: string } | null {
  const chain = getApprovalChain(requesterRole)
  if (chain.autoApprove) return null

  const nextStep = chain.steps.find((s) => s.level > (currentStep ?? 0))
  return nextStep ?? null
}

/**
 * Check if a user can approve a specific leave request.
 */
export function canApproveLeave(
  userRole: UserRole,
  requesterRole: UserRole,
  approvalStep: number | null,
  approverRole: string | null
): boolean {
  if (approvalStep === null) return false // Already finalized
  return canApproveAtStep(userRole, approvalStep, approverRole)
}

/**
 * Get the display label for the approval chain status.
 */
export function getApprovalStatusLabel(
  approvalStep: number | null,
  approverRole: string | null,
  status: string
): string {
  if (status === 'Approved') return 'Fully Approved'
  if (status === 'Rejected') return 'Rejected'
  if (status === 'Cancelled') return 'Cancelled'
  if (!approvalStep || !approverRole) return 'Pending'
  
  if (approvalStep === 1) {
    return approverRole === 'HR' ? 'Pending HR Approval' : 'Pending Founder Approval'
  }
  if (approvalStep === 2) {
    return 'Pending Level 2 Approval'
  }
  return 'Pending'
}
