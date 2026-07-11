const BASE_URL = "https://www.omdbapi.com/";

// BUG FIX: this was reading VITE_OMDB_KEY, but the .env / Vercel variable
// is VITE_OMDB_API_KEY — the mismatch is why requests were silently
// failing (API_KEY was `undefined`, so omdbRequest threw before ever
// hitting the network).
const API_KEY = import.meta.env.VITE_OMDB_API_KEY;

const REQUEST_TIMEOUT_MS = 10_000;
const POPULAR_PAGE_SIZE = 6;

// OMDb has no "trending/popular" endpoint (it's search-only), so we keep a
// curated list of well-known IMDb IDs to hydrate the "Popular" grid. We
// paginate through this list locally (POPULAR_PAGE_SIZE at a time) so
// infinite scroll has something real to load on this tab too.
const CURATED_IDS = [
  "tt15398776", // Oppenheimer
  "tt1517268", // Barbie
  "tt6710474", // Everything Everywhere All at Once
  "tt9362722", // Spider-Man: Across the Spider-Verse
  "tt1745960", // Top Gun: Maverick
  "tt10366206", // John Wick: Chapter 4
  "tt15239678", // Dune: Part Two
  "tt5433140", // Fast X
  "tt9603212", // Wonka
  "tt14513804", // Killers of the Flower Moon
  "tt13320622", // Poor Things
  "tt1630029", // Avatar: The Way of Water
  "tt6791350", // Guardians of the Galaxy Vol. 3
  "tt2049403", // Mission: Impossible - Dead Reckoning
  "tt5108870", // Turning Red
  "tt9114286", // Black Panther: Wakanda Forever
  "tt1160419", // Dune
  "tt10648342", // Thor: Love and Thunder
  "tt11762114", // Puss in Boots: The Last Wish
  "tt13320352", // Elemental
  "tt1877830", // The Batman
  "tt10872600", // Spider-Man: No Way Home
  "tt9032400", // Eternals
  "tt9764362", // Nope
  "tt15671028", // Napoleon
  "tt6857112", // Asteroid City
  "tt14209916", // Beau Is Afraid
  "tt9603208", // The Killer
  "tt1462764", // Jojo Rabbit
  "tt7286456", // Joker
  "tt6751668", // Parasite
  "tt8579674", // 1917
  "tt7975244", // Knives Out
  "tt2382320", // No Time to Die
  "tt9376612", // Shang-Chi and the Legend of the Ten Rings
  "tt9848626", // Free Guy
  "tt11813216", // Licorice Pizza
  "tt10545296", // West Side Story
  "tt7146812", // Once Upon a Time in Hollywood
  "tt6146586", // The Suicide Squad
  "tt2704998", // Kingsman: The Golden Circle
  "tt5027774", // Three Billboards Outside Ebbing, Missouri
  "tt1517451", // Ford v Ferrari
  "tt5433138", // Jurassic World: Fallen Kingdom
  "tt4154796", // Avengers: Endgame
  "tt4154756", // Avengers: Infinity War
];

// ---------------------------------------------------------------------------
// In-memory cache
// ---------------------------------------------------------------------------
// Keeps this session from re-fetching the same "by id" or search page twice
// (e.g. scrolling past a movie, then hovering it again in the trending row).
// A Map is fine here since it's cleared on refresh — no need for anything
// heavier for a demo-scale app.
const cache = new Map();

function getCached(key) {
  return cache.has(key) ? cache.get(key) : null;
}

function setCached(key, value) {
  cache.set(key, value);
  return value;
}

/**
 * Wraps fetch with an API-key check, a timeout, and OMDb's
 * Response:"False" error convention.
 */
async function omdbRequest(params) {
  if (!API_KEY) {
    throw new Error(
      "OMDb API key missing. Add VITE_OMDB_API_KEY to your .env file (see .env.example)."
    );
  }

  const query = new URLSearchParams({ apikey: API_KEY, ...params });
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  let res;
  try {
    res = await fetch(`${BASE_URL}?${query.toString()}`, {
      signal: controller.signal,
    });
  } catch (err) {
    if (err.name === "AbortError") {
      throw new Error("OMDb request timed out. Please try again.");
    }
    throw new Error("Couldn't reach OMDb. Check your connection.");
  } finally {
    clearTimeout(timeoutId);
  }

  if (!res.ok) {
    throw new Error(`OMDb request failed: ${res.status} ${res.statusText}`);
  }

  const data = await res.json();

  if (data.Response === "False") {
    throw new Error(data.Error || "OMDb returned an error");
  }

  return data;
}

/**
 * Normalizes an OMDb "by id" payload into the compact shape used by
 * cards / grids throughout the app.
 */
function normalizeMovie(raw) {
  return {
    id: raw.imdbID,
    title: raw.Title,
    year: raw.Year !== "N/A" ? raw.Year : null,
    poster: raw.Poster && raw.Poster !== "N/A" ? raw.Poster : null,
    rating: raw.imdbRating && raw.imdbRating !== "N/A" ? raw.imdbRating : null,
  };
}

/**
 * Normalizes a "by id" payload into the fuller shape needed by a movie
 * details view — genre, plot, runtime, etc. Kept separate from
 * normalizeMovie so cards/grids don't carry data they never render.
 */
function normalizeMovieDetails(raw) {
  return {
    ...normalizeMovie(raw),
    genre: raw.Genre !== "N/A" ? raw.Genre : null,
    overview: raw.Plot !== "N/A" ? raw.Plot : null,
    released: raw.Released !== "N/A" ? raw.Released : null,
    runtime: raw.Runtime !== "N/A" ? raw.Runtime : null,
    director: raw.Director !== "N/A" ? raw.Director : null,
  };
}

function getMovieById(imdbID) {
  const cacheKey = `movie:${imdbID}`;
  const cached = getCached(cacheKey);
  if (cached) return Promise.resolve(cached);

  return omdbRequest({ i: imdbID })
    .then(normalizeMovie)
    .then((movie) => setCached(cacheKey, movie));
}

/**
 * Fetches full detail fields for a single movie (genre, plot, runtime...).
 * Used by the movie details modal — separate from getMovieById so the
 * grid/trending-row calls stay lightweight.
 */
export function getMovieDetails(imdbID) {
  const cacheKey = `details:${imdbID}`;
  const cached = getCached(cacheKey);
  if (cached) return Promise.resolve(cached);

  return omdbRequest({ i: imdbID, plot: "full" })
    .then(normalizeMovieDetails)
    .then((details) => setCached(cacheKey, details));
}

/**
 * "Popular Movies" grid, paginated locally over the curated ID list so the
 * infinite-scroll hook has real "next page" behavior to trigger.
 */
export async function getPopularMovies(page = 1) {
  const cacheKey = `popular:${page}`;
  const cached = getCached(cacheKey);
  if (cached) return cached;

  const start = (page - 1) * POPULAR_PAGE_SIZE;
  const end = start + POPULAR_PAGE_SIZE;
  const idsForPage = CURATED_IDS.slice(start, end);

  const settled = await Promise.allSettled(idsForPage.map(getMovieById));
  const results = settled
    .filter((r) => r.status === "fulfilled")
    .map((r) => r.value);

  return setCached(cacheKey, {
    results,
    hasMore: end < CURATED_IDS.length,
  });
}

/**
 * Search endpoint, paginated via OMDb's own `page` param. OMDb's `s=`
 * search doesn't include ratings, so each hit is enriched with a
 * follow-up "by id" call (which benefits from the same cache).
 */
export async function searchMovies(query, page = 1) {
  const cacheKey = `search:${query.toLowerCase()}:${page}`;
  const cached = getCached(cacheKey);
  if (cached) return cached;

  const searchData = await omdbRequest({ s: query, type: "movie", page });

  const enriched = await Promise.allSettled(
    searchData.Search.map((item) => getMovieById(item.imdbID))
  );
  const results = enriched
    .filter((r) => r.status === "fulfilled")
    .map((r) => r.value);

  const totalResults = Number(searchData.totalResults) || 0;
  const hasMore = page * 10 < totalResults;

  return setCached(cacheKey, { results, hasMore });
}
