'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { AnimatePresence, motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import {
  ChevronsLeft,
  ChevronsRight,
  CalendarDays,
  CalendarX,
  CalendarPlus,
  User,
  Clock,
  MapPin,
  Plus,
  Video,
} from 'lucide-react'

// ===== Types =====

type Interview = {
  id: string
  candidateId: string
  candidate: { id: string; firstName: string; lastName: string }
  jobId: string | null
  job: { id: string; title: string } | null
  type: string
  interviewer: string | null
  date: string
  duration: number
  location: string | null
  meetingLink: string | null
  status: string
  feedback: string | null
  rating: number | null
  createdAt: string
  updatedAt: string
}

type CalendarView = 'week' | 'month'

// ===== Constants =====

const HOURS_START = 9
const HOURS_END = 18
const HOUR_HEIGHT = 64 // px per hour slot

const DAY_NAMES_SHORT = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const DAY_NAMES_MINI = ['M', 'T', 'W', 'T', 'F', 'S', 'S']
const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

const TYPE_BORDER_COLORS: Record<string, string> = {
  Phone: 'border-l-amber-500',
  Technical: 'border-l-emerald-500',
  HR: 'border-l-violet-500',
  Managerial: 'border-l-rose-500',
  Final: 'border-l-primary',
}

const TYPE_BG_COLORS: Record<string, string> = {
  Phone: 'bg-amber-50 dark:bg-amber-950/30',
  Technical: 'bg-emerald-50 dark:bg-emerald-950/30',
  HR: 'bg-violet-50 dark:bg-violet-950/30',
  Managerial: 'bg-rose-50 dark:bg-rose-950/30',
  Final: 'bg-primary/5',
}

const TYPE_DOT_COLORS: Record<string, string> = {
  Phone: 'bg-amber-500',
  Technical: 'bg-emerald-500',
  HR: 'bg-violet-500',
  Managerial: 'bg-rose-500',
  Final: 'bg-primary',
}

const TYPE_BADGE_COLORS: Record<string, string> = {
  Phone: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400',
  Technical: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400',
  HR: 'bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-400',
  Managerial: 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-400',
  Final: 'bg-primary/15 text-primary',
}

const STATUS_COLORS: Record<string, string> = {
  Scheduled: 'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400',
  Completed: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
  Cancelled: 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400',
  'No-Show': 'bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-400',
}

// ===== Date Helpers (all local time) =====

function getMonday(d: Date): Date {
  const date = new Date(d.getFullYear(), d.getMonth(), d.getDate())
  const day = date.getDay()
  const diff = day === 0 ? -6 : 1 - day
  date.setDate(date.getDate() + diff)
  date.setHours(0, 0, 0, 0)
  return date
}

function getWeekDays(monday: Date): Date[] {
  const days: Date[] = []
  for (let i = 0; i < 7; i++) {
    const d = new Date(monday)
    d.setDate(monday.getDate() + i)
    days.push(d)
  }
  return days
}

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  )
}

function isToday(d: Date): boolean {
  return isSameDay(d, new Date())
}

function formatTime(date: Date): string {
  let hours = date.getHours()
  const minutes = date.getMinutes()
  const ampm = hours >= 12 ? 'PM' : 'AM'
  hours = hours % 12
  if (hours === 0) hours = 12
  return `${hours}:${minutes.toString().padStart(2, '0')} ${ampm}`
}

function formatHour(hour: number): string {
 const ampm = hour >= 12 ? 'PM' : 'AM'
  const h = hour % 12 || 12
  return `${h} ${ampm}`
}

function getMonthGrid(year: number, month: number): (Date | null)[] {
  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)
  const daysInMonth = lastDay.getDate()

  let startDay = firstDay.getDay() // 0=Sun
  // Adjust for Monday start
  startDay = startDay === 0 ? 6 : startDay - 1

  const cells: (Date | null)[] = []

  // Leading empty cells
  for (let i = 0; i < startDay; i++) {
    cells.push(null)
  }

  // Month days
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push(new Date(year, month, d))
  }

  // Trailing empty cells to fill 6 rows (42 cells) or at least complete last row
  const remaining = cells.length % 7 === 0 ? 0 : 7 - (cells.length % 7)
  for (let i = 0; i < remaining; i++) {
    cells.push(null)
  }

  return cells
}

function getInterviewsForDay(interviews: Interview[], day: Date): Interview[] {
  return interviews.filter((i) => isSameDay(new Date(i.date), day))
}

// ===== Sub-components =====

function InterviewBlock({ interview }: { interview: Interview }) {
  const startDate = new Date(interview.date)
  const startHour = startDate.getHours() + startDate.getMinutes() / 60
  const endHour = startHour + interview.duration / 60

  const top = Math.max(0, (startHour - HOURS_START) * HOUR_HEIGHT)
  const height = Math.max(20, (endHour - startHour) * HOUR_HEIGHT - 2)

  const borderClass = TYPE_BORDER_COLORS[interview.type] || 'border-l-gray-400'
  const bgClass = TYPE_BG_COLORS[interview.type] || 'bg-gray-50 dark:bg-gray-900'

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.2 }}
      className={`absolute left-1 right-1 overflow-hidden rounded-lg border-l-[3px] p-1.5 text-xs shadow-sm hover:scale-105 hover:shadow-md transition-transform cursor-default ${borderClass} ${bgClass}`}
      style={{ top: `${top}px`, height: `${height}px` }}
      title={`${interview.candidate.firstName} ${interview.candidate.lastName} - ${interview.type} at ${formatTime(startDate)}`}
    >
      <div className="truncate font-medium leading-tight">
        {interview.candidate.firstName} {interview.candidate.lastName}
      </div>
      {height > 40 && (
        <Badge className={`mt-0.5 text-[9px] px-1 py-0 ${TYPE_BADGE_COLORS[interview.type] || ''}`}>
          {interview.type}
        </Badge>
      )}
      {height > 60 && interview.interviewer && (
        <div className="mt-0.5 truncate text-[10px] text-muted-foreground">
          {interview.interviewer}
        </div>
      )}
    </motion.div>
  )
}

function CurrentTimeIndicator() {
  const [now, setNow] = useState(() => new Date())

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 60000)
    return () => clearInterval(interval)
  }, [])

  const currentHour = now.getHours() + now.getMinutes() / 60
  if (currentHour < HOURS_START || currentHour > HOURS_END) return null

  const top = (currentHour - HOURS_START) * HOUR_HEIGHT

  return (
    <div
      className="pointer-events-none absolute left-0 right-0 z-10"
      style={{ top: `${top}px` }}
    >
      <div className="flex items-center">
        <div className="h-2.5 w-2.5 rounded-full bg-red-500" />
        <div className="h-[2px] flex-1 bg-red-500" />
      </div>
    </div>
  )
}

function WeekView({ interviews }: { interviews: Interview[] }) {
  const [currentMonday, setCurrentMonday] = useState(() => getMonday(new Date()))

  const weekDays = useMemo(() => getWeekDays(currentMonday), [currentMonday])

  const goToPrevWeek = useCallback(() => {
    setCurrentMonday((prev) => {
      const d = new Date(prev)
      d.setDate(d.getDate() - 7)
      return d
    })
  }, [])

  const goToNextWeek = useCallback(() => {
    setCurrentMonday((prev) => {
      const d = new Date(prev)
      d.setDate(d.getDate() + 7)
      return d
    })
  }, [])

  const goToToday = useCallback(() => {
    setCurrentMonday(getMonday(new Date()))
  }, [])

  const weekEndDate = new Date(currentMonday)
  weekEndDate.setDate(weekEndDate.getDate() + 6)

  const headerLabel = `${weekDays[0].toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – ${weekDays[6].toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`

  const hours = useMemo(() => {
    const h = []
    for (let i = HOURS_START; i <= HOURS_END; i++) h.push(i)
    return h
  }, [])

  return (
    <div className="flex flex-col gap-3">
      {/* Navigation Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1">
          <Button variant="outline" size="icon" className="h-8 w-8" onClick={goToPrevWeek}>
            <ChevronsLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={goToToday}>
            Today
          </Button>
          <Button variant="outline" size="icon" className="h-8 w-8" onClick={goToNextWeek}>
            <ChevronsRight className="h-4 w-4" />
          </Button>
        </div>
        <h3 className="text-sm font-semibold">{headerLabel}</h3>
      </div>

      {/* Desktop Week Grid */}
      <div className="hidden md:block">
        <div className="rounded-lg border border-border/50 overflow-hidden">
          {/* Day headers */}
          <div className="grid grid-cols-[48px_repeat(7,1fr)] border-b border-muted/50 bg-muted/30">
            <div className="p-2" />
            {weekDays.map((day, i) => (
              <div
                key={i}
                className={`p-2 text-center ${
                  isToday(day) ? 'bg-primary/10 font-bold text-primary' : 'text-muted-foreground'
                }`}
              >
                <div className="text-[10px] uppercase tracking-wide">{DAY_NAMES_SHORT[i]}</div>
                <div className={`text-lg font-bold leading-tight ${isToday(day) ? 'text-primary' : 'text-foreground'}`}>
                  {day.getDate()}
                </div>
              </div>
            ))}
          </div>

          {/* Time grid */}
          <div className="grid grid-cols-[48px_repeat(7,1fr)]">
            {/* Time labels */}
            <div className="relative">
              {hours.map((hour) => (
                <div
                  key={hour}
                  className="flex items-start justify-end pr-2 pt-0 text-[11px] text-muted-foreground"
                  style={{ height: `${HOUR_HEIGHT}px` }}
                >
                  <span className="-translate-y-1/2">{formatHour(hour)}</span>
                </div>
              ))}
            </div>

            {/* Day columns */}
            {weekDays.map((day, dayIdx) => {
              const dayInterviews = getInterviewsForDay(interviews, day).filter(
                (i) => i.status !== 'Cancelled'
              )
              return (
                <div
                  key={dayIdx}
                  className={`relative border-l border-muted/50 ${
                    isToday(day) ? 'bg-muted/30' : ''
                  }`}
                >
                  {/* Hour lines */}
                  {hours.map((hour) => (
                    <div
                      key={hour}
                      className="border-b border-muted/50"
                      style={{ height: `${HOUR_HEIGHT}px` }}
                    />
                  ))}

                  {/* Interview blocks */}
                  {dayInterviews.map((interview) => (
                    <InterviewBlock key={interview.id} interview={interview} />
                  ))}

                  {/* Current time indicator */}
                  {isToday(day) && <CurrentTimeIndicator />}

                  {/* Empty state per column */}
                  {dayInterviews.length === 0 && isToday(day) && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="flex flex-col items-center gap-1 text-muted-foreground/50">
                        <CalendarX className="h-5 w-5" />
                        <span className="text-[10px]">No interviews</span>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Mobile: List by day */}
      <div className="md:hidden flex flex-col gap-3">
        {weekDays.map((day, dayIdx) => {
          const dayInterviews = getInterviewsForDay(interviews, day).filter(
            (i) => i.status !== 'Cancelled'
          )
          const isTodayCol = isToday(day)
          return (
            <motion.div
              key={dayIdx}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: dayIdx * 0.04 }}
            >
              <div
                className={`flex items-center gap-2 mb-2 ${
                  isTodayCol
                    ? 'font-bold text-primary'
                    : 'font-medium text-muted-foreground'
                }`}
              >
                <span className="text-sm">
                  {DAY_NAMES_SHORT[dayIdx]}, {day.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </span>
                {isTodayCol && (
                  <Badge variant="outline" className="text-[10px] h-4 px-1.5 text-primary border-primary/30">
                    Today
                  </Badge>
                )}
              </div>
              {dayInterviews.length === 0 ? (
                <div className={`flex items-center gap-2 rounded-lg border border-dashed p-3 ${isTodayCol ? 'border-primary/20 bg-primary/5' : 'border-muted-foreground/20 bg-muted/30'}`}>
                  <CalendarX className="h-4 w-4 text-muted-foreground/50" />
                  <span className="text-xs text-muted-foreground/60">No interviews</span>
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  {dayInterviews.map((interview) => {
                    const startDate = new Date(interview.date)
                    const borderClass = TYPE_BORDER_COLORS[interview.type] || 'border-l-gray-400'
                    const bgClass = TYPE_BG_COLORS[interview.type] || 'bg-gray-50 dark:bg-gray-900'
                    return (
                      <motion.div
                        key={interview.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        className={`flex items-center gap-3 rounded-lg border-l-[3px] p-3 text-xs shadow-sm ${borderClass} ${bgClass}`}
                      >
                        <div className="flex-1 min-w-0">
                          <div className="font-medium truncate">
                            {interview.candidate.firstName} {interview.candidate.lastName}
                          </div>
                          <div className="flex items-center gap-2 mt-1 flex-wrap">
                            <Badge className={`text-[9px] px-1.5 py-0 ${TYPE_BADGE_COLORS[interview.type] || ''}`}>
                              {interview.type}
                            </Badge>
                            {interview.interviewer && (
                              <span className="text-muted-foreground truncate">
                                <User className="inline h-3 w-3 mr-0.5" />
                                {interview.interviewer}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <div className="font-medium">{formatTime(startDate)}</div>
                          <div className="text-[10px] text-muted-foreground">
                            {interview.duration}m
                          </div>
                        </div>
                      </motion.div>
                    )
                  })}
                </div>
              )}
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}

function DayInterviewsDialog({
  open,
  onOpenChange,
  day,
  interviews,
  onScheduleInterview,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  day: Date | null
  interviews: Interview[]
  onScheduleInterview?: (date: Date) => void
}) {
  if (!day) return null

  const dayInterviews = getInterviewsForDay(interviews, day).sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  )

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-w-[calc(100vw-1.5rem)]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CalendarDays className="h-4 w-4" />
            {day.toLocaleDateString('en-US', {
              weekday: 'long',
              month: 'long',
              day: 'numeric',
            })}
          </DialogTitle>
          <DialogDescription>
            {dayInterviews.length} interview{dayInterviews.length !== 1 ? 's' : ''} scheduled
          </DialogDescription>
          {onScheduleInterview && (
            <Button
              variant="outline"
              className="mt-2 border-emerald-300 text-emerald-700 hover:bg-emerald-50 dark:border-emerald-800 dark:text-emerald-400 dark:hover:bg-emerald-950/50"
              onClick={() => {
                onScheduleInterview(day)
                onOpenChange(false)
              }}
            >
              <Plus className="mr-1.5 h-3.5 w-3.5" />
              <CalendarPlus className="mr-1.5 h-3.5 w-3.5" />
              Schedule Interview
            </Button>
          )}
        </DialogHeader>
        {dayInterviews.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-8 text-muted-foreground">
            <CalendarX className="h-8 w-8 text-muted-foreground/40" />
            <p className="text-sm">No interviews on this day</p>
          </div>
        ) : (
          <div className="max-h-80 overflow-y-auto flex flex-col gap-2 pr-1">
            {dayInterviews.map((interview) => {
              const startDate = new Date(interview.date)
              const borderClass = TYPE_BORDER_COLORS[interview.type] || 'border-l-gray-400'
              const bgClass = TYPE_BG_COLORS[interview.type] || 'bg-gray-50 dark:bg-gray-900'
              return (
                <div
                  key={interview.id}
                  className={`rounded-lg border-l-[3px] p-3 text-sm ${borderClass} ${bgClass}`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold">
                      {interview.candidate.firstName} {interview.candidate.lastName}
                    </span>
                    <Badge className={`text-[10px] ${STATUS_COLORS[interview.status] || ''}`}>
                      {interview.status}
                    </Badge>
                  </div>
                  <div className="mt-1.5 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {formatTime(startDate)} ({interview.duration}m)
                    </span>
                    <Badge className={`text-[10px] ${TYPE_BADGE_COLORS[interview.type] || ''}`}>
                      {interview.type}
                    </Badge>
                    {interview.interviewer && (
                      <span className="flex items-center gap-1">
                        <User className="h-3 w-3" />
                        {interview.interviewer}
                      </span>
                    )}
                  </div>
                  {interview.location && (
                    <div className="mt-1 flex items-center gap-1 text-[11px] text-muted-foreground">
                      <MapPin className="h-3 w-3" />
                      {interview.location}
                    </div>
                  )}
                  {interview.meetingLink && (
                    <div className="mt-1 flex items-center gap-1 text-[11px] text-muted-foreground">
                      <Video className="h-3 w-3" />
                      <span className="truncate">{interview.meetingLink}</span>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

function MonthView({ interviews, onScheduleInterview }: { interviews: Interview[]; onScheduleInterview?: (date: Date) => void }) {
  const today = useMemo(() => new Date(), [])
  const [currentYear, setCurrentYear] = useState(today.getFullYear())
  const [currentMonth, setCurrentMonth] = useState(today.getMonth())
  const [selectedDay, setSelectedDay] = useState<Date | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)

  const grid = useMemo(
    () => getMonthGrid(currentYear, currentMonth),
    [currentYear, currentMonth]
  )

  const goToPrevMonth = useCallback(() => {
    setCurrentMonth((prev) => {
      if (prev === 0) {
        setCurrentYear((y) => y - 1)
        return 11
      }
      return prev - 1
    })
  }, [])

  const goToNextMonth = useCallback(() => {
    setCurrentMonth((prev) => {
      if (prev === 11) {
        setCurrentYear((y) => y + 1)
        return 0
      }
      return prev + 1
    })
  }, [])

  const goToToday = useCallback(() => {
    const now = new Date()
    setCurrentYear(now.getFullYear())
    setCurrentMonth(now.getMonth())
  }, [])

  const handleDayClick = useCallback(
    (day: Date) => {
      setSelectedDay(day)
      setDialogOpen(true)
    },
    []
  )

  const headerLabel = `${MONTH_NAMES[currentMonth]} ${currentYear}`

  return (
    <div className="flex flex-col gap-3">
      {/* Navigation Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1">
          <Button variant="outline" size="icon" className="h-8 w-8" onClick={goToPrevMonth}>
            <ChevronsLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={goToToday}>
            Today
          </Button>
          <Button variant="outline" size="icon" className="h-8 w-8" onClick={goToNextMonth}>
            <ChevronsRight className="h-4 w-4" />
          </Button>
        </div>
        <h3 className="text-sm font-semibold">{headerLabel}</h3>
      </div>

      {/* Desktop Month Grid */}
      <div className="hidden sm:block">
        <div className="rounded-lg border border-border/50 overflow-hidden">
          {/* Day name headers */}
          <div className="grid grid-cols-7 border-b border-muted/50 bg-muted/30">
            {DAY_NAMES_SHORT.map((name, i) => (
              <div
                key={i}
                className="p-2 text-center text-[10px] font-medium uppercase tracking-wide text-muted-foreground"
              >
                {name}
              </div>
            ))}
          </div>

          {/* Calendar grid */}
          <div className="grid grid-cols-7">
            {grid.map((day, idx) => {
              if (!day) {
                return (
                  <div
                    key={`empty-${idx}`}
                    className="min-h-[100px] border-b border-r border-muted/50 bg-muted/10"
                  />
                )
              }

              const dayInterviews = getInterviewsForDay(interviews, day).filter(
                (i) => i.status !== 'Cancelled'
              )
              const isTodayCell = isToday(day)
              const hasInterviews = dayInterviews.length > 0
              const isCurrentMonth = day.getMonth() === currentMonth

              return (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: idx * 0.01, duration: 0.15 }}
                  className={`min-h-[100px] border-b border-r border-muted/50 p-1.5 transition-colors ${
                    isTodayCell
                      ? 'ring-2 ring-inset ring-primary/60 bg-primary/5'
                      : hasInterviews
                        ? 'bg-primary/5 hover:bg-primary/10'
                        : 'hover:bg-muted/30'
                  } ${!isCurrentMonth ? 'opacity-40' : ''} cursor-pointer`}
                  onClick={() => handleDayClick(day)}
                >
                  <div
                    className={`text-xs mb-1 w-6 h-6 flex items-center justify-center rounded-full ${
                      isTodayCell
                        ? 'bg-primary text-primary-foreground font-bold'
                        : 'font-medium text-foreground'
                    }`}
                  >
                    {day.getDate()}
                  </div>

                  {dayInterviews.length === 0 ? (
                    <div className="flex items-center justify-center h-12">
                      <CalendarX className="h-3.5 w-3.5 text-muted-foreground/30" />
                    </div>
                  ) : (
                    <div className="flex flex-col gap-0.5">
                      {dayInterviews.slice(0, 3).map((interview) => (
                        <div
                          key={interview.id}
                          className={`flex items-center gap-1 rounded px-1 py-0.5 text-[10px] leading-tight truncate ${
                            TYPE_BG_COLORS[interview.type] || 'bg-gray-50 dark:bg-gray-900'
                          }`}
                        >
                          <span
                            className={`h-1.5 w-1.5 shrink-0 rounded-full ${
                              TYPE_DOT_COLORS[interview.type] || 'bg-gray-400'
                            }`}
                          />
                          <span className="truncate">
                            {interview.candidate.firstName} {formatTime(new Date(interview.date))}
                          </span>
                        </div>
                      ))}
                      {dayInterviews.length > 3 && (
                        <div className="text-[10px] text-muted-foreground font-medium pl-1">
                          +{dayInterviews.length - 3} more
                        </div>
                      )}
                    </div>
                  )}
                </motion.div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Mobile: Compact grid */}
      <div className="sm:block hidden"> {/* Spacer - mobile grid below */} </div>
      <div className="sm:hidden">
        {/* Mobile day name headers */}
        <div className="grid grid-cols-7 mb-1">
          {DAY_NAMES_MINI.map((name, i) => (
            <div
              key={i}
              className="p-1 text-center text-[10px] font-medium text-muted-foreground"
            >
              {name}
            </div>
          ))}
        </div>

        {/* Mobile calendar grid */}
        <div className="grid grid-cols-7 gap-0.5">
          {grid.map((day, idx) => {
            if (!day) {
              return <div key={`empty-${idx}`} className="aspect-square" />
            }

            const dayInterviews = getInterviewsForDay(interviews, day).filter(
              (i) => i.status !== 'Cancelled'
            )
            const isTodayCell = isToday(day)
            const isCurrentMonth = day.getMonth() === currentMonth

            return (
              <motion.button
                key={idx}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: idx * 0.008, duration: 0.1 }}
                className={`aspect-square flex flex-col items-center justify-center rounded-lg text-xs relative transition-colors ${
                  isTodayCell
                    ? 'ring-2 ring-primary bg-primary/10 font-bold text-primary'
                    : dayInterviews.length > 0
                      ? 'bg-primary/5 font-medium'
                      : 'text-foreground'
                } ${!isCurrentMonth ? 'opacity-30' : ''}`}
                onClick={() => handleDayClick(day)}
              >
                <span>{day.getDate()}</span>
                {dayInterviews.length > 0 && (
                  <div className="flex gap-0.5 mt-0.5">
                    {dayInterviews.slice(0, 3).map((interview) => (
                      <span
                        key={interview.id}
                        className={`h-1.5 w-1.5 rounded-full ${
                          TYPE_DOT_COLORS[interview.type] || 'bg-gray-400'
                        }`}
                      />
                    ))}
                  </div>
                )}
              </motion.button>
            )
          })}
        </div>
      </div>

      {/* Day detail dialog */}
      <DayInterviewsDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        day={selectedDay}
        interviews={interviews}
        onScheduleInterview={onScheduleInterview}
      />
    </div>
  )
}

// ===== Main Component =====

export function InterviewCalendar({ onScheduleInterview }: { onScheduleInterview?: (date: Date) => void }) {
  const [view, setView] = useState<CalendarView>('week')

  const { data, isLoading } = useQuery<{ data: Interview[] }>({
    queryKey: ['interviews-calendar'],
    queryFn: async () => {
      const res = await fetch('/api/interviews')
      if (!res.ok) throw new Error('Failed to fetch interviews')
      return res.json()
    },
  })

  const interviews = data?.data || []

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-16">
          <div className="flex items-center gap-3">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            <p className="text-sm text-muted-foreground">Loading calendar...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      {/* View Toggle + Navigation */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1 rounded-lg bg-muted/50 p-1">
          <Button
            variant={view === 'week' ? 'default' : 'ghost'}
            size="sm"
            className={`h-8 px-3 text-xs ${
              view === 'week'
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'hover:bg-muted text-muted-foreground'
            }`}
            onClick={() => setView('week')}
          >
            Week
          </Button>
          <Button
            variant={view === 'month' ? 'default' : 'ghost'}
            size="sm"
            className={`h-8 px-3 text-xs ${
              view === 'month'
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'hover:bg-muted text-muted-foreground'
            }`}
            onClick={() => setView('month')}
          >
            Month
          </Button>
        </div>
      </div>

      {/* Calendar Views */}
      <AnimatePresence mode="wait">
        {view === 'week' ? (
          <motion.div
            key="week"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
          >
            <WeekView interviews={interviews} />
          </motion.div>
        ) : (
          <motion.div
            key="month"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
          >
            <MonthView interviews={interviews} onScheduleInterview={onScheduleInterview} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
