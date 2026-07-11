export default function MovieCard({ movie, isFavorite, onToggleFavorite }) {
  return (
    <article className="movie-card">
      <div className="poster-frame">
        {movie.poster ? (
          <img
            src={movie.poster}
            alt={`${movie.title} poster`}
            loading="lazy"
          />
        ) : (
          <div className="poster-fallback">
            <span>{movie.title}</span>
          </div>
        )}

        <span className="rating-badge">
          ★ {movie.rating ? movie.rating : "N/A"}
        </span>

        <button
          type="button"
          className={`favorite-btn ${isFavorite ? "is-favorite" : ""}`}
          onClick={() => onToggleFavorite(movie)}
          aria-pressed={isFavorite}
          aria-label={
            isFavorite ? `Remove ${movie.title} from favorites` : `Add ${movie.title} to favorites`
          }
        >
          {isFavorite ? "♥" : "♡"}
        </button>
      </div>

      <div className="movie-meta">
        <h3 className="movie-title" title={movie.title}>
          {movie.title}
        </h3>
        <span className="movie-year">{movie.year || "—"}</span>
      </div>
    </article>
  );
}
