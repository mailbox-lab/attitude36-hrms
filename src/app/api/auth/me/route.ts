import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.employeeId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const employee = await db.employee.findUnique({
      where: { id: session.user.employeeId },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        department: true,
        avatar: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        leaveBalances: {
          where: { year: new Date().getFullYear() },
          select: {
            type: true,
            total: true,
            used: true,
            remaining: true,
          },
        },
        attendance: {
          orderBy: { date: 'desc' },
          take: 5,
          select: {
            date: true,
            clockIn: true,
            clockOut: true,
            status: true,
            totalHours: true,
          },
        },
      },
    })

    if (!employee) {
      return NextResponse.json({ error: 'Employee not found' }, { status: 404 })
    }

    return NextResponse.json({ employee })
  } catch (error) {
    console.error('Fetch current user error:', error)
    return NextResponse.json(
      { error: 'Something went wrong' },
      { status: 500 }
    )
  }
}
