# Task 3: Floating Back-to-Top, Top Loading Progress Bar, Candidate Notes

## Summary
Completed all 3 parts successfully with 0 ESLint errors.

### Files Created
1. `src/components/crm/back-to-top.tsx` — Floating back-to-top button
2. `src/components/crm/loading-progress.tsx` — Top loading progress bar

### Files Modified
1. `src/components/crm/crm-layout.tsx` — Integrated BackToTop + LoadingProgress
2. `src/components/crm/candidates/candidate-detail.tsx` — Editable notes section + header badge
3. `src/components/crm/candidates/candidates-page.tsx` — Notes indicator icon in table

### Key Decisions
- Back-to-top listens to content container scroll via ref (not window)
- Loading progress uses `queryClient.isFetching() > 0` for global detection
- Notes indicator placed next to candidate name in table (no skills column exists in table view)
- NotesEditor uses local state + dirty tracking to enable/disable save button
- Saved indicator auto-hides after 2 seconds via setTimeout

### Verification
- ESLint: 0 errors, 1 pre-existing warning (react-hook-form watch)
- Dev server: All API routes responding normally
- No forbidden colors used (blue/indigo/purple/sky)