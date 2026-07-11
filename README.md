# PixelFlix 🎬

A movie browsing app I built with React + Vite. Search for movies, save favorites, and get personalized recommendations based on your mood using AI.

## What it does

- **Browse & search** movies using the OMDb API
- **Login / Signup** so you can save your own favorites list
- **Mood Matcher** — describe how you're feeling and it suggests movies to match (powered by Gemini)
- **Trending row** on the landing page — horizontal scroll, snaps to each card
- **Favorites** — heart a movie and it's saved for later
- **Language toggle** — switch between English and Hindi
- **Infinite scroll** on the browse grid instead of pagination

## Tech stack

- React (Vite)
- OMDb API for movie data
- Gemini API for the mood-based recommendations
- Plain CSS (no framework — wanted full control over the styling)

## Running it locally

```bash
git clone https://github.com/Akarshi617/pixelflix.git
cd pixelflix
npm install
```

You'll need your own API keys. Create a `.env` file in the root:

```
VITE_OMDB_API_KEY=your_omdb_key_here
VITE_GEMINI_API_KEY=your_gemini_key_here
```

- Get an OMDb key here: http://www.omdbapi.com/apikey.aspx
- Get a Gemini key from Google AI Studio

Then just:

```bash
npm run dev
```

## Project structure

```
src/
  api/            → OMDb + Gemini API calls
  components/      → LandingPage, MovieGrid, MovieCard, AuthModal, MoodMatcher, SearchBar
  hooks/           → useAuth, useDebounce, useFavorites, useInfiniteScroll
  i18n.js          → EN/HI translations
```

## Known issues / things I'm still working on

- Movie detail modal isn't built yet (clicking a poster doesn't open anything right now)
- Download button is UI-only, doesn't actually do anything (it's a demo app, no real streaming)
- Trending row card count on very small screens could use more testing

## Why I made this

Wanted to practice building something Netflix-adjacent with a real external API, actual auth, and an AI feature that wasn't just a gimmick tacked on. Still actively adding to it.

## Live Demo

🔗 https://pixelflix-tawny.vercel.app/

## Author

Developed by **Akarshi Agrahari**
