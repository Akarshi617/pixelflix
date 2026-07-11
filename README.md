# PixelFlix — Sprint 08 (Phase 1)

A movie discovery SPA built with React + Vite, consuming the **OMDb API**.

> Note: the sprint brief points at TMDB, but OMDb was used here because TMDB
> was unreachable (TMDB is periodically restricted in some regions, including
> India). OMDb is a free, equivalent movie-data API. OMDb has no
> "trending/popular" discovery endpoint (it's search-only), so the "Popular"
> grid is hydrated from a curated list of well-known IMDb IDs on load — the
> **Search** feature hits OMDb's live search endpoint directly, exactly as
> the brief describes.

## What's implemented

**Phase 1 (P0)**
- Fetches a **Popular Movies** grid (curated IMDb IDs) on load — poster, title, release year, rating.
- **Search** component that queries OMDb's search endpoint and re-renders the grid.

**Phase 2 (P1)**
- **Infinite Scroll** — an `IntersectionObserver` watches a sentinel div at the bottom of the grid. When it scrolls into view, the next page is fetched and appended (works for both Popular and Search).
- **Debounced Search** — typing doesn't fire a request per keystroke; a `useDebounce` hook waits 500ms after you stop typing before searching.
- **Favorites (localStorage)** — click the heart on any card to save it. Favorites persist across reloads via `localStorage` and have their own "My Favorites" tab.

**Phase 3 (P2 — Stretch)**
- **Lazy Loading** — every poster `<img>` uses `loading="lazy"`, so the browser only downloads posters as they scroll near the viewport.
- **AI Mood Matcher** — a second input above the grid where you type a mood (e.g. "rainy Sunday, need a good cry"). It's sent to the Gemini API with a prompt that asks for exactly one movie title back, and that title is dropped straight into the normal search box — same debounce, same OMDb search, same grid.

**Extras**
- **Landing page** — a Netflix-style splash screen shown before Browse, with a poster-collage backdrop, Sign In / Sign Up, an English/Hindi language toggle, and a horizontally-scrolling "Trending Now" row.
- **Login / Sign Up** — client-only demo auth stored in `localStorage` (no backend in this sprint, so passwords are plain text — fine for a college project, never for production).

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```
2. Get a free OMDb API key:
   - Go to https://www.omdbapi.com/apikey.aspx
   - Select **FREE**, enter your email, submit
   - Check your inbox for an activation link, click it
   - Your key arrives by email
3. Create your env file:
   ```bash
   cp .env.example .env
   ```
   Paste your key into `.env`:
   ```
   VITE_OMDB_KEY=your_key_here
   ```
4. (Optional, for Mood Matcher) Get a free Gemini API key from
   https://aistudio.google.com/apikey and add it to `.env`:
   ```
   VITE_GEMINI_KEY=your_gemini_key_here
   ```
5. Run the dev server:
   ```bash
   npm run dev
   ```

## Project structure

```
src/
  api/
    omdb.js                     → fetch wrappers (getPopularMovies, searchMovies), both paginated
    gemini.js                     → getMovieForMood(mood) — one title back from Gemini
  hooks/
    useDebounce.js             → delays a value until typing pauses for 500ms
    useInfiniteScroll.js         → IntersectionObserver wrapper for "load next page"
    useFavorites.js               → favorites array synced to localStorage
    useAuth.js                     → login/signup, users synced to localStorage
  components/
    LandingPage.jsx                   → hero splash screen (backdrop, auth, language, trending row)
    AuthModal.jsx                       → login/signup form used by LandingPage
    MovieCard.jsx               → poster tile (image, title, year, rating, favorite heart)
    MovieGrid.jsx                 → CSS grid layout of MovieCard
    SearchBar.jsx                   → controlled search input (auto-searches via debounce)
    MoodMatcher.jsx                   → mood input that hands a title off to the search box
  App.jsx                           → page state, pagination, Browse/Favorites tabs
  App.css / index.css                → styling
```

## Deploying

Push this repo to GitHub, then import it in Vercel or Netlify.
**Important:** add `VITE_OMDB_KEY` as an environment variable in your host's
project settings — the `.env` file is git-ignored and won't deploy automatically.

