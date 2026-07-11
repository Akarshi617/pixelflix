import { useEffect, useState } from "react";
import LandingPage from "./components/LandingPage";
import SearchBar from "./components/SearchBar";
import MoodMatcher from "./components/MoodMatcher";
import MovieGrid from "./components/MovieGrid";
import { getPopularMovies, searchMovies } from "./api/omdb";
import { getMovieForMood } from "./api/gemini";
import { useDebounce } from "./hooks/useDebounce";
import { useInfiniteScroll } from "./hooks/useInfiniteScroll";
import { useFavorites } from "./hooks/useFavorites";
import "./App.css";

export default function App() {
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebounce(query, 500); // Phase 2: debounce (500ms)

  const [viewMode, setViewMode] = useState("landing"); // "landing" | "browse" | "favorites"
  const [movies, setMovies] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [status, setStatus] = useState("loading"); // "loading" | "ready" | "error"
  const [errorMsg, setErrorMsg] = useState("");
  const [loadingMore, setLoadingMore] = useState(false);

  const { favorites, isFavorite, toggleFavorite } = useFavorites(); // Phase 2: favorites

  const [moodError, setMoodError] = useState(""); // Phase 3: mood matcher

  const isSearching = debouncedQuery.trim().length > 0;

  // Phase 3: Mood Matcher — ask Gemini for one title, then just drop it
  // into the normal search box. The existing debounce + search effect
  // below takes it from there like the user typed it themselves.
  async function handleMoodMatch(mood) {
    setMoodError("");
    try {
      const title = await getMovieForMood(mood);
      setQuery(title);
    } catch (err) {
      setMoodError(err.message);
    }
  }

  function fetchPage(pageNum) {
    return isSearching
      ? searchMovies(debouncedQuery.trim(), pageNum)
      : getPopularMovies(pageNum);
  }

  // Fresh load whenever the debounced query changes (or we're back on Browse)
  useEffect(() => {
    if (viewMode !== "browse") return;

    let ignore = false;
    setStatus("loading");
    setPage(1);

    fetchPage(1)
      .then(({ results, hasMore }) => {
        if (ignore) return;
        setMovies(results);
        setHasMore(hasMore);
        setStatus("ready");
      })
      .catch((err) => {
        if (ignore) return;
        setErrorMsg(err.message);
        setStatus("error");
      });

    return () => {
      ignore = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedQuery, viewMode]);

  // Phase 2: Infinite Scroll — fetch page N+1 and append when the sentinel
  // at the bottom of the grid scrolls into view
  async function loadMore() {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    const nextPage = page + 1;
    try {
      const { results, hasMore: more } = await fetchPage(nextPage);
      setMovies((prev) => [...prev, ...results]);
      setPage(nextPage);
      setHasMore(more);
    } catch {
      setHasMore(false); // stop trying if a page fails
    } finally {
      setLoadingMore(false);
    }
  }

  const sentinelRef = useInfiniteScroll(loadMore, {
    enabled: viewMode === "browse" && status === "ready" && hasMore && !loadingMore,
  });

  const visibleMovies = viewMode === "favorites" ? favorites : movies;

  if (viewMode === "landing") {
    return <LandingPage onEnter={() => setViewMode("browse")} />;
  }

  return (
    <div className="app-shell">
      <header className="app-header">
        <h1 className="marquee-title">
          Pixel<span>Flix</span>
        </h1>

        {viewMode === "browse" && (
          <SearchBar
            value={query}
            onChange={setQuery}
            onSubmit={() => {}}
          />
        )}
      </header>

      {viewMode === "browse" && (
        <div className="mood-section">
          <MoodMatcher onMatch={handleMoodMatch} />
          {moodError && <p className="mood-error">{moodError}</p>}
        </div>
      )}

      <nav className="view-tabs">
        <button
          type="button"
          className={viewMode === "browse" ? "tab active" : "tab"}
          onClick={() => setViewMode("browse")}
        >
          Browse
        </button>
        <button
          type="button"
          className={viewMode === "favorites" ? "tab active" : "tab"}
          onClick={() => setViewMode("favorites")}
        >
          ♥ My Favorites ({favorites.length})
        </button>
      </nav>

      <main>
        <div className="section-label">
          {viewMode === "favorites"
            ? "My Favorites"
            : isSearching
            ? `Results for "${debouncedQuery.trim()}"`
            : "Popular right now"}
        </div>

        {viewMode === "browse" && status === "loading" && (
          <div className="status-state">Loading titles…</div>
        )}

        {viewMode === "browse" && status === "error" && (
          <div className="status-state status-error">
            Something went wrong: {errorMsg}
          </div>
        )}

        {(viewMode === "favorites" || status === "ready") && (
          <>
            <MovieGrid
              movies={visibleMovies}
              isFavorite={isFavorite}
              onToggleFavorite={toggleFavorite}
            />

            {/* Sentinel element the IntersectionObserver watches */}
            {viewMode === "browse" && hasMore && (
              <div ref={sentinelRef} className="scroll-sentinel">
                {loadingMore && <span>Loading more…</span>}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
