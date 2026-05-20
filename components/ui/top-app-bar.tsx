'use client'

import { Icon } from '@/components/ui/ms-icon'
import { VocaLogo } from '@/components/ui/voca-logo'

interface TopAppBarProps {
  title?: string
  /** JSX shown on the left (e.g. back button). If omitted, shows the logo. */
  leftSlot?: React.ReactNode
  /** JSX shown on the right (e.g. settings icon). */
  rightSlot?: React.ReactNode
}

export function TopAppBar({ title, leftSlot, rightSlot }: TopAppBarProps) {
  return (
    <header className="fixed top-0 w-full z-50 glass-nav border-b border-outline-variant h-16 flex items-center justify-between px-container-padding-mobile">
      <div className="flex items-center gap-3">
        {leftSlot ?? <VocaLogo iconSize={30} />}
        {leftSlot && title && (
          <span className="font-headline font-bold text-headline-md text-on-surface">{title}</span>
        )}
      </div>
      <div className="flex items-center gap-1">
        {rightSlot ?? (
          <button className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-surface-container-high transition-colors active:scale-95 duration-100">
            <Icon name="settings" size={24} className="text-on-surface-variant" />
          </button>
        )}
      </div>
    </header>
  )
}
