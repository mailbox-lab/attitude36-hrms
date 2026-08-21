import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getApprovalChain } from '@/lib/auth-utils';

type ApproverRole = 'HR' | 'FOUNDER_OR_COFOUNDER';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const view = searchParams.get('view');
    const status = searchParams.get('status');
    const type = searchParams.get('type');
    const employeeId = searchParams.get('employeeId');
    const pendingFor = searchParams.get('pendingFor'); // role-based filter

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

    // Handle pending approvals for a specific role
    if (view === 'pending-approvals' && pendingFor) {
      const where: Record<string, unknown> = {
        status: 'Pending',
      };

      if (pendingFor === 'HR') {
        where.approverRole = 'HR';
        where.approvalStep = 1;
      } else if (pendingFor === 'FOUNDER' || pendingFor === 'COFOUNDER') {
        where.approverRole = 'FOUNDER_OR_COFOUNDER';
        where.approvalStep = 1;
      }

      const pendingRequests = await db.leaveRequest.findMany({
        where,
        orderBy: { createdAt: 'asc' },
        include: {
          employee: { select: { id: true, name: true, role: true, department: true, designation: true } },
        },
      });

      return NextResponse.json({ data: pendingRequests });
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
        employee: { select: { id: true, name: true, role: true, department: true, designation: true, reportingToId: true } },
        approvedByL1: { select: { id: true, name: true, role: true } },
        approvedByL2: { select: { id: true, name: true, role: true } },
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

    // Get employee to determine role
    const employee = await db.employee.findUnique({
      where: { id: employeeId },
      select: { role: true },
    });

    if (!employee) {
      return NextResponse.json({ error: 'Employee not found' }, { status: 404 });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const totalDays = parseFloat((diffTime / (1000 * 60 * 60 * 24) + 1).toFixed(1));

    // Determine approval chain
    const chain = getApprovalChain(employee.role as any);

    let approvalStep: number | null = null;
    let approverRole: string | null = null;
    let finalStatus = 'Pending';

    if (chain.autoApprove) {
      // Founder/Co-Founder: auto-approve
      approvalStep = null;
      approverRole = null;
      finalStatus = 'Approved';
    } else if (chain.steps.length > 0) {
      const firstStep = chain.steps[0];
      approvalStep = firstStep.level;
      approverRole = firstStep.approverRole;
      finalStatus = 'Pending';
    }

    const leaveRequest = await db.leaveRequest.create({
      data: {
        employeeId,
        type,
        startDate: start,
        endDate: end,
        totalDays,
        reason,
        status: finalStatus,
        approvalStep,
        approverRole: approverRole as ApproverRole | null,
      },
      include: {
        employee: { select: { id: true, name: true, role: true, department: true, designation: true } },
        approvedByL1: { select: { id: true, name: true, role: true } },
        approvedByL2: { select: { id: true, name: true, role: true } },
      },
    });

    // If auto-approved, update leave balance
    if (finalStatus === 'Approved') {
      const year = start.getFullYear();
      const leaveBalance = await db.leaveBalance.findUnique({
        where: {
          employeeId_year_type: {
            employeeId,
            year,
            type,
          },
        },
      });

      if (leaveBalance) {
        await db.leaveBalance.update({
          where: { id: leaveBalance.id },
          data: {
            used: { increment: totalDays },
            remaining: { decrement: totalDays },
          },
        });
      }
    }

    return NextResponse.json(leaveRequest, { status: 201 });
  } catch (error) {
    console.error('Error creating leave request:', error);
    return NextResponse.json({ error: 'Failed to create leave request' }, { status: 500 });
  }
}
