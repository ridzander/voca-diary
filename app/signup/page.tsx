'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createSupabaseBrowserClient } from '@/lib/supabase-browser'
import { VocaButton } from '@/components/ui/voca-card'
import { Input } from '@/components/ui/input'
import { VocaLogo } from '@/components/ui/voca-logo'

export default function SignupPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createSupabaseBrowserClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const { error } = await supabase.auth.signUp({ email, password })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    router.push('/?welcome=1')
    router.refresh()
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-surface px-container-padding-mobile py-12">
      <div className="w-full max-w-sm">
        {/* Logo / brand */}
        <div className="mb-10 flex flex-col items-center gap-3">
          <VocaLogo iconSize={64} showWordmark={false} />
          <div className="text-center">
            <h1 className="font-body font-bold text-on-surface" style={{ fontSize: 28 }}>
              Voca<span className="text-[#1D9E75]">Diary</span>
            </h1>
            <p className="mt-1 text-caption text-on-surface-variant">Create your account</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="email" className="text-label-sm font-medium text-on-surface-variant">Email</label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              autoComplete="email"
              required
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="password" className="text-label-sm font-medium text-on-surface-variant">Password</label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 6 characters"
              autoComplete="new-password"
              minLength={6}
              required
            />
          </div>

          {error && (
            <p className="text-caption text-error bg-error-container/40 px-3 py-2 rounded-lg">{error}</p>
          )}

          <VocaButton type="submit" variant="primary" disabled={loading} className="mt-1">
            {loading ? 'Creating account…' : 'Create account'}
          </VocaButton>
        </form>

        <p className="mt-6 text-center text-caption text-on-surface-variant">
          Already have an account?{' '}
          <Link href="/login" className="text-primary font-semibold hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </main>
  )
}
