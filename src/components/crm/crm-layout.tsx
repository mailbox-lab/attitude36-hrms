'use client'

import { useEffect, useRef, useCallback, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { signOut } from 'next-auth/react'
import { useCRMStore, type CRMView } from '@/stores/crm-store'
import { useAuth } from '@/lib/use-auth'
import { canAccess, ROLE_LABELS, ROLE_COLORS } from '@/lib/auth-utils'
import { cn } from '@/lib/utils'
import { useIsMobile } from '@/hooks/use-mobile'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import {
  LayoutDashboard,
  Users,
  Building2,
  Briefcase,
  Clock,
  CalendarOff,
  Video,
  Award,
  UserCog,
  Activity,
  BarChart3,
  Settings,
  Menu,
  ChevronLeft,
  HeadphonesIcon,
  Bell,
  Keyboard,
  LogOut,
} from 'lucide-react'
import Image from 'next/image'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { KeyboardShortcuts, dispatchOpenShortcuts } from '@/components/crm/keyboard-shortcuts'
import { CommandPalette } from '@/components/crm/command-palette'
import { NotificationBell } from '@/components/crm/notification-bell'
import { ThemeToggle } from '@/components/crm/theme-toggle'
import { GlobalSearch } from '@/components/crm/global-search'
import { BackToTop } from '@/components/crm/back-to-top'
import { LoadingProgress } from '@/components/crm/loading-progress'

const allNavItems: { icon: typeof LayoutDashboard; label: string; view: CRMView; badge?: string; badgeColor?: string; section?: string }[] = [
  // Employee-specific items (shown for EMPLOYEE role)
  { icon: LayoutDashboard, label: 'My Dashboard', view: 'my-dashboard', section: 'PERSONAL' },
  { icon: Clock, label: 'My Attendance', view: 'my-attendance', section: 'PERSONAL' },
  { icon: CalendarOff, label: 'My Leave', view: 'my-leave', section: 'PERSONAL' },
  { icon: UserCog, label: 'My Profile', view: 'my-profile', section: 'PERSONAL' },
  // Admin items (shown for FOUNDER, COFOUNDER, HR)
  { icon: LayoutDashboard, label: 'Dashboard', view: 'dashboard' },
  { icon: Users, label: 'Candidates', view: 'candidates', badge: 'Pipeline', badgeColor: 'bg-emerald-500' },
  { icon: Building2, label: 'Clients', view: 'clients' },
  { icon: Briefcase, label: 'Job Openings', view: 'jobs' },
  { icon: Clock, label: 'Attendance', view: 'attendance', section: 'HR & Attendance' },
  { icon: CalendarOff, label: 'Leave Mgmt', view: 'leave' },
  { icon: Video, label: 'Interviews', view: 'interviews' },
  { icon: Award, label: 'Placements', view: 'placements' },
  { icon: Activity, label: 'Activity', view: 'activity-feed', section: 'TRACKING' },
  { icon: Bell, label: 'Notifications', view: 'notifications', section: 'NOTIFICATIONS' },
  { icon: UserCog, label: 'Employees', view: 'employees' },
  { icon: BarChart3, label: 'Analytics', view: 'analytics', badge: 'Reports', badgeColor: 'bg-violet-500' },
  { icon: Settings, label: 'Settings', view: 'settings', section: 'System' },
]

function getInitials(name?: string | null): string {
  if (!name) return '??'
  return name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

export function CRMLayout({ children }: { children: React.ReactNode }) {
  const { currentView, sidebarOpen, toggleSidebar, setSidebarOpen, navigate } = useCRMStore()
  const { role, user } = useAuth()
  const isMobile = useIsMobile()
  const queryClient = useQueryClient()
  const contentRef = useRef<HTMLDivElement>(null)
  const isFetching = queryClient.isFetching() > 0
  const [loggingOut, setLoggingOut] = useState(false)

  // Filter nav items based on role permissions
  const navItems = allNavItems.filter((item) => canAccess(item.view, role))

  // Get the label for the current view from all items (not just filtered)
  const currentLabel = allNavItems.find((i) => i.view === currentView)?.label ?? 'Dashboard'

  useEffect(() => {
    if (isMobile) setSidebarOpen(false)
  }, [isMobile, setSidebarOpen])

  const handleLogout = useCallback(async () => {
    if (loggingOut) return
    setLoggingOut(true)
    try {
      await signOut({ redirect: false })
    } catch {
      // signOut failed, force reload anyway
    }
    // Force a full page reload to clear all client state
    window.location.replace(window.location.href)
  }, [loggingOut])

  return (
    <div className="flex h-screen bg-muted/30">
      {/* Sidebar */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-40 flex flex-col border-r bg-gradient-to-b from-card to-card/95 transition-all duration-300',
          sidebarOpen ? 'w-64' : 'w-16',
          isMobile && !sidebarOpen && '-translate-x-full',
          isMobile && sidebarOpen && 'translate-x-0',
        )}
      >
        {/* Logo */}
        <div className={cn(
          'flex h-14 shrink-0 items-center border-b transition-all duration-300',
          sidebarOpen ? 'gap-2.5 px-3' : 'justify-center',
        )}>
          <Image
            src="/logo.png"
            alt="Attitude360"
            width={sidebarOpen ? 32 : 28}
            height={sidebarOpen ? 32 : 28}
            className="shrink-0 rounded-lg object-contain"
          />
          {sidebarOpen && (
            <div className="flex flex-col overflow-hidden">
              <span className="text-sm font-semibold tracking-tight">Attitude360</span>
              <span className="text-[10px] text-muted-foreground">HR Management System</span>
            </div>
          )}
        </div>

        {/* Navigation - must use min-h-0 for flex scroll to work */}
        <div className="min-h-0 flex-1 overflow-hidden">
          <ScrollArea className="h-full">
            <nav className="flex flex-col gap-1 px-2 py-2">
              {navItems.map((item) => {
                const Icon = item.icon
                const isActive = currentView === item.view ||
                  (item.view === 'candidates' && (currentView === 'candidate-detail')) ||
                  (item.view === 'clients' && (currentView === 'client-detail')) ||
                  (item.view === 'jobs' && (currentView === 'job-detail')) ||
                  (item.view === 'employees' && (currentView === 'employee-detail'))

                const needsDivider = item.view === 'attendance' || item.view === 'settings' || !!item.section
                const dividerLabel = item.view === 'attendance' ? 'HR & Attendance' : item.view === 'settings' ? 'System' : item.section || ''

                const btn = (
                  <Button
                    key={item.view}
                    variant={isActive ? 'secondary' : 'ghost'}
                    className={cn(
                      'w-full justify-start gap-3 h-9 text-sm font-normal border-l-2 border-l-transparent',
                      isActive && 'font-medium bg-primary/10 text-primary hover:bg-primary/15 hover:text-primary border-l-primary',
                      !sidebarOpen && 'justify-center px-2',
                    )}
                    onClick={() => {
                      navigate(item.view)
                      if (isMobile) setSidebarOpen(false)
                    }}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    {sidebarOpen && <span className="truncate">{item.label}</span>}
                    {sidebarOpen && item.badge && (
                      <Badge className={cn('ml-auto text-[10px] px-1.5 py-0 h-4', item.badgeColor)}>
                        {item.badge}
                      </Badge>
                    )}
                  </Button>
                )

                if (!sidebarOpen) {
                  return (
                    <div key={item.view}>
                      {needsDivider && <Separator className="my-2" />}
                      <Tooltip delayDuration={0}>
                        <TooltipTrigger asChild>{btn}</TooltipTrigger>
                        <TooltipContent side="right" className="flex items-center gap-2">
                          {item.label}
                          {item.badge && (
                            <Badge className={cn('text-[10px] px-1.5 py-0 h-4', item.badgeColor)}>
                              {item.badge}
                            </Badge>
                          )}
                        </TooltipContent>
                      </Tooltip>
                    </div>
                  )
                }

                return (
                  <div key={item.view}>
                    {needsDivider && (
                      <div className="text-[10px] uppercase tracking-wider text-muted-foreground/60 px-3 pt-4 pb-1">
                        {dividerLabel}
                      </div>
                    )}
                    {btn}
                  </div>
                )
              })}
            </nav>
          </ScrollArea>
        </div>

        {/* Bottom section - User info & Logout (always visible, never scrolls) */}
        <div className="shrink-0 border-t p-2">
          {sidebarOpen ? (
            <div className="space-y-1 px-2">
              <div className="flex items-center gap-3 rounded-lg px-2 py-2">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400 text-xs font-semibold">
                    {getInitials(user?.name)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-col overflow-hidden flex-1">
                  <span className="text-xs font-medium truncate">{user?.name ?? 'User'}</span>
                  <Badge
                    variant="secondary"
                    className={cn('text-[9px] px-1.5 py-0 h-4 w-fit font-normal', ROLE_COLORS[role])}
                  >
                    {ROLE_LABELS[role]}
                  </Badge>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start gap-2 text-muted-foreground hover:text-red-500 hover:bg-red-500/10 h-9 text-xs"
                onClick={handleLogout}
                disabled={loggingOut}
              >
                {loggingOut ? (
                  <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
                ) : (
                  <LogOut className="h-3.5 w-3.5" />
                )}
                {loggingOut ? 'Signing out...' : 'Sign Out'}
              </Button>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-1">
              <Tooltip delayDuration={0}>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" className="w-full h-9">
                    <Avatar className="h-7 w-7">
                      <AvatarFallback className="bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400 text-[10px] font-semibold">
                        {getInitials(user?.name)}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="right">
                  <div className="flex flex-col gap-1">
                    <span className="font-medium">{user?.name ?? 'User'}</span>
                    <Badge variant="secondary" className={cn('text-[9px] px-1.5 py-0 h-4 w-fit font-normal', ROLE_COLORS[role])}>
                      {ROLE_LABELS[role]}
                    </Badge>
                  </div>
                </TooltipContent>
              </Tooltip>
              <Tooltip delayDuration={0}>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="w-full h-9 text-muted-foreground hover:text-red-500 hover:bg-red-500/10"
                    onClick={handleLogout}
                    disabled={loggingOut}
                  >
                    {loggingOut ? (
                      <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    ) : (
                      <LogOut className="h-3.5 w-3.5" />
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="right">{loggingOut ? 'Signing out...' : 'Sign Out'}</TooltipContent>
              </Tooltip>
            </div>
          )}
        </div>
      </aside>

      {/* Main Content */}
      <main
        className={cn(
          'flex flex-1 flex-col transition-all duration-300 min-w-0',
          sidebarOpen ? 'ml-64' : 'ml-16',
          isMobile && 'ml-0',
        )}
      >
        {/* Top bar */}
        <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center gap-3 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-4" style={{ borderBottom: '1px solid transparent', backgroundImage: 'linear-gradient(to right, hsl(var(--border) / 0.6), hsl(var(--primary) / 0.15), hsl(var(--border) / 0.6))', backgroundSize: '100% 1px', backgroundRepeat: 'no-repeat', backgroundPosition: 'bottom' }}>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={toggleSidebar}
          >
            {sidebarOpen ? <ChevronLeft className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </Button>
          <Separator orientation="vertical" className="h-6" />
          <GlobalSearch />
          <div className="hidden md:flex flex-1">
            <h2 className="text-sm font-semibold">
              {currentLabel}
            </h2>
          </div>
          <NotificationBell />
          <ThemeToggle />
          <Tooltip delayDuration={0}>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <HeadphonesIcon className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Support</TooltipContent>
          </Tooltip>
          <Tooltip delayDuration={0}>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={dispatchOpenShortcuts}>
                <Keyboard className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Keyboard Shortcuts (?)</TooltipContent>
          </Tooltip>
        </header>

        {/* Loading Progress Bar */}
        <LoadingProgress isLoading={isFetching} />

        {/* Page Content */}
        <div ref={contentRef} className="flex-1 overflow-auto p-4 md:p-6">
          {children}
          <BackToTop scrollContainerRef={contentRef} />
        </div>

        {/* Footer */}
        <footer className="shrink-0 bg-background px-4 py-2">
          <div className="h-px bg-gradient-to-r from-transparent via-emerald-500/30 to-transparent" />
          <div className="flex items-center justify-between pt-2 text-[11px] text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <span>© 2025 Attitude360</span>
              <span className="text-muted-foreground/40">·</span>
              <span>HR Management System</span>
            </div>
            <div className="hidden sm:flex items-center gap-3">
              <div className="flex items-center gap-1.5">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="animate-subtle-pulse absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75" />
                  <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
                </span>
                <span>System Online</span>
              </div>
              <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 font-normal text-muted-foreground">
                v2.1.0
              </Badge>
            </div>
            <span className="hidden sm:inline">Made with <span className="animate-dot-pulse inline-block">♥</span> in India</span>
          </div>
        </footer>
      </main>

      {/* Mobile overlay */}
      {isMobile && sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <KeyboardShortcuts />
      <CommandPalette />
    </div>
  )
}
