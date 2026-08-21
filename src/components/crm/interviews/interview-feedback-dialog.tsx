'use client'

import { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Star, Loader2, Tag } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogFooter,
} from '@/components/ui/dialog'
import { EnhancedDialogHeader } from '@/components/crm/enhanced-dialog-header'
import { MessageSquare } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'

// ===== Types =====

type Interview = {
  id: string
  candidateId: string
  candidate: { id: string; firstName: string; lastName: string }
  jobId: string | null
  job: { id: string; title: string } | null
  type: string
  interviewer: string | null
  date: string
  duration: number
  location: string | null
  meetingLink: string | null
  status: string
  feedback: string | null
  rating: number | null
  createdAt: string
  updatedAt: string
}

// ===== Constants =====

const RATING_LABELS: Record<number, string> = {
  1: 'Poor',
  2: 'Below Average',
  3: 'Average',
  4: 'Good',
  5: 'Excellent',
}

const QUICK_TAGS = [
  'Strong Communication',
  'Technical Skills',
  'Good Culture Fit',
  'Needs Improvement',
  'Leadership Potential',
  'Problem Solver',
  'Not Recommended',
  'Recommended for Next Round',
]

const TAG_COLORS: Record<string, string> = {
  'Strong Communication': 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400',
  'Technical Skills': 'bg-cyan-100 text-cyan-700 dark:bg-cyan-950 dark:text-cyan-400',
  'Good Culture Fit': 'bg-teal-100 text-teal-700 dark:bg-teal-950 dark:text-teal-400',
  'Needs Improvement': 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400',
  'Leadership Potential': 'bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-400',
  'Problem Solver': 'bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-400',
  'Not Recommended': 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-400',
  'Recommended for Next Round': 'bg-teal-100 text-teal-700 dark:bg-teal-950 dark:text-teal-400',
}

// ===== Star Rating Component =====

function StarRating({
  value,
  onChange,
  hoverValue,
  onHoverChange,
}: {
  value: number
  onChange: (val: number) => void
  hoverValue: number | null
  onHoverChange: (val: number | null) => void
}) {
  const displayValue = hoverValue ?? value

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <motion.button
            key={star}
            type="button"
            whileHover={{ scale: 1.2 }}
            whileTap={{ scale: 0.95 }}
            className="rounded-md p-0.5 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
            onClick={() => onChange(star)}
            onMouseEnter={() => onHoverChange(star)}
            onMouseLeave={() => onHoverChange(null)}
          >
            <Star
              className={`h-7 w-7 transition-colors duration-150 ${
                star <= displayValue
                  ? 'fill-amber-400 text-amber-400'
                  : 'fill-none text-gray-300 dark:text-gray-600'
              }`}
            />
          </motion.button>
        ))}
      </div>
      <p className="text-xs text-muted-foreground">
        {value > 0 ? RATING_LABELS[value] : 'Select a rating'}
      </p>
    </div>
  )
}

// ===== Main Component =====

export function InterviewFeedbackDialog({
  open,
  onOpenChange,
  interview,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  interview: Interview | null
}) {
  const queryClient = useQueryClient()

  const [rating, setRating] = useState(0)
  const [hoverValue, setHoverValue] = useState<number | null>(null)
  const [feedback, setFeedback] = useState('')
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const prevInterviewRef = useRef<string | null>(null)

  // Reset form when a different interview is opened
  const interviewId = interview?.id ?? null
  if (interviewId !== prevInterviewRef.current) {
    prevInterviewRef.current = interviewId
    if (interview) {
      setRating(interview.rating || 0)
      setFeedback(interview.feedback || '')
      setSelectedTags([])
    } else {
      setRating(0)
      setFeedback('')
      setSelectedTags([])
    }
    setHoverValue(null)
  }

  const canSubmit = rating > 0 && feedback.trim().length >= 10

  const mutation = useMutation({
    mutationFn: async () => {
      const tagsText = selectedTags.length > 0
        ? `\n\nTags: ${selectedTags.join(', ')}`
        : ''
      const res = await fetch(`/api/interviews/${interview?.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          feedback: feedback.trim() + tagsText,
          rating,
          status: 'Completed',
        }),
      })
      if (!res.ok) throw new Error('Failed to save feedback')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['interviews'] })
      toast.success('Feedback submitted successfully')
      onOpenChange(false)
    },
    onError: () => {
      toast.error('Failed to submit feedback. Please try again.')
    },
  })

  function handleToggleTag(tag: string) {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    )
  }

  function handleSubmit() {
    if (!canSubmit || !interview) return
    mutation.mutate()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <EnhancedDialogHeader
          icon={MessageSquare}
          title="Interview Feedback"
          description={
            interview
              ? `${interview.candidate.firstName} ${interview.candidate.lastName} — ${interview.type} interview`
              : ''
          }
          iconColor="text-violet-600 dark:text-violet-400"
        />

        <div className="space-y-5">
          {/* Star Rating */}
          <div className="space-y-1">
            <label className="text-sm font-medium">Rating</label>
            <StarRating
              value={rating}
              onChange={setRating}
              hoverValue={hoverValue}
              onHoverChange={setHoverValue}
            />
          </div>

          {/* Feedback Textarea */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Feedback</label>
            <Textarea
              placeholder="Share detailed feedback about the candidate's performance..."
              rows={4}
              className="resize-none"
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              maxLength={1000}
            />
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">
                {feedback.trim().length < 10
                  ? `Minimum 10 characters (${feedback.trim().length}/10)`
                  : `${feedback.length}/1000 characters`}
              </p>
            </div>
          </div>

          {/* Quick Feedback Tags */}
          <div className="space-y-2">
            <label className="flex items-center gap-1.5 text-sm font-medium">
              <Tag className="h-3.5 w-3.5 text-muted-foreground" />
              Quick Tags
            </label>
            <div className="flex flex-wrap gap-2">
              <AnimatePresence mode="popLayout">
                {QUICK_TAGS.map((tag) => {
                  const isSelected = selectedTags.includes(tag)
                  return (
                    <motion.button
                      key={tag}
                      type="button"
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                      initial={false}
                      animate={{
                        opacity: 1,
                        scale: 1,
                      }}
                      onClick={() => handleToggleTag(tag)}
                      className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                        isSelected
                          ? TAG_COLORS[tag] || 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400'
                          : 'bg-muted text-muted-foreground hover:bg-muted/80'
                      }`}
                    >
                      {tag}
                    </motion.button>
                  )
                })}
              </AnimatePresence>
            </div>
          </div>
        </div>

        <DialogFooter className="pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={mutation.isPending}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={!canSubmit || mutation.isPending}
          >
            {mutation.isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Star className="mr-2 h-4 w-4" />
            )}
            Submit Feedback
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
