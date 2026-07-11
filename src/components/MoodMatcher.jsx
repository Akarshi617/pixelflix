import { useState } from "react";

export default function MoodMatcher({ onMatch }) {
  const [mood, setMood] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!mood.trim() || loading) return;

    setLoading(true);
    await onMatch(mood.trim());
    setLoading(false);
    setMood("");
  }

  return (
    <form className="mood-matcher" onSubmit={handleSubmit}>
      <span className="mood-icon">🎬</span>
      <input
        type="text"
        placeholder="In the mood for something specific? Try 'rainy Sunday, need a good cry'"
        value={mood}
        onChange={(e) => setMood(e.target.value)}
      />
      <button type="submit" disabled={loading}>
        {loading ? "Matching…" : "Match"}
      </button>
    </form>
  );
}
