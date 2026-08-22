import type { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { db } from '@/lib/db'
import { compare } from 'bcryptjs'
import type { DefaultSession } from 'next-auth'

// Extend session type to include role and employeeId
declare module 'next-auth' {
  interface Session {
    user: DefaultSession['user'] & {
      role: string
      employeeId: string
    }
  }
  interface User {
    role?: string
    employeeId?: string
  }
}

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null

        const employee = await db.employee.findUnique({ where: { email: credentials.email } })
        if (!employee || !employee.password) return null
        if (!employee.isActive) return null

        const isValid = await compare(credentials.password, employee.password)
        if (!isValid) return null

        return {
          id: employee.id,
          name: employee.name,
          email: employee.email,
          role: employee.role,
          employeeId: employee.id,
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role
        token.employeeId = user.employeeId
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.role = token.role as string
        session.user.employeeId = token.employeeId as string
      }
      return session
    },
  },
  pages: {
    signIn: '/',
  },
  session: {
    strategy: 'jwt',
    maxAge: 24 * 60 * 60, // 24 hours
  },
  secret: process.env.NEXTAUTH_SECRET,
}
