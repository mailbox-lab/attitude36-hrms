# Task 5-a: Candidates Module Frontend Components

## Status: COMPLETED

## Files Created

1. `/home/z/my-project/src/components/crm/candidates/candidates-page.tsx` - Main candidates page with List + Pipeline (Kanban) views, search, filters, table with actions
2. `/home/z/my-project/src/components/crm/candidates/candidate-detail.tsx` - Candidate detail view with profile card, contact info, skills, status timeline, interview history, notes
3. `/home/z/my-project/src/components/crm/candidates/add-candidate-dialog.tsx` - Add/Edit dialog with 16 form fields, react-hook-form + zod validation

## Key Technical Decisions
- Used `@tanstack/react-query` for all data fetching (useQuery, useMutation, useQueryClient)
- Store integration via `useCRMStore` for navigation and candidateFilter
- Status badge colors: New=emerald, Screening=blue, Interview=amber, Offer=violet, Hired=green, Rejected=red, On-Hold=gray
- Kanban columns are horizontally scrollable with colored left borders
- Table has max-h-96 overflow-y-auto
- Responsive column hiding on smaller screens
- Form uses zod v4 schema with `z.coerce.number()` for numeric fields
- Edit mode pre-populates all fields via useEffect

## Lint
- Zero errors
