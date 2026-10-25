/**
 * Single source of truth for design tokens.
 *
 * Values live in `src/index.css` (`:root`). Components refer to the token name
 * through CSS variables, or — where a DOM style cannot resolve a variable, such
 * as three.js materials — through `readToken`.
 */
export const THEME_TOKENS = [
  '--bg-deepest',
  '--bg-base',
  '--bg-surface',
  '--bg-surface-2',
  '--bg-elevated',
  '--border',
  '--border-strong',
  '--text-primary',
  '--text-secondary',
  '--text-muted',
  '--accent-primary',
  '--accent-violet',
  '--accent-cyan',
  '--accent-blue',
  '--accent-pink',
  '--accent-orange',
  '--accent-yellow',
  '--danger',
  '--accent-primary-soft',
  '--accent-primary-glow',
  '--accent-violet-soft',
  '--accent-cyan-soft',
  '--accent-blue-soft',
  '--accent-orange-soft',
  '--accent-pink-soft',
  '--accent-yellow-soft',
  '--danger-soft',
] as const;

export type ThemeToken = (typeof THEME_TOKENS)[number];
export type AccentToken = Extract<ThemeToken, `--accent-${string}`>;

const resolved = new Map<ThemeToken, string>();

/**
 * Resolves a CSS custom property to a concrete color string.
 * Used only for sinks that cannot parse `var(...)` (three.js materials,
 * canvas/fog colors). Results are cached because the theme is static.
 */
export function readToken(name: ThemeToken, fallback = '#FFFFFF'): string {
  if (typeof document === 'undefined') return fallback;
  const cached = resolved.get(name);
  if (cached) return cached;
  const value = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  if (!value) return fallback;
  resolved.set(name, value);
  return value;
}
