'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'
import { Button } from './button'

interface AlertDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description: string
  confirmLabel?: string
  cancelLabel?: string
  onConfirm: () => void
  destructive?: boolean
}

export function AlertDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  onConfirm,
  destructive = false,
}: AlertDialogProps) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={() => onOpenChange(false)}
      />
      {/* Dialog */}
      <div className={cn(
        'relative z-10 mx-4 w-full max-w-sm rounded-2xl bg-background p-6 shadow-xl',
        'animate-in fade-in-0 zoom-in-95'
      )}>
        <h2 className="text-base font-semibold">{title}</h2>
        <p className="mt-2 text-sm text-muted-foreground">{description}</p>
        <div className="mt-6 flex gap-3">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
            {cancelLabel}
          </Button>
          <Button
            onClick={() => { onConfirm(); onOpenChange(false) }}
            className={cn('flex-1', destructive && 'bg-destructive text-destructive-foreground hover:bg-destructive/90')}
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  )
}
