const BASE_URL = "https://www.omdbapi.com/";
const API_KEY = import.meta.env.VITE_OMDB_KEY;

// OMDb has no "trending/popular" endpoint (it's search-only), so we keep a
// curated list of well-known IMDb IDs to hydrate the "Popular" grid. We
// paginate through this list locally (PAGE_SIZE at a time) so infinite
// scroll has something real to load on this tab too.
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

const POPULAR_PAGE_SIZE = 6;

async function omdbRequest(params) {
  if (!API_KEY) {
    throw new Error(
      "OMDb API key missing. Create a .env file from .env.example and add your key."
    );
  }

  const query = new URLSearchParams({ apikey: API_KEY, ...params });
  const res = await fetch(`${BASE_URL}?${query.toString()}`);

  if (!res.ok) {
    throw new Error(`OMDb request failed: ${res.status} ${res.statusText}`);
  }

  const data = await res.json();

  if (data.Response === "False") {
    throw new Error(data.Error || "OMDb returned an error");
  }

  return data;
}

// Normalizes an OMDb "by id" payload into the shape our components expect
function normalizeMovie(raw) {
  return {
    id: raw.imdbID,
    title: raw.Title,
    year: raw.Year !== "N/A" ? raw.Year : null,
    poster: raw.Poster && raw.Poster !== "N/A" ? raw.Poster : null,
    rating: raw.imdbRating && raw.imdbRating !== "N/A" ? raw.imdbRating : null,
  };
}

function getMovieById(imdbID) {
  return omdbRequest({ i: imdbID }).then(normalizeMovie);
}

// Phase 1 + 2: "Popular Movies" grid, paginated locally over our curated ID
// list so the infinite-scroll hook has real "next page" behavior to trigger.
export async function getPopularMovies(page = 1) {
  const start = (page - 1) * POPULAR_PAGE_SIZE;
  const end = start + POPULAR_PAGE_SIZE;
  const idsForPage = CURATED_IDS.slice(start, end);

  const settled = await Promise.allSettled(idsForPage.map(getMovieById));
  const results = settled
    .filter((r) => r.status === "fulfilled")
    .map((r) => r.value);

  return {
    results,
    hasMore: end < CURATED_IDS.length,
  };
}

// Phase 1 + 2: Search endpoint, paginated via OMDb's own `page` param.
// OMDb's `s=` search doesn't include ratings, so each hit is enriched with
// a follow-up "by id" call.
export async function searchMovies(query, page = 1) {
  const searchData = await omdbRequest({ s: query, type: "movie", page });

  const enriched = await Promise.allSettled(
    searchData.Search.map((item) => getMovieById(item.imdbID))
  );
  const results = enriched
    .filter((r) => r.status === "fulfilled")
    .map((r) => r.value);

  const totalResults = Number(searchData.totalResults) || 0;
  const hasMore = page * 10 < totalResults;

  return { results, hasMore };
}
