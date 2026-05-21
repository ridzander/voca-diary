'use client'

import Link from 'next/link'
import { Icon } from '@/components/ui/ms-icon'

export function TopBarActions() {
  return (
    <div className="flex items-center gap-1">
      <Link
        href="/usage"
        className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-surface-container-high transition-colors active:scale-95 duration-100"
        title="Usage"
      >
        <Icon name="monitoring" size={24} className="text-on-surface-variant" />
      </Link>
      <button className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-surface-container-high transition-colors active:scale-95 duration-100">
        <Icon name="settings" size={24} className="text-on-surface-variant" />
      </button>
    </div>
  )
}
