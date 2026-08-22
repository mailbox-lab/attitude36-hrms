import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { hash } from 'bcryptjs'
import type { UserRole } from '@/lib/auth-utils'

const VALID_ROLES: UserRole[] = ['FOUNDER', 'COFOUNDER', 'HR', 'EMPLOYEE']
const ADMIN_ROLES: UserRole[] = ['FOUNDER', 'COFOUNDER']

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, email, password, role, inviteCode } = body

    // Validate name
    if (!name || typeof name !== 'string' || name.trim().length < 2) {
      return NextResponse.json(
        { error: 'Name must be at least 2 characters long' },
        { status: 400 }
      )
    }

    // Validate email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!email || typeof email !== 'string' || !emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Please provide a valid email address' },
        { status: 400 }
      )
    }

    // Validate password
    if (!password || typeof password !== 'string' || password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters long' },
        { status: 400 }
      )
    }

    // Check uniqueness
    const existing = await db.employee.findUnique({ where: { email: email.toLowerCase() } })
    if (existing) {
      return NextResponse.json(
        { error: 'An account with this email already exists' },
        { status: 409 }
      )
    }

    // Determine role
    let assignedRole: UserRole = 'EMPLOYEE'
    if (role && VALID_ROLES.includes(role)) {
      if (ADMIN_ROLES.includes(role as UserRole)) {
        const validCode = process.env.INVITE_CODE || 'a360founder'
        if (!inviteCode || inviteCode !== validCode) {
          return NextResponse.json(
            { error: 'A valid invite code is required for this role' },
            { status: 403 }
          )
        }
        assignedRole = role as UserRole
      } else {
        assignedRole = role as UserRole
      }
    }

    // Hash password
    const hashedPassword = await hash(password, 10)

    // Create employee
    const employee = await db.employee.create({
      data: {
        name: name.trim(),
        email: email.toLowerCase(),
        password: hashedPassword,
        role: assignedRole,
        isActive: true,
      },
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
      },
    })

    return NextResponse.json(
      { message: 'Account created successfully', employee },
      { status: 201 }
    )
  } catch (error) {
    console.error('Registration error:', error)
    return NextResponse.json(
      { error: 'Something went wrong. Please try again.' },
      { status: 500 }
    )
  }
}
