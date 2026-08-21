import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const candidate = await db.candidate.findUnique({
      where: { id },
      include: {
        job: { select: { id: true, title: true, client: { select: { id: true, name: true } } } },
        interviews: { orderBy: { date: 'desc' } },
        placements: true,
      },
    });

    if (!candidate) {
      return NextResponse.json({ error: 'Candidate not found' }, { status: 404 });
    }

    return NextResponse.json(candidate);
  } catch (error) {
    console.error('Error fetching candidate:', error);
    return NextResponse.json({ error: 'Failed to fetch candidate' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const candidate = await db.candidate.update({
      where: { id },
      data: {
        firstName: body.firstName,
        lastName: body.lastName,
        email: body.email,
        phone: body.phone,
        title: body.title,
        location: body.location,
        experience: body.experience,
        currentCompany: body.currentCompany,
        currentCTC: body.currentCTC,
        expectedCTC: body.expectedCTC,
        currency: body.currency,
        noticePeriod: body.noticePeriod,
        source: body.source,
        resumeUrl: body.resumeUrl,
        skills: body.skills,
        status: body.status,
        jobId: body.jobId,
        rating: body.rating,
        notes: body.notes,
      },
    });

    return NextResponse.json(candidate);
  } catch (error) {
    console.error('Error updating candidate:', error);
    return NextResponse.json({ error: 'Failed to update candidate' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await db.candidate.delete({ where: { id } });
    return NextResponse.json({ message: 'Candidate deleted' });
  } catch (error) {
    console.error('Error deleting candidate:', error);
    return NextResponse.json({ error: 'Failed to delete candidate' }, { status: 500 });
  }
}
