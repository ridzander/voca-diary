'use client'

import { useRouter } from 'next/navigation'
import { createSupabaseBrowserClient } from '@/lib/supabase-browser'

export function SignOutButton() {
  const router = useRouter()
  const supabase = createSupabaseBrowserClient()

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <button
      onClick={handleSignOut}
      className="w-full text-left text-body-md text-error hover:opacity-80 transition-opacity font-semibold"
    >
      Sign out
    </button>
  )
}
