import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    // Start of the week (Monday)
    const dayOfWeek = today.getDay();
    const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() + mondayOffset);
    weekStart.setHours(0, 0, 0, 0);

    // Previous week for comparison
    const prevWeekStart = new Date(weekStart);
    prevWeekStart.setDate(weekStart.getDate() - 7);
    const prevWeekEnd = new Date(weekStart);
    prevWeekEnd.setDate(weekStart.getDate() - 1);

    // Start and end of the month
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

    // Previous month for comparison
    const prevMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const prevMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);

    const [
      totalCandidates,
      openJobs,
      activeClients,
      interviewsThisWeek,
      placementsThisMonth,
      todaysAttendance,
      pendingLeaves,
      allPlacements,
      prevWeekCandidates,
      prevMonthPlacements,
      candidateStatusBreakdown,
      jobStatusBreakdown,
      recentActivities,
      upcomingInterviews,
      jobPriorityBreakdown,
    ] = await Promise.all([
      db.candidate.count(),
      db.jobOpening.count({ where: { status: 'Open' } }),
      db.client.count({ where: { status: 'Active' } }),
      db.interview.count({ where: { date: { gte: weekStart } } }),
      db.placement.count({ where: { createdAt: { gte: monthStart, lte: monthEnd } } }),
      db.attendance.count({ where: { date: { gte: today } } }),
      db.leaveRequest.count({ where: { status: 'Pending' } }),
      db.placement.findMany({
        where: { status: { in: ['Joined', 'Offered'] } },
        select: { commission: true },
      }),
      // Previous week candidates count for change calculation
      db.candidate.count({ where: { createdAt: { gte: prevWeekStart, lt: weekStart } } }),
      // Previous month placements count for change calculation
      db.placement.count({ where: { createdAt: { gte: prevMonthStart, lte: prevMonthEnd } } }),
      db.candidate.groupBy({ by: ['status'], _count: { status: true } }),
      db.jobOpening.groupBy({ by: ['status'], _count: { status: true } }),
      // Recent activities
      db.activityLog.findMany({
        orderBy: { createdAt: 'desc' },
        take: 10,
        include: { employee: { select: { name: true } } },
      }),
      // Upcoming interviews (future interviews)
      db.interview.findMany({
        where: { date: { gte: today }, status: { in: ['Scheduled', 'Confirmed'] } },
        orderBy: { date: 'asc' },
        take: 10,
        include: {
          candidate: { select: { firstName: true, lastName: true } },
          job: { select: { title: true } },
        },
      }),
      // Job priority breakdown
      db.jobOpening.groupBy({ by: ['priority'], _count: { priority: true } }),
    ]);

    const totalRevenue = allPlacements.reduce(
      (sum: number, p: { commission: number | null }) => sum + (p.commission || 0),
      0
    );

    // Calculate change percentages
    const currentWeekCandidates = await db.candidate.count({
      where: { createdAt: { gte: weekStart } },
    });
    const totalCandidatesChange = prevWeekCandidates > 0
      ? ((currentWeekCandidates - prevWeekCandidates) / prevWeekCandidates) * 100
      : 0;

    const placementsThisMonthChange = prevMonthPlacements > 0
      ? ((placementsThisMonth - prevMonthPlacements) / prevMonthPlacements) * 100
      : 0;

    return NextResponse.json({
      stats: {
        totalCandidates,
        openPositions: openJobs,
        activeClients,
        interviewsThisWeek,
        placementsThisMonth,
        todaysAttendance,
        pendingLeaves,
        monthlyRevenue: totalRevenue,
        totalCandidatesChange,
        openPositionsChange: 0,
        activeClientsChange: 0,
        interviewsThisWeekChange: 0,
        placementsThisMonthChange,
        todaysAttendanceChange: 0,
        pendingLeavesChange: 0,
        monthlyRevenueChange: 0,
      },
      pipeline: candidateStatusBreakdown.map((s: { status: string; _count: { status: number } }) => ({
        status: s.status,
        count: s._count.status,
      })),
      priorityDistribution: jobPriorityBreakdown.map((s: { priority: string; _count: { priority: number } }) => ({
        priority: s.priority,
        count: s._count.priority,
      })),
      recentActivities: recentActivities.map((a) => ({
        id: a.id,
        action: a.action,
        entityType: a.entityType,
        details: a.details,
        employeeName: a.employee?.name || 'System',
        createdAt: a.createdAt.toISOString(),
      })),
      upcomingInterviews: upcomingInterviews.map((i) => ({
        id: i.id,
        candidateName: `${i.candidate.firstName} ${i.candidate.lastName}`,
        jobTitle: i.job?.title || 'No Job Assigned',
        type: i.type,
        date: i.date.toISOString(),
        time: i.date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }),
        status: i.status,
      })),
    });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    return NextResponse.json({ error: 'Failed to fetch dashboard stats' }, { status: 500 });
  }
}
