const THEME_KEY = 'vison-theme';
export const THEMES = ['dark', 'light'];

function validTheme(value) { return THEMES.includes(value) ? value : 'dark'; }

export function getTheme() {
  try { return validTheme(globalThis.localStorage?.getItem(THEME_KEY)); }
  catch { return 'dark'; }
}

export function setTheme(theme) {
  const value = validTheme(theme);
  try { globalThis.localStorage?.setItem(THEME_KEY, value); } catch { /* preference is best effort */ }
  applyTheme(value);
  return value;
}

export function applyTheme(theme = getTheme()) {
  const value = validTheme(theme);
  if (globalThis.document?.documentElement) document.documentElement.dataset.theme = value;
  return value;
}

export { THEME_KEY };
