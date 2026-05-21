import { NextRequest, NextResponse } from 'next/server';
import { openai } from '@/lib/openai';
import { createSupabaseServerClient } from '@/lib/supabase-server';
import { logUsage } from '@/lib/usage-logger';

const MOCK_TRANSCRIPTS = [
  'Having a headache, maybe a 6 out of 10. Had a lot of screen time today.',
  'Hamstrings are very sore. Hurting to sit or stand up. Did legs day before yesterday.',
  'Did chest and triceps today. Dumbbell chest press, three sets, 35 kilos 12 reps, 37.5 kilos 10 reps, 40 kilos 6 reps.',
  'Feeling a bit bloated. Had junk food at lunch.',
  'My eyes are really itchy and watering a lot. Been staring at screens for hours.',
];

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  let userId: string | null = null;

  try {
    const supabase = createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    userId = user?.id ?? null;

    // Mock mode — set MOCK_TRANSCRIPTION=true in .env.local to skip Whisper during dev
    if (process.env.MOCK_TRANSCRIPTION === 'true') {
      await new Promise((r) => setTimeout(r, 800));
      const transcript = MOCK_TRANSCRIPTS[Math.floor(Math.random() * MOCK_TRANSCRIPTS.length)];
      return NextResponse.json({ transcript });
    }

    const formData = await request.formData();
    const audio = formData.get('audio');

    if (!audio || !(audio instanceof File)) {
      return NextResponse.json({ error: 'No audio file provided' }, { status: 400 });
    }

    const audioSeconds = Math.round(audio.size / 16000);

    const transcription = await openai.audio.transcriptions.create({
      file: audio,
      model: 'whisper-1',
    });

    await logUsage({
      userId,
      route: '/api/transcribe',
      model: 'whisper-1',
      audioSeconds,
      durationMs: Date.now() - startTime,
      status: 'success',
    });

    return NextResponse.json({ transcript: transcription.text });
  } catch (err) {
    console.error('[transcribe]', err);
    await logUsage({
      userId,
      route: '/api/transcribe',
      model: 'whisper-1',
      durationMs: Date.now() - startTime,
      status: 'error',
      errorMessage: err instanceof Error ? err.message : String(err),
    });
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 });
  }
}
