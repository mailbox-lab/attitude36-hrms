import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const data: Record<string, unknown> = {};

    if (body.clockIn !== undefined) {
      data.clockIn = body.clockIn ? new Date(body.clockIn) : null;
    }

    if (body.clockOut !== undefined) {
      data.clockOut = body.clockOut ? new Date(body.clockOut) : null;

      // Calculate total hours if both clock in and clock out are set
      if (body.clockOut && body.clockIn) {
        const start = new Date(body.clockIn);
        const end = new Date(body.clockOut);
        data.totalHours = parseFloat(((end.getTime() - start.getTime()) / (1000 * 60 * 60)).toFixed(2));
      }
    }

    if (body.status !== undefined) {
      data.status = body.status;
    }

    if (body.notes !== undefined) {
      data.notes = body.notes;
    }

    const attendance = await db.attendance.update({
      where: { id },
      data,
      include: {
        employee: { select: { id: true, name: true, role: true } },
      },
    });

    return NextResponse.json(attendance);
  } catch (error) {
    console.error('Error updating attendance:', error);
    return NextResponse.json({ error: 'Failed to update attendance' }, { status: 500 });
  }
}
