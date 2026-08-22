import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const department = searchParams.get('department');
    const role = searchParams.get('role');
    const activeOnly = searchParams.get('activeOnly') !== 'false';

    const where: Record<string, unknown> = {};

    if (department) {
      where.department = department;
    }

    if (role) {
      where.role = role;
    }

    if (activeOnly) {
      where.isActive = true;
    }

    const employees = await db.employee.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: {
            placements: true,
            assignedJobs: true,
          },
        },
      },
    });

    return NextResponse.json({ data: employees });
  } catch (error) {
    console.error('Error fetching employees:', error);
    return NextResponse.json({ error: 'Failed to fetch employees' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const employee = await db.employee.create({
      data: {
        name: body.name,
        email: body.email,
        phone: body.phone,
        role: body.role || 'EMPLOYEE',
        department: body.department,
        avatar: body.avatar,
        isActive: body.isActive !== undefined ? body.isActive : true,
      },
    });

    return NextResponse.json(employee, { status: 201 });
  } catch (error) {
    console.error('Error creating employee:', error);
    return NextResponse.json({ error: 'Failed to create employee' }, { status: 500 });
  }
}
