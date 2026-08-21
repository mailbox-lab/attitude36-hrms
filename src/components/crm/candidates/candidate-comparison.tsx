'use client'

import { useQueries } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Star, Briefcase, MapPin, Clock, AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Skeleton } from '@/components/ui/skeleton'

// ===== Types =====

type ComparisonCandidate = {
  id: string
  firstName: string
  lastName: string
  email: string | null
  phone: string | null
  title: string | null
  location: string | null
  experience: number | null
  currentCompany: string | null
  currentCTC: number | null
  expectedCTC: number | null
  noticePeriod: number | null
  source: string | null
  skills: string
  status: string
  rating: number
  notes: string | null
  interviews: { id: string }[]
}

interface CandidateComparisonProps {
  candidateIds: string[]
  onClose: () => void
}

// ===== Constants =====

const COLUMN_COLORS = [
  { gradient: 'from-emerald-500 to-teal-500', text: 'text-emerald-600 dark:text-emerald-400', light: 'bg-emerald-50 dark:bg-emerald-950/50', bar: 'bg-gradient-to-r from-emerald-500 to-teal-500', avatar: 'from-emerald-500 to-teal-500', borderHex: '#10b981' },
  { gradient: 'from-amber-500 to-orange-500', text: 'text-amber-600 dark:text-amber-400', light: 'bg-amber-50 dark:bg-amber-950/50', bar: 'bg-gradient-to-r from-amber-500 to-orange-500', avatar: 'from-amber-500 to-orange-500', borderHex: '#f59e0b' },
  { gradient: 'from-rose-500 to-pink-500', text: 'text-rose-600 dark:text-rose-400', light: 'bg-rose-50 dark:bg-rose-950/50', bar: 'bg-gradient-to-r from-rose-500 to-pink-500', avatar: 'from-rose-500 to-pink-500', borderHex: '#f43f5e' },
  { gradient: 'from-cyan-500 to-teal-500', text: 'text-cyan-600 dark:text-cyan-400', light: 'bg-cyan-50 dark:bg-cyan-950/50', bar: 'bg-gradient-to-r from-cyan-500 to-teal-500', avatar: 'from-cyan-500 to-teal-500', borderHex: '#06b6d4' },
]

const STATUS_COLORS: Record<string, string> = {
  New: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400',
  Screening: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-950 dark:text-cyan-400',
  Interview: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400',
  Offer: 'bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-400',
  Hired: 'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400',
  Rejected: 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400',
  'On-Hold': 'bg-gray-100 text-gray-700 dark:bg-gray-950 dark:text-gray-400',
}

const SOURCE_COLORS: Record<string, string> = {
  LinkedIn: 'bg-teal-100 text-teal-700 dark:bg-teal-950 dark:text-teal-400',
  Naukri: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400',
  Referral: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400',
  'Job Portal': 'bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-400',
  'Company Website': 'bg-teal-100 text-teal-700 dark:bg-teal-950 dark:text-teal-400',
  'Social Media': 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-400',
  'Campus Drive': 'bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-400',
  Headhunting: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-950 dark:text-cyan-400',
  Other: 'bg-gray-100 text-gray-700 dark:bg-gray-950 dark:text-gray-400',
}

// ===== Helpers =====

function getInitials(firstName: string, lastName: string) {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase()
}

function formatCTC(ctc: number | null): string {
  if (ctc == null) return '—'
  return `₹${ctc} LPA`
}

function parseSkills(skills: string): string[] {
  return skills
    ? skills
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean)
    : []
}

function findSharedSkills(candidates: ComparisonCandidate[]): Set<string> {
  const skillCount: Record<string, number> = {}
  candidates.forEach((c) => {
    parseSkills(c.skills).forEach((skill) => {
      const normalized = skill.toLowerCase()
      skillCount[normalized] = (skillCount[normalized] || 0) + 1
    })
  })
  const shared = new Set<string>()
  Object.entries(skillCount).forEach(([skill, count]) => {
    if (count >= 2) shared.add(skill)
  })
  return shared
}

// ===== Star Rating =====

function StarRating({ rating }: { rating: number }) {
  if (!rating || rating <= 0) return <span className="text-xs text-muted-foreground">Not rated</span>
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          className={`h-3.5 w-3.5 ${i <= rating ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground/30'}`}
        />
      ))}
    </div>
  )
}

// ===== Experience Bar =====

function ExperienceBar({ years, color }: { years: number | null; color: typeof COLUMN_COLORS[number] }) {
  const maxYears = 15
  const pct = years != null ? Math.min((years / maxYears) * 100, 100) : 0
  return (
    <div className="space-y-1.5">
      {years != null ? (
        <span className="text-sm font-semibold">{years} years</span>
      ) : (
        <span className="text-sm text-muted-foreground">—</span>
      )}
      <div className="h-2.5 w-full overflow-hidden rounded-full bg-muted">
        <motion.div
          className={`h-full rounded-full ${color.bar}`}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.8, ease: 'easeOut', delay: 0.3 }}
        />
      </div>
    </div>
  )
}

// ===== Section Header Row =====

function SectionHeader({ label }: { label: string }) {
  return (
    <motion.tr initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <td colSpan={100} className="px-4 py-2">
        <div className="flex items-center gap-2">
          <div className="h-px flex-1 bg-gradient-to-r from-transparent via-border to-transparent" />
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {label}
          </span>
          <div className="h-px flex-1 bg-gradient-to-r from-transparent via-border to-transparent" />
        </div>
      </td>
    </motion.tr>
  )
}

// ===== Loading Skeleton =====

function ComparisonSkeleton() {
  return (
    <div className="space-y-4 p-6">
      <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="space-y-3 rounded-lg p-4">
            <Skeleton className="mx-auto h-14 w-14 rounded-full" />
            <Skeleton className="mx-auto h-4 w-24" />
            <Skeleton className="mx-auto h-3 w-20" />
          </div>
        ))}
      </div>
      {Array.from({ length: 8 }).map((_, i) => (
        <Skeleton key={i} className="h-12 w-full rounded-lg" />
      ))}
    </div>
  )
}

// ===== Main Component =====

export function CandidateComparison({ candidateIds, onClose }: CandidateComparisonProps) {
  // Fetch all candidates in parallel using useQueries
  const queries = useQueries({
    queries: candidateIds.map((id) => ({
      queryKey: ['candidate-comparison', id],
      queryFn: async (): Promise<ComparisonCandidate> => {
        const res = await fetch(`/api/candidates/${id}`)
        if (!res.ok) throw new Error('Failed to fetch candidate')
        return res.json()
      },
      staleTime: 30000,
    })),
  })

  const isLoading = queries.some((q) => q.isLoading)
  const isError = queries.some((q) => q.isError)
  const candidates = queries
    .filter((q) => q.data)
    .map((q) => q.data!)

  const sharedSkills = candidates.length >= 2 ? findSharedSkills(candidates) : new Set<string>()

  // Stagger animation variants
  const rowVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: { delay: i * 0.05, duration: 0.35, ease: 'easeOut' },
    }),
  }

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
      >
        {/* Backdrop */}
        <motion.div
          className="absolute inset-0 bg-black/40 backdrop-blur-sm"
          onClick={onClose}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        />

        {/* Modal */}
        <motion.div
          className="relative z-10 flex max-h-[90vh] w-full max-w-7xl flex-col overflow-hidden rounded-2xl border bg-card shadow-2xl"
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b px-6 py-4">
            <div className="flex items-center gap-3">
              <h2 className="text-lg font-bold tracking-tight">Compare Candidates</h2>
              <Badge variant="secondary" className="bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400">
                {candidateIds.length} candidate{candidateIds.length !== 1 ? 's' : ''}
              </Badge>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-lg"
              onClick={onClose}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto">
            {isLoading ? (
              <ComparisonSkeleton />
            ) : isError ? (
              <div className="flex flex-col items-center justify-center gap-2 py-16">
                <AlertTriangle className="h-8 w-8 text-amber-500" />
                <p className="text-sm text-muted-foreground">Failed to load candidate data</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[600px] border-collapse">
                  {/* Candidate Header Row */}
                  <thead>
                    <tr>
                      <th className="w-[140px] px-4 py-4 text-left text-xs font-medium text-muted-foreground" />
                      {candidates.map((c, i) => {
                        const color = COLUMN_COLORS[i % COLUMN_COLORS.length]
                        const initials = getInitials(c.firstName, c.lastName)
                        return (
                          <th
                            key={c.id}
                            className={`px-4 py-4 pt-5 text-center ${color.light}`}
                            style={{ borderTop: `3px solid ${color.borderHex}` }}
                          >
                            <motion.div
                              className="flex flex-col items-center gap-2"
                              initial={{ opacity: 0, y: -10 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: i * 0.1, duration: 0.4 }}
                            >
                              <Avatar className="h-14 w-14 text-lg font-bold">
                                <AvatarFallback className={`bg-gradient-to-br ${color.avatar} text-white`}>
                                  {initials}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="text-sm font-semibold">{c.firstName} {c.lastName}</p>
                                {c.title && (
                                  <p className="mt-0.5 text-xs text-muted-foreground">{c.title}</p>
                                )}
                                {c.location && (
                                  <p className="mt-0.5 flex items-center justify-center gap-1 text-[11px] text-muted-foreground">
                                    <MapPin className="h-2.5 w-2.5" />
                                    {c.location}
                                  </p>
                                )}
                              </div>
                            </motion.div>
                          </th>
                        )
                      })}
                    </tr>
                  </thead>

                  <motion.tbody
                    initial="hidden"
                    animate="visible"
                  >
                    {/* === PROFILE SECTION === */}
                    <SectionHeader label="Profile" />

                    {/* Experience */}
                    <motion.tr
                      custom={1}
                      variants={rowVariants}
                      className="group transition-colors hover:bg-muted/50"
                    >
                      <td className="px-4 py-3 text-xs font-medium text-muted-foreground">
                        <div className="flex items-center gap-1.5">
                          <Briefcase className="h-3.5 w-3.5" />
                          Experience
                        </div>
                      </td>
                      {candidates.map((c, i) => (
                        <td key={c.id} className="px-4 py-3">
                          <ExperienceBar
                            years={c.experience}
                            color={COLUMN_COLORS[i % COLUMN_COLORS.length]}
                          />
                        </td>
                      ))}
                    </motion.tr>

                    {/* Current Company */}
                    <motion.tr
                      custom={2}
                      variants={rowVariants}
                      className="bg-muted/30 transition-colors hover:bg-muted/50"
                    >
                      <td className="px-4 py-3 text-xs font-medium text-muted-foreground">
                        <div className="flex items-center gap-1.5">
                          <Briefcase className="h-3.5 w-3.5" />
                          Current Company
                        </div>
                      </td>
                      {candidates.map((c) => (
                        <td key={c.id} className="px-4 py-3 text-center text-sm">
                          {c.currentCompany || <span className="text-muted-foreground">—</span>}
                        </td>
                      ))}
                    </motion.tr>

                    {/* === COMPENSATION SECTION === */}
                    <SectionHeader label="Compensation" />

                    {/* Current CTC */}
                    <motion.tr
                      custom={3}
                      variants={rowVariants}
                      className="transition-colors hover:bg-muted/50"
                    >
                      <td className="px-4 py-3 text-xs font-medium text-muted-foreground">
                        Current CTC
                      </td>
                      {candidates.map((c) => (
                        <td key={c.id} className="px-4 py-3 text-center">
                          <span className={`text-sm font-bold text-emerald-600 dark:text-emerald-400`}>
                            {formatCTC(c.currentCTC)}
                          </span>
                        </td>
                      ))}
                    </motion.tr>

                    {/* Expected CTC */}
                    <motion.tr
                      custom={4}
                      variants={rowVariants}
                      className="bg-muted/30 transition-colors hover:bg-muted/50"
                    >
                      <td className="px-4 py-3 text-xs font-medium text-muted-foreground">
                        Expected CTC
                      </td>
                      {candidates.map((c) => {
                        const isHigher =
                          c.expectedCTC != null &&
                          c.currentCTC != null &&
                          c.expectedCTC > c.currentCTC
                        return (
                          <td key={c.id} className="px-4 py-3 text-center">
                            <div className="flex flex-col items-center gap-1">
                              <span className={`text-sm font-bold text-emerald-600 dark:text-emerald-400`}>
                                {formatCTC(c.expectedCTC)}
                              </span>
                              {isHigher && (
                                <span className="flex items-center gap-0.5 text-[10px] font-medium text-amber-600 dark:text-amber-400">
                                  <AlertTriangle className="h-2.5 w-2.5" />
                                  Hike expected
                                </span>
                              )}
                            </div>
                          </td>
                        )
                      })}
                    </motion.tr>

                    {/* Notice Period */}
                    <motion.tr
                      custom={5}
                      variants={rowVariants}
                      className="transition-colors hover:bg-muted/50"
                    >
                      <td className="px-4 py-3 text-xs font-medium text-muted-foreground">
                        <div className="flex items-center gap-1.5">
                          <Clock className="h-3.5 w-3.5" />
                          Notice Period
                        </div>
                      </td>
                      {candidates.map((c) => (
                        <td key={c.id} className="px-4 py-3 text-center text-sm">
                          {c.noticePeriod != null ? (
                            <Badge variant="outline" className="font-medium">
                              {c.noticePeriod} days
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </td>
                      ))}
                    </motion.tr>

                    {/* Source */}
                    <motion.tr
                      custom={6}
                      variants={rowVariants}
                      className="bg-muted/30 transition-colors hover:bg-muted/50"
                    >
                      <td className="px-4 py-3 text-xs font-medium text-muted-foreground">
                        Source
                      </td>
                      {candidates.map((c) => (
                        <td key={c.id} className="px-4 py-3 text-center">
                          {c.source ? (
                            <Badge className={`text-[10px] ${SOURCE_COLORS[c.source] || 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'}`}>
                              {c.source}
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </td>
                      ))}
                    </motion.tr>

                    {/* === SKILLS SECTION === */}
                    <SectionHeader label="Skills" />

                    {/* Skills Row */}
                    <motion.tr
                      custom={7}
                      variants={rowVariants}
                      className="transition-colors hover:bg-muted/50"
                    >
                      <td className="px-4 py-3 align-top text-xs font-medium text-muted-foreground">
                        Skills
                      </td>
                      {candidates.map((c) => {
                        const skills = parseSkills(c.skills)
                        return (
                          <td key={c.id} className="px-4 py-3">
                            <div className="flex flex-wrap justify-center gap-1.5">
                              {skills.length > 0 ? (
                                skills.map((skill) => {
                                  const isShared = sharedSkills.has(skill.toLowerCase())
                                  return (
                                    <Badge
                                      key={skill}
                                      variant={isShared ? 'default' : 'secondary'}
                                      className={`text-[10px] ${
                                        isShared
                                          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-950'
                                          : 'bg-muted text-muted-foreground'
                                      }`}
                                    >
                                      {skill}
                                    </Badge>
                                  )
                                })
                              ) : (
                                <span className="text-xs text-muted-foreground">—</span>
                              )}
                            </div>
                          </td>
                        )
                      })}
                    </motion.tr>

                    {/* Shared Skills Summary */}
                    {sharedSkills.size > 0 && (
                      <motion.tr
                        custom={7.5}
                        variants={rowVariants}
                        className="bg-emerald-50/50 dark:bg-emerald-950/20"
                      >
                        <td className="px-4 py-3 text-xs font-medium text-emerald-700 dark:text-emerald-400">
                          Shared Skills
                        </td>
                        <td colSpan={candidates.length} className="px-4 py-3">
                          <div className="flex flex-wrap justify-center gap-1.5">
                            {Array.from(sharedSkills).map((skill) => (
                              <Badge
                                key={skill}
                                className="bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400"
                              >
                                {skill}
                              </Badge>
                            ))}
                          </div>
                        </td>
                      </motion.tr>
                    )}

                    {/* === ACTIVITY SECTION === */}
                    <SectionHeader label="Activity" />

                    {/* Status */}
                    <motion.tr
                      custom={8}
                      variants={rowVariants}
                      className="transition-colors hover:bg-muted/50"
                    >
                      <td className="px-4 py-3 text-xs font-medium text-muted-foreground">
                        Status
                      </td>
                      {candidates.map((c) => (
                        <td key={c.id} className="px-4 py-3 text-center">
                          <Badge className={`text-[10px] ${STATUS_COLORS[c.status] || 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'}`}>
                            {c.status}
                          </Badge>
                        </td>
                      ))}
                    </motion.tr>

                    {/* Rating */}
                    <motion.tr
                      custom={9}
                      variants={rowVariants}
                      className="bg-muted/30 transition-colors hover:bg-muted/50"
                    >
                      <td className="px-4 py-3 text-xs font-medium text-muted-foreground">
                        Rating
                      </td>
                      {candidates.map((c) => (
                        <td key={c.id} className="px-4 py-3 text-center">
                          <StarRating rating={c.rating} />
                        </td>
                      ))}
                    </motion.tr>

                    {/* Interviews */}
                    <motion.tr
                      custom={10}
                      variants={rowVariants}
                      className="transition-colors hover:bg-muted/50"
                    >
                      <td className="px-4 py-3 text-xs font-medium text-muted-foreground">
                        Interviews
                      </td>
                      {candidates.map((c) => (
                        <td key={c.id} className="px-4 py-3 text-center">
                          <Badge variant="outline" className="font-medium">
                            {c.interviews?.length || 0} interview{(c.interviews?.length || 0) !== 1 ? 's' : ''}
                          </Badge>
                        </td>
                      ))}
                    </motion.tr>
                  </motion.tbody>
                </table>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex justify-end border-t px-6 py-3">
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
