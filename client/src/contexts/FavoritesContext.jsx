import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

const FAVORITES_KEY = 'hengadget_favorites';
const LEGACY_WISHLIST_KEY = 'hengadget_wishlist';

const FavoritesContext = createContext(null);

function readStoredFavorites() {
  if (typeof window === 'undefined') return [];

  for (const key of [FAVORITES_KEY, LEGACY_WISHLIST_KEY]) {
    try {
      const parsed = JSON.parse(window.localStorage.getItem(key) || '[]');
      if (Array.isArray(parsed)) {
        return [...new Set(parsed.filter((id) => typeof id === 'string' && id))];
      }
    } catch {
      // Abaikan data rusak lalu coba kunci berikutnya.
    }
  }

  // Cek apakah key legacy masih ada dan menanyakan konfirmasi sekali saja
  const legacyKey = LEGACY_WISHLIST_KEY;
  const legacyData = window.localStorage.getItem(legacyKey);
  if (legacyData) {
    try {
      const parsed = JSON.parse(legacyData);
      if (Array.isArray(parsed) && parsed.length > 0) {
        // Tampilkan konfirmasi satu kali saat pertama kali diakses di sesi ini
        if (!window.__HENGADGET_FAVORITES_LEGACY_CONFIRMED__) {
          const confirmResult = window.confirm(
            'Ditemukan data wishlist lama. Apakah Anda ingin mengimport data ke sistem favorit baru?'
          );
          if (confirmResult) {
            window.__HENGADGET_FAVORITES_LEGACY_CONFIRMED__ = true;
            // Import data legacy ke key baru
            const favoriteIds = [...new Set(parsed.filter((id) => typeof id === 'string' && id))];
            window.localStorage.setItem(FAVORITES_KEY, JSON.stringify(favoriteIds));
          }
        }
        // Hapus key lama setelah import (atau tinggalkan jika user menolak)
        window.localStorage.removeItem(legacyKey);
      }
    } catch {
      // Abaikan data rusak.
    }
  }

  return [];
}

export function FavoritesProvider({ children }) {
  const [favoriteIds, setFavoriteIds] = useState(readStoredFavorites);

  useEffect(() => {
    try {
      window.localStorage.setItem(FAVORITES_KEY, JSON.stringify(favoriteIds));
      // Bersihkan kunci lama agar tidak menimpa data baru.
      window.localStorage.removeItem(LEGACY_WISHLIST_KEY);
    } catch {
      // localStorage bisa diblokir (mode privat); favorit tetap jalan di sesi ini.
    }
  }, [favoriteIds]);

  const isFavorite = useCallback(
    (productId) => favoriteIds.includes(String(productId)),
    [favoriteIds],
  );

  const addFavorite = useCallback((productId) => {
    const id = String(productId || '');
    if (!id) return;
    setFavoriteIds((current) => (current.includes(id) ? current : [...current, id]));
  }, []);

  const removeFavorite = useCallback((productId) => {
    const id = String(productId || '');
    setFavoriteIds((current) => current.filter((item) => item !== id));
  }, []);

  const toggleFavorite = useCallback((productId) => {
    const id = String(productId || '');
    if (!id) return false;
    let added = false;
    setFavoriteIds((current) => {
      if (current.includes(id)) return current.filter((item) => item !== id);
      added = true;
      return [...current, id];
    });
    return added;
  }, []);

  const clearFavorites = useCallback(() => setFavoriteIds([]), []);

  const value = useMemo(
    () => ({
      favoriteIds,
      count: favoriteIds.length,
      isFavorite,
      addFavorite,
      removeFavorite,
      toggleFavorite,
      clearFavorites,
    }),
    [favoriteIds, isFavorite, addFavorite, removeFavorite, toggleFavorite, clearFavorites],
  );

  return <FavoritesContext.Provider value={value}>{children}</FavoritesContext.Provider>;
}

export function useFavorites() {
  const context = useContext(FavoritesContext);
  if (!context) throw new Error('useFavorites must be used within FavoritesProvider');
  return context;
}
