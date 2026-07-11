import MovieCard from "./MovieCard";

export default function MovieGrid({ movies, isFavorite, onToggleFavorite }) {
  if (movies.length === 0) {
    return (
      <div className="empty-state">
        <p>No titles found. Try a different search.</p>
      </div>
    );
  }

  return (
    <div className="movie-grid">
      {movies.map((movie) => (
        <MovieCard
          key={movie.id}
          movie={movie}
          isFavorite={isFavorite(movie.id)}
          onToggleFavorite={onToggleFavorite}
        />
      ))}
    </div>
  );
}
