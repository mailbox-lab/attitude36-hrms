'use client'

import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useQuery } from '@tanstack/react-query'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Users,
  ChevronDown,
  ChevronRight,
  Building2,
  UserCircle,
  Crown,
  Mail,
  Briefcase,
  Network,
} from 'lucide-react'
import { ROLE_COLORS, ROLE_LABELS, type UserRole } from '@/lib/auth-utils'

// ===== Types =====

type Employee = {
  id: string
  name: string
  email: string
  phone: string | null
  role: string
  department: string | null
  designation: string | null
  reportingToId: string | null
  isActive: boolean
  avatar: string | null
}

interface TreeNode {
  employee: Employee
  children: TreeNode[]
}

// ===== Constants =====

const AVATAR_COLORS: Record<string, string> = {
  FOUNDER: 'bg-amber-500 text-white',
  COFOUNDER: 'bg-orange-500 text-white',
  HR: 'bg-teal-500 text-white',
  EMPLOYEE: 'bg-emerald-500 text-white',
}

const AVATAR_RING_COLORS: Record<string, string> = {
  FOUNDER: 'ring-amber-300 dark:ring-amber-700',
  COFOUNDER: 'ring-orange-300 dark:ring-orange-700',
  HR: 'ring-teal-300 dark:ring-teal-700',
  EMPLOYEE: 'ring-emerald-300 dark:ring-emerald-700',
}

// ===== Helpers =====

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((w) => w.charAt(0))
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

function getAvatarColor(role: string): string {
  return AVATAR_COLORS[role] ?? AVATAR_COLORS.EMPLOYEE
}

function getAvatarRingColor(role: string): string {
  return AVATAR_RING_COLORS[role] ?? AVATAR_RING_COLORS.EMPLOYEE
}

function getRoleBadgeClass(role: string): string {
  return ROLE_COLORS[role as UserRole] ?? ROLE_COLORS.EMPLOYEE
}

function getRoleLabel(role: string): string {
  return ROLE_LABELS[role as UserRole] ?? role
}

function getRoleIcon(role: string) {
  switch (role) {
    case 'FOUNDER':
      return <Crown className="h-4 w-4" />
    case 'COFOUNDER':
      return <Crown className="h-4 w-4" />
    case 'HR':
      return <UserCircle className="h-4 w-4" />
    default:
      return <Users className="h-4 w-4" />
  }
}

// ===== Tree Building =====

function buildTree(employees: Employee[]): TreeNode[] {
  const employeeMap = new Map<string, Employee>()
  const childrenMap = new Map<string, Employee[]>()

  for (const emp of employees) {
    if (!emp.isActive) continue
    employeeMap.set(emp.id, emp)
    if (emp.reportingToId) {
      const existing = childrenMap.get(emp.reportingToId) ?? []
      existing.push(emp)
      childrenMap.set(emp.reportingToId, existing)
    }
  }

  // Root nodes: FOUNDER/COFOUNDER with no reportingToId
  const roots: Employee[] = []
  const nonRootOrphans: Employee[] = []

  for (const emp of employeeMap.values()) {
    if (!emp.reportingToId) {
      roots.push(emp)
    } else if (!employeeMap.has(emp.reportingToId)) {
      // reportingTo points to non-existent/inactive employee, treat as root
      nonRootOrphans.push(emp)
    }
  }

  // Sort roots: FOUNDER first, then COFOUNDER
  roots.sort((a, b) => {
    const order: Record<string, number> = { FOUNDER: 0, COFOUNDER: 1 }
    return (order[a.role] ?? 99) - (order[b.role] ?? 99)
  })

  const allRoots = [...roots, ...nonRootOrphans]

  function buildNode(emp: Employee): TreeNode {
    const children = (childrenMap.get(emp.id) ?? []).map(buildNode)
    // Sort children: HR first, then by name
    children.sort((a, b) => {
      const order: Record<string, number> = { COFOUNDER: 0, HR: 1, EMPLOYEE: 2 }
      const roleDiff = (order[a.employee.role] ?? 99) - (order[b.employee.role] ?? 99)
      if (roleDiff !== 0) return roleDiff
      return a.employee.name.localeCompare(b.employee.name)
    })
    return { employee: emp, children }
  }

  return allRoots.map(buildNode)
}

// ===== Employee Card Node =====

function EmployeeCard({
  employee,
  reporteeCount,
  isExpanded,
  onToggle,
  depth = 0,
}: {
  employee: Employee
  reporteeCount: number
  isExpanded: boolean
  onToggle: () => void
  depth?: number
}) {
  const initials = getInitials(employee.name)
  const avatarColor = getAvatarColor(employee.role)
  const ringColor = getAvatarRingColor(employee.role)
  const badgeClass = getRoleBadgeClass(employee.role)
  const roleLabel = getRoleLabel(employee.role)
  const RoleIcon = getRoleIcon(employee.role)
  const hasChildren = reporteeCount > 0

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{
        duration: 0.4,
        delay: depth * 0.1,
        ease: [0.25, 0.46, 0.45, 0.94],
      }}
      className="flex flex-col items-center"
    >
      <Card className="card-glass w-56 sm:w-64 rounded-xl shadow-md hover:shadow-lg transition-all duration-300 hover:-translate-y-1 cursor-default overflow-hidden">
        <CardContent className="p-4 flex flex-col items-center text-center gap-2.5">
          {/* Avatar */}
          <div className="relative">
            <div
              className={`w-14 h-14 rounded-full ${avatarColor} flex items-center justify-center text-lg font-bold ring-2 ${ringColor} ring-offset-2 ring-offset-background shadow-sm`}
            >
              {initials}
            </div>
            {hasChildren && (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onToggle()
                }}
                className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-background border border-border flex items-center justify-center hover:bg-muted transition-colors shadow-sm"
                aria-label={isExpanded ? 'Collapse' : 'Expand'}
              >
                {isExpanded ? (
                  <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                ) : (
                  <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
                )}
              </button>
            )}
          </div>

          {/* Name & Designation */}
          <div className="flex flex-col gap-0.5 min-w-0 w-full">
            <p className="font-semibold text-sm truncate text-foreground">
              {employee.name}
            </p>
            {employee.designation && (
              <p className="text-xs text-muted-foreground truncate flex items-center justify-center gap-1">
                <Briefcase className="h-3 w-3 shrink-0" />
                {employee.designation}
              </p>
            )}
          </div>

          {/* Department */}
          {employee.department && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Building2 className="h-3 w-3 shrink-0" />
              <span className="truncate">{employee.department}</span>
            </div>
          )}

          {/* Role Badge */}
          <Badge
            variant="secondary"
            className={`${badgeClass} text-xs font-medium px-2.5 py-0.5 gap-1 border-0`}
          >
            {RoleIcon}
            {roleLabel}
          </Badge>

          {/* Reportee Count */}
          {hasChildren && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Users className="h-3 w-3" />
              <span>
                {reporteeCount} reportee{reporteeCount !== 1 ? 's' : ''}
              </span>
            </div>
          )}

          {/* Contact row */}
          <div className="flex items-center gap-3 text-muted-foreground">
            {employee.email && (
              <span className="flex items-center gap-1 text-xs truncate max-w-[120px]">
                <Mail className="h-3 w-3 shrink-0" />
                <span className="truncate">{employee.email.split('@')[0]}</span>
              </span>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

// ===== Tree Node Renderer =====

function TreeBranch({
  node,
  depth = 0,
}: {
  node: TreeNode
  depth?: number
}) {
  const [isExpanded, setIsExpanded] = useState(true)
  const hasChildren = node.children.length > 0

  const countAllReportees = (n: TreeNode): number => {
    return n.children.reduce((acc, child) => acc + 1 + countAllReportees(child), 0)
  }

  const totalReportees = countAllReportees(node)

  return (
    <div className="flex flex-col items-center">
      {/* Current node card */}
      <EmployeeCard
        employee={node.employee}
        reporteeCount={totalReportees}
        isExpanded={isExpanded}
        onToggle={() => setIsExpanded((prev) => !prev)}
        depth={depth}
      />

      {/* Children */}
      <AnimatePresence initial={false}>
        {hasChildren && isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="w-full overflow-hidden"
          >
            {/* Desktop: horizontal tree layout */}
            <div className="hidden md:block">
              <DesktopTreeChildren
                nodes={node.children}
                parentDepth={depth}
              />
            </div>

            {/* Mobile: vertical tree layout */}
            <div className="block md:hidden">
              <MobileTreeChildren
                nodes={node.children}
                parentDepth={depth}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ===== Desktop Horizontal Tree =====

function DesktopTreeChildren({
  nodes,
  parentDepth,
}: {
  nodes: TreeNode[]
  parentDepth: number
}) {
  if (nodes.length === 0) return null

  return (
    <div className="flex flex-col items-center">
      {/* Vertical line down from parent */}
      <div className={`w-px h-6 bg-amber-300 dark:bg-amber-700`} />

      {/* Children row */}
      <div className="flex items-start gap-0">
        {nodes.map((childNode, index) => {
          const isLast = index === nodes.length - 1
          const isFirst = index === 0

          return (
            <div key={childNode.employee.id} className="flex flex-col items-center">
              {/* Horizontal connector line */}
              <div className="flex items-center">
                {/* Horizontal line segment (only if not first child) */}
                {!isFirst && (
                  <div className={`w-6 h-px bg-amber-300 dark:bg-amber-700`} />
                )}
                {/* Horizontal line extends from this point to next sibling (if not last) */}
                {!isLast && (
                  <div className={`w-6 h-px bg-amber-300 dark:bg-amber-700`} />
                )}
                {/* Vertical stub down to child */}
                <div className={`w-px h-6 bg-amber-300 dark:bg-amber-700`} />
              </div>

              {/* The child tree node */}
              <div className="px-2">
                <TreeBranch node={childNode} depth={parentDepth + 1} />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ===== Mobile Vertical Tree =====

function MobileTreeChildren({
  nodes,
  parentDepth,
}: {
  nodes: TreeNode[]
  parentDepth: number
}) {
  if (nodes.length === 0) return null

  return (
    <div className="flex flex-col items-center ml-4 mt-2 space-y-4 border-l-2 border-amber-300 dark:border-amber-700 pl-4">
      {nodes.map((childNode) => (
        <div
          key={childNode.employee.id}
          className="relative flex flex-col items-center"
        >
          {/* Horizontal stub from left border to card */}
          <div className="absolute -left-4 top-7 w-4 h-px bg-amber-300 dark:bg-amber-700" />
          <TreeBranch node={childNode} depth={parentDepth + 1} />
        </div>
      ))}
    </div>
  )
}

// ===== Empty State =====

function EmptyState() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="flex flex-col items-center justify-center py-20 px-4"
    >
      <div className="w-20 h-20 rounded-full bg-amber-100 dark:bg-amber-950 flex items-center justify-center mb-6">
        <Network className="h-10 w-10 text-amber-600 dark:text-amber-400" />
      </div>
      <h3 className="text-lg font-semibold text-foreground mb-2">
        No Organization Structure Yet
      </h3>
      <p className="text-sm text-muted-foreground text-center max-w-md">
        Add employees and set up their reporting lines to visualize the
        organization hierarchy here.
      </p>
    </motion.div>
  )
}

// ===== Legend =====

function RoleLegend() {
  const roles: { role: UserRole; label: string; icon: React.ReactNode }[] = [
    { role: 'FOUNDER', label: 'Founder', icon: <Crown className="h-3.5 w-3.5" /> },
    { role: 'COFOUNDER', label: 'Co-Founder', icon: <Crown className="h-3.5 w-3.5" /> },
    { role: 'HR', label: 'HR Manager', icon: <UserCircle className="h-3.5 w-3.5" /> },
    { role: 'EMPLOYEE', label: 'Employee', icon: <Users className="h-3.5 w-3.5" /> },
  ]

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.3 }}
      className="mt-8"
    >
      <Card className="card-glass rounded-xl shadow-sm max-w-md mx-auto">
        <CardContent className="p-4">
          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-1.5">
            <Network className="h-3.5 w-3.5" />
            Role Legend
          </h4>
          <div className="flex flex-wrap gap-3 justify-center">
            {roles.map(({ role, label, icon }) => (
              <div key={role} className="flex items-center gap-2">
                <div
                  className={`w-3 h-3 rounded-full ${AVATAR_COLORS[role]}`}
                />
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  {icon}
                  {label}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

// ===== Skeleton Loader =====

function HierarchySkeleton() {
  return (
    <div className="flex flex-col items-center gap-6 py-8">
      <Skeleton className="h-4 w-32" />
      <div className="flex flex-col items-center gap-4">
        <Skeleton className="h-52 w-64 rounded-xl" />
        <Skeleton className="w-px h-6" />
        <div className="flex gap-4">
          <Skeleton className="h-52 w-64 rounded-xl" />
          <Skeleton className="h-52 w-64 rounded-xl" />
        </div>
      </div>
    </div>
  )
}

// ===== Main Page Component =====

export function OrgHierarchyPage() {
  const { data, isLoading, isError } = useQuery<{
    data: Employee[]
  }>({
    queryKey: ['employees'],
    queryFn: async () => {
      const res = await fetch('/api/employees')
      if (!res.ok) throw new Error('Failed to fetch employees')
      return res.json()
    },
  })

  const tree = useMemo(() => {
    if (!data?.data) return []
    return buildTree(data.data)
  }, [data])

  const totalEmployees = data?.data?.filter((e) => e.isActive).length ?? 0
  const totalDepartments = useMemo(() => {
    if (!data?.data) return new Set<string>()
    const depts = new Set<string>()
    data.data.forEach((e) => {
      if (e.isActive && e.department) depts.add(e.department)
    })
    return depts
  }, [data])

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <div className="flex items-center gap-3 mb-1">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 text-white shadow-md">
            <Network className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              Organization Hierarchy
            </h1>
            <p className="text-sm text-muted-foreground">
              Visual representation of the company reporting structure
            </p>
          </div>
        </div>
        <div className="h-1 w-24 rounded-full bg-gradient-to-r from-amber-500 via-orange-400 to-teal-500 mt-3" />
      </motion.div>

      {/* Stats Bar */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className="flex flex-wrap gap-3"
      >
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800">
          <Users className="h-4 w-4 text-amber-600 dark:text-amber-400" />
          <span className="text-sm font-medium text-amber-800 dark:text-amber-300">
            {totalEmployees} Member{totalEmployees !== 1 ? 's' : ''}
          </span>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-teal-50 dark:bg-teal-950/50 border border-teal-200 dark:border-teal-800">
          <Building2 className="h-4 w-4 text-teal-600 dark:text-teal-400" />
          <span className="text-sm font-medium text-teal-800 dark:text-teal-300">
            {totalDepartments.size} Department{totalDepartments.size !== 1 ? 's' : ''}
          </span>
        </div>
      </motion.div>

      {/* Content */}
      {isLoading && <HierarchySkeleton />}

      {isError && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center justify-center py-16"
        >
          <p className="text-sm text-destructive">
            Failed to load organization data. Please try again later.
          </p>
        </motion.div>
      )}

      {!isLoading && !isError && tree.length === 0 && <EmptyState />}

      {!isLoading && !isError && tree.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.15 }}
          className="overflow-x-auto pb-4"
        >
          <div className="flex flex-col items-center min-w-max px-4">
            {tree.map((rootNode) => (
              <TreeBranch
                key={rootNode.employee.id}
                node={rootNode}
                depth={0}
              />
            ))}
          </div>
        </motion.div>
      )}

      {/* Legend */}
      {!isLoading && !isError && tree.length > 0 && <RoleLegend />}
    </div>
  )
}