import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status');
    const source = searchParams.get('source');
    const jobId = searchParams.get('jobId');
    const fromDate = searchParams.get('fromDate') || '';
    const toDate = searchParams.get('toDate') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    const where: Record<string, unknown> = {};

    if (search) {
      where.OR = [
        { firstName: { contains: search } },
        { lastName: { contains: search } },
        { email: { contains: search } },
        { title: { contains: search } },
        { skills: { contains: search } },
      ];
    }

    if (status) {
      where.status = status;
    }

    if (source) {
      where.source = source;
    }

    if (jobId) {
      where.jobId = jobId;
    }

    if (fromDate) {
      const existing = (where.createdAt as Record<string, unknown>) || {};
      where.createdAt = { ...existing, gte: new Date(fromDate) };
    }
    if (toDate) {
      const existing = (where.createdAt as Record<string, unknown>) || {};
      where.createdAt = { ...existing, lte: new Date(toDate + 'T23:59:59') };
    }

    const [candidates, total] = await Promise.all([
      db.candidate.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: { job: { select: { id: true, title: true } } },
      }),
      db.candidate.count({ where }),
    ]);

    return NextResponse.json({
      data: candidates,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching candidates:', error);
    return NextResponse.json({ error: 'Failed to fetch candidates' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const candidate = await db.candidate.create({
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
        currency: body.currency || 'INR',
        noticePeriod: body.noticePeriod,
        source: body.source,
        resumeUrl: body.resumeUrl,
        skills: body.skills || '',
        status: body.status || 'New',
        jobId: body.jobId,
        rating: body.rating || 0,
        notes: body.notes,
      },
    });

    return NextResponse.json(candidate, { status: 201 });
  } catch (error) {
    console.error('Error creating candidate:', error);
    return NextResponse.json({ error: 'Failed to create candidate' }, { status: 500 });
  }
}
