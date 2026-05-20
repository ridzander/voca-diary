# Workout Extractor — v2

## Purpose
Turn a rambling voice transcript about a workout (lifting, cardio, or sport) into clean structured JSON.

**v2 changes from v1:** added `session_label` field. `session_type` is now a strict enum used by code/filters; `session_label` is a free-form human-readable name shown in the UI.

---

## System prompt (paste into Claude as the system message)

You are a structured-data extractor for a personal workout journal. Your job is to read a voice-transcribed entry from a user describing a workout and return ONLY valid JSON matching the schema below — no prose, no markdown, no explanation.

The user is logging what they did. Don't critique the workout, don't suggest changes, don't add encouragement. Only extract.

### Schema
```json
{
  "session_type": "'lifting' | 'cardio' | 'sport' | 'mixed' — strict enum, used by code for filtering and analysis",
  "session_label": "string — short human-readable name for this session, used in the UI",
  "activities": [
    {
      "type": "'lifting' | 'cardio' | 'sport'",
      "name": "string — canonical exercise/sport name e.g. 'dumbbell bench press', 'lat pulldown', 'football', 'badminton doubles'",
      "sets": [
        {
          "reps": "integer or null",
          "weight_kg": "number or null — always store in kg",
          "rpe": "integer 1-10 or null — only if user mentioned effort/RPE",
          "notes": "string or null — per-set notes e.g. 'last set hard', 'knee tweaky'"
        }
      ],
      "duration_minutes": "integer or null — for cardio/sport activities",
      "intensity_notes": "string or null — for cardio/sport e.g. 'forward position, exhaustive'",
      "notes": "string or null — exercise-level notes that don't fit per-set"
    }
  ],
  "session_notes": "string or null — overall how the session felt e.g. 'energy was low', 'felt strong'",
  "perceived_effort": "integer 1-10 or null — overall session RPE if user implied one",
  "post_session_symptoms": [
    {
      "name": "string — e.g. 'knee pain'",
      "location": "string or null"
    }
  ],
  "ambiguities": [
    "string — anything you weren't sure about"
  ],
  "raw_transcript": "string — original verbatim"
}
```

### Rules

1. Output ONLY the JSON object. No commentary.
2. **session_type** — strict enum. `lifting` if all activities are lifting, `cardio` if all cardio, `sport` if all sport, `mixed` if combining different types. Never anything else.
3. **session_label** — short human-readable name describing the session. Used as the title shown on the timeline. Lowercase. Don't add the word "workout" — the UI will add that itself.
   - For lifting: name the muscle groups, e.g. `"chest and triceps"`, `"legs and abs"`, `"shoulders"`, `"back and biceps"`.
   - For sport/cardio: use the activity name, e.g. `"football"`, `"pickleball doubles"`, `"table tennis"`.
   - For mixed: combine briefly, e.g. `"legs and walking"`.
   - For two distinct sport sessions in one entry: use a combined label, e.g. `"football and badminton"`.
4. **Empty sets array for sport/cardio** — `sets: []` is fine for sports; use `duration_minutes` and `intensity_notes` instead.
5. **One activity per exercise/sport** — 4 lifting exercises = 4 entries in `activities[]`. Football + badminton = 2 entries.
6. **Mid-sentence corrections** — when the user says "15 kgs, no, sorry, 10 kgs," store **10** (the correction). Add a note to `ambiguities`.
7. **Weight math** — when the user explains a calculation ("30 kgs each, so total was 70 kgs"), trust the user's stated total and store that. Add an entry to `ambiguities` describing the math.
8. **Always store weight in kg.** If the user says "lbs" or "pounds," convert: `kg = lbs * 0.4536`, round to 1 decimal. Note conversion in `ambiguities`.
9. **Canonical exercise names** — use lowercase, common names. "dumbbell bench press" not "DB Bench". "lat pulldown" not "lateral pull". If the user's term is ambiguous (e.g. "rowing"), use a generic name and flag in ambiguities.
10. **RPE detection** — capture if the user uses RPE numbers OR clear effort language ("last set was hard" → ~RPE 8-9, "very exhaustive" → ~RPE 8). When inferred, note in ambiguities.
11. **Post-session symptoms** — if the user mentions a body part hurting *because of* the session, put it in `post_session_symptoms`, NOT in set notes.
12. If the user says they bailed/skipped, capture what they actually did (could be empty `activities[]` with `session_notes` describing why).

### Pyramid set parsing
When the user lists sets like "first set 35 kgs, 12 reps. second set 37.5kgs, 10 reps. third set 40 kgs 6 reps", parse as separate set objects in order. Numeric values must be parsed as numbers, never strings.

### Bodyweight exercises
For exercises like crunches, leg raises, push-ups: `weight_kg: null` and add `"bodyweight"` to the activity's `notes` field.

### Rep ranges
If user says "15 to 20 reps," store the midpoint (e.g. 18) and flag in ambiguities.

---

## Test inputs and expected outputs

For each test below, the **Expected output** is the exact JSON Claude should return. When iterating, diff Claude's output against the expected JSON. Small differences in canonicalization (e.g. `"machine chest press"` vs `"chest press machine"`) are acceptable — what matters is structural correctness, correct numbers, correct `session_type` enum value, and ambiguities being flagged.

---

### Test 1 — clean lifting, multiple exercises with pyramid sets

**Input:**
```
Did chest and triceps today, started with dumbell chest press. 3 sets. first set 35 kgs, 12 reps. second set 37.5kgs, 10 reps. third set 40 kgs 6 reps. then did chest fly, 3 sets. first 50kgs 15 reps, 60 kgs 12 reps, 65 kgs 8 reps. then did machine chest press, 55 kgs 15 reps, 60 kgs 12 reps, 65 kgs 10 reps. then i did tricep push down, 3 sets, 30 kgs 15 reps, 35 kgs 12 reps, 40 kgs 10 reps. then i did tricep overhead cable extension, 3 sets, 20 kgs 15 reps, 25 kgs 12 reps, 25 kgs 9 reps.
```

**Expected output:**
```json
{
  "session_type": "lifting",
  "session_label": "chest and triceps",
  "activities": [
    {
      "type": "lifting",
      "name": "dumbbell chest press",
      "sets": [
        { "reps": 12, "weight_kg": 35, "rpe": null, "notes": null },
        { "reps": 10, "weight_kg": 37.5, "rpe": null, "notes": null },
        { "reps": 6, "weight_kg": 40, "rpe": null, "notes": null }
      ],
      "duration_minutes": null,
      "intensity_notes": null,
      "notes": null
    },
    {
      "type": "lifting",
      "name": "chest fly",
      "sets": [
        { "reps": 15, "weight_kg": 50, "rpe": null, "notes": null },
        { "reps": 12, "weight_kg": 60, "rpe": null, "notes": null },
        { "reps": 8, "weight_kg": 65, "rpe": null, "notes": null }
      ],
      "duration_minutes": null,
      "intensity_notes": null,
      "notes": null
    },
    {
      "type": "lifting",
      "name": "machine chest press",
      "sets": [
        { "reps": 15, "weight_kg": 55, "rpe": null, "notes": null },
        { "reps": 12, "weight_kg": 60, "rpe": null, "notes": null },
        { "reps": 10, "weight_kg": 65, "rpe": null, "notes": null }
      ],
      "duration_minutes": null,
      "intensity_notes": null,
      "notes": null
    },
    {
      "type": "lifting",
      "name": "tricep pushdown",
      "sets": [
        { "reps": 15, "weight_kg": 30, "rpe": null, "notes": null },
        { "reps": 12, "weight_kg": 35, "rpe": null, "notes": null },
        { "reps": 10, "weight_kg": 40, "rpe": null, "notes": null }
      ],
      "duration_minutes": null,
      "intensity_notes": null,
      "notes": null
    },
    {
      "type": "lifting",
      "name": "tricep overhead cable extension",
      "sets": [
        { "reps": 15, "weight_kg": 20, "rpe": null, "notes": null },
        { "reps": 12, "weight_kg": 25, "rpe": null, "notes": null },
        { "reps": 9, "weight_kg": 25, "rpe": null, "notes": null }
      ],
      "duration_minutes": null,
      "intensity_notes": null,
      "notes": null
    }
  ],
  "session_notes": null,
  "perceived_effort": null,
  "post_session_symptoms": [],
  "ambiguities": [
    "user said 'chest fly' — could be machine, dumbbell, or cable; stored generically"
  ],
  "raw_transcript": "Did chest and triceps today, started with dumbell chest press. 3 sets. first set 35 kgs, 12 reps. second set 37.5kgs, 10 reps. third set 40 kgs 6 reps. then did chest fly, 3 sets. first 50kgs 15 reps, 60 kgs 12 reps, 65 kgs 8 reps. then did machine chest press, 55 kgs 15 reps, 60 kgs 12 reps, 65 kgs 10 reps. then i did tricep push down, 3 sets, 30 kgs 15 reps, 35 kgs 12 reps, 40 kgs 10 reps. then i did tricep overhead cable extension, 3 sets, 20 kgs 15 reps, 25 kgs 12 reps, 25 kgs 9 reps."
}
```

---

### Test 2 — back/biceps with abs at end (low-detail abs, ambiguous exercise names)

**Input:**
```
I did back and biceps workout today. The first exercise was lateral pull, 3 sets, 50 kgs, 15 reps, 55 kgs, 12 reps, 60 kgs, 10 reps. Then the next exercise was rowing, 40 kgs, 15 reps, 45 kgs, 12 reps, and 50 kgs, 10 reps. Then the next exercise was bicep curls. I did 10 kgs, 15 reps, then 12.5 kgs, 12 reps, and 15 kgs, 8 reps.Next, hammer curls, 15 kg, 10 reps, 15 kg, 10 reps, 15 kg, 10 reps. Then I did some abs workout. I had the crunches and leg raise, 15 to 20 reps each.
```

**Expected output:**
```json
{
  "session_type": "lifting",
  "session_label": "back and biceps",
  "activities": [
    {
      "type": "lifting",
      "name": "lat pulldown",
      "sets": [
        { "reps": 15, "weight_kg": 50, "rpe": null, "notes": null },
        { "reps": 12, "weight_kg": 55, "rpe": null, "notes": null },
        { "reps": 10, "weight_kg": 60, "rpe": null, "notes": null }
      ],
      "duration_minutes": null,
      "intensity_notes": null,
      "notes": null
    },
    {
      "type": "lifting",
      "name": "row",
      "sets": [
        { "reps": 15, "weight_kg": 40, "rpe": null, "notes": null },
        { "reps": 12, "weight_kg": 45, "rpe": null, "notes": null },
        { "reps": 10, "weight_kg": 50, "rpe": null, "notes": null }
      ],
      "duration_minutes": null,
      "intensity_notes": null,
      "notes": null
    },
    {
      "type": "lifting",
      "name": "bicep curl",
      "sets": [
        { "reps": 15, "weight_kg": 10, "rpe": null, "notes": null },
        { "reps": 12, "weight_kg": 12.5, "rpe": null, "notes": null },
        { "reps": 8, "weight_kg": 15, "rpe": null, "notes": null }
      ],
      "duration_minutes": null,
      "intensity_notes": null,
      "notes": null
    },
    {
      "type": "lifting",
      "name": "hammer curl",
      "sets": [
        { "reps": 10, "weight_kg": 15, "rpe": null, "notes": null },
        { "reps": 10, "weight_kg": 15, "rpe": null, "notes": null },
        { "reps": 10, "weight_kg": 15, "rpe": null, "notes": null }
      ],
      "duration_minutes": null,
      "intensity_notes": null,
      "notes": null
    },
    {
      "type": "lifting",
      "name": "crunch",
      "sets": [
        { "reps": 18, "weight_kg": null, "rpe": null, "notes": null }
      ],
      "duration_minutes": null,
      "intensity_notes": null,
      "notes": "bodyweight"
    },
    {
      "type": "lifting",
      "name": "leg raise",
      "sets": [
        { "reps": 18, "weight_kg": null, "rpe": null, "notes": null }
      ],
      "duration_minutes": null,
      "intensity_notes": null,
      "notes": "bodyweight"
    }
  ],
  "session_notes": null,
  "perceived_effort": null,
  "post_session_symptoms": [],
  "ambiguities": [
    "user said 'lateral pull' — interpreted as 'lat pulldown'",
    "user said 'rowing' — could be barbell row, cable row, or machine row; stored as generic 'row'",
    "user did not state how many sets of crunches and leg raise — stored as 1 set each",
    "abs reps stored as midpoint of stated 15-20 range (18)"
  ],
  "raw_transcript": "I did back and biceps workout today. The first exercise was lateral pull, 3 sets, 50 kgs, 15 reps, 55 kgs, 12 reps, 60 kgs, 10 reps. Then the next exercise was rowing, 40 kgs, 15 reps, 45 kgs, 12 reps, and 50 kgs, 10 reps. Then the next exercise was bicep curls. I did 10 kgs, 15 reps, then 12.5 kgs, 12 reps, and 15 kgs, 8 reps.Next, hammer curls, 15 kg, 10 reps, 15 kg, 10 reps, 15 kg, 10 reps. Then I did some abs workout. I had the crunches and leg raise, 15 to 20 reps each."
}
```

---

### Test 3 — mid-sentence correction

**Input:**
```
I had a shoulder workout today. First exercise was shoulder press with dumbbells. I did 25 kgs, 15 reps, 27.5 kgs, 12 reps, and 30 kgs, 10 reps. Then I did lateral raises, 15 kgs, no, sorry, 10 kgs, 15 reps, 12.5 kgs, 12 reps, and 15 kgs, 8 reps. Next I did was reverse fly, 45 kgs, 15 reps, 55 kgs, 14 reps, and then 60 kgs, 12 reps. Next was front raise. I did 15 kgs, 15 reps, 20 kgs, 12 reps, and then 25 kgs, 6 reps. Next was shrugs 60 kgs 10 reps 3 sets same weight.
```

**Expected output:**
```json
{
  "session_type": "lifting",
  "session_label": "shoulders",
  "activities": [
    {
      "type": "lifting",
      "name": "dumbbell shoulder press",
      "sets": [
        { "reps": 15, "weight_kg": 25, "rpe": null, "notes": null },
        { "reps": 12, "weight_kg": 27.5, "rpe": null, "notes": null },
        { "reps": 10, "weight_kg": 30, "rpe": null, "notes": null }
      ],
      "duration_minutes": null,
      "intensity_notes": null,
      "notes": null
    },
    {
      "type": "lifting",
      "name": "lateral raise",
      "sets": [
        { "reps": 15, "weight_kg": 10, "rpe": null, "notes": null },
        { "reps": 12, "weight_kg": 12.5, "rpe": null, "notes": null },
        { "reps": 8, "weight_kg": 15, "rpe": null, "notes": null }
      ],
      "duration_minutes": null,
      "intensity_notes": null,
      "notes": null
    },
    {
      "type": "lifting",
      "name": "reverse fly",
      "sets": [
        { "reps": 15, "weight_kg": 45, "rpe": null, "notes": null },
        { "reps": 14, "weight_kg": 55, "rpe": null, "notes": null },
        { "reps": 12, "weight_kg": 60, "rpe": null, "notes": null }
      ],
      "duration_minutes": null,
      "intensity_notes": null,
      "notes": null
    },
    {
      "type": "lifting",
      "name": "front raise",
      "sets": [
        { "reps": 15, "weight_kg": 15, "rpe": null, "notes": null },
        { "reps": 12, "weight_kg": 20, "rpe": null, "notes": null },
        { "reps": 6, "weight_kg": 25, "rpe": null, "notes": null }
      ],
      "duration_minutes": null,
      "intensity_notes": null,
      "notes": null
    },
    {
      "type": "lifting",
      "name": "shrug",
      "sets": [
        { "reps": 10, "weight_kg": 60, "rpe": null, "notes": null },
        { "reps": 10, "weight_kg": 60, "rpe": null, "notes": null },
        { "reps": 10, "weight_kg": 60, "rpe": null, "notes": null }
      ],
      "duration_minutes": null,
      "intensity_notes": null,
      "notes": null
    }
  ],
  "session_notes": null,
  "perceived_effort": null,
  "post_session_symptoms": [],
  "ambiguities": [
    "user corrected lateral raise set 1 mid-sentence: said 15kg then corrected to 10kg; stored 10kg",
    "reverse fly weights (45-60kg) are unusually high — likely a machine; stored as stated, user should verify"
  ],
  "raw_transcript": "I had a shoulder workout today. First exercise was shoulder press with dumbbells. I did 25 kgs, 15 reps, 27.5 kgs, 12 reps, and 30 kgs, 10 reps. Then I did lateral raises, 15 kgs, no, sorry, 10 kgs, 15 reps, 12.5 kgs, 12 reps, and 15 kgs, 8 reps. Next I did was reverse fly, 45 kgs, 15 reps, 55 kgs, 14 reps, and then 60 kgs, 12 reps. Next was front raise. I did 15 kgs, 15 reps, 20 kgs, 12 reps, and then 25 kgs, 6 reps. Next was shrugs 60 kgs 10 reps 3 sets same weight."
}
```

---

### Test 4 — weight math + mixed session (lifting + cardio)

**Input:**
```
I had a leg workout today. I did weighted squats, 30 kgs each, so total was 70 kgs, 15 reps, then 90 kgs, 12 reps, and then 100 kgs, 10 reps. Then I did leg extension, 40 kgs, 15 reps, 45 kgs, 12 reps, 50 kgs, 10 reps. Then I did leg curls, 50 kgs, 15 reps, 55 kgs, 12 reps, and 60 kgs, 10 reps. Then I did calf raises, 50 kgs, 15 reps, 60 kgs, 12 reps, and 70 kgs, 10 reps. Then I did some abs workout. I did leg raises, 20 reps of three sets, and some light walking for 10 minutes.
```

**Expected output:**
```json
{
  "session_type": "mixed",
  "session_label": "legs and walking",
  "activities": [
    {
      "type": "lifting",
      "name": "squat",
      "sets": [
        { "reps": 15, "weight_kg": 70, "rpe": null, "notes": null },
        { "reps": 12, "weight_kg": 90, "rpe": null, "notes": null },
        { "reps": 10, "weight_kg": 100, "rpe": null, "notes": null }
      ],
      "duration_minutes": null,
      "intensity_notes": null,
      "notes": null
    },
    {
      "type": "lifting",
      "name": "leg extension",
      "sets": [
        { "reps": 15, "weight_kg": 40, "rpe": null, "notes": null },
        { "reps": 12, "weight_kg": 45, "rpe": null, "notes": null },
        { "reps": 10, "weight_kg": 50, "rpe": null, "notes": null }
      ],
      "duration_minutes": null,
      "intensity_notes": null,
      "notes": null
    },
    {
      "type": "lifting",
      "name": "leg curl",
      "sets": [
        { "reps": 15, "weight_kg": 50, "rpe": null, "notes": null },
        { "reps": 12, "weight_kg": 55, "rpe": null, "notes": null },
        { "reps": 10, "weight_kg": 60, "rpe": null, "notes": null }
      ],
      "duration_minutes": null,
      "intensity_notes": null,
      "notes": null
    },
    {
      "type": "lifting",
      "name": "calf raise",
      "sets": [
        { "reps": 15, "weight_kg": 50, "rpe": null, "notes": null },
        { "reps": 12, "weight_kg": 60, "rpe": null, "notes": null },
        { "reps": 10, "weight_kg": 70, "rpe": null, "notes": null }
      ],
      "duration_minutes": null,
      "intensity_notes": null,
      "notes": null
    },
    {
      "type": "lifting",
      "name": "leg raise",
      "sets": [
        { "reps": 20, "weight_kg": null, "rpe": null, "notes": null },
        { "reps": 20, "weight_kg": null, "rpe": null, "notes": null },
        { "reps": 20, "weight_kg": null, "rpe": null, "notes": null }
      ],
      "duration_minutes": null,
      "intensity_notes": null,
      "notes": "bodyweight"
    },
    {
      "type": "cardio",
      "name": "walking",
      "sets": [],
      "duration_minutes": 10,
      "intensity_notes": "light",
      "notes": null
    }
  ],
  "session_notes": null,
  "perceived_effort": null,
  "post_session_symptoms": [],
  "ambiguities": [
    "squat set 1 — user explained '30kg each, total 70kg'; stored stated total of 70kg (user likely meant 30kg per side + bar); user should verify"
  ],
  "raw_transcript": "I had a leg workout today. I did weighted squats, 30 kgs each, so total was 70 kgs, 15 reps, then 90 kgs, 12 reps, and then 100 kgs, 10 reps. Then I did leg extension, 40 kgs, 15 reps, 45 kgs, 12 reps, 50 kgs, 10 reps. Then I did leg curls, 50 kgs, 15 reps, 55 kgs, 12 reps, and 60 kgs, 10 reps. Then I did calf raises, 50 kgs, 15 reps, 60 kgs, 12 reps, and 70 kgs, 10 reps. Then I did some abs workout. I did leg raises, 20 reps of three sets, and some light walking for 10 minutes."
}
```

---

### Test 5 — sport with post-session symptom

**Input:**
```
I played football for 60 minutes today. I was playing a forward, so it was very exhaustive. I have some knee pain after that.
```

**Expected output:**
```json
{
  "session_type": "sport",
  "session_label": "football",
  "activities": [
    {
      "type": "sport",
      "name": "football",
      "sets": [],
      "duration_minutes": 60,
      "intensity_notes": "forward position, exhaustive",
      "notes": null
    }
  ],
  "session_notes": null,
  "perceived_effort": 8,
  "post_session_symptoms": [
    { "name": "knee pain", "location": null }
  ],
  "ambiguities": [
    "perceived_effort inferred as 8 from 'very exhaustive'",
    "knee pain location (left/right) not stated"
  ],
  "raw_transcript": "I played football for 60 minutes today. I was playing a forward, so it was very exhaustive. I have some knee pain after that."
}
```

---

### Test 6 — TWO sports in one entry

**Input:**
```
I played football for 60 minutes today. I was playing a forward, so it was very exhaustive. I have some knee pain after that.Played badminton doubles for 80 minutes today.
```

**Expected output:**
```json
{
  "session_type": "sport",
  "session_label": "football and badminton",
  "activities": [
    {
      "type": "sport",
      "name": "football",
      "sets": [],
      "duration_minutes": 60,
      "intensity_notes": "forward position, exhaustive",
      "notes": null
    },
    {
      "type": "sport",
      "name": "badminton doubles",
      "sets": [],
      "duration_minutes": 80,
      "intensity_notes": null,
      "notes": null
    }
  ],
  "session_notes": null,
  "perceived_effort": 8,
  "post_session_symptoms": [
    { "name": "knee pain", "location": null }
  ],
  "ambiguities": [
    "perceived_effort inferred as 8 from 'very exhaustive' (refers to football)",
    "knee pain location (left/right) not stated; appears to follow football, not badminton",
    "user logged two separate sport sessions in one entry — captured as two activities"
  ],
  "raw_transcript": "I played football for 60 minutes today. I was playing a forward, so it was very exhaustive. I have some knee pain after that.Played badminton doubles for 80 minutes today."
}
```

---

### Test 7 — short sport entry (pickleball)

**Input:**
```
Played pickleball doubles for 60 minutes today.
```

**Expected output:**
```json
{
  "session_type": "sport",
  "session_label": "pickleball doubles",
  "activities": [
    {
      "type": "sport",
      "name": "pickleball doubles",
      "sets": [],
      "duration_minutes": 60,
      "intensity_notes": null,
      "notes": null
    }
  ],
  "session_notes": null,
  "perceived_effort": null,
  "post_session_symptoms": [],
  "ambiguities": [],
  "raw_transcript": "Played pickleball doubles for 60 minutes today."
}
```

---

### Test 8 — short sport entry (table tennis)

**Input:**
```
Played table tennis singles for 60 minutes today.
```

**Expected output:**
```json
{
  "session_type": "sport",
  "session_label": "table tennis singles",
  "activities": [
    {
      "type": "sport",
      "name": "table tennis singles",
      "sets": [],
      "duration_minutes": 60,
      "intensity_notes": null,
      "notes": null
    }
  ],
  "session_notes": null,
  "perceived_effort": null,
  "post_session_symptoms": [],
  "ambiguities": [],
  "raw_transcript": "Played table tennis singles for 60 minutes today."
}
```

---

## How to test

1. Open https://claude.ai
2. Start a new conversation. Paste the **System prompt** section (everything from "You are a structured-data extractor..." down to the end of "Rep ranges") as your first message, prefixed with: *"You will act according to these instructions for the rest of this conversation:"*
3. For each test, paste only the **Input** block. Diff Claude's JSON output against the **Expected output**.
4. When output is wrong: don't argue with Claude in chat. Edit the system prompt above, start a fresh chat with the updated version, re-run all tests.
5. **Acceptable variation**: minor canonicalization differences in exercise names, slightly different RPE inferences (7 vs 8), or extra/different ambiguity strings, slightly different `session_label` wording (e.g. "chest and tris" vs "chest and triceps").
6. **Not acceptable**: wrong `session_type` enum value, wrong numbers, wrong number of sets, missing post-session symptoms, the lateral-raise correction (Test 3) storing 15 instead of 10, the squat weights (Test 4) storing 30 instead of 70.
7. Iterate until all 8 tests pass on a single fresh chat session.
8. Save the final working version of the system prompt back into this file.

## Done = ✅ when:
- All 8 tests produce valid JSON parsing the same structure as expected
- `session_type` is always one of the four enum values: `lifting`, `cardio`, `sport`, `mixed`
- `session_label` is a sensible human-readable name
- Test 3 lateral raise set 1 = `weight_kg: 10` (not 15)
- Test 4 squat set 1 = `weight_kg: 70` (not 30), with ambiguity flagged
- Test 4 session_type = `"mixed"` (not "lifting")
- Test 6 produces TWO activities, not one merged
- Tests 5 and 6 correctly populate `post_session_symptoms`
