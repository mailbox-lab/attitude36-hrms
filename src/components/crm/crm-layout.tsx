'use client'

import { useEffect } from 'react'
import { useCRMStore, type CRMView } from '@/stores/crm-store'
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
  BarChart3,
  Settings,
  Menu,
  ChevronLeft,
  HeadphonesIcon,
} from 'lucide-react'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { CommandPalette } from '@/components/crm/command-palette'
import { NotificationBell } from '@/components/crm/notification-bell'
import { ThemeToggle } from '@/components/crm/theme-toggle'
import { GlobalSearch } from '@/components/crm/global-search'

const navItems: { icon: typeof LayoutDashboard; label: string; view: CRMView; badge?: string; badgeColor?: string }[] = [
  { icon: LayoutDashboard, label: 'Dashboard', view: 'dashboard' },
  { icon: Users, label: 'Candidates', view: 'candidates', badge: 'Pipeline', badgeColor: 'bg-emerald-500' },
  { icon: Building2, label: 'Clients', view: 'clients' },
  { icon: Briefcase, label: 'Job Openings', view: 'jobs' },
  { icon: Clock, label: 'Attendance', view: 'attendance' },
  { icon: CalendarOff, label: 'Leave Mgmt', view: 'leave' },
  { icon: Video, label: 'Interviews', view: 'interviews' },
  { icon: Award, label: 'Placements', view: 'placements' },
  { icon: UserCog, label: 'Employees', view: 'employees' },
  { icon: BarChart3, label: 'Analytics', view: 'analytics', badge: 'Reports', badgeColor: 'bg-violet-500' },
  { icon: Settings, label: 'Settings', view: 'settings' },
]

export function CRMLayout({ children }: { children: React.ReactNode }) {
  const { currentView, sidebarOpen, toggleSidebar, setSidebarOpen, navigate } = useCRMStore()
  const isMobile = useIsMobile()

  useEffect(() => {
    if (isMobile) setSidebarOpen(false)
  }, [isMobile, setSidebarOpen])

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
          'flex h-14 items-center border-b transition-all duration-300',
          sidebarOpen ? 'gap-2 px-3' : 'justify-center',
        )}>
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-primary/80 text-primary-foreground font-bold text-sm shadow-sm">
            R
          </div>
          {sidebarOpen && (
            <div className="flex flex-col overflow-hidden">
              <span className="text-sm font-semibold tracking-tight">RecruitPro</span>
              <span className="text-[10px] text-muted-foreground">Recruitment CRM</span>
            </div>
          )}
        </div>

        {/* Navigation */}
        <ScrollArea className="flex-1 py-2">
          <nav className="flex flex-col gap-1 px-2">
            {navItems.map((item) => {
              const Icon = item.icon
              const isActive = currentView === item.view ||
                (item.view === 'candidates' && (currentView === 'candidate-detail')) ||
                (item.view === 'clients' && (currentView === 'client-detail')) ||
                (item.view === 'jobs' && (currentView === 'job-detail'))

              const needsDivider = item.view === 'attendance' || item.view === 'settings'
              const dividerLabel = item.view === 'attendance' ? 'HR & Attendance' : 'System'

              const btn = (
                <Button
                  key={item.view}
                  variant={isActive ? 'secondary' : 'ghost'}
                  className={cn(
                    'w-full justify-start gap-3 h-9 text-sm font-normal border-l-2 border-l-transparent',
                    isActive && 'font-medium bg-primary/10 text-primary hover:bg-primary/15 hover:text-primary border-l-primary',
                    !sidebarOpen && 'justify-center px-2',
                  )}
                  onClick={() => navigate(item.view)}
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

        {/* Bottom section */}
        <div className="border-t p-2">
          {sidebarOpen ? (
            <div className="flex items-center gap-3 rounded-lg px-2 py-2">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">AP</AvatarFallback>
              </Avatar>
              <div className="flex flex-col overflow-hidden">
                <span className="text-xs font-medium">Admin Panel</span>
                <span className="text-[10px] text-muted-foreground">admin@recruitpro.com</span>
              </div>
            </div>
          ) : (
            <Tooltip delayDuration={0}>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="w-full h-9">
                  <Avatar className="h-7 w-7">
                    <AvatarFallback className="bg-primary/10 text-primary text-[10px] font-semibold">AP</AvatarFallback>
                  </Avatar>
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">Admin Panel</TooltipContent>
            </Tooltip>
          )}
        </div>
      </aside>

      {/* Main Content */}
      <main
        className={cn(
          'flex flex-1 flex-col transition-all duration-300',
          sidebarOpen ? 'ml-64' : 'ml-16',
          isMobile && 'ml-0',
        )}
      >
        {/* Top bar */}
        <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-4" style={{ borderBottom: '1px solid transparent', backgroundImage: 'linear-gradient(to right, hsl(var(--border) / 0.6), hsl(var(--primary) / 0.15), hsl(var(--border) / 0.6))', backgroundSize: '100% 1px', backgroundRepeat: 'no-repeat', backgroundPosition: 'bottom' }}>
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
              {navItems.find((i) => i.view === currentView)?.label ?? 'Dashboard'}
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
        </header>

        {/* Page Content */}
        <div className="flex-1 overflow-auto p-4 md:p-6">
          {children}
        </div>

        {/* Footer */}
        <footer className="bg-background px-4 py-2">
          <div className="h-px bg-gradient-to-r from-transparent via-border to-transparent" />
          <div className="flex items-center justify-between pt-2 text-[11px] text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <span>© 2025 RecruitPro</span>
              <span className="text-muted-foreground/40">·</span>
              <span>Recruitment CRM</span>
            </div>
            <div className="hidden sm:flex items-center gap-3">
              <div className="flex items-center gap-1.5">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="animate-pulse absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75" />
                  <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
                </span>
                <span>System Online</span>
              </div>
              <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 font-normal text-muted-foreground">
                v1.1.0
              </Badge>
            </div>
            <span className="hidden sm:inline">Made with ♥ in India</span>
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

      <CommandPalette />
    </div>
  )
}
