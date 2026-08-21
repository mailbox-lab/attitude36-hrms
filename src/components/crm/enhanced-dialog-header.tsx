'use client'

import type { ElementType } from 'react'

export function EnhancedDialogHeader({
  icon: Icon,
  title,
  description,
  iconColor,
}: {
  icon?: ElementType
  title: string
  description?: string
  iconColor?: string
}) {
  const colorClasses = iconColor
    ? `${iconColor}`
    : 'text-primary'

  const bgClasses = iconColor
    ? iconColor.replace(/text-(\w+-\d+)/, 'bg-$1/10')
    : 'bg-primary/10'

  return (
    <div className="space-y-4">
      <div className="h-1 w-full rounded-full bg-gradient-to-r from-primary/20 to-primary/5" />
      <div className="flex items-start gap-3">
        {Icon && (
          <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${bgClasses}`}>
            <Icon className={`h-5 w-5 ${colorClasses}`} />
          </div>
        )}
        <div className="min-w-0">
          <h2 className="text-lg font-semibold tracking-tight leading-tight">
            {title}
          </h2>
          {description && (
            <p className="mt-1 text-sm text-muted-foreground leading-snug">
              {description}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
