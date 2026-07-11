import { useCallback, useEffect, useMemo, useState } from "react";

const STORAGE_PREFIX = "pixelflix:favorites";

function storageKeyFor(userEmail) {
  // Scoped per account so two users on the same browser don't share a
  // favorites list. Signed-out visitors still get a working (local-only)
  // "guest" list rather than losing the feature entirely.
  return `${STORAGE_PREFIX}:${userEmail || "guest"}`;
}

function readFromStorage(key) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : [];
  } catch {
    // corrupted or blocked storage — fall back to an empty list
    return [];
  }
}

/**
 * @param {string|null} userEmail - current signed-in user (from useAuth).
 *   Pass null/undefined for a guest-scoped favorites list.
 */
export function useFavorites(userEmail = null) {
  const storageKey = storageKeyFor(userEmail);
  const [favorites, setFavorites] = useState(() => readFromStorage(storageKey));

  // If the signed-in user changes (login/logout/switch account), reload
  // that user's own favorites list instead of continuing to show the
  // previous user's data.
  useEffect(() => {
    setFavorites(readFromStorage(storageKey));
  }, [storageKey]);

  // keep localStorage in sync whenever the favorites list changes
  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(favorites));
    } catch {
      // storage full or disabled — fail silently, app still works in-memory
    }
  }, [favorites, storageKey]);

  // O(1) membership checks instead of re-scanning the array for every
  // card on every render — matters once the grid has 50+ movies on screen.
  const favoriteIds = useMemo(
    () => new Set(favorites.map((movie) => movie.id)),
    [favorites]
  );

  const isFavorite = useCallback((id) => favoriteIds.has(id), [favoriteIds]);

  const toggleFavorite = useCallback((movie) => {
    setFavorites((prev) => {
      const alreadySaved = prev.some((m) => m.id === movie.id);
      if (alreadySaved) {
        return prev.filter((m) => m.id !== movie.id);
      }
      return [...prev, movie];
    });
  }, []);

  const clearFavorites = useCallback(() => setFavorites([]), []);

  return { favorites, isFavorite, toggleFavorite, clearFavorites };
}
