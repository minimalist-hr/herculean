import { StatusBar } from 'expo-status-bar';
import { useEffect, useState, type ReactNode } from 'react';

import type { components } from '@/api/schema';
import { useSessionStatus } from '@/features/account/session';
import { useCurrentUser } from '@/features/account/use-current-user';
import { readStored, storedKeys, writeStored } from '@/storage/phone-storage';
import { ThemeProvider, useTheme } from '@/theme/theme-provider';

import { themeLabels } from './settings-labels';

type Schemas = components['schemas'];

interface Appearance {
  theme: Schemas['Theme'];
}

const storedKey = storedKeys.appearance;

function parse(stored: string | null): Appearance | null {
  if (stored === null) {
    return null;
  }

  try {
    const appearance = JSON.parse(stored) as Partial<Appearance>;

    // A copy from an older version can hold a name that no longer exists.
    return appearance.theme !== undefined && appearance.theme in themeLabels
      ? { theme: appearance.theme }
      : null;
  } catch {
    return null;
  }
}

/** Gives the app the user's theme. A copy on the phone shows them from the first frame, before the user loads. */
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
  useEffect(() => {
    if (theme !== undefined) {
      void writeStored(storedKey, JSON.stringify({ theme }));
    }
  }, [theme]);

  // Reading the phone takes a moment, which the splash screen covers.
  if (stored === undefined) {
    return null;
  }

  return (
    // Signed-out screens always show Default.
    <ThemeProvider
      theme={status === 'signedOut' ? undefined : (theme ?? stored?.theme)}
    >
      <SchemeStatusBar />
      {children}
    </ThemeProvider>
  );
}

/** Dark text on a light theme, light text on a dark one, whatever the phone's own setting. */
function SchemeStatusBar() {
  const { scheme } = useTheme();

  return <StatusBar style={scheme === 'light' ? 'dark' : 'light'} />;
}
