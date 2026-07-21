import { useContext } from 'react';
import { AppContext } from '@/context/AppContext';
import colors from '@/constants/colors';

/**
 * Returns design tokens for the current dark/light mode.
 * Reads darkMode from AppContext so the toggle in Settings
 * immediately updates the whole app without a restart.
 *
 * Defaults to light mode when AppContext is not yet hydrated.
 */
export function useColors() {
  // Avoid a hard crash if called outside AppProvider (e.g. during bootstrap)
  // by catching the missing-context case gracefully.
  let darkMode = false;
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const ctx = useContext(AppContext);
    if (ctx) darkMode = ctx.darkMode;
  } catch (_) {
    darkMode = false;
  }

  const palette = darkMode
    ? (colors as Record<string, typeof colors.light>).dark
    : colors.light;

  return { ...palette, radius: colors.radius };
}
