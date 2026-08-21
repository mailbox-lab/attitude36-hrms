'use client'

import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  CheckSquare,
  Trash2,
  ArrowUpDown,
  X,
  GitCompare,
} from 'lucide-react'
import { toast } from 'sonner'

// ===== Status Colors for dot indicators =====
const STATUS_DOT_COLORS: Record<string, string> = {
  New: 'bg-slate-500',
  Screening: 'bg-amber-500',
  Interview: 'bg-violet-500',
  Offer: 'bg-cyan-500',
  Hired: 'bg-emerald-500',
  Rejected: 'bg-red-500',
  'On-Hold': 'bg-orange-500',
}

const ALL_STATUSES = [
  'New',
  'Screening',
  'Interview',
  'Offer',
  'Hired',
  'Rejected',
  'On-Hold',
]

interface BulkActionsBarProps {
  selectedIds: string[]
  onClearSelection: () => void
  onSuccess: () => void
  onCompare?: () => void
}

export function BulkActionsBar({
  selectedIds,
  onClearSelection,
  onSuccess,
  onCompare,
}: BulkActionsBarProps) {
  const [confirmDelete, setConfirmDelete] = useState(false)

  const bulkMutation = useMutation({
    mutationFn: async ({
      action,
      status,
    }: {
      action: 'updateStatus' | 'delete'
      status?: string
    }) => {
      const res = await fetch('/api/candidates/bulk', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: selectedIds, action, status }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Bulk action failed')
      }
      return res.json()
    },
    onSuccess: (data, variables) => {
      const count = data.updated
      if (variables.action === 'updateStatus') {
        toast.success(`${count} candidate${count !== 1 ? 's' : ''} updated to "${variables.status}"`)
      } else {
        toast.success(`${count} candidate${count !== 1 ? 's' : ''} deleted`)
      }
      setConfirmDelete(false)
      onSuccess()
    },
    onError: (error) => {
      toast.error(error.message)
      setConfirmDelete(false)
    },
  })

  if (selectedIds.length === 0) return null

  return (
    <motion.div
      initial={{ height: 0, opacity: 0 }}
      animate={{ height: 'auto', opacity: 1 }}
      exit={{ height: 0, opacity: 0 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      className="overflow-hidden"
    >
      <div className="flex flex-col gap-3 rounded-lg border border-primary/20 bg-primary/5 p-3 sm:flex-row sm:items-center sm:justify-between">
        {/* Left side */}
        <div className="flex items-center gap-2">
          <CheckSquare className="h-4 w-4 text-primary" />
          <span className="text-sm font-medium">
            {selectedIds.length} candidate{selectedIds.length !== 1 ? 's' : ''} selected
          </span>
          <button
            onClick={onClearSelection}
            className="text-xs font-medium text-primary hover:underline"
          >
            Clear
          </button>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-2">
          {/* Compare Button */}
          {onCompare && selectedIds.length >= 2 && selectedIds.length <= 4 && (
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 border-emerald-300 text-emerald-700 hover:bg-emerald-50 hover:text-emerald-700 dark:border-emerald-700 dark:text-emerald-400 dark:hover:bg-emerald-950"
              onClick={onCompare}
            >
              <GitCompare className="h-3.5 w-3.5" />
              Compare ({Math.min(selectedIds.length, 4)})
            </Button>
          )}

          {/* Update Status Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-1.5">
                <ArrowUpDown className="h-3.5 w-3.5" />
                Update Status
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {ALL_STATUSES.map((status) => (
                <DropdownMenuItem
                  key={status}
                  onClick={() =>
                    bulkMutation.mutate({
                      action: 'updateStatus',
                      status,
                    })
                  }
                  disabled={bulkMutation.isPending}
                  className="gap-2"
                >
                  <span
                    className={`inline-block h-2.5 w-2.5 rounded-full ${STATUS_DOT_COLORS[status] || 'bg-gray-400'}`}
                  />
                  {status}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Delete Selected */}
          {confirmDelete ? (
            <div className="flex items-center gap-1.5">
              <Badge variant="destructive" className="text-[10px]">
                Delete {selectedIds.length}?
              </Badge>
              <Button
                variant="destructive"
                size="sm"
                className="h-7 gap-1 text-xs"
                onClick={() =>
                  bulkMutation.mutate({ action: 'delete' })
                }
                disabled={bulkMutation.isPending}
              >
                {bulkMutation.isPending ? '...' : 'Confirm'}
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-xs"
                onClick={() => setConfirmDelete(false)}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          ) : (
            <Button
              variant="destructive"
              size="sm"
              className="gap-1.5"
              onClick={() => setConfirmDelete(true)}
              disabled={bulkMutation.isPending}
            >
              <Trash2 className="h-3.5 w-3.5" />
              Delete Selected
            </Button>
          )}
        </div>
      </div>
    </motion.div>
  )
}
