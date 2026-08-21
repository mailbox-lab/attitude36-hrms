'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useCRMStore, type CRMView } from '@/stores/crm-store'
import { useIsMobile } from '@/hooks/use-mobile'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import {
  Search,
  Users,
  Building2,
  Briefcase,
  UserCog,
  SearchX,
  Loader2,
} from 'lucide-react'
import { cn } from '@/lib/utils'

type SearchResult = {
  id: string
  name: string
  subtitle: string
}

type SearchResponse = {
  candidates: SearchResult[]
  clients: SearchResult[]
  jobs: SearchResult[]
  employees: SearchResult[]
}

type SearchGroup = {
  key: keyof SearchResponse
  label: string
  icon: typeof Users
  view: CRMView
  results: SearchResult[]
  accentColor: string
}

const GROUP_CONFIG: { key: keyof SearchResponse; label: string; icon: typeof Users; view: CRMView; accentColor: string }[] = [
  { key: 'candidates', label: 'Candidates', icon: Users, view: 'candidate-detail', accentColor: 'border-l-emerald-500' },
  { key: 'clients', label: 'Clients', icon: Building2, view: 'client-detail', accentColor: 'border-l-amber-500' },
  { key: 'jobs', label: 'Job Openings', icon: Briefcase, view: 'job-detail', accentColor: 'border-l-violet-500' },
  { key: 'employees', label: 'Employees', icon: UserCog, view: 'employees', accentColor: 'border-l-rose-500' },
]

function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(timer)
  }, [value, delay])
  return debounced
}

const dropdownVariants = {
  hidden: { opacity: 0, y: -8, scale: 0.97 },
  visible: { opacity: 1, y: 0, scale: 1, transition: { type: 'spring', stiffness: 500, damping: 30 } },
  exit: { opacity: 0, y: -8, scale: 0.97, transition: { duration: 0.12 } },
}

function LoadingSkeleton() {
  return (
    <div className="p-3 space-y-4">
      {[0, 1, 2].map((i) => (
        <div key={i} className="space-y-2">
          <Skeleton className="h-4 w-20" />
          {[0, 1].map((j) => (
            <div key={j} className="flex items-center gap-3 px-2 py-1.5">
              <Skeleton className="h-7 w-7 rounded-md" />
              <div className="flex-1 space-y-1.5">
                <Skeleton className="h-3.5 w-32" />
                <Skeleton className="h-3 w-24" />
              </div>
            </div>
          ))}
        </div>
      ))}
    </div>
  )
}

export function GlobalSearch() {
  const isMobile = useIsMobile()
  const { navigate } = useCRMStore()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(-1)

  const inputRef = useRef<HTMLInputElement>(null)
  const debouncedQuery = useDebounce(query, 300)
  const shouldSearch = debouncedQuery.length >= 2

  // Fetch results when debounced query changes (only when shouldSearch is true)
  useEffect(() => {
    if (!shouldSearch) return

    let cancelled = false

    fetch(`/api/search?q=${encodeURIComponent(debouncedQuery)}`)
      .then((res) => res.json())
      .then((data) => {
        if (!cancelled) {
          setResults(data)
          setLoading(false)
          setActiveIndex(-1)
        }
      })
      .catch(() => {
        if (!cancelled) {
          setResults(null)
          setLoading(false)
          setActiveIndex(-1)
        }
      })

    return () => { cancelled = true }
  }, [debouncedQuery, shouldSearch])

  // Build flat list of items for keyboard navigation
  const flatItems = useMemo(() => {
    if (!results) return []
    const items: { group: SearchGroup; result: SearchResult }[] = []
    for (const config of GROUP_CONFIG) {
      const groupResults = results[config.key]
      if (groupResults && groupResults.length > 0) {
        items.push(...groupResults.map((r) => ({ group: config, result: r })))
      }
    }
    return items
  }, [results])

  const totalResults = results
    ? results.candidates.length + results.clients.length + results.jobs.length + results.employees.length
    : 0

  const hasQuery = query.length >= 2
  const showResults = open && hasQuery

  const handleSelect = useCallback(
    (group: SearchGroup, result: SearchResult) => {
      if (group.key === 'employees') {
        navigate(group.view)
      } else {
        navigate(group.view, result.id)
      }
      setOpen(false)
      setQuery('')
    },
    [navigate]
  )

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        setOpen(false)
        inputRef.current?.blur()
        return
      }

      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setActiveIndex((prev) => (prev < flatItems.length - 1 ? prev + 1 : 0))
        return
      }

      if (e.key === 'ArrowUp') {
        e.preventDefault()
        setActiveIndex((prev) => (prev > 0 ? prev - 1 : flatItems.length - 1))
        return
      }

      if (e.key === 'Enter') {
        e.preventDefault()
        if (activeIndex >= 0 && activeIndex < flatItems.length) {
          const item = flatItems[activeIndex]
          handleSelect(item.group, item.result)
        }
        return
      }
    },
    [flatItems, activeIndex, handleSelect]
  )

  // On mobile, render a button that triggers Cmd+K (command palette)
  if (isMobile) {
    return (
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8"
        onClick={() => {
          // Simulate Cmd+K to open command palette
          document.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', metaKey: true, bubbles: true }))
        }}
        aria-label="Search"
      >
        <Search className="h-4 w-4" />
      </Button>
    )
  }

  return (
    <Popover open={showResults} onOpenChange={(isOpen) => {
      setOpen(isOpen)
      if (!isOpen) setLoading(false)
    }}>
      <PopoverTrigger asChild>
        <div className="relative w-64 lg:w-80">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <input
            ref={inputRef}
            id="global-search-input"
            type="text"
            placeholder="Search candidates, clients, jobs..."
            value={query}
            onChange={(e) => {
              const value = e.target.value
              setQuery(value)
              setActiveIndex(-1)
              if (value.length >= 2) {
                setLoading(true)
                if (!open) setOpen(true)
              }
            }}
            onFocus={() => {
              if (query.length >= 2) setOpen(true)
            }}
            onKeyDown={handleKeyDown}
            className={cn(
              'flex h-8 w-full rounded-lg border bg-muted/50 px-8 py-1.5 text-sm',
              'ring-offset-background placeholder:text-muted-foreground',
              'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring focus-visible:bg-background',
              'transition-colors duration-200'
            )}
            aria-label="Global search"
            role="combobox"
            aria-expanded={showResults}
            aria-haspopup="listbox"
            aria-controls="global-search-listbox"
          />
          {loading && (
            <Loader2 className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground animate-spin" />
          )}
        </div>
      </PopoverTrigger>

      <PopoverContent
        className="w-[400px] max-w-[calc(100vw-2rem)] p-0 overflow-hidden rounded-xl border shadow-lg"
        side="bottom"
        align="start"
        sideOffset={8}
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <AnimatePresence mode="wait">
          {loading && !results ? (
            <motion.div
              key="loading"
              initial="hidden"
              animate="visible"
              exit="exit"
              variants={dropdownVariants}
              className="max-h-80 overflow-y-auto"
            >
              <LoadingSkeleton />
            </motion.div>
          ) : results && totalResults > 0 ? (
            <motion.div
              key="results"
              initial="hidden"
              animate="visible"
              exit="exit"
              variants={dropdownVariants}
              className="max-h-80 overflow-y-auto"
              role="listbox"
              id="global-search-listbox"
            >
              <div className="p-2">
                {GROUP_CONFIG.map((config) => {
                  const groupResults = results[config.key]
                  if (!groupResults || groupResults.length === 0) return null

                  const Icon = config.icon

                  // Calculate the starting index in the flat list for this group
                  const startIndex = flatItems.findIndex(
                    (item) => item.group.key === config.key
                  )

                  return (
                    <div key={config.key} className="mb-2 last:mb-0">
                      <div className={cn(
                        'flex items-center gap-2 px-2 py-1.5 text-xs uppercase tracking-wider text-muted-foreground',
                        'font-medium border-l-2 pl-3',
                        config.accentColor
                      )}>
                        <Icon className="h-3 w-3" />
                        <span>{config.label}</span>
                        <span className="ml-auto text-[10px] font-normal normal-case tracking-normal text-muted-foreground/70">
                          {groupResults.length}
                        </span>
                      </div>
                      {groupResults.map((result, idx) => {
                        const flatIdx = startIndex + idx
                        const isActive = flatIdx === activeIndex
                        return (
                          <button
                            key={result.id}
                            className={cn(
                              'flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm cursor-pointer',
                              'transition-colors duration-150',
                              isActive ? 'bg-muted/80' : 'hover:bg-muted/50'
                            )}
                            onClick={() => handleSelect(config, result)}
                            onMouseEnter={() => setActiveIndex(flatIdx)}
                            role="option"
                            aria-selected={isActive}
                          >
                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-muted">
                              <Icon className="h-3.5 w-3.5 text-muted-foreground" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="font-medium truncate">{result.name}</div>
                              <div className="text-xs text-muted-foreground truncate">{result.subtitle}</div>
                            </div>
                          </button>
                        )
                      })}
                    </div>
                  )
                })}
              </div>

              <div className="border-t px-3 py-1.5 flex items-center justify-between text-[10px] text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <kbd className="pointer-events-none inline-flex h-4 select-none items-center gap-0.5 rounded border bg-muted px-1 font-mono text-[9px] text-muted-foreground">
                    ↑↓
                  </kbd>
                  <span>navigate</span>
                  <span className="mx-0.5">·</span>
                  <kbd className="pointer-events-none inline-flex h-4 select-none items-center gap-0.5 rounded border bg-muted px-1 font-mono text-[9px] text-muted-foreground">
                    ↵
                  </kbd>
                  <span>select</span>
                  <span className="mx-0.5">·</span>
                  <kbd className="pointer-events-none inline-flex h-4 select-none items-center gap-0.5 rounded border bg-muted px-1 font-mono text-[9px] text-muted-foreground">
                    esc
                  </kbd>
                  <span>close</span>
                </span>
                <span>{totalResults} results</span>
              </div>
            </motion.div>
          ) : results && totalResults === 0 ? (
            <motion.div
              key="empty"
              initial="hidden"
              animate="visible"
              exit="exit"
              variants={dropdownVariants}
              className="py-8 flex flex-col items-center gap-2 text-muted-foreground"
            >
              <SearchX className="h-8 w-8 opacity-30" />
              <p className="text-sm">No results found for &ldquo;{query}&rdquo;</p>
              <p className="text-xs opacity-60">Try a different search term.</p>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </PopoverContent>
    </Popover>
  )
}