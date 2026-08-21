import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { canApproveAtStep } from '@/lib/auth-utils';

type UserRole = 'FOUNDER' | 'COFOUNDER' | 'HR' | 'EMPLOYEE';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { status: newStatus, approvedById, remark, userRole } = body;

    if (!newStatus || !['Approved', 'Rejected', 'Cancelled'].includes(newStatus)) {
      return NextResponse.json(
        { error: 'status must be Approved, Rejected, or Cancelled' },
        { status: 400 }
      );
    }

    const leaveRequest = await db.leaveRequest.findUnique({
      where: { id },
      include: {
        employee: { select: { id: true, name: true, role: true } },
      },
    });

    if (!leaveRequest) {
      return NextResponse.json({ error: 'Leave request not found' }, { status: 404 });
    }

    if (leaveRequest.status !== 'Pending') {
      return NextResponse.json(
        { error: 'Can only act on pending requests' },
        { status: 400 }
      );
    }

    // For Approval/Rejection: verify hierarchy
    if (newStatus === 'Approved' || newStatus === 'Rejected') {
      if (!userRole || !approvedById) {
        return NextResponse.json(
          { error: 'Approver role and ID are required' },
          { status: 400 }
        );
      }

      // Check if this user can approve at the current step
      const canApprove = canApproveAtStep(
        userRole as UserRole,
        leaveRequest.approvalStep,
        leaveRequest.approverRole
      );

      if (!canApprove) {
        return NextResponse.json(
          { error: `You don't have permission to approve this request. This requires ${leaveRequest.approverRole === 'HR' ? 'HR' : 'Founder/Co-Founder'} approval.` },
          { status: 403 }
        );
      }
    }

    // Handle Cancellation (only the requester can cancel)
    if (newStatus === 'Cancelled') {
      if (!approvedById || approvedById !== leaveRequest.employeeId) {
        return NextResponse.json(
          { error: 'Only the requester can cancel a leave request' },
          { status: 403 }
        );
      }
    }

    // Build update data based on approval step
    const updateData: Record<string, unknown> = {
      status: newStatus,
    };

    if (newStatus === 'Cancelled') {
      updateData.approvalStep = null;
      updateData.approverRole = null;
      return NextResponse.json(
        await db.leaveRequest.update({ where: { id }, data: updateData, include: {
          employee: { select: { id: true, name: true, role: true, department: true, designation: true } },
          approvedByL1: { select: { id: true, name: true, role: true } },
          approvedByL2: { select: { id: true, name: true, role: true } },
        }})
      );
    }

    if (newStatus === 'Rejected') {
      updateData.status = 'Rejected';
      updateData.rejectionReason = remark || null;
      // Record which level rejected
      if (leaveRequest.approvalStep === 1) {
        updateData.approvedByLevel1 = approvedById;
        updateData.approvedAtLevel1 = new Date();
        updateData.remarkL1 = remark || null;
      } else if (leaveRequest.approvalStep === 2) {
        updateData.approvedByLevel2 = approvedById;
        updateData.approvedAtLevel2 = new Date();
        updateData.remarkL2 = remark || null;
      }
      updateData.approvalStep = null;
      updateData.approverRole = null;

      return NextResponse.json(
        await db.leaveRequest.update({ where: { id }, data: updateData, include: {
          employee: { select: { id: true, name: true, role: true, department: true, designation: true } },
          approvedByL1: { select: { id: true, name: true, role: true } },
          approvedByL2: { select: { id: true, name: true, role: true } },
        }})
      );
    }

    // Approval logic
    if (newStatus === 'Approved') {
      if (leaveRequest.approvalStep === 1) {
        updateData.approvedByLevel1 = approvedById;
        updateData.approvedAtLevel1 = new Date();
        updateData.remarkL1 = remark || null;

        // For employee leaves, HR approval is final
        if (leaveRequest.approverRole === 'HR') {
          updateData.status = 'Approved';
          updateData.approvalStep = null;
          updateData.approverRole = null;
        } else {
          // For HR leaves, need L2 (founder) - but since founder IS L1 here, it's final
          updateData.status = 'Approved';
          updateData.approvalStep = null;
          updateData.approverRole = null;
        }
      } else if (leaveRequest.approvalStep === 2) {
        updateData.approvedByLevel2 = approvedById;
        updateData.approvedAtLevel2 = new Date();
        updateData.remarkL2 = remark || null;
        updateData.status = 'Approved';
        updateData.approvalStep = null;
        updateData.approverRole = null;
      }

      const updated = await db.leaveRequest.update({
        where: { id },
        data: updateData,
        include: {
          employee: { select: { id: true, name: true, role: true, department: true, designation: true } },
          approvedByL1: { select: { id: true, name: true, role: true } },
          approvedByL2: { select: { id: true, name: true, role: true } },
        },
      });

      // If fully approved, update leave balance
      if (updated.status === 'Approved') {
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

        // Log activity
        await db.activityLog.create({
          data: {
            entityType: 'LeaveRequest',
            entityId: id,
            action: 'Approved',
            details: `${leaveRequest.type} leave (${leaveRequest.totalDays} days) approved for ${leaveRequest.employee.name}`,
            employeeId: approvedById,
          },
        });
      }

      return NextResponse.json(updated);
    }

    return NextResponse.json({ error: 'Invalid operation' }, { status: 400 });
  } catch (error) {
    console.error('Error updating leave request:', error);
    return NextResponse.json({ error: 'Failed to update leave request' }, { status: 500 });
  }
}