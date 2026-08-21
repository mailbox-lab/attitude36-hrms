# Task 2 - Auth Backend

## Summary
Created the complete authentication backend for Attitude360 HRMS using NextAuth v4 with Credentials provider, JWT session strategy, and bcryptjs password hashing.

## Files Created
- `src/lib/auth.ts` - NextAuth configuration
- `src/app/api/auth/[...nextauth]/route.ts` - NextAuth API route
- `src/app/api/auth/register/route.ts` - Registration endpoint
- `src/app/api/auth/me/route.ts` - Current user endpoint
- `src/lib/auth-utils.ts` - Role types, labels, colors, permission helpers

## Files Modified
- `.env` - Added NEXTAUTH_SECRET, INVITE_CODE
- `src/app/api/seed/route.ts` - Auth-enabled employee seeds

## Key Details
- 4 roles: FOUNDER, COFOUNDER, HR, EMPLOYEE
- Permission system with module-level access control
- Invite code required for FOUNDER/COFOUNDER registration
- Role colors: amber (Founder), orange (Co-Founder), teal (HR), emerald (Employee)
- 6 seed accounts with bcrypt-hashed passwords
- Database seeded successfully
