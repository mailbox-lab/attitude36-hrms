'use server'

import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const q = searchParams.get('q')?.trim() ?? ''

  if (!q || q.length < 2) {
    return NextResponse.json({ candidates: [], clients: [], jobs: [], employees: [] })
  }

  const take = 5

  try {
    const [candidates, clients, jobs, employees] = await Promise.all([
      db.candidate.findMany({
        where: {
          OR: [
            { firstName: { contains: q } },
            { lastName: { contains: q } },
            { email: { contains: q } },
            { skills: { contains: q } },
            { title: { contains: q } },
          ],
        },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          title: true,
          status: true,
        },
        take,
        orderBy: { updatedAt: 'desc' },
      }),

      db.client.findMany({
        where: {
          OR: [
            { name: { contains: q } },
            { industry: { contains: q } },
            { contactName: { contains: q } },
            { contactEmail: { contains: q } },
          ],
        },
        select: {
          id: true,
          name: true,
          industry: true,
          contactName: true,
          status: true,
        },
        take,
        orderBy: { updatedAt: 'desc' },
      }),

      db.jobOpening.findMany({
        where: {
          OR: [
            { title: { contains: q } },
            { department: { contains: q } },
            { location: { contains: q } },
          ],
        },
        select: {
          id: true,
          title: true,
          department: true,
          location: true,
          status: true,
        },
        take,
        orderBy: { updatedAt: 'desc' },
      }),

      db.employee.findMany({
        where: {
          OR: [
            { name: { contains: q } },
            { email: { contains: q } },
            { department: { contains: q } },
          ],
        },
        select: {
          id: true,
          name: true,
          email: true,
          department: true,
          role: true,
        },
        take,
        orderBy: { updatedAt: 'desc' },
      }),
    ])

    const formattedCandidates = candidates.map((c) => ({
      id: c.id,
      name: `${c.firstName} ${c.lastName}`,
      subtitle: c.email ?? c.title ?? c.status,
    }))

    const formattedClients = clients.map((c) => ({
      id: c.id,
      name: c.name,
      subtitle: c.industry ?? c.contactName ?? c.status,
    }))

    const formattedJobs = jobs.map((j) => ({
      id: j.id,
      name: j.title,
      subtitle: [j.department, j.location].filter(Boolean).join(' · ') || j.status,
    }))

    const formattedEmployees = employees.map((e) => ({
      id: e.id,
      name: e.name,
      subtitle: [e.department, e.role].filter(Boolean).join(' · ') ?? e.email,
    }))

    return NextResponse.json({
      candidates: formattedCandidates,
      clients: formattedClients,
      jobs: formattedJobs,
      employees: formattedEmployees,
    })
  } catch (error) {
    console.error('Search error:', error)
    return NextResponse.json(
      { error: 'Search failed' },
      { status: 500 }
    )
  }
}
