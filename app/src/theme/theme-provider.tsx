import { createContext, useContext, useMemo, type ReactNode } from 'react';
import { useColorScheme } from 'react-native';

import { createTheme, type ColorSetting, type Theme } from './theme';

export type ThemeSetting = 'matchPhone' | 'dark' | 'light';

const ThemeContext = createContext<Theme | null>(null);

interface ThemeProviderProps {
  theme?: ThemeSetting;
  color?: ColorSetting;
  children: ReactNode;
}

/** Gives every screen the tokens for the chosen theme and color. Defaults until Settings saves them. */
export function ThemeProvider({
  theme = 'matchPhone',
  color = 'racingBlue',
  children,
}: ThemeProviderProps) {
  const phoneScheme = useColorScheme();
  // A phone with no preference gets dark.
  const scheme =
    theme === 'matchPhone'
      ? phoneScheme === 'light'
        ? 'light'
        : 'dark'
      : theme;
  const value = useMemo(() => createTheme(scheme, color), [scheme, color]);

  return <ThemeContext value={value}>{children}</ThemeContext>;
}

export function useTheme(): Theme {
  const theme = useContext(ThemeContext);
  if (theme === null) {
    throw new Error('useTheme must be used inside ThemeProvider.');
  }
  return theme;
}
