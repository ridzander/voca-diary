'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Icon } from '@/components/ui/ms-icon'
import { TopAppBar } from '@/components/ui/top-app-bar'
import { BottomNav } from '@/components/ui/bottom-nav'
import { SignOutButton } from '@/components/SignOutButton'

interface Props {
  firstName: string
  lastName: string
  email: string
}

export function SettingsClient({ firstName, lastName, email }: Props) {
  const [first, setFirst] = useState(firstName)
  const [last, setLast] = useState(lastName)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const handleSave = async () => {
    setSaving(true)
    setSaved(false)
    setError(null)
    try {
      const res = await fetch('/api/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ first_name: first.trim(), last_name: last.trim() }),
      })
      if (!res.ok) throw new Error('Failed to save')
      setSaved(true)
      router.refresh()
      setTimeout(() => setSaved(false), 2000)
    } catch {
      setError('Could not save. Try again.')
    } finally {
      setSaving(false)
    }
  }

  const backButton = (
    <Link href="/" className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-surface-container-high transition-colors active:scale-95 duration-100">
      <Icon name="arrow_back" size={24} className="text-on-surface" />
    </Link>
  )

  return (
    <>
      <TopAppBar title="Settings" leftSlot={backButton} rightSlot={<div />} />

      <main className="mt-20 pb-28 px-container-padding-mobile max-w-[640px] mx-auto">
        {/* Profile section */}
        <div className="mt-6 mb-4">
          <p className="text-label-sm font-medium text-on-surface-variant uppercase tracking-wider mb-3">Profile</p>
          <div className="bg-surface-container-lowest border border-outline-variant rounded-xl overflow-hidden divide-y divide-outline-variant">
            <div className="px-4 py-3">
              <label className="block text-caption text-on-surface-variant mb-1">First name</label>
              <input
                type="text"
                value={first}
                onChange={(e) => setFirst(e.target.value)}
                placeholder="Enter first name"
                className="w-full bg-transparent text-body-md text-on-surface outline-none placeholder:text-on-surface-variant/50"
              />
            </div>
            <div className="px-4 py-3">
              <label className="block text-caption text-on-surface-variant mb-1">Last name</label>
              <input
                type="text"
                value={last}
                onChange={(e) => setLast(e.target.value)}
                placeholder="Enter last name"
                className="w-full bg-transparent text-body-md text-on-surface outline-none placeholder:text-on-surface-variant/50"
              />
            </div>
          </div>

          <button
            onClick={handleSave}
            disabled={saving}
            className="mt-3 w-full py-3 rounded-xl bg-primary text-on-primary font-headline font-semibold text-body-md transition-opacity active:scale-95 duration-100 disabled:opacity-60"
          >
            {saving ? 'Saving…' : saved ? 'Saved!' : 'Save profile'}
          </button>
          {error && <p className="text-caption text-error mt-2 text-center">{error}</p>}
        </div>

        {/* Account section */}
        <div className="mb-4">
          <p className="text-label-sm font-medium text-on-surface-variant uppercase tracking-wider mb-3">Account</p>
          <div className="bg-surface-container-lowest border border-outline-variant rounded-xl overflow-hidden divide-y divide-outline-variant">
            <div className="px-4 py-3">
              <p className="text-caption text-on-surface-variant mb-0.5">Email</p>
              <p className="text-body-md text-on-surface">{email}</p>
            </div>
            <div className="px-4 py-3">
              <SignOutButton />
            </div>
          </div>
        </div>
      </main>

      <BottomNav />
    </>
  )
}
