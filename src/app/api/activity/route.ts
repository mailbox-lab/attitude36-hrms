import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

const VALID_ENTITY_TYPES = ['candidate', 'client', 'job', 'interview', 'placement', 'employee', 'leave', 'attendance'];

const SAMPLE_ACTIONS: Record<string, { action: string; details: string }[]> = {
  candidate: [
    { action: 'created', details: 'New candidate added to the system' },
    { action: 'status_updated', details: 'Candidate status changed from New to Screening' },
    { action: 'interview_scheduled', details: 'Technical interview scheduled' },
    { action: 'skills_updated', details: 'Candidate skills profile updated' },
    { action: 'moved_to_pipeline', details: 'Candidate moved to interview pipeline' },
    { action: 'note_added', details: 'Recruiter added notes about candidate experience' },
    { action: 'resume_updated', details: 'New resume uploaded for the candidate' },
    { action: 'rating_updated', details: 'Candidate rating updated to 4 stars' },
  ],
  client: [
    { action: 'created', details: 'New client company onboarded' },
    { action: 'contact_updated', details: 'Client contact information updated' },
    { action: 'status_changed', details: 'Client status changed to Active' },
    { action: 'job_posted', details: 'New job opening posted by client' },
    { action: 'meeting_scheduled', details: 'Client meeting scheduled for next week' },
  ],
  job: [
    { action: 'created', details: 'New job opening created' },
    { action: 'priority_changed', details: 'Job priority updated to High' },
    { action: 'status_updated', details: 'Job status changed to In Progress' },
    { action: 'requirement_updated', details: 'Job requirements updated by hiring manager' },
    { action: 'salary_updated', details: 'Salary range updated for the position' },
    { action: 'candidate_assigned', details: 'Candidates assigned to the job opening' },
    { action: 'closed', details: 'Job opening closed after successful placement' },
  ],
  interview: [
    { action: 'scheduled', details: 'Interview scheduled with hiring team' },
    { action: 'completed', details: 'Interview completed successfully' },
    { action: 'rescheduled', details: 'Interview rescheduled due to availability' },
    { action: 'feedback_added', details: 'Interviewer submitted feedback' },
    { action: 'cancelled', details: 'Interview cancelled by candidate' },
    { action: 'reminder_sent', details: 'Interview reminder sent to candidate' },
  ],
  placement: [
    { action: 'offered', details: 'Offer letter sent to candidate' },
    { action: 'accepted', details: 'Candidate accepted the offer' },
    { action: 'joined', details: 'Candidate joined the organization' },
    { action: 'backed_out', details: 'Candidate backed out after accepting offer' },
    { action: 'commission_generated', details: 'Placement commission calculated' },
  ],
  employee: [
    { action: 'created', details: 'New employee added to the system' },
    { action: 'profile_updated', details: 'Employee profile information updated' },
    { action: 'role_changed', details: 'Employee role updated' },
    { action: 'department_changed', details: 'Employee transferred to new department' },
    { action: 'deactivated', details: 'Employee account deactivated' },
  ],
  leave: [
    { action: 'requested', details: 'Leave request submitted for approval' },
    { action: 'approved', details: 'Leave request approved by manager' },
    { action: 'rejected', details: 'Leave request rejected due to project deadline' },
    { action: 'cancelled', details: 'Leave request cancelled by employee' },
    { action: 'balance_updated', details: 'Leave balance updated after approval' },
  ],
  attendance: [
    { action: 'clocked_in', details: 'Employee clocked in for the day' },
    { action: 'clocked_out', details: 'Employee clocked out' },
    { action: 'late_marked', details: 'Employee marked as late arrival' },
    { action: 'half_day', details: 'Employee marked half-day attendance' },
    { action: 'absent_marked', details: 'Employee marked absent for the day' },
  ],
};

async function generateSampleActivities() {
  const employees = await db.employee.findMany({ select: { id: true, name: true } });
  const candidates = await db.candidate.findMany({ select: { id: true, firstName: true, lastName: true } });
  const clients = await db.client.findMany({ select: { id: true, name: true } });
  const jobs = await db.jobOpening.findMany({ select: { id: true, title: true } });

  if (employees.length === 0) return;

  const now = new Date();
  const activities: { entityType: string; entityId: string; action: string; details: string; employeeId: string; createdAt: Date }[] = [];

  const entityMap: Record<string, { id: string }[]> = {
    candidate: candidates,
    client: clients,
    job: jobs,
    interview: [],
    placement: [],
    employee: employees,
    leave: [],
    attendance: [],
  };

  const entityIds: Record<string, string> = {
    interview: 'intv_sample',
    placement: 'plc_sample',
    leave: 'lv_sample',
    attendance: 'att_sample',
  };

  // Generate ~30 sample activities spread across the last 30 days
  const entityTypes = Object.keys(SAMPLE_ACTIONS);
  for (let i = 0; i < 35; i++) {
    const type = entityTypes[i % entityTypes.length];
    const actions = SAMPLE_ACTIONS[type];
    const sample = actions[i % actions.length];
    const emp = employees[i % employees.length];
    const daysAgo = Math.floor(i * 0.85);
    const hoursOffset = Math.floor(Math.random() * 10) + 8;
    const createdAt = new Date(now);
    createdAt.setDate(createdAt.getDate() - daysAgo);
    createdAt.setHours(hoursOffset, Math.floor(Math.random() * 60), 0, 0);

    let entityId: string;
    const entities = entityMap[type];
    if (entities && entities.length > 0) {
      entityId = entities[i % entities.length].id;
    } else {
      entityId = `${entityIds[type] || 'sample'}_${i}`;
    }

    activities.push({
      entityType: type,
      entityId,
      action: sample.action,
      details: sample.details,
      employeeId: emp.id,
      createdAt,
    });
  }

  await db.activityLog.createMany({ data: activities });
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '20', 10)));
    const entityType = searchParams.get('entityType');
    const action = searchParams.get('action');

    // Validate entity type
    if (entityType && !VALID_ENTITY_TYPES.includes(entityType)) {
      return NextResponse.json({ error: 'Invalid entityType' }, { status: 400 });
    }

    // Auto-generate sample data if fewer than 20 logs exist
    const totalCount = await db.activityLog.count();
    if (totalCount < 20) {
      await generateSampleActivities();
    }

    const where: Record<string, unknown> = {};
    if (entityType) where.entityType = entityType;
    if (action) where.action = action;

    const [activities, total] = await Promise.all([
      db.activityLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          employee: {
            select: { id: true, name: true },
          },
        },
      }),
      db.activityLog.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return NextResponse.json({
      data: activities,
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
    });
  } catch (error) {
    console.error('Error fetching activities:', error);
    return NextResponse.json({ error: 'Failed to fetch activities' }, { status: 500 });
  }
}
