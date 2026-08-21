import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const candidateId = searchParams.get('candidateId');
    const jobId = searchParams.get('jobId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    const where: Record<string, unknown> = {};

    if (status) {
      where.status = status;
    }

    if (candidateId) {
      where.candidateId = candidateId;
    }

    if (jobId) {
      where.jobId = jobId;
    }

    if (startDate && endDate) {
      where.date = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      };
    }

    const interviews = await db.interview.findMany({
      where,
      orderBy: { date: 'desc' },
      include: {
        candidate: { select: { id: true, firstName: true, lastName: true, email: true, phone: true } },
        job: { select: { id: true, title: true, client: { select: { id: true, name: true } } } },
      },
    });

    return NextResponse.json({ data: interviews });
  } catch (error) {
    console.error('Error fetching interviews:', error);
    return NextResponse.json({ error: 'Failed to fetch interviews' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const interview = await db.interview.create({
      data: {
        candidateId: body.candidateId,
        jobId: body.jobId,
        type: body.type || 'Technical',
        interviewer: body.interviewer,
        date: new Date(body.date),
        duration: body.duration || 60,
        location: body.location,
        meetingLink: body.meetingLink,
        status: body.status || 'Scheduled',
        feedback: body.feedback,
        rating: body.rating,
      },
      include: {
        candidate: { select: { id: true, firstName: true, lastName: true } },
        job: { select: { id: true, title: true } },
      },
    });

    return NextResponse.json(interview, { status: 201 });
  } catch (error) {
    console.error('Error creating interview:', error);
    return NextResponse.json({ error: 'Failed to create interview' }, { status: 500 });
  }
}
