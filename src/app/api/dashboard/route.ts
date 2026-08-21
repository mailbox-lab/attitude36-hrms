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

    // Start and end of the month
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

    const [
      totalCandidates,
      openJobs,
      activeClients,
      interviewsThisWeek,
      placementsThisMonth,
      todaysAttendance,
      pendingLeaves,
      allPlacements,
    ] = await Promise.all([
      // Total candidates
      db.candidate.count(),

      // Open jobs
      db.jobOpening.count({ where: { status: 'Open' } }),

      // Active clients
      db.client.count({ where: { status: 'Active' } }),

      // Interviews this week
      db.interview.count({
        where: {
          date: { gte: weekStart },
        },
      }),

      // Placements this month
      db.placement.count({
        where: {
          createdAt: { gte: monthStart, lte: monthEnd },
        },
      }),

      // Today's attendance
      db.attendance.count({
        where: {
          date: { gte: today },
        },
      }),

      // Pending leaves
      db.leaveRequest.count({ where: { status: 'Pending' } }),

      // All placements for revenue calculation
      db.placement.findMany({
        where: {
          status: { in: ['Joined', 'Offered'] },
        },
        select: { commission: true },
      }),
    ]);

    const totalRevenue = allPlacements.reduce(
      (sum: number, p: { commission: number | null }) => sum + (p.commission || 0),
      0
    );

    // Candidate status breakdown
    const candidateStatusBreakdown = await db.candidate.groupBy({
      by: ['status'],
      _count: { status: true },
    });

    // Job status breakdown
    const jobStatusBreakdown = await db.jobOpening.groupBy({
      by: ['status'],
      _count: { status: true },
    });

    return NextResponse.json({
      totalCandidates,
      openJobs,
      activeClients,
      interviewsThisWeek,
      placementsThisMonth,
      todaysAttendance,
      pendingLeaves,
      totalRevenue,
      candidateStatusBreakdown: candidateStatusBreakdown.map((s: { status: string; _count: { status: number } }) => ({
        status: s.status,
        count: s._count.status,
      })),
      jobStatusBreakdown: jobStatusBreakdown.map((s: { status: string; _count: { status: number } }) => ({
        status: s.status,
        count: s._count.status,
      })),
    });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    return NextResponse.json({ error: 'Failed to fetch dashboard stats' }, { status: 500 });
  }
}
