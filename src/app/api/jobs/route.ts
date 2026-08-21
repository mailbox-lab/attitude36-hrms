import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status');
    const priority = searchParams.get('priority');

    const where: Record<string, unknown> = {};

    if (search) {
      where.OR = [
        { title: { contains: search } },
        { location: { contains: search } },
        { department: { contains: search } },
        { client: { name: { contains: search } } },
      ];
    }

    if (status) {
      where.status = status;
    }

    if (priority) {
      where.priority = priority;
    }

    const jobs = await db.jobOpening.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        client: { select: { id: true, name: true } },
        recruiter: { select: { id: true, name: true } },
        _count: { select: { candidates: true, interviews: true, placements: true } },
      },
    });

    return NextResponse.json({ data: jobs });
  } catch (error) {
    console.error('Error fetching jobs:', error);
    return NextResponse.json({ error: 'Failed to fetch jobs' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const job = await db.jobOpening.create({
      data: {
        title: body.title,
        clientId: body.clientId,
        recruiterId: body.recruiterId,
        department: body.department,
        location: body.location,
        employmentType: body.employmentType || 'Full-Time',
        salaryMin: body.salaryMin,
        salaryMax: body.salaryMax,
        currency: body.currency || 'INR',
        description: body.description,
        requirements: body.requirements,
        status: body.status || 'Open',
        priority: body.priority || 'Medium',
        openings: body.openings || 1,
      },
      include: {
        client: { select: { id: true, name: true } },
        recruiter: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json(job, { status: 201 });
  } catch (error) {
    console.error('Error creating job:', error);
    return NextResponse.json({ error: 'Failed to create job' }, { status: 500 });
  }
}
