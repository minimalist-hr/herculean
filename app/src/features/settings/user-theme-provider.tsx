import { StatusBar } from 'expo-status-bar';
import { useEffect, useState, type ReactNode } from 'react';

import type { components } from '@/api/schema';
import { useSessionStatus } from '@/features/account/session';
import { useCurrentUser } from '@/features/account/use-current-user';
import { readStored, storedKeys, writeStored } from '@/storage/phone-storage';
import { ThemeProvider, useTheme } from '@/theme/theme-provider';

import { colorLabels, themeLabels } from './settings-labels';

type Schemas = components['schemas'];

interface Appearance {
  theme: Schemas['Theme'];
  color: Schemas['Color'];
}

const storedKey = storedKeys.appearance;

function parse(stored: string | null): Appearance | null {
  if (stored === null) {
    return null;
  }

  try {
    const appearance = JSON.parse(stored) as Partial<Appearance>;

    // A copy from an older version can hold a name that no longer exists.
    return appearance.theme !== undefined &&
      appearance.theme in themeLabels &&
      appearance.color !== undefined &&
      appearance.color in colorLabels
      ? { theme: appearance.theme, color: appearance.color }
      : null;
  } catch {
    return null;
  }
}

/** Gives the app the user's theme and color. A copy on the phone shows them from the first frame, before the user loads. */
export function UserThemeProvider({ children }: { children: ReactNode }) {
  const status = useSessionStatus();
  const user = useCurrentUser({ enabled: status === 'ready' }).data;
  // Undefined until the phone has been read.
  const [stored, setStored] = useState<Appearance | null>();

  useEffect(() => {
    void readStored(storedKey).then((value) => {
      setStored(parse(value));
    });
  }, []);

  const theme = user?.theme;
  const color = user?.color;
  useEffect(() => {
    if (theme !== undefined && color !== undefined) {
      void writeStored(storedKey, JSON.stringify({ theme, color }));
    }
  }, [theme, color]);

  // Reading the phone takes a moment, which the splash screen covers.
  if (stored === undefined) {
    return null;
  }

  return (
    <ThemeProvider
      theme={theme ?? stored?.theme}
      color={color ?? stored?.color}
    >
      <SchemeStatusBar />
      {children}
    </ThemeProvider>
  );
}

/** Dark text on a light app, light text on a dark one, whatever the phone's own setting. */
function SchemeStatusBar() {
  const { scheme } = useTheme();

  return <StatusBar style={scheme === 'light' ? 'dark' : 'light'} />;
}
