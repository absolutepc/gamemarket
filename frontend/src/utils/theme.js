const STORAGE_KEY = 'gm_theme';

export function getStoredTheme() {
  try {
    const t = localStorage.getItem(STORAGE_KEY);
    if (t === 'light' || t === 'dark') return t;
  } catch {
    /* ignore */
  }
  return 'dark';
}

export function applyTheme(theme) {
  const root = document.documentElement;
  const isLight = theme === 'light';
  root.classList.toggle('light', isLight);
  root.classList.toggle('dark', !isLight);
  root.style.colorScheme = isLight ? 'light' : 'dark';
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute('content', isLight ? '#f3f4f6' : '#18181f');
  try {
    localStorage.setItem(STORAGE_KEY, theme);
  } catch {
    /* ignore */
  }
}

export function initTheme() {
  applyTheme(getStoredTheme());
}

export function toggleTheme() {
  const next = getStoredTheme() === 'light' ? 'dark' : 'light';
  applyTheme(next);
  return next;
}
