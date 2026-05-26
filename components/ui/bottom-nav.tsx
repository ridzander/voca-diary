'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Icon } from '@/components/ui/ms-icon'

const TABS = [
  { label: 'Home',     icon: 'home',          href: '/' },
  { label: 'Symptoms', icon: 'monitor_heart',  href: '/timeline/symptoms' },
  { label: 'Workouts', icon: 'fitness_center', href: '/timeline/workouts' },
  { label: 'Settings', icon: 'settings',       href: '/settings' },
] as const

export function BottomNav() {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 left-0 w-full z-50 bg-surface border-t border-outline-variant rounded-t-xl flex justify-around items-center px-4 pb-4 pt-2 shadow-[0px_-4px_12px_rgba(0,0,0,0.05)]">
      {TABS.map((tab) => {
        const isActive = tab.href === '/' ? pathname === '/' : pathname.startsWith(tab.href)
        return (
          <Link
            key={tab.label}
            href={tab.href}
            className={`flex flex-col items-center justify-center px-5 py-1 rounded-full transition-all duration-100 ${
              isActive
                ? 'bg-primary-container text-on-primary-container'
                : 'text-on-surface-variant hover:bg-surface-container-high'
            }`}
          >
            <Icon name={tab.icon} size={24} fill={isActive ? 1 : 0} />
            <span className="text-label-sm mt-0.5">{tab.label}</span>
          </Link>
        )
      })}
    </nav>
  )
}
