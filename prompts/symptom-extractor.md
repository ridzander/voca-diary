# Symptom Extractor — v2

## Purpose
Turn a rambling voice transcript about how the user feels physically/mentally into clean structured JSON.

**v2 changes from v1:** every test case now has a full JSON expected output (was prose), matching the workout extractor format for consistency.

---

## System prompt (paste into Claude as the system message)

You are a structured-data extractor for a personal symptom journal. Your job is to read a voice-transcribed entry from a user describing how they feel, and return ONLY valid JSON matching the schema below — no prose, no markdown, no explanation.

The user is journaling, not asking for medical advice. Never diagnose, never recommend treatment, never editorialize. Only extract what the user said.

### Schema
```json
{
  "symptoms": [
    {
      "name": "string — short canonical name e.g. 'headache', 'knee pain', 'bloating', 'fatigue', 'itchy eyes'",
      "location": "string or null — body area if relevant e.g. 'right knee', 'lower back', 'both feet'",
      "severity": "integer 1-10 or null — explicit if user states it (e.g. '6/10'), otherwise inferred from intensity language using the rubric below",
      "severity_source": "'explicit' | 'inferred' | 'unknown' — how severity was determined",
      "quality": "string or null — descriptive words the user used e.g. 'sore', 'sharp', 'dull', 'itchy', 'heavy'"
    }
  ],
  "factors": [
    {
      "name": "string — what the user mentioned as a possible cause/context e.g. 'screen time', 'junk food', 'poor sleep', 'leg workout', 'house work', 'football'",
      "category": "'sleep' | 'food' | 'activity' | 'work' | 'stress' | 'medication' | 'weather' | 'screen_time' | 'social' | 'other'",
      "time_offset_days": "integer — 0 if today/same-day, -1 if yesterday, -2 if day before yesterday, etc. Default to 0 if user is vague.",
      "detail": "string or null — extra context e.g. '10+ hours', 'forward position', 'lunch'"
    }
  ],
  "mood": "string or null — only if user mentioned it e.g. 'tired', 'low energy', 'stressed', 'sad'",
  "notes": "string or null — anything else the user said that doesn't fit above; keep brief",
  "ambiguities": [
    "string — list anything you weren't sure about, e.g. 'severity not stated explicitly', 'unclear if knee pain is in left or right leg', 'mentioned headache and head feels heavy — kept as separate symptoms'"
  ],
  "raw_transcript": "string — copy the original transcript verbatim"
}
```

### Severity inference rubric (use only when user doesn't state a number)
- 1–2: barely noticeable, "a little", "slight"
- 3–4: noticeable but not bothersome, "a bit", "kinda"
- 5–6: clearly there, "noticeable", "uncomfortable"
- 7–8: bad, "very", "really", "bad", "intense"
- 9–10: severe, "unbearable", "worst", "couldn't function"

If the user gives no severity signal at all, set `severity: null` and `severity_source: "unknown"`.

### Rules
1. Output ONLY the JSON object. No commentary before or after.
2. If the user mentions multiple distinct symptoms, list them as separate items in `symptoms[]`.
3. If two phrases likely describe the same thing (e.g. "head feels heavy" + "I'm very tired"), use judgment: if they're clearly the same symptom, merge; if distinct, keep separate. Note the decision in `ambiguities` if borderline.
4. Time offset for factors: parse "yesterday" as -1, "day before yesterday" as -2, "last week" as -7, "this morning" / "today" / unstated as 0. If the user says "for the past few days," use -1 and add detail "ongoing few days".
5. Don't invent factors or symptoms the user didn't mention.
6. Use lowercase canonical names for `symptoms[].name` and `factors[].name`.
7. If the entry is empty, garbled, or unrelated to symptoms, return: `{ "symptoms": [], "factors": [], "mood": null, "notes": null, "ambiguities": ["entry did not contain symptom information"], "raw_transcript": "..." }`

---

## Test inputs and expected outputs

For each test below, the **Expected output** is the exact JSON Claude should return. When iterating, diff Claude's output against the expected JSON. Small differences in canonicalization (e.g. `"foot pain"` vs `"feet pain"`) are acceptable — what matters is structural correctness, correct severity values, correct time offsets, and ambiguities being flagged.

---

### Test 1 — explicit severity, clear factor

**Input:**
```
Having a headache a 6/10. Had a lot of screen time.
```

**Expected output:**
```json
{
  "symptoms": [
    {
      "name": "headache",
      "location": null,
      "severity": 6,
      "severity_source": "explicit",
      "quality": null
    }
  ],
  "factors": [
    {
      "name": "screen time",
      "category": "screen_time",
      "time_offset_days": 0,
      "detail": "a lot"
    }
  ],
  "mood": null,
  "notes": null,
  "ambiguities": [],
  "raw_transcript": "Having a headache a 6/10. Had a lot of screen time."
}
```

---

### Test 2 — location matters, time-lagged factor, user misspoke

**Input:**
```
having knee pain in the right foot. played football last evening.
```

**Expected output:**
```json
{
  "symptoms": [
    {
      "name": "knee pain",
      "location": "right knee",
      "severity": null,
      "severity_source": "unknown",
      "quality": null
    }
  ],
  "factors": [
    {
      "name": "football",
      "category": "activity",
      "time_offset_days": -1,
      "detail": null
    }
  ],
  "mood": null,
  "notes": null,
  "ambiguities": [
    "user said 'knee pain in the right foot' — interpreted as right knee (likely misspoke)",
    "severity not stated"
  ],
  "raw_transcript": "having knee pain in the right foot. played football last evening."
}
```

---

### Test 3 — DOMS pattern, time-lagged factor, inferred severity

**Input:**
```
hamstrings are very sore. hurting to sit or stand up. did legs day before yesterday.
```

**Expected output:**
```json
{
  "symptoms": [
    {
      "name": "hamstring soreness",
      "location": "hamstrings",
      "severity": 7,
      "severity_source": "inferred",
      "quality": "sore"
    }
  ],
  "factors": [
    {
      "name": "leg workout",
      "category": "activity",
      "time_offset_days": -2,
      "detail": null
    }
  ],
  "mood": null,
  "notes": "hurting to sit or stand up",
  "ambiguities": [
    "severity inferred as 7 from 'very sore' plus functional impact (difficulty sitting/standing)"
  ],
  "raw_transcript": "hamstrings are very sore. hurting to sit or stand up. did legs day before yesterday."
}
```

---

### Test 4 — vague mood + tiredness, borderline merge

**Input:**
```
head feels heavy. I'm very tired. had a long day.
```

**Expected output:**
```json
{
  "symptoms": [
    {
      "name": "heavy head",
      "location": "head",
      "severity": null,
      "severity_source": "unknown",
      "quality": "heavy"
    },
    {
      "name": "fatigue",
      "location": null,
      "severity": 7,
      "severity_source": "inferred",
      "quality": null
    }
  ],
  "factors": [
    {
      "name": "long day",
      "category": "work",
      "time_offset_days": 0,
      "detail": null
    }
  ],
  "mood": "tired",
  "notes": null,
  "ambiguities": [
    "kept 'heavy head' and 'fatigue' as separate symptoms — they may describe the same underlying state",
    "fatigue severity inferred as 7 from 'very tired'",
    "'long day' categorized as work — could also be 'other' if not work-related"
  ],
  "raw_transcript": "head feels heavy. I'm very tired. had a long day."
}
```

---

### Test 5 — clear factor, food, recurring symptom

**Input:**
```
Feeling bloated again. had junk food in lunch.
```

**Expected output:**
```json
{
  "symptoms": [
    {
      "name": "bloating",
      "location": null,
      "severity": null,
      "severity_source": "unknown",
      "quality": null
    }
  ],
  "factors": [
    {
      "name": "junk food",
      "category": "food",
      "time_offset_days": 0,
      "detail": "lunch"
    }
  ],
  "mood": null,
  "notes": null,
  "ambiguities": [
    "user said 'again' — symptom appears recurring; the patterns engine will detect this over time"
  ],
  "raw_transcript": "Feeling bloated again. had junk food in lunch."
}
```

---

### Test 6 — bad severity language, ambiguous location

**Input:**
```
my feet hurt bad. had alot of house work.
```

**Expected output:**
```json
{
  "symptoms": [
    {
      "name": "foot pain",
      "location": "both feet",
      "severity": 7,
      "severity_source": "inferred",
      "quality": null
    }
  ],
  "factors": [
    {
      "name": "house work",
      "category": "activity",
      "time_offset_days": 0,
      "detail": "a lot"
    }
  ],
  "mood": null,
  "notes": null,
  "ambiguities": [
    "severity inferred as 7 from 'hurt bad'",
    "user said 'feet' (plural) — assumed both feet; could be one foot"
  ],
  "raw_transcript": "my feet hurt bad. had alot of house work."
}
```

---

### Test 7 — fatigue with implied poor sleep schedule

**Input:**
```
i feel like i dont have any energy left even though i just woke up 2 hrs ago at 12PM.
```

**Expected output:**
```json
{
  "symptoms": [
    {
      "name": "fatigue",
      "location": null,
      "severity": null,
      "severity_source": "unknown",
      "quality": "low energy"
    }
  ],
  "factors": [
    {
      "name": "late wake time",
      "category": "sleep",
      "time_offset_days": 0,
      "detail": "woke at 12PM, 2hrs awake"
    }
  ],
  "mood": "low energy",
  "notes": null,
  "ambiguities": [
    "user did not explicitly state poor sleep — categorized late 12PM wake as a sleep factor based on context",
    "severity not stated; user's framing ('don't have any energy left') suggests significant but not extreme"
  ],
  "raw_transcript": "i feel like i dont have any energy left even though i just woke up 2 hrs ago at 12PM."
}
```

---

### Test 8 — ongoing/multi-day factor, two related eye symptoms

**Input:**
```
My eyes are very itchy and watering alot. had 10hrs plus screentime for past few days because of work.
```

**Expected output:**
```json
{
  "symptoms": [
    {
      "name": "itchy eyes",
      "location": "eyes",
      "severity": 7,
      "severity_source": "inferred",
      "quality": "itchy"
    },
    {
      "name": "watery eyes",
      "location": "eyes",
      "severity": 7,
      "severity_source": "inferred",
      "quality": "watering"
    }
  ],
  "factors": [
    {
      "name": "screen time",
      "category": "screen_time",
      "time_offset_days": -1,
      "detail": "10+ hrs/day for past few days, work-related"
    }
  ],
  "mood": null,
  "notes": null,
  "ambiguities": [
    "kept 'itchy eyes' and 'watery eyes' as separate symptoms — could merge into 'eye irritation'",
    "severity inferred as 7 from 'very' + 'a lot'",
    "'past few days' encoded as time_offset_days = -1 with detail noting the duration"
  ],
  "raw_transcript": "My eyes are very itchy and watering alot. had 10hrs plus screentime for past few days because of work."
}
```

---

## How to test

1. Open https://claude.ai
2. Start a new conversation. Paste the **System prompt** section (everything from "You are a structured-data extractor..." through the end of "Rules") as your first message, prefixed with: *"You will act according to these instructions for the rest of this conversation:"*
3. For each test, paste only the **Input** block. Diff Claude's JSON output against the **Expected output**.
4. When output is wrong: don't argue with Claude in chat. Edit the system prompt above, start a fresh chat with the updated version, re-run all tests.
5. **Acceptable variation**: minor canonicalization differences in symptom names, slight severity inference differences (6 vs 7), extra/different ambiguity strings, choice to merge vs split borderline symptoms (just flag the choice in ambiguities).
6. **Not acceptable**: invalid `severity_source` values, wrong `time_offset_days` for clear cases (yesterday should always be -1), invented symptoms or factors not mentioned by the user, missing the "right knee" interpretation in Test 2, missing ambiguity flag when severity was inferred not explicit.
7. Iterate until all 8 tests pass on a single fresh chat session.
8. Save the final working version of the system prompt back into this file.

## Done = ✅ when:
- All 8 tests produce valid JSON parsing the same structure as expected
- `severity_source` is always one of the three enum values: `explicit`, `inferred`, `unknown`
- Time offsets are correct: Test 2 = -1 (last evening), Test 3 = -2 (day before yesterday), Test 8 = -1 (past few days)
- Test 2 stores location as "right knee" not "right foot", with ambiguity flagged
- When severity is inferred (not stated), `severity_source: "inferred"` AND an ambiguity entry notes it
- When location is uncertain (Test 6), it's flagged in ambiguities
