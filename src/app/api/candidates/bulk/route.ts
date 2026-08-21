import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

const VALID_ACTIONS = ['updateStatus', 'delete'] as const;
const VALID_STATUSES = ['New', 'Screening', 'Interview', 'Offer', 'Hired', 'Rejected', 'On-Hold'];

type BulkAction = (typeof VALID_ACTIONS)[number];

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { ids, action, status } = body as {
      ids: string[];
      action: BulkAction;
      status?: string;
    };

    // Validate ids
    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json(
        { error: 'ids must be a non-empty array' },
        { status: 400 }
      );
    }

    // Validate action
    if (!VALID_ACTIONS.includes(action)) {
      return NextResponse.json(
        { error: `action must be one of: ${VALID_ACTIONS.join(', ')}` },
        { status: 400 }
      );
    }

    // Validate status for updateStatus action
    if (action === 'updateStatus') {
      if (!status || !VALID_STATUSES.includes(status)) {
        return NextResponse.json(
          { error: `status must be one of: ${VALID_STATUSES.join(', ')}` },
          { status: 400 }
        );
      }
    }

    let updated = 0;

    if (action === 'updateStatus') {
      const result = await db.candidate.updateMany({
        where: { id: { in: ids } },
        data: { status },
      });
      updated = result.count;
    } else if (action === 'delete') {
      // Delete in a transaction to handle related records
      const result = await db.$transaction(async (tx) => {
        // Delete related interviews first
        await tx.interview.deleteMany({
          where: { candidateId: { in: ids } },
        });
        // Delete related placements
        await tx.placement.deleteMany({
          where: { candidateId: { in: ids } },
        });
        // Delete candidates
        const deleted = await tx.candidate.deleteMany({
          where: { id: { in: ids } },
        });
        return deleted.count;
      });
      updated = result;
    }

    return NextResponse.json({ success: true, updated });
  } catch (error) {
    console.error('Error performing bulk action:', error);
    return NextResponse.json(
      { error: 'Failed to perform bulk action' },
      { status: 500 }
    );
  }
}
