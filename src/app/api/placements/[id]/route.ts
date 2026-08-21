import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const placement = await db.placement.findUnique({
      where: { id },
      include: {
        candidate: true,
        client: true,
        job: {
          include: {
            client: { select: { id: true, name: true } },
          },
        },
        recruiter: { select: { id: true, name: true, email: true } },
      },
    });

    if (!placement) {
      return NextResponse.json({ error: 'Placement not found' }, { status: 404 });
    }

    return NextResponse.json(placement);
  } catch (error) {
    console.error('Error fetching placement:', error);
    return NextResponse.json({ error: 'Failed to fetch placement' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const placement = await db.placement.update({
      where: { id },
      data: {
        candidateId: body.candidateId,
        jobId: body.jobId,
        clientId: body.clientId,
        recruiterId: body.recruiterId,
        offeredCTC: body.offeredCTC,
        joinedDate: body.joinedDate ? new Date(body.joinedDate) : null,
        status: body.status,
        commission: body.commission,
      },
      include: {
        candidate: { select: { id: true, firstName: true, lastName: true } },
        client: { select: { id: true, name: true } },
        job: { select: { id: true, title: true } },
        recruiter: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json(placement);
  } catch (error) {
    console.error('Error updating placement:', error);
    return NextResponse.json({ error: 'Failed to update placement' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await db.placement.delete({ where: { id } });
    return NextResponse.json({ message: 'Placement deleted' });
  } catch (error) {
    console.error('Error deleting placement:', error);
    return NextResponse.json({ error: 'Failed to delete placement' }, { status: 500 });
  }
}
