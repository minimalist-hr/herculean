import { createContext, useContext, useMemo, type ReactNode } from 'react';

import { createTheme, defaultTheme, type Theme, type ThemeName } from './theme';

const ThemeContext = createContext<Theme | null>(null);

interface ThemeProviderProps {
  theme?: ThemeName;
  children: ReactNode;
}

/** Gives every screen the tokens for the chosen theme. Default until the user's theme is known. */
export function ThemeProvider({
  theme = defaultTheme,
  children,
}: ThemeProviderProps) {
  const value = useMemo(() => createTheme(theme), [theme]);

  return <ThemeContext value={value}>{children}</ThemeContext>;
}

export function useTheme(): Theme {
  const theme = useContext(ThemeContext);
  if (theme === null) {
    throw new Error('useTheme must be used inside ThemeProvider.');
  }
  return theme;
}
