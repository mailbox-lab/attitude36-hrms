import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const employee = await db.employee.findUnique({
      where: { id },
      include: {
        placements: {
          include: {
            candidate: { select: { id: true, firstName: true, lastName: true } },
            client: { select: { id: true, name: true } },
          },
          orderBy: { createdAt: 'desc' },
        },
        assignedJobs: {
          include: {
            client: { select: { id: true, name: true } },
          },
          orderBy: { createdAt: 'desc' },
        },
        leaveBalances: true,
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

    return NextResponse.json(employee);
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
