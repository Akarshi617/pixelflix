const GEMINI_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent";

// BUG FIX: this was reading VITE_GEMINI_KEY, but the .env / Vercel variable
// is VITE_GEMINI_API_KEY — same mismatch pattern as the OMDb key, and the
// same reason Mood Matcher would silently fail before ever hitting the
// network.
const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

const MAX_RETRIES = 1;
const RETRY_DELAY_MS = 1500;

// Small in-memory cache so re-typing the same mood in one session doesn't
// spend another Gemini call on an answer we already have.
const moodCache = new Map();

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Gemini sometimes wraps the title in quotes or markdown bold even when
 * told not to ("**Inception**" / "\"Inception\""). Strip that so the
 * string that reaches OMDb's search is just the title.
 */
function sanitizeTitle(raw) {
  return raw
    .trim()
    .replace(/^["'*]+|["'*]+$/g, "") // leading/trailing quotes or asterisks
    .replace(/\n/g, " ")
    .trim();
}

async function callGemini(prompt) {
  const res = await fetch(`${GEMINI_URL}?key=${API_KEY}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
    }),
  });

  const data = await res.json().catch(() => null);

  if (res.status === 429) {
    const err = new Error("Too many requests right now — wait a bit and try again.");
    err.status = 429;
    throw err;
  }

  if (!res.ok) {
    // surface Google's own error message instead of guessing what went wrong
    throw new Error(data?.error?.message || `Gemini request failed: ${res.status}`);
  }

  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!text) {
    throw new Error("Gemini didn't return a usable answer. Try rephrasing your mood.");
  }

  return sanitizeTitle(text);
}

// Phase 3: "Mood Matcher" — takes a mood string, asks Gemini for a single
// movie title, and that title gets fed straight into our existing OMDb
// search (see handleMoodMatch in App.jsx). We tell Gemini to reply with
// nothing but the title so there's no sentence to parse out of the response.
export async function getMovieForMood(mood) {
  if (!API_KEY) {
    throw new Error(
      "Gemini API key missing. Add VITE_GEMINI_API_KEY to your .env file (see .env.example)."
    );
  }

  const normalizedMood = mood.trim().toLowerCase();
  if (moodCache.has(normalizedMood)) {
    return moodCache.get(normalizedMood);
  }

  const prompt = `Suggest one movie that matches this mood: "${mood}". Reply with ONLY the movie title, nothing else — no year, no quotes, no explanation.`;

  let lastError;
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const title = await callGemini(prompt);
      moodCache.set(normalizedMood, title);
      return title;
    } catch (err) {
      lastError = err;
      // Only worth retrying a rate-limit — anything else (bad key, bad
      // request) will fail again immediately.
      if (err.status === 429 && attempt < MAX_RETRIES) {
        await sleep(RETRY_DELAY_MS);
        continue;
      }
      throw err;
    }
  }

  throw lastError;
}
