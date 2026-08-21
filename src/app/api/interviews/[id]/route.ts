import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const interview = await db.interview.findUnique({
      where: { id },
      include: {
        candidate: true,
        job: {
          include: {
            client: { select: { id: true, name: true } },
          },
        },
      },
    });

    if (!interview) {
      return NextResponse.json({ error: 'Interview not found' }, { status: 404 });
    }

    return NextResponse.json(interview);
  } catch (error) {
    console.error('Error fetching interview:', error);
    return NextResponse.json({ error: 'Failed to fetch interview' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const interview = await db.interview.update({
      where: { id },
      data: {
        candidateId: body.candidateId,
        jobId: body.jobId,
        type: body.type,
        interviewer: body.interviewer,
        date: body.date ? new Date(body.date) : undefined,
        duration: body.duration,
        location: body.location,
        meetingLink: body.meetingLink,
        status: body.status,
        feedback: body.feedback,
        rating: body.rating,
      },
      include: {
        candidate: { select: { id: true, firstName: true, lastName: true } },
        job: { select: { id: true, title: true } },
      },
    });

    return NextResponse.json(interview);
  } catch (error) {
    console.error('Error updating interview:', error);
    return NextResponse.json({ error: 'Failed to update interview' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await db.interview.delete({ where: { id } });
    return NextResponse.json({ message: 'Interview deleted' });
  } catch (error) {
    console.error('Error deleting interview:', error);
    return NextResponse.json({ error: 'Failed to delete interview' }, { status: 500 });
  }
}
