'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'

interface BottomSheetProps {
  open: boolean
  onClose: () => void
  children: React.ReactNode
  title?: string
}

export function BottomSheet({ open, onClose, children, title }: BottomSheetProps) {
  React.useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end">
      <div className="absolute inset-0 bg-on-background/40 animate-in fade-in-0" onClick={onClose} />
      <div className={cn(
        'relative z-10 bg-surface-container-lowest rounded-t-xl max-h-[90dvh] flex flex-col border-t border-outline-variant shadow-lg',
        'animate-in slide-in-from-bottom-4 duration-200'
      )}>
        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-1 shrink-0">
          <div className="w-10 h-1 rounded-full bg-outline-variant" />
        </div>
        {title && (
          <div className="px-container-padding-mobile pb-3 shrink-0 border-b border-outline-variant/50">
            <h2 className="font-headline text-headline-md text-on-surface">{title}</h2>
          </div>
        )}
        <div className="overflow-y-auto flex-1 pb-safe">
          {children}
        </div>
      </div>
    </div>
  )
}
