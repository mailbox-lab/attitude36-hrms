import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status');
    const industry = searchParams.get('industry');

    const where: Record<string, unknown> = {};

    if (search) {
      where.OR = [
        { name: { contains: search } },
        { contactName: { contains: search } },
        { contactEmail: { contains: search } },
        { city: { contains: search } },
      ];
    }

    if (status) {
      where.status = status;
    }

    if (industry) {
      where.industry = industry;
    }

    const clients = await db.client.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        _count: { select: { jobs: true, placements: true } },
      },
    });

    return NextResponse.json({ data: clients });
  } catch (error) {
    console.error('Error fetching clients:', error);
    return NextResponse.json({ error: 'Failed to fetch clients' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const client = await db.client.create({
      data: {
        name: body.name,
        industry: body.industry,
        website: body.website,
        address: body.address,
        city: body.city,
        state: body.state,
        country: body.country || 'India',
        description: body.description,
        contactName: body.contactName,
        contactEmail: body.contactEmail,
        contactPhone: body.contactPhone,
        status: body.status || 'Active',
      },
    });

    return NextResponse.json(client, { status: 201 });
  } catch (error) {
    console.error('Error creating client:', error);
    return NextResponse.json({ error: 'Failed to create client' }, { status: 500 });
  }
}
