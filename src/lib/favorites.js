/**
 * Favoriler sistemi - yerel depolama ile favori yönetimi
 */

import * as logger from './logger.js';

const FAV_KEY = "bygog_favs";
const DEFAULT_FAVORITES = [
  "Microsoft Activation Scripts",
  "Office Tool Plus",
  "Snappy Driver Installer",
  "Ninite",
  "Winutil",
  "PowerShell",
  "FMHY"
];

let favorites = new Set();
let changeListeners = [];

// İlk yükleme
function initFavorites() {
  let stored = null;
  try {
    stored = localStorage.getItem(FAV_KEY);
  } catch (err) {
    logger.warn('favorites', 'localStorage erişilemedi', err);
  }
  
  if (stored !== null) {
    try {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed)) {
        favorites = new Set(parsed);
        return;
      }
    } catch (err) {
      logger.warn('favorites', 'Favoriler parse edilemedi', err);
    }
  }
  
  favorites = new Set(DEFAULT_FAVORITES);
  saveFavorites();
}

function saveFavorites() {
  try {
    localStorage.setItem(FAV_KEY, JSON.stringify([...favorites]));
  } catch (err) {
    logger.error('favorites', 'Favoriler kaydedilemedi', err);
  }
}

export function getFavorites() {
  return new Set(favorites);
}

export function isFavorite(name) {
  return favorites.has(name);
}

export function addFavorite(name) {
  if (!favorites.has(name)) {
    favorites.add(name);
    saveFavorites();
    notifyListeners();
    return true;
  }
  return false;
}

export function removeFavorite(name) {
  if (favorites.has(name)) {
    favorites.delete(name);
    saveFavorites();
    notifyListeners();
    return true;
  }
  return false;
}

export function toggleFavorite(name) {
  if (favorites.has(name)) {
    favorites.delete(name);
  } else {
    favorites.add(name);
  }
  saveFavorites();
  notifyListeners();
  return favorites.has(name);
}

export function onFavoritesChange(callback) {
  changeListeners.push(callback);
  return () => {
    changeListeners = changeListeners.filter(cb => cb !== callback);
  };
}

function notifyListeners() {
  changeListeners.forEach(cb => {
    try {
      cb(getFavorites());
    } catch (err) {
      logger.error('favorites', 'Change listener hatası', err);
    }
  });
}

export function getDefaultFavorites() {
  return [...DEFAULT_FAVORITES];
}

export function resetToDefaults() {
  favorites = new Set(DEFAULT_FAVORITES);
  saveFavorites();
  notifyListeners();
}

// Modül yüklendiğinde favorileri başlat
initFavorites();

export default {
  getFavorites,
  isFavorite,
  addFavorite,
  removeFavorite,
  toggleFavorite,
  onFavoritesChange,
  getDefaultFavorites,
  resetToDefaults
};
