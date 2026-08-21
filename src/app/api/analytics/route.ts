import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const now = new Date()
    const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1)
    const startOfWeek = new Date(now)
    startOfWeek.setDate(now.getDate() - now.getDay() + 1) // Monday
    startOfWeek.setHours(0, 0, 0, 0)
    const endOfWeek = new Date(startOfWeek)
    endOfWeek.setDate(startOfWeek.getDate() + 6)
    endOfWeek.setHours(23, 59, 59, 999)

    // 1. Monthly placement trend (last 6 months)
    const placements = await db.placement.findMany({
      where: { createdAt: { gte: sixMonthsAgo } },
      select: { createdAt: true },
    })

    const monthlyPlacements: { month: string; count: number }[] = []
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const monthLabel = d.toLocaleString('en-IN', { month: 'short', year: '2-digit' })
      const monthStart = new Date(d.getFullYear(), d.getMonth(), 1)
      const monthEnd = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999)
      const count = placements.filter((p) => {
        const pd = new Date(p.createdAt)
        return pd >= monthStart && pd <= monthEnd
      }).length
      monthlyPlacements.push({ month: monthLabel, count })
    }

    // 2. Source-wise candidate distribution
    const candidatesBySource = await db.candidate.groupBy({
      by: ['source'],
      _count: { id: true },
    })
    const sourceLabels = ['LinkedIn', 'Referral', 'Job Portal', 'Direct', 'Naukri', 'Indeed', 'Walk-in', 'Other']
    const candidateSources = sourceLabels.map((source) => {
      const found = candidatesBySource.find((s) => s.source === source)
      return { source, count: found ? found._count.id : 0 }
    })

    // 3. Department-wise job openings
    const jobsByDept = await db.jobOpening.groupBy({
      by: ['department'],
      _count: { id: true },
    })
    const departmentDistribution = jobsByDept
      .filter((j) => j.department)
      .map((j) => ({ department: j.department!, count: j._count.id }))
      .sort((a, b) => b.count - a.count)

    // 4. Weekly interview completion rate
    const interviewsThisWeek = await db.interview.findMany({
      where: { date: { gte: startOfWeek, lte: endOfWeek } },
      select: { status: true },
    })
    const totalScheduled = interviewsThisWeek.length
    const completed = interviewsThisWeek.filter(
      (i) => i.status === 'Completed' || i.status === 'Selected'
    ).length

    // 5. Top recruiters by placements
    const topRecruiters = await db.placement.groupBy({
      by: ['recruiterId'],
      _count: { id: true },
      where: { recruiterId: { not: null } },
      orderBy: { _count: { id: 'desc' } },
      take: 10,
    })
    const recruiterNames = await db.employee.findMany({
      where: { id: { in: topRecruiters.map((r) => r.recruiterId!) } },
      select: { id: true, name: true },
    })
    const topRecruitersList = topRecruiters.map((r, idx) => {
      const emp = recruiterNames.find((e) => e.id === r.recruiterId)
      return { rank: idx + 1, name: emp?.name ?? 'Unknown', placements: r._count.id }
    })

    // 6. Average time-to-hire
    const hiredCandidates = await db.candidate.findMany({
      where: { status: 'Hired' },
      select: { createdAt: true, updatedAt: true },
    })
    let avgTimeToHire = 0
    if (hiredCandidates.length > 0) {
      const totalDays = hiredCandidates.reduce((sum, c) => {
        const created = new Date(c.createdAt).getTime()
        const updated = new Date(c.updatedAt).getTime()
        return sum + (updated - created) / (1000 * 60 * 60 * 24)
      }, 0)
      avgTimeToHire = Math.round(totalDays / hiredCandidates.length)
    }

    // 7. Revenue trend (sum of commission per month for last 6 months)
    const placementsWithCommission = await db.placement.findMany({
      where: { createdAt: { gte: sixMonthsAgo }, commission: { not: null } },
      select: { createdAt: true, commission: true },
    })
    const revenueTrend: { month: string; revenue: number }[] = []
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const monthLabel = d.toLocaleString('en-IN', { month: 'short', year: '2-digit' })
      const monthStart = new Date(d.getFullYear(), d.getMonth(), 1)
      const monthEnd = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999)
      const revenue = placementsWithCommission
        .filter((p) => {
          const pd = new Date(p.createdAt)
          return pd >= monthStart && pd <= monthEnd
        })
        .reduce((sum, p) => sum + (p.commission ?? 0), 0)
      revenueTrend.push({ month: monthLabel, revenue: Math.round(revenue) })
    }

    // Total revenue (all time)
    const totalRevenueResult = await db.placement.aggregate({
      _sum: { commission: true },
    })
    const totalRevenue = totalRevenueResult._sum.commission ?? 0

    // Active recruiters count
    const activeRecruitersCount = await db.employee.count({
      where: { isActive: true },
    })

    return NextResponse.json({
      monthlyPlacements,
      candidateSources,
      departmentDistribution,
      weeklyInterviews: { total: totalScheduled, completed },
      topRecruiters: topRecruitersList,
      avgTimeToHire,
      revenueTrend,
      totalRevenue: Math.round(totalRevenue),
      activeRecruitersCount,
    })
  } catch (error) {
    console.error('Analytics API error:', error)
    return NextResponse.json({ error: 'Failed to fetch analytics' }, { status: 500 })
  }
}
