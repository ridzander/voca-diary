'use client'

import { useState } from 'react'
import { Icon } from '@/components/ui/ms-icon'
import { BottomSheet } from '@/components/ui/bottom-sheet'
import { QuickSymptomSheet } from './QuickSymptomSheet'
import { QuickSetSheet } from './QuickSetSheet'

interface Props {
  open: boolean
  onClose: () => void
}

type SubSheet = 'symptom' | 'set' | null

export function QuickLogSheet({ open, onClose }: Props) {
  const [sub, setSub] = useState<SubSheet>(null)

  const handleClose = () => { setSub(null); onClose() }

  if (sub === 'symptom') return <QuickSymptomSheet open onClose={handleClose} />
  if (sub === 'set') return <QuickSetSheet open onClose={handleClose} />

  return (
    <BottomSheet open={open} onClose={handleClose} title="Quick log">
      <div className="flex flex-col gap-3 px-container-padding-mobile py-4 pb-8">
        <button
          onClick={() => setSub('symptom')}
          className="flex items-center gap-4 rounded-xl bg-primary-container/40 border border-primary-container px-5 py-5 text-left tap-response hover:bg-primary-container/60 transition-colors"
        >
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary-container">
            <Icon name="mic" size={22} fill={1} className="text-on-primary-container" />
          </div>
          <div>
            <p className="font-headline text-body-lg font-semibold text-on-surface">Quick symptom</p>
            <p className="text-caption text-on-surface-variant mt-0.5">Body area + severity, 3 taps</p>
          </div>
        </button>

        <button
          onClick={() => setSub('set')}
          className="flex items-center gap-4 rounded-xl bg-tertiary-container/30 border border-tertiary-container/60 px-5 py-5 text-left tap-response hover:bg-tertiary-container/50 transition-colors"
        >
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-tertiary-container">
            <Icon name="fitness_center" size={22} fill={1} className="text-on-tertiary-container" />
          </div>
          <div>
            <p className="font-headline text-body-lg font-semibold text-on-surface">Quick set</p>
            <p className="text-caption text-on-surface-variant mt-0.5">Log a single set, auto-fills last weight</p>
          </div>
        </button>

        <button
          onClick={handleClose}
          className="py-3 text-label-sm text-on-surface-variant hover:text-on-surface transition-colors text-center"
        >
          Cancel
        </button>
      </div>
    </BottomSheet>
  )
}
