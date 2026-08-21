import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const now = new Date();
    const currentYear = now.getFullYear();
    const thirtyDaysAgo = new Date(now);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const employee = await db.employee.findUnique({
      where: { id },
      include: {
        placements: {
          include: {
            candidate: { select: { id: true, firstName: true, lastName: true } },
            client: { select: { id: true, name: true } },
            job: { select: { id: true, title: true } },
          },
          orderBy: { createdAt: 'desc' },
        },
        assignedJobs: {
          include: {
            client: { select: { id: true, name: true } },
          },
          orderBy: { createdAt: 'desc' },
        },
        leaveBalances: {
          where: { year: currentYear },
        },
        leaveRequests: {
          orderBy: { createdAt: 'desc' },
        },
        attendance: {
          where: {
            date: { gte: thirtyDaysAgo },
          },
          orderBy: { date: 'desc' },
        },
        activities: {
          orderBy: { createdAt: 'desc' },
          take: 20,
        },
        _count: {
          select: {
            attendance: true,
            leaveRequests: true,
            activities: true,
          },
        },
      },
    });

    if (!employee) {
      return NextResponse.json({ error: 'Employee not found' }, { status: 404 });
    }

    // Compute attendance stats
    const recentAttendance = employee.attendance;
    const presentDays = recentAttendance.filter(
      (a) => a.status === 'Present'
    ).length;
    const lateDays = recentAttendance.filter(
      (a) => a.status === 'Late'
    ).length;
    const totalRecords = recentAttendance.length;
    const totalHours = recentAttendance.reduce(
      (sum, a) => sum + (a.totalHours || 0),
      0
    );
    const attendanceRate =
      totalRecords > 0
        ? Math.round(((presentDays + lateDays) / totalRecords) * 100)
        : 0;
    const avgHoursPerDay =
      totalRecords > 0
        ? Math.round((totalHours / totalRecords) * 100) / 100
        : 0;

    // Leave request summary
    const leaveRequestsSummary = {
      pending: employee.leaveRequests.filter(
      (r) => r.status === 'Pending'
    ).length,
      approved: employee.leaveRequests.filter(
      (r) => r.status === 'Approved'
    ).length,
      rejected: employee.leaveRequests.filter(
      (r) => r.status === 'Rejected'
    ).length,
      total: employee.leaveRequests.length,
    };

    // Placements stats
    const totalPlacements = employee.placements.length;
    const totalRevenue = employee.placements.reduce(
      (sum, p) => sum + (p.commission || 0),
      0
    );

    // Interviews conducted (from activities or we count from placements context)
    // Since there's no direct interviewer -> employee link, use activities
    const interviewsConducted = employee.activities.filter(
      (a) =>
        a.action.toLowerCase().includes('interview')
    ).length;

    // Total leave balance remaining
    const totalLeaveRemaining = employee.leaveBalances.reduce(
      (sum, b) => sum + (b.remaining || 0),
      0
    );

    return NextResponse.json({
      ...employee,
      stats: {
        totalPlacements,
        interviewsConducted,
        attendanceRate,
        totalLeaveRemaining,
        totalRevenue,
      },
      attendanceSummary: {
        presentDays,
        lateDays,
        totalRecords,
        totalHours: Math.round(totalHours * 100) / 100,
        avgHoursPerDay,
      },
      leaveRequestsSummary,
    });
  } catch (error) {
    console.error('Error fetching employee:', error);
    return NextResponse.json({ error: 'Failed to fetch employee' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const employee = await db.employee.update({
      where: { id },
      data: {
        name: body.name,
        email: body.email,
        phone: body.phone,
        role: body.role,
        department: body.department,
        avatar: body.avatar,
        isActive: body.isActive,
      },
    });

    return NextResponse.json(employee);
  } catch (error) {
    console.error('Error updating employee:', error);
    return NextResponse.json({ error: 'Failed to update employee' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await db.employee.delete({ where: { id } });
    return NextResponse.json({ message: 'Employee deleted' });
  } catch (error) {
    console.error('Error deleting employee:', error);
    return NextResponse.json({ error: 'Failed to delete employee' }, { status: 500 });
  }
}
