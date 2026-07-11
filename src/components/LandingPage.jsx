import { useEffect, useRef, useState } from "react";
import { getPopularMovies } from "../api/omdb";
import { useAuth } from "../hooks/useAuth";
import { translations } from "../i18n";
import AuthModal from "./AuthModal";

export default function LandingPage({ onEnter }) {
  const [movies, setMovies] = useState([]);
  const [lang, setLang] = useState(() => localStorage.getItem("pixelflix:lang") || "en");
  const [authMode, setAuthMode] = useState(null); // null | "login" | "signup"

  const { user, logOut } = useAuth();
  const t = translations[lang];
  const trendingRowRef = useRef(null);

  function scrollTrending(direction) {
    const node = trendingRowRef.current;
    if (!node) return;
    // scroll by one full "page" (all visible cards) so snap always lands cleanly
    node.scrollBy({ left: direction * node.clientWidth, behavior: "smooth" });
  }

  // reuse the same "popular" fetch the Browse tab uses — for the backdrop
  // collage and the trending row below
  useEffect(() => {
    getPopularMovies(1)
      .then(({ results }) => setMovies(results))
      .catch(() => {
        // hero still works with a plain background if this fails
      });
  }, []);

  useEffect(() => {
    localStorage.setItem("pixelflix:lang", lang);
  }, [lang]);

  const posters = movies.map((m) => m.poster).filter(Boolean);
  // repeat the posters a few times so the backdrop grid has enough tiles
  const backdropTiles = posters.length > 0 ? Array(4).fill(posters).flat() : [];

  return (
    <div className="landing">
      <div className="landing-backdrop">
        {backdropTiles.map((src, i) => (
          <img key={i} src={src} alt="" />
        ))}
      </div>
      <div className="landing-overlay" />

      <header className="landing-header">
        <span className="landing-logo">
          Pixel<span>Flix</span>
        </span>

        <div className="landing-header-actions">
          <select
            className="lang-select"
            value={lang}
            onChange={(e) => setLang(e.target.value)}
            aria-label="Language"
          >
            <option value="en">English</option>
            <option value="hi">हिंदी</option>
          </select>

          {user ? (
            <button type="button" className="landing-auth-btn" onClick={logOut}>
              {t.logOut}
            </button>
          ) : (
            <>
              <button
                type="button"
                className="landing-auth-btn ghost"
                onClick={() => setAuthMode("login")}
              >
                {t.signIn}
              </button>
              <button
                type="button"
                className="landing-auth-btn"
                onClick={() => setAuthMode("signup")}
              >
                {t.signUp}
              </button>
            </>
          )}
        </div>
      </header>

      <div className="landing-content">
        <h1>{t.heroTitle}</h1>
        <p>{t.heroSubtitle}</p>
        <button type="button" onClick={onEnter}>
          {t.browseNow}
        </button>
      </div>

      {movies.length > 0 && (
        <div className="trending-section">
          <h2>{t.trendingNow}</h2>
          <div className="trending-wrap">
            <button
              type="button"
              className="trending-arrow left"
              onClick={() => scrollTrending(-1)}
              aria-label="Scroll left"
            >
              ‹
            </button>

            <div className="trending-row" ref={trendingRowRef}>
              {movies.map((movie, i) => (
                <div key={movie.id} className="trending-item">
                  <span className="trending-rank">{i + 1}</span>
                  <div className="trending-card">
                    {movie.poster ? (
                      <img src={movie.poster} alt={movie.title} loading="lazy" />
                    ) : (
                      <div className="trending-fallback">{movie.title}</div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <button
              type="button"
              className="trending-arrow right"
              onClick={() => scrollTrending(1)}
              aria-label="Scroll right"
            >
              ›
            </button>
          </div>
        </div>
      )}

      {authMode && (
        <AuthModal
          mode={authMode}
          onClose={() => setAuthMode(null)}
          onSuccess={() => setAuthMode(null)}
        />
      )}
    </div>
  );
}