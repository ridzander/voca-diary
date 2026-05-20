'use client'

import { useState } from 'react'
import { Icon } from '@/components/ui/ms-icon'
import { QuickLogSheet } from './QuickLogSheet'

export function FAB() {
  const [open, setOpen] = useState(false)

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        aria-label="Quick log"
        className="fixed bottom-24 right-5 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-on-primary shadow-lg hover:opacity-90 active:scale-90 transition-all duration-200"
      >
        <Icon name="add" size={28} fill={1} />
      </button>
      <QuickLogSheet open={open} onClose={() => setOpen(false)} />
    </>
  )
}
