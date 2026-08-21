import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const view = searchParams.get('view');
    const status = searchParams.get('status');
    const type = searchParams.get('type');
    const employeeId = searchParams.get('employeeId');

    // Handle balance view
    if (view === 'balances' && employeeId) {
      const currentYear = new Date().getFullYear();
      const balances = await db.leaveBalance.findMany({
        where: {
          employeeId,
          year: currentYear,
        },
        orderBy: { type: 'asc' },
      });
      return NextResponse.json({ data: balances });
    }

    const where: Record<string, unknown> = {};

    if (status && status !== 'All') {
      where.status = status;
    }

    if (type && type !== 'All') {
      where.type = type;
    }

    if (employeeId) {
      where.employeeId = employeeId;
    }

    const leaveRequests = await db.leaveRequest.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        employee: { select: { id: true, name: true, role: true, department: true } },
      },
    });

    return NextResponse.json({ data: leaveRequests });
  } catch (error) {
    console.error('Error fetching leave requests:', error);
    return NextResponse.json({ error: 'Failed to fetch leave requests' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { employeeId, type, startDate, endDate, reason } = body;

    if (!employeeId || !type || !startDate || !endDate) {
      return NextResponse.json(
        { error: 'employeeId, type, startDate, and endDate are required' },
        { status: 400 }
      );
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const totalDays = parseFloat((diffTime / (1000 * 60 * 60 * 24) + 1).toFixed(1));

    const leaveRequest = await db.leaveRequest.create({
      data: {
        employeeId,
        type,
        startDate: start,
        endDate: end,
        totalDays,
        reason,
        status: 'Pending',
      },
      include: {
        employee: { select: { id: true, name: true, role: true, department: true } },
      },
    });

    return NextResponse.json(leaveRequest, { status: 201 });
  } catch (error) {
    console.error('Error creating leave request:', error);
    return NextResponse.json({ error: 'Failed to create leave request' }, { status: 500 });
  }
}
