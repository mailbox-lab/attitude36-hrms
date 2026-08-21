import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { employeeId } = body;

    if (!employeeId) {
      return NextResponse.json({ error: 'employeeId is required' }, { status: 400 });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const attendance = await db.attendance.findUnique({
      where: {
        employeeId_date: {
          employeeId,
          date: today,
        },
      },
    });

    if (!attendance) {
      return NextResponse.json({ error: 'No clock-in record found for today' }, { status: 404 });
    }

    if (attendance.clockOut) {
      return NextResponse.json({ error: 'Already clocked out today' }, { status: 400 });
    }

    const now = new Date();
    const totalHours = parseFloat(
      ((now.getTime() - attendance.clockIn!.getTime()) / (1000 * 60 * 60)).toFixed(2)
    );

    const updated = await db.attendance.update({
      where: { id: attendance.id },
      data: {
        clockOut: now,
        totalHours,
      },
      include: {
        employee: { select: { id: true, name: true, role: true } },
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Error clocking out:', error);
    return NextResponse.json({ error: 'Failed to clock out' }, { status: 500 });
  }
}
