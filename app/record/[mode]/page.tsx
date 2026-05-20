'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Icon } from '@/components/ui/ms-icon'
import { SymptomReviewCard } from '@/components/SymptomReviewCard'
import { WorkoutReviewCard } from '@/components/WorkoutReviewCard'
import type { SymptomExtraction, WorkoutExtraction } from '@/lib/types'

type Mode = 'symptom' | 'workout'
type Phase = 'idle' | 'recording' | 'transcribing' | 'extracting' | 'reviewing'

function formatElapsed(seconds: number): string {
  const m = Math.floor(seconds / 60).toString().padStart(2, '0')
  const s = (seconds % 60).toString().padStart(2, '0')
  return `${m}:${s}`
}

export default function RecordPage() {
  const params = useParams()
  const router = useRouter()
  const mode = params.mode as Mode

  const [phase, setPhase] = useState<Phase>('idle')
  const [elapsed, setElapsed] = useState(0)
  const [transcript, setTranscript] = useState<string | null>(null)
  const [extracted, setExtracted] = useState<SymptomExtraction | WorkoutExtraction | null>(null)
  const [saving, setSaving] = useState(false)

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    if (mode !== 'symptom' && mode !== 'workout') router.replace('/')
  }, [mode, router])

  const stopTimer = useCallback(() => {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null }
  }, [])

  useEffect(() => () => stopTimer(), [stopTimer])

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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode])

  const runExtraction = useCallback(async (text: string) => {
    setPhase('extracting')
    try {
      const res = await fetch('/api/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode, transcript: text }),
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error ?? 'Extraction failed.')
        setPhase('idle')
        return
      }
      setExtracted(data.extracted)
      setPhase('reviewing')
    } catch {
      toast.error('Network error — extraction failed.')
      setPhase('idle')
    }
  }, [mode])

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

  const handleMicButton = () => {
    if (phase === 'idle') startRecording()
    else if (phase === 'recording') stopRecording()
  }

  const handleSave = async (editedData: SymptomExtraction | WorkoutExtraction) => {
    setSaving(true)
    try {
      const res = await fetch('/api/entries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode, data: editedData, transcript }),
      })
      const result = await res.json()
      if (!res.ok) { toast.error(result.error ?? 'Failed to save'); setSaving(false); return }
      toast.success('Entry saved!')
      router.push('/')
    } catch {
      toast.error('Network error — could not save.')
      setSaving(false)
    }
  }

  // Review phase
  if (phase === 'reviewing' && extracted !== null) {
    return (
      <main className="min-h-screen bg-surface px-container-padding-mobile">
        {/* Back bar */}
        <div className="flex items-center gap-3 h-16 sticky top-0 glass-nav border-b border-outline-variant mb-6">
          <button
            onClick={() => router.back()}
            className="flex items-center justify-center w-10 h-10 rounded-full hover:bg-surface-container-high transition-colors"
          >
            <Icon name="arrow_back" size={24} className="text-on-surface-variant" />
          </button>
          <span className="font-headline font-bold text-headline-md text-on-surface capitalize">Review {mode}</span>
        </div>

        {mode === 'symptom' ? (
          <SymptomReviewCard
            extracted={extracted as SymptomExtraction}
            transcript={transcript ?? ''}
            onSave={handleSave}
            isSaving={saving}
          />
        ) : (
          <WorkoutReviewCard
            extracted={extracted as WorkoutExtraction}
            transcript={transcript ?? ''}
            onSave={handleSave}
            isSaving={saving}
          />
        )}
      </main>
    )
  }

  const isProcessing = phase === 'transcribing' || phase === 'extracting'

  return (
    <main className="flex min-h-screen flex-col items-center justify-start bg-surface px-container-padding-mobile py-0">
      {/* Top bar */}
      <div className="flex items-center gap-3 h-16 w-full max-w-lg sticky top-0 glass-nav border-b border-outline-variant mb-8">
        <button
          onClick={() => router.back()}
          className="flex items-center justify-center w-10 h-10 rounded-full hover:bg-surface-container-high transition-colors"
          aria-label="Go back"
        >
          <Icon name="arrow_back" size={24} className="text-on-surface-variant" />
        </button>
        <h1 className="font-headline font-bold text-headline-md text-on-surface capitalize">
          Log {mode}
        </h1>
      </div>

      {/* Mic button area */}
      <div className="flex flex-col items-center gap-8 mt-12">
        <div className="relative">
          {phase === 'recording' && (
            <div className="absolute inset-0 rounded-full bg-error/20 animate-ping scale-110" />
          )}
          <button
            onClick={handleMicButton}
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

        {/* Timer when recording */}
        {phase === 'recording' && (
          <span className="font-mono text-display-lg-mobile font-bold text-on-surface tabular-nums tracking-tight">
            {formatElapsed(elapsed)}
          </span>
        )}

        {phase === 'idle' && !transcript && (
          <p className="text-body-md text-on-surface-variant">Tap to start recording</p>
        )}

        {isProcessing && (
          <p className="text-body-md text-on-surface-variant animate-pulse">
            {phase === 'transcribing' ? 'Transcribing…' : 'Extracting data…'}
          </p>
        )}
      </div>

      {/* Transcript card while extracting */}
      {transcript && phase === 'extracting' && (
        <div className="w-full max-w-lg mt-8 bg-surface-container-lowest border border-outline-variant rounded-xl px-5 py-4">
          <p className="text-label-sm font-medium text-on-surface-variant uppercase tracking-wider mb-2">
            Transcript captured
          </p>
          <p className="text-body-md text-on-surface leading-relaxed">{transcript}</p>
        </div>
      )}
    </main>
  )
}
