'use client'

import { useSession } from 'next-auth/react'
import type { UserRole } from '@/lib/auth-utils'

export function useAuth() {
  const { data: session, status } = useSession()
  return {
    user: session?.user ?? null,
    role: (session?.user?.role as UserRole) ?? 'EMPLOYEE',
    employeeId: session?.user?.employeeId ?? null,
    isAuthenticated: status === 'authenticated',
    isLoading: status === 'loading',
  }
}
