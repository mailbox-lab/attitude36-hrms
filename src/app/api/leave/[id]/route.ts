import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { status, approvedBy } = body;

    if (!status || !['Approved', 'Rejected'].includes(status)) {
      return NextResponse.json(
        { error: 'status must be Approved or Rejected' },
        { status: 400 }
      );
    }

    const leaveRequest = await db.leaveRequest.findUnique({
      where: { id },
    });

    if (!leaveRequest) {
      return NextResponse.json({ error: 'Leave request not found' }, { status: 404 });
    }

    if (leaveRequest.status !== 'Pending') {
      return NextResponse.json(
        { error: 'Can only approve or reject pending requests' },
        { status: 400 }
      );
    }

    const updated = await db.leaveRequest.update({
      where: { id },
      data: {
        status,
        approvedBy: approvedBy || null,
        approvedAt: new Date(),
      },
      include: {
        employee: { select: { id: true, name: true, role: true, department: true } },
      },
    });

    // If approved, update leave balance
    if (status === 'Approved') {
      const year = leaveRequest.startDate.getFullYear();
      const leaveBalance = await db.leaveBalance.findUnique({
        where: {
          employeeId_year_type: {
            employeeId: leaveRequest.employeeId,
            year,
            type: leaveRequest.type,
          },
        },
      });

      if (leaveBalance) {
        await db.leaveBalance.update({
          where: { id: leaveBalance.id },
          data: {
            used: { increment: leaveRequest.totalDays },
            remaining: { decrement: leaveRequest.totalDays },
          },
        });
      }
    }

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Error updating leave request:', error);
    return NextResponse.json({ error: 'Failed to update leave request' }, { status: 500 });
  }
}
