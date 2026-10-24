export const DEFAULT_PREFERENCES = { mode: 'light', accent: 'green', language: 'en' };
const KEY = 'solluce-preferences-v1';

export function readPreferences() {
  try {
    const saved = JSON.parse(localStorage.getItem(KEY) || '{}');
    return {
      mode: ['light', 'dark'].includes(saved.mode) ? saved.mode : 'light',
      accent: ['green', 'orange', 'purple'].includes(saved.accent) ? saved.accent : 'green',
      language: ['en', 'es'].includes(saved.language) ? saved.language : 'en',
    };
  } catch { return { ...DEFAULT_PREFERENCES }; }
}

export function applyPreferences(value) {
  document.documentElement.dataset.mode = value.mode;
  document.documentElement.dataset.accent = value.accent;
  document.documentElement.lang = value.language;
  document.documentElement.style.colorScheme = value.mode;
  document.title = value.language === 'es' ? 'Solluce — Información para agricultores del Valle Central' : 'Solluce — Crop insights for Central Valley growers';
  try { localStorage.setItem(KEY, JSON.stringify(value)); } catch { /* Private browsing can disable storage. */ }
}
