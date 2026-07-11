import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "pixelflix:favorites";

function readFromStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    // corrupted or blocked storage — fall back to an empty list
    return [];
  }
}

export function useFavorites() {
  const [favorites, setFavorites] = useState(readFromStorage);

  // keep localStorage in sync whenever the favorites list changes
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(favorites));
    } catch {
      // storage full or disabled — fail silently, app still works in-memory
    }
  }, [favorites]);

  const isFavorite = useCallback(
    (id) => favorites.some((movie) => movie.id === id),
    [favorites]
  );

  const toggleFavorite = useCallback((movie) => {
    setFavorites((prev) => {
      const alreadySaved = prev.some((m) => m.id === movie.id);
      if (alreadySaved) {
        return prev.filter((m) => m.id !== movie.id);
      }
      return [...prev, movie];
    });
  }, []);

  return { favorites, isFavorite, toggleFavorite };
}
