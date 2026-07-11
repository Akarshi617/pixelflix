const GEMINI_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent";
const API_KEY = import.meta.env.VITE_GEMINI_KEY;

// Phase 3: "Mood Matcher" — takes a mood string, asks Gemini for a single
// movie title, and that title gets fed straight into our existing OMDb
// search (see handleMoodMatch in App.jsx). We tell Gemini to reply with
// nothing but the title so there's no sentence to parse out of the response.
export async function getMovieForMood(mood) {
  if (!API_KEY) {
    throw new Error(
      "Gemini API key missing. Add VITE_GEMINI_KEY to your .env file."
    );
  }

  const prompt = `Suggest one movie that matches this mood: "${mood}". Reply with ONLY the movie title, nothing else — no year, no quotes, no explanation.`;

  const res = await fetch(`${GEMINI_URL}?key=${API_KEY}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
    }),
  });

  const data = await res.json().catch(() => null);

  if (res.status === 429) {
    throw new Error("Too many requests right now — wait a bit and try again.");
  }

  if (!res.ok) {
    // surface Google's own error message instead of guessing what went wrong
    throw new Error(data?.error?.message || `Gemini request failed: ${res.status}`);
  }

  const title = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();

  if (!title) {
    throw new Error("Gemini didn't return a title");
  }

  // sometimes Gemini wraps the title in quotes anyway — strip them off
  return title.replace(/^["']|["']$/g, "");
}
