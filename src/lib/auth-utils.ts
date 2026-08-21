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
  EMPLOYEE: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300',
}

// Permission checks
export function canAccess(module: string, role: UserRole): boolean {
  const permissions: Record<UserRole, string[]> = {
    FOUNDER: ['dashboard', 'candidates', 'clients', 'jobs', 'attendance', 'leave', 'interviews', 'placements', 'employees', 'activity-feed', 'notifications', 'analytics', 'settings', 'my-attendance', 'my-leave', 'my-profile'],
    COFOUNDER: ['dashboard', 'candidates', 'clients', 'jobs', 'attendance', 'leave', 'interviews', 'placements', 'employees', 'activity-feed', 'notifications', 'analytics', 'settings', 'my-attendance', 'my-leave', 'my-profile'],
    HR: ['dashboard', 'candidates', 'clients', 'jobs', 'attendance', 'leave', 'interviews', 'placements', 'employees', 'activity-feed', 'notifications', 'analytics', 'my-attendance', 'my-leave', 'my-profile'],
    EMPLOYEE: ['my-dashboard', 'my-attendance', 'my-leave', 'my-profile', 'notifications'],
  }
  return permissions[role]?.includes(module) ?? false
}

export function isAdmin(role: UserRole): boolean {
  return role === 'FOUNDER' || role === 'COFOUNDER' || role === 'HR'
}
