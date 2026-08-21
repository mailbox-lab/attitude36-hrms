# Task 2: Global Search Feature

## Files Created/Modified

### Created
- `/home/z/my-project/src/app/api/search/route.ts` - Global search API endpoint
- `/home/z/my-project/src/components/crm/global-search.tsx` - GlobalSearch UI component

### Modified
- `/home/z/my-project/src/components/crm/crm-layout.tsx` - Integrated GlobalSearch into header

## Implementation Details

### API Route (`/api/search`)
- GET endpoint accepting `?q=` query parameter (min 2 chars)
- Searches across 4 entities in parallel using `Promise.all`:
  - Candidates: firstName, lastName, email, skills, title
  - Clients: name, industry, contactName, contactEmail
  - Jobs: title, department, location
  - Employees: name, email, department
- Returns top 5 results per entity
- Returns `{ candidates: [...], clients: [...], jobs: [...], employees: [...] }`
- Each result has `{ id, name, subtitle }`
- Uses SQLite `contains` (case-insensitive by default)

### GlobalSearch Component
- `'use client'` with named export `GlobalSearch`
- 300ms debounced search using custom `useDebounce` hook
- Mobile: renders a search icon Button that dispatches Cmd+K to open command palette
- Desktop: renders search input (w-64 lg:w-80) with Popover dropdown
- Popover uses shadcn/ui Popover + framer-motion AnimatePresence
- Results grouped by type with colored left-border headers (emerald/amber/violet/rose)
- Each item shows icon + name + subtitle, clickable to navigate
- Navigation: candidates→candidate-detail, clients→client-detail, jobs→job-detail, employees→employees
- Keyboard: Escape (close), ArrowDown/Up (navigate), Enter (select)
- Loading state with Skeleton
- Empty state with SearchX icon showing the query
- Footer with keyboard hints and result count
- Proper ARIA: combobox role, listbox, aria-controls, aria-expanded
- Lint-compliant: no synchronous setState in effects

### CRM Layout Integration
- GlobalSearch placed between Separator and page title div in header
- Page title hidden on mobile (hidden md:flex) to save space
- Search component handles mobile/desktop rendering internally
