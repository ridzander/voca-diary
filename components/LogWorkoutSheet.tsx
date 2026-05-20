'use client'

import { useRouter } from 'next/navigation'
import { Icon } from '@/components/ui/ms-icon'
import { BottomSheet } from '@/components/ui/bottom-sheet'

interface Props {
  open: boolean
  onClose: () => void
}

export function LogWorkoutSheet({ open, onClose }: Props) {
  const router = useRouter()

  return (
    <BottomSheet open={open} onClose={onClose} title="Log workout">
      <div className="flex flex-col gap-3 px-container-padding-mobile py-4 pb-8">
        <button
          onClick={() => { onClose(); router.push('/record/workout') }}
          className="flex items-center gap-4 rounded-xl bg-tertiary-container/30 border border-tertiary-container/60 px-5 py-5 text-left tap-response hover:bg-tertiary-container/50 transition-colors"
        >
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-tertiary-container">
            <Icon name="mic" size={22} fill={1} className="text-on-tertiary-container" />
          </div>
          <div>
            <p className="font-headline text-body-lg font-semibold text-on-surface">Voice log</p>
            <p className="text-caption text-on-surface-variant mt-0.5">Speak your workout, Claude extracts it</p>
          </div>
        </button>

        <button
          onClick={() => { onClose(); router.push('/workout/live') }}
          className="flex items-center gap-4 rounded-xl bg-secondary-container/40 border border-secondary-container px-5 py-5 text-left tap-response hover:bg-secondary-container/60 transition-colors"
        >
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-secondary-container">
            <Icon name="bolt" size={22} fill={1} className="text-on-secondary-container" />
          </div>
          <div>
            <p className="font-headline text-body-lg font-semibold text-on-surface">Live workout</p>
            <p className="text-caption text-on-surface-variant mt-0.5">Log sets in real-time as you train</p>
          </div>
        </button>

        <button
          onClick={onClose}
          className="py-3 text-label-sm text-on-surface-variant hover:text-on-surface transition-colors text-center"
        >
          Cancel
        </button>
      </div>
    </BottomSheet>
  )
}
