import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const clientId = searchParams.get('clientId');

    const where: Record<string, unknown> = {};

    if (status) {
      where.status = status;
    }

    if (clientId) {
      where.clientId = clientId;
    }

    const placements = await db.placement.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        candidate: { select: { id: true, firstName: true, lastName: true, email: true, phone: true } },
        client: { select: { id: true, name: true, industry: true } },
        job: { select: { id: true, title: true } },
        recruiter: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json({ data: placements });
  } catch (error) {
    console.error('Error fetching placements:', error);
    return NextResponse.json({ error: 'Failed to fetch placements' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const placement = await db.placement.create({
      data: {
        candidateId: body.candidateId,
        jobId: body.jobId,
        clientId: body.clientId,
        recruiterId: body.recruiterId,
        offeredCTC: body.offeredCTC,
        joinedDate: body.joinedDate ? new Date(body.joinedDate) : null,
        status: body.status || 'Offered',
        commission: body.commission,
      },
      include: {
        candidate: { select: { id: true, firstName: true, lastName: true } },
        client: { select: { id: true, name: true } },
        job: { select: { id: true, title: true } },
        recruiter: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json(placement, { status: 201 });
  } catch (error) {
    console.error('Error creating placement:', error);
    return NextResponse.json({ error: 'Failed to create placement' }, { status: 500 });
  }
}
