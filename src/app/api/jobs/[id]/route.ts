import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const job = await db.jobOpening.findUnique({
      where: { id },
      include: {
        client: true,
        recruiter: { select: { id: true, name: true, email: true } },
        candidates: { orderBy: { createdAt: 'desc' } },
        interviews: {
          include: {
            candidate: { select: { id: true, firstName: true, lastName: true } },
          },
          orderBy: { date: 'desc' },
        },
        placements: {
          include: {
            candidate: { select: { id: true, firstName: true, lastName: true } },
          },
        },
        _count: { select: { candidates: true, interviews: true, placements: true } },
      },
    });

    if (!job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }

    return NextResponse.json(job);
  } catch (error) {
    console.error('Error fetching job:', error);
    return NextResponse.json({ error: 'Failed to fetch job' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const job = await db.jobOpening.update({
      where: { id },
      data: {
        title: body.title,
        clientId: body.clientId,
        recruiterId: body.recruiterId,
        department: body.department,
        location: body.location,
        employmentType: body.employmentType,
        salaryMin: body.salaryMin,
        salaryMax: body.salaryMax,
        currency: body.currency,
        description: body.description,
        requirements: body.requirements,
        status: body.status,
        priority: body.priority,
        openings: body.openings,
      },
      include: {
        client: { select: { id: true, name: true } },
        recruiter: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json(job);
  } catch (error) {
    console.error('Error updating job:', error);
    return NextResponse.json({ error: 'Failed to update job' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await db.jobOpening.delete({ where: { id } });
    return NextResponse.json({ message: 'Job deleted' });
  } catch (error) {
    console.error('Error deleting job:', error);
    return NextResponse.json({ error: 'Failed to delete job' }, { status: 500 });
  }
}
