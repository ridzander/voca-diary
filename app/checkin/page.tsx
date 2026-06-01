'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { toast } from 'sonner'
import { Icon } from '@/components/ui/ms-icon'
import { DailyCheckinReviewCard } from '@/components/DailyCheckinReviewCard'
import { BottomNav } from '@/components/ui/bottom-nav'
import type { DailyCheckinExtraction } from '@/lib/types'

type Phase = 'idle' | 'recording' | 'transcribing' | 'extracting' | 'reviewing'

function formatElapsed(seconds: number): string {
  const m = Math.floor(seconds / 60).toString().padStart(2, '0')
  const s = (seconds % 60).toString().padStart(2, '0')
  return `${m}:${s}`
}

const CATEGORIES = ['Sleep', 'Mood', 'Food', 'Symptoms', 'Workout']

export default function CheckinPage() {
  const router = useRouter()
  const [phase, setPhase] = useState<Phase>('idle')
  const [elapsed, setElapsed] = useState(0)
  const [transcript, setTranscript] = useState<string | null>(null)
  const [extracted, setExtracted] = useState<DailyCheckinExtraction | null>(null)

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const stopTimer = useCallback(() => {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null }
  }, [])

  useEffect(() => () => stopTimer(), [stopTimer])

  const runExtraction = useCallback(async (text: string) => {
    setPhase('extracting')
    try {
      const res = await fetch('/api/extract/daily-checkin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transcript: text }),
      })
      const data = await res.json()
      if (!res.ok) { toast.error(data.error ?? 'Extraction failed'); setPhase('idle'); return }
      setExtracted(data.extracted)
      setPhase('reviewing')
    } catch {
      toast.error('Network error — extraction failed.')
      setPhase('idle')
    }
  }, [])

  const runTranscription = useCallback(async (blob: Blob, mimeType: string) => {
    setPhase('transcribing')
    const ext = mimeType.includes('ogg') ? 'ogg' : 'webm'
    const file = new File([blob], `recording.${ext}`, { type: mimeType })
    const formData = new FormData()
    formData.append('audio', file)
    try {
      const res = await fetch('/api/transcribe', { method: 'POST', body: formData })
      const data = await res.json()
      if (!res.ok) { toast.error(data.error ?? 'Transcription failed'); setPhase('idle'); return }
      const text: string = data.transcript
      setTranscript(text)
      await runExtraction(text)
    } catch {
      toast.error('Network error — could not transcribe.')
      setPhase('idle')
    }
  }, [runExtraction])

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : MediaRecorder.isTypeSupported('audio/webm')
        ? 'audio/webm'
        : 'audio/ogg'
      const recorder = new MediaRecorder(stream, { mimeType })
      chunksRef.current = []
      recorder.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data) }
      recorder.start(250)
      mediaRecorderRef.current = recorder
      setPhase('recording')
      setElapsed(0)
      timerRef.current = setInterval(() => setElapsed((s) => s + 1), 1000)
    } catch (err) {
      const denied = err instanceof DOMException && err.name === 'NotAllowedError'
      toast.error(denied ? 'Microphone access denied.' : 'Could not start recording.')
    }
  }, [])

  const stopRecording = useCallback(() => {
    const recorder = mediaRecorderRef.current
    if (!recorder) return
    stopTimer()
    recorder.onstop = () => {
      recorder.stream.getTracks().forEach((t) => t.stop())
      const blob = new Blob(chunksRef.current, { type: recorder.mimeType })
      runTranscription(blob, recorder.mimeType)
    }
    recorder.stop()
    mediaRecorderRef.current = null
  }, [stopTimer, runTranscription])

  const handleSave = async (editedData: DailyCheckinExtraction) => {
    const res = await fetch('/api/daily-checkins', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ transcript, data: editedData }),
    })
    const result = await res.json()
    if (!res.ok) {
      toast.error(result.error ?? 'Failed to save')
      throw new Error(result.error)
    }
    toast.success('Check-in saved!')
    router.push('/')
  }

  const isProcessing = phase === 'transcribing' || phase === 'extracting'

  // ── Review phase ──────────────────────────────────────────────────────────
  if (phase === 'reviewing' && extracted !== null) {
    return (
      <>
        <div className="flex items-center gap-3 h-16 sticky top-0 z-50 glass-nav border-b border-outline-variant px-container-padding-mobile">
          <button
            onClick={() => { setPhase('idle'); setExtracted(null); setTranscript(null) }}
            className="flex items-center justify-center w-10 h-10 rounded-full hover:bg-surface-container-high transition-colors"
          >
            <Icon name="arrow_back" size={24} className="text-on-surface-variant" />
          </button>
          <span className="font-headline font-bold text-headline-md text-on-surface">Review</span>
        </div>
        <main className="pb-28 px-container-padding-mobile max-w-[640px] mx-auto mt-6">
          <DailyCheckinReviewCard
            extracted={extracted}
            transcript={transcript ?? ''}
            onSave={handleSave}
          />
        </main>
        <BottomNav />
      </>
    )
  }

  // ── Recording / processing phase ──────────────────────────────────────────
  return (
    <>
      <div className="flex items-center gap-3 h-16 sticky top-0 z-50 glass-nav border-b border-outline-variant px-container-padding-mobile">
        <Link
          href="/"
          className="flex items-center justify-center w-10 h-10 rounded-full hover:bg-surface-container-high transition-colors"
        >
          <Icon name="arrow_back" size={24} className="text-on-surface-variant" />
        </Link>
        <h1 className="font-headline font-bold text-headline-md text-on-surface">Daily Check-in</h1>
      </div>

      <main className="flex min-h-[calc(100vh-4rem)] flex-col items-center justify-start px-container-padding-mobile py-8">
        {/* Subtitle */}
        {phase === 'idle' && (
          <>
            <p className="text-body-md text-on-surface-variant text-center mb-6">
              Talk for 30–60 seconds about your day.
            </p>
            <div className="flex gap-2 flex-wrap justify-center mb-10">
              {CATEGORIES.map((cat) => (
                <span
                  key={cat}
                  className="px-3 py-1 rounded-full bg-surface-container text-on-surface-variant text-label-sm"
                >
                  {cat}
                </span>
              ))}
            </div>
          </>
        )}

        {/* Mic button */}
        <div className="relative mt-4">
          {phase === 'recording' && (
            <div className="absolute inset-0 rounded-full bg-error/20 animate-ping scale-110" />
          )}
          <button
            onClick={phase === 'idle' ? startRecording : phase === 'recording' ? stopRecording : undefined}
            disabled={isProcessing}
            aria-label={phase === 'recording' ? 'Stop recording' : 'Start recording'}
            className={[
              'relative flex h-[120px] w-[120px] items-center justify-center rounded-full transition-all duration-200 active:scale-95 disabled:cursor-not-allowed disabled:opacity-60',
              phase === 'recording'
                ? 'bg-error shadow-lg shadow-error/30'
                : 'bg-primary-container hover:brightness-95',
            ].join(' ')}
          >
            {isProcessing ? (
              <Icon name="autorenew" size={48} className="text-on-primary-container animate-spin" />
            ) : phase === 'recording' ? (
              <Icon name="stop" size={48} fill={1} className="text-on-error" />
            ) : (
              <Icon name="mic" size={48} fill={1} className="text-on-primary-container" />
            )}
          </button>
        </div>

        {phase === 'recording' && (
          <span className="font-mono text-display-lg-mobile font-bold text-on-surface tabular-nums tracking-tight mt-6">
            {formatElapsed(elapsed)}
          </span>
        )}

        {phase === 'idle' && !transcript && (
          <p className="text-body-md text-on-surface-variant mt-8">Tap to start recording</p>
        )}

        {isProcessing && (
          <p className="text-body-md text-on-surface-variant animate-pulse mt-8">
            {phase === 'transcribing' ? 'Transcribing…' : 'Extracting data…'}
          </p>
        )}

        {transcript && phase === 'extracting' && (
          <div className="w-full max-w-lg mt-8 bg-surface-container-lowest border border-outline-variant rounded-xl px-5 py-4">
            <p className="text-label-sm font-medium text-on-surface-variant uppercase tracking-wider mb-2">
              Transcript captured
            </p>
            <p className="text-body-md text-on-surface leading-relaxed">{transcript}</p>
          </div>
        )}
      </main>
      <BottomNav />
    </>
  )
}
