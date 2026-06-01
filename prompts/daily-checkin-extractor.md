# Daily Check-in Extractor — v1

## Purpose
Turn a voice-transcribed entry covering an entire day (sleep, mood, food, symptoms, workout, life context) into clean structured JSON.

This is the unified extractor for the daily check-in feature. The output populates up to five tables in one save (sleep, mood, nutrition, symptoms, workout) plus a free-form daily_notes field.

---

## System prompt (paste into Claude as the system message)

You are a structured-data extractor for a personal voice-first daily health journal. Your job is to read a voice-transcribed entry from a user describing their entire day, and return ONLY valid JSON matching the schema below — no prose, no markdown, no explanation.

The user is journaling, not asking for medical advice. Never diagnose, never recommend treatment, never editorialize. Only extract what the user said.

The user's entry can mention any combination of: sleep, mood, food and drink, symptoms, workout, plus general life context. Extract whatever they mention. Do NOT invent data they did not mention. If they didn't mention a category, that category's block is `null`.

### Schema
```json
{
  "sleep": null | {
    "hours": "number or null",
    "quality": "'good' | 'okay' | 'bad' | null",
    "wake_state": "string or null — e.g. 'groggy', 'rested', 'tired', 'hungover'",
    "ambiguities": "string[]"
  },
  "mood": null | {
    "score": "integer 1-10 or null",
    "source": "'explicit' | 'inferred' | 'unknown'",
    "label": "'good' | 'okay' | 'bad' | null",
    "notes": "string or null — qualitative notes e.g. 'felt productive', 'low energy'"
  },
  "nutrition": null | {
    "meals": [
      { "meal": "'breakfast' | 'lunch' | 'dinner' | 'snack' | 'general' | null", "items": "string[]" }
    ],
    "drinks": "string[] — coffee, tea, alcohol, water (when quantified)",
    "protein_grams": "number or null",
    "notes": "string or null",
    "ambiguities": "string[]"
  },
  "symptoms": null | {
    "items": [
      {
        "name": "string",
        "location": "string or null",
        "severity": "integer 1-10 or null",
        "severity_source": "'explicit' | 'inferred' | 'unknown'",
        "quality": "string or null"
      }
    ],
    "factors": [
      {
        "name": "string",
        "category": "'sleep' | 'food' | 'activity' | 'work' | 'stress' | 'medication' | 'weather' | 'screen_time' | 'alcohol' | 'social' | 'other'",
        "time_offset_days": "integer",
        "detail": "string or null"
      }
    ]
  },
  "workout": null | {
    "did_workout": "boolean",
    "skip_reason": "string or null — only when did_workout is false",
    "session_type": "'lifting' | 'cardio' | 'sport' | 'mixed' | null",
    "session_label": "string or null",
    "activities": [
      {
        "type": "'lifting' | 'cardio' | 'sport'",
        "name": "string",
        "sets": [{ "reps": "int|null", "weight_kg": "number|null", "rpe": "int|null", "notes": "string|null" }],
        "duration_minutes": "integer or null",
        "intensity_notes": "string or null",
        "notes": "string or null"
      }
    ],
    "session_notes": "string or null",
    "perceived_effort": "integer 1-10 or null"
  },
  "daily_notes": "string or null — productivity, social context, life observations not fitting other categories",
  "ambiguities": "string[] — top-level cross-category ambiguities",
  "raw_transcript": "string — original verbatim"
}
```

### Rules

1. **Output ONLY the JSON object.** No commentary, no markdown fences.

2. **Null vs empty rule.** If the user did not mention a category at all, its top-level block is `null`. If they mentioned the category but no specifics ("ate good food" with no items), populate the block with limited info and leave specific sub-fields null/empty.

3. **Sleep hours hedges.** "Around 6," "like 7," "I think 8," "maybe 5 and a half" → extract the stated number. Range ("6 or 7 hours") → midpoint, flag in ambiguities. Qualitative only ("slept fine") with no hours → hours = null, quality set.

4. **Sleep quality + wake_state inference.**
   - "slept fine" / "slept well" / "great sleep" → quality "good"
   - "slept okay" / "slept enough" → "okay"
   - "slept badly" / "slept poorly" / "awful sleep" → "bad"
   - wake_state: "woke up tired" → "tired", "woke up groggy" → "groggy", "woke up with a hangover" → "hungover", "feel great" / "rested" → "rested"

5. **Mood scoring.**
   - Explicit number: "mood was 7 out of 10" → score: 7, source: "explicit"
   - Hedged number: "mood was around like 4" → score: 4, source: "explicit"
   - Qualitative only: "mood was good" → score: 7, source: "inferred", label: "good"
   - Not mentioned: mood = null entirely
   - Inferred rubric: bad ≈ 2-3, low ≈ 4, okay ≈ 5-6, good ≈ 7, great ≈ 8, amazing ≈ 9

6. **Nutrition extraction.**
   - Group items by meal when user specifies one ("kachori for breakfast")
   - Drinks (coffee, tea, alcohol, quantified water) go in drinks array
   - "Hit my protein goal of 100g" → protein_grams: 100. Mid-sentence corrections apply: "100 grams... I mean 100" → use corrected value, flag.
   - "Ate good food with high protein" without specifics → meals: [], protein_grams: null, notes: "high protein day, no specific items mentioned"
   - "Didn't eat much, just toast" → meals: [{meal: "general", items: ["toast"]}], notes: "low food intake"

7. **Symptoms** (same shape as standalone symptom extractor):
   - Multiple symptoms = multiple items in symptoms.items
   - Severity inferred when not stated using the rubric
   - Factor categories include 'alcohol' for hangovers
   - Time offsets: "from last night" → -1, "yesterday" → -1, default 0

8. **Workout extraction.**
   - did_workout: true → populate session_type, session_label, activities just like the standalone workout extractor
   - did_workout: false → user EXPLICITLY says skipped, rest day, or didn't go. Populate skip_reason if a reason given.
   - workout block = null only when user doesn't mention workout at all
   - "Sore muscles" today might be from yesterday's workout — capture as a symptom with factor "previous workout"
   - "Completed 10K steps" → cardio activity within workout block: type "cardio", name "walking", intensity_notes "10K steps"
   - "Going out with family" → NOT a workout, goes in daily_notes

9. **Daily notes.** Productivity, social context, life observations. Keep brief.

10. **Ambiguities are honest.** Every hedged number, every inferred severity, every category-assignment judgment gets flagged. Per-block ambiguities for issues inside a block; top-level for cross-category.

11. **Cultural / regional food names** are fine. "Kachori," "chole," "dal," "biryani" — extract verbatim. Don't translate.

12. **Mid-sentence corrections** apply throughout. Use the correction, flag in ambiguities.

### Severity inference rubric
- 1–2: barely noticeable
- 3–4: noticeable but not bothersome
- 5–6: clearly there
- 7–8: bad, "very," "really," "couldn't walk properly"
- 9–10: severe

If no severity signal: severity = null, severity_source = "unknown".

---

## Test inputs and expected outputs

For each test below, the expected JSON is what Claude should return. Acceptable variations: severity scores within ±1 of expected, slight differences in canonical naming, extra or differently-worded ambiguity strings. NOT acceptable: wrong null/populated decisions for top-level blocks, wrong numbers, missing symptoms or factor connections, wrong did_workout flag.

---

### Test 1 — full daily check-in covering all 5 categories

**Input:**
```
I slept for around 6 hours last night. I had kachori for breakfast, boiled eggs for lunch, and boiled chole for dinner. I also worked out today, did chest and tricep workout. I had coffee twice today before hitting the evening and had a headache because I had too much screen time today.
```

**Expected output:**
```json
{
  "sleep": {
    "hours": 6,
    "quality": null,
    "wake_state": null,
    "ambiguities": ["user said 'around 6 hours' — stored 6 with mild imprecision"]
  },
  "mood": null,
  "nutrition": {
    "meals": [
      { "meal": "breakfast", "items": ["kachori"] },
      { "meal": "lunch", "items": ["boiled eggs"] },
      { "meal": "dinner", "items": ["boiled chole"] }
    ],
    "drinks": ["coffee"],
    "protein_grams": null,
    "notes": "coffee twice today, before evening",
    "ambiguities": []
  },
  "symptoms": {
    "items": [
      {
        "name": "headache",
        "location": null,
        "severity": null,
        "severity_source": "unknown",
        "quality": null
      }
    ],
    "factors": [
      {
        "name": "screen time",
        "category": "screen_time",
        "time_offset_days": 0,
        "detail": "too much today"
      },
      {
        "name": "coffee",
        "category": "food",
        "time_offset_days": 0,
        "detail": "two cups before evening"
      }
    ]
  },
  "workout": {
    "did_workout": true,
    "skip_reason": null,
    "session_type": "lifting",
    "session_label": "chest and triceps",
    "activities": [],
    "session_notes": null,
    "perceived_effort": null
  },
  "daily_notes": null,
  "ambiguities": [
    "workout mentioned but no exercises, sets, or weights given — activities array left empty"
  ],
  "raw_transcript": "I slept for around 6 hours last night. I had kachori for breakfast, boiled eggs for lunch, and boiled chole for dinner. I also worked out today, did chest and tricep workout. I had coffee twice today before hitting the evening and had a headache because I had too much screen time today."
}
```

---

### Test 2 — good day, mood + workout + protein, no sleep mention

**Input:**
```
I had a good day today. The mood was good. I think like a 7 out of 10. Felt productive today. Worked out. Did back and bicep workout. I hit my protein goal of 100g.
```

**Expected output:**
```json
{
  "sleep": null,
  "mood": {
    "score": 7,
    "source": "explicit",
    "label": "good",
    "notes": "felt productive"
  },
  "nutrition": {
    "meals": [],
    "drinks": [],
    "protein_grams": 100,
    "notes": "hit protein goal of 100g",
    "ambiguities": []
  },
  "symptoms": null,
  "workout": {
    "did_workout": true,
    "skip_reason": null,
    "session_type": "lifting",
    "session_label": "back and biceps",
    "activities": [],
    "session_notes": null,
    "perceived_effort": null
  },
  "daily_notes": "good day overall",
  "ambiguities": [
    "workout mentioned but no exercises, sets, or weights given — activities array left empty"
  ],
  "raw_transcript": "I had a good day today. The mood was good. I think like a 7 out of 10. Felt productive today. Worked out. Did back and bicep workout. I hit my protein goal of 100g."
}
```

---

### Test 3 — short morning entry, sleep + hangover

**Input:**
```
I slept for nine hours, woke up with a hangover because I drank last night. It is a slow morning.
```

**Expected output:**
```json
{
  "sleep": {
    "hours": 9,
    "quality": null,
    "wake_state": "hungover",
    "ambiguities": []
  },
  "mood": null,
  "nutrition": {
    "meals": [],
    "drinks": ["alcohol"],
    "protein_grams": null,
    "notes": "drank alcohol previous night",
    "ambiguities": []
  },
  "symptoms": {
    "items": [
      {
        "name": "hangover",
        "location": null,
        "severity": null,
        "severity_source": "unknown",
        "quality": null
      }
    ],
    "factors": [
      {
        "name": "alcohol",
        "category": "alcohol",
        "time_offset_days": -1,
        "detail": "drank last night"
      }
    ]
  },
  "workout": null,
  "daily_notes": "slow morning",
  "ambiguities": [],
  "raw_transcript": "I slept for nine hours, woke up with a hangover because I drank last night. It is a slow morning."
}
```

---

### Test 4 — bad day, multiple symptoms, skipped gym

**Input:**
```
Awful day. Slept fine but woke up with a migraine, like 7/10, lasted all day. Mood was a 3. Didn't eat much, just toast. Skipped the gym.
```

**Expected output:**
```json
{
  "sleep": {
    "hours": null,
    "quality": "good",
    "wake_state": null,
    "ambiguities": ["user said 'slept fine' — no hours given"]
  },
  "mood": {
    "score": 3,
    "source": "explicit",
    "label": "bad",
    "notes": "awful day"
  },
  "nutrition": {
    "meals": [
      { "meal": "general", "items": ["toast"] }
    ],
    "drinks": [],
    "protein_grams": null,
    "notes": "low food intake — didn't eat much",
    "ambiguities": []
  },
  "symptoms": {
    "items": [
      {
        "name": "migraine",
        "location": null,
        "severity": 7,
        "severity_source": "explicit",
        "quality": null
      }
    ],
    "factors": []
  },
  "workout": {
    "did_workout": false,
    "skip_reason": "migraine, awful day",
    "session_type": null,
    "session_label": null,
    "activities": [],
    "session_notes": null,
    "perceived_effort": null
  },
  "daily_notes": "awful day overall",
  "ambiguities": [],
  "raw_transcript": "Awful day. Slept fine but woke up with a migraine, like 7/10, lasted all day. Mood was a 3. Didn't eat much, just toast. Skipped the gym."
}
```

---

### Test 5 — rest day with mid-sentence correction on protein

**Input:**
```
Rest day today. I slept fine. I ate good food with high protein. I hit my protein goal for the day of 10, I'm sorry, 100 grams.
```

**Expected output:**
```json
{
  "sleep": {
    "hours": null,
    "quality": "good",
    "wake_state": null,
    "ambiguities": ["user said 'slept fine' — no hours given"]
  },
  "mood": null,
  "nutrition": {
    "meals": [],
    "drinks": [],
    "protein_grams": 100,
    "notes": "good food with high protein, hit protein goal",
    "ambiguities": [
      "user corrected protein amount mid-sentence: said 10g then corrected to 100g; stored 100g"
    ]
  },
  "symptoms": null,
  "workout": {
    "did_workout": false,
    "skip_reason": "rest day",
    "session_type": null,
    "session_label": null,
    "activities": [],
    "session_notes": null,
    "perceived_effort": null
  },
  "daily_notes": null,
  "ambiguities": [],
  "raw_transcript": "Rest day today. I slept fine. I ate good food with high protein. I hit my protein goal for the day of 10, I'm sorry, 100 grams."
}
```

---

### Test 6 — symptom-heavy day, sleep + mood + knee pain

**Input:**
```
I slept for, I don't know, like six hours. Then I had some knee pain, couldn't walk properly. I had to take rest. And mood was also not good. It was around like 4 out of 10.
```

**Expected output:**
```json
{
  "sleep": {
    "hours": 6,
    "quality": null,
    "wake_state": null,
    "ambiguities": ["user hedged with 'I don't know, like six hours' — stored 6 with mild imprecision"]
  },
  "mood": {
    "score": 4,
    "source": "explicit",
    "label": "bad",
    "notes": null
  },
  "nutrition": null,
  "symptoms": {
    "items": [
      {
        "name": "knee pain",
        "location": "knee",
        "severity": 7,
        "severity_source": "inferred",
        "quality": null
      }
    ],
    "factors": []
  },
  "workout": {
    "did_workout": false,
    "skip_reason": "knee pain — couldn't walk properly, took rest",
    "session_type": null,
    "session_label": null,
    "activities": [],
    "session_notes": null,
    "perceived_effort": null
  },
  "daily_notes": "had to take rest due to knee pain",
  "ambiguities": [
    "knee pain location (left/right) not specified",
    "knee pain severity inferred as 7 from 'couldn't walk properly' (significant functional impact)",
    "user did not explicitly say 'skipped gym' but 'took rest' due to knee pain implies it — flagged did_workout false"
  ],
  "raw_transcript": "I slept for, I don't know, like six hours. Then I had some knee pain, couldn't walk properly. I had to take rest. And mood was also not good. It was around like 4 out of 10."
}
```

---

### Test 7 — workout-heavy with sport context and post-session symptom

**Input:**
```
Slept for like seven hours. I went to the gym as soon as I woke up. Dead shoulder workout today. Felt nice after that. Had eggs after that. I had to go out with my family, so I was out all day, completed 10K steps. The knee pain got a bit worse. Other than that, there was no symptoms.
```

**Expected output:**
```json
{
  "sleep": {
    "hours": 7,
    "quality": null,
    "wake_state": null,
    "ambiguities": ["user said 'like seven hours' — stored 7 with mild imprecision"]
  },
  "mood": null,
  "nutrition": {
    "meals": [
      { "meal": "general", "items": ["eggs"] }
    ],
    "drinks": [],
    "protein_grams": null,
    "notes": "eggs after workout",
    "ambiguities": []
  },
  "symptoms": {
    "items": [
      {
        "name": "knee pain",
        "location": "knee",
        "severity": null,
        "severity_source": "unknown",
        "quality": "worsening"
      }
    ],
    "factors": [
      {
        "name": "walking",
        "category": "activity",
        "time_offset_days": 0,
        "detail": "10K steps, out all day"
      }
    ]
  },
  "workout": {
    "did_workout": true,
    "skip_reason": null,
    "session_type": "mixed",
    "session_label": "shoulders and walking",
    "activities": [
      {
        "type": "lifting",
        "name": "shoulder workout",
        "sets": [],
        "duration_minutes": null,
        "intensity_notes": null,
        "notes": "felt nice after"
      },
      {
        "type": "cardio",
        "name": "walking",
        "sets": [],
        "duration_minutes": null,
        "intensity_notes": "10K steps",
        "notes": null
      }
    ],
    "session_notes": "felt nice after gym",
    "perceived_effort": null
  },
  "daily_notes": "went out with family, out all day",
  "ambiguities": [
    "user said 'dead shoulder workout' — interpreted 'dead' as filler/emphasis; stored as standard shoulder workout",
    "knee pain getting worse implies pre-existing — no current severity given",
    "10K steps treated as cardio activity in workout block; session_type bumped to 'mixed'"
  ],
  "raw_transcript": "Slept for like seven hours. I went to the gym as soon as I woke up. Dead shoulder workout today. Felt nice after that. Had eggs after that. I had to go out with my family, so I was out all day, completed 10K steps. The knee pain got a bit worse. Other than that, there was no symptoms."
}
```

---

### Test 8 — multi-symptom bad day, no workout, low productivity

**Input:**
```
I slept for around five hours last night and then I woke up with headache. I had some stomach ache as well and didn't do anything much really today. The mood was also bad. I had sore muscles, so I skipped gym. I wasn't productive at all today.
```

**Expected output:**
```json
{
  "sleep": {
    "hours": 5,
    "quality": "bad",
    "wake_state": null,
    "ambiguities": ["user said 'around five hours' — stored 5 with mild imprecision", "sleep quality inferred as 'bad' from only 5 hours plus waking up with symptoms"]
  },
  "mood": {
    "score": 3,
    "source": "inferred",
    "label": "bad",
    "notes": "wasn't productive at all"
  },
  "nutrition": null,
  "symptoms": {
    "items": [
      {
        "name": "headache",
        "location": null,
        "severity": null,
        "severity_source": "unknown",
        "quality": null
      },
      {
        "name": "stomach ache",
        "location": "stomach",
        "severity": null,
        "severity_source": "unknown",
        "quality": null
      },
      {
        "name": "sore muscles",
        "location": null,
        "severity": null,
        "severity_source": "unknown",
        "quality": "sore"
      }
    ],
    "factors": [
      {
        "name": "poor sleep",
        "category": "sleep",
        "time_offset_days": 0,
        "detail": "5 hours last night"
      },
      {
        "name": "previous workout",
        "category": "activity",
        "time_offset_days": -1,
        "detail": "implied — sore muscles suggest prior workout"
      }
    ]
  },
  "workout": {
    "did_workout": false,
    "skip_reason": "sore muscles",
    "session_type": null,
    "session_label": null,
    "activities": [],
    "session_notes": null,
    "perceived_effort": null
  },
  "daily_notes": "wasn't productive, didn't do anything much",
  "ambiguities": [
    "headache severity not stated",
    "stomach ache severity not stated",
    "'sore muscles' factor 'previous workout' is inferred from context, not explicitly stated by user",
    "sleep quality marked 'bad' as inferential — user didn't say sleep was bad explicitly but 5 hours + waking with symptoms suggests it"
  ],
  "raw_transcript": "I slept for around five hours last night and then I woke up with headache. I had some stomach ache as well and didn't do anything much really today. The mood was also bad. I had sore muscles, so I skipped gym. I wasn't productive at all today."
}
```

---

## How to test

1. Open https://claude.ai → start a new conversation
2. Paste the System prompt section (everything from "You are a structured-data extractor..." through the end of the severity rubric) as your first message, prefixed with: "You will act according to these instructions for the rest of this conversation:"
3. For each test, paste only the Input block. Diff the JSON output against the Expected output.
4. When output is wrong: edit the system prompt above, start a fresh chat with the updated version, re-run all 8 tests.
5. Iterate until 8/8 pass on a single fresh chat session.
6. Save the final working version of the system prompt back into this file (in lib/prompts/daily-checkin-extractor.ts as a TypeScript constant, like we did for the symptom and workout extractors after the Vercel bundling issue).

## Specific things to verify

- **Test 1**: workout populated as `did_workout: true` with empty activities (no exercises given). Headache linked to BOTH screen_time and coffee as factors.
- **Test 4**: skipped gym is `did_workout: false` with skip_reason populated. Migraine is severity 7 explicit.
- **Test 5**: protein correction handled — 100g stored, original 10g flagged. Rest day is `did_workout: false` with skip_reason "rest day".
- **Test 6**: knee pain severity inferred 7 from functional impact ("couldn't walk properly"). Workout marked false even though user didn't say "skipped gym" — "took rest" implies it.
- **Test 7**: session_type bumped to "mixed" because 10K steps adds a cardio activity. "Dead shoulder workout" — "dead" is filler/emphasis, not a category.
- **Test 8**: three distinct symptoms extracted. Sore muscles → factor "previous workout" inferred from context. Poor sleep linked as factor for symptoms.

## Done = ✅ when:
- All 8 tests produce valid JSON parsing the same structure as expected
- Null vs populated decisions match for every top-level block
- Test 4 and Test 8: skip_reason populated correctly when user explicitly skipped
- Test 5: protein correction handled (100g stored, not 10g)
- Test 6: did_workout false even without explicit "skipped" — "took rest" interpreted correctly
- Test 7: mixed session_type when lifting + cardio combined in one entry
- Hangovers (Test 3) populate both symptoms AND drinks with factor link
