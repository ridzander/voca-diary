'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import { Icon } from '@/components/ui/ms-icon'
import { SignOutButton } from '@/components/SignOutButton'

const TABS = [
  { label: 'Home',     icon: 'home',          href: '/' },
  { label: 'Symptoms', icon: 'monitor_heart',  href: '/timeline/symptoms' },
  { label: 'Workouts', icon: 'fitness_center', href: '/timeline/workouts' },
  { label: 'Profile',  icon: 'person',         href: null },
] as const

export function BottomNav() {
  const pathname = usePathname()
  const [profileOpen, setProfileOpen] = useState(false)

  return (
    <>
      {/* Profile popover */}
      {profileOpen && (
        <div className="fixed inset-0 z-40" onClick={() => setProfileOpen(false)}>
          <div
            className="absolute bottom-20 right-4 bg-surface-container-lowest border border-outline-variant rounded-xl shadow-lg p-4 min-w-[180px]"
            onClick={(e) => e.stopPropagation()}
          >
            <p className="text-label-sm text-on-surface-variant mb-3">Account</p>
            <SignOutButton />
          </div>
        </div>
      )}

      <nav className="fixed bottom-0 left-0 w-full z-50 bg-surface border-t border-outline-variant rounded-t-xl flex justify-around items-center px-4 pb-4 pt-2 shadow-[0px_-4px_12px_rgba(0,0,0,0.05)]">
        {TABS.map((tab) => {
          const isActive = tab.href
            ? tab.href === '/' ? pathname === '/' : pathname.startsWith(tab.href)
            : profileOpen

          if (tab.href === null) {
            return (
              <button
                key={tab.label}
                onClick={() => setProfileOpen((v) => !v)}
                className={`flex flex-col items-center justify-center px-5 py-1 rounded-full transition-all duration-100 ${
                  isActive
                    ? 'bg-primary-container text-on-primary-container'
                    : 'text-on-surface-variant hover:bg-surface-container-high'
                }`}
              >
                <Icon name={tab.icon} size={24} fill={isActive ? 1 : 0} />
                <span className="text-label-sm mt-0.5">{tab.label}</span>
              </button>
            )
          }

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
    </>
  )
}
