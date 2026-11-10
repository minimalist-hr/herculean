import { useNavigation, usePathname, useRouter, type Href } from 'expo-router';
import { useCallback } from 'react';

type Kind = 'exercise' | 'routine' | 'workout';
type Tab = 'exercises' | 'routines' | 'workout';

type PageHref = (params: { id: string; from: string }) => Href;

/** Where an exercise, a routine or a workout opens, inside each tab, so the tab you are in stays yours. */
const pages: Record<Tab, Record<Kind, { name: string; href: PageHref }>> = {
  exercises: {
    exercise: {
      name: '[id]',
      href: (params) => ({ pathname: '/exercises/[id]', params }),
    },
    routine: {
      name: 'routine/[id]',
      href: (params) => ({ pathname: '/exercises/routine/[id]', params }),
    },
    workout: {
      name: 'workout/[id]',
      href: (params) => ({ pathname: '/exercises/workout/[id]', params }),
    },
  },
  routines: {
    exercise: {
      name: 'exercise/[id]',
      href: (params) => ({ pathname: '/routines/exercise/[id]', params }),
    },
    routine: {
      name: '[id]',
      href: (params) => ({ pathname: '/routines/[id]', params }),
    },
    workout: {
      name: 'workout/[id]',
      href: (params) => ({ pathname: '/routines/workout/[id]', params }),
    },
  },
  workout: {
    exercise: {
      name: 'exercise/[id]',
      href: (params) => ({ pathname: '/workout/exercise/[id]', params }),
    },
    routine: {
      name: 'routine/[id]',
      href: (params) => ({ pathname: '/workout/routine/[id]', params }),
    },
    workout: {
      name: 'details/[id]',
      href: (params) => ({ pathname: '/workout/details/[id]', params }),
    },
  },
};

function tabOf(pathname: string): Tab {
  if (pathname.startsWith('/exercises')) {
    return 'exercises';
  }

  return pathname.startsWith('/routines') ? 'routines' : 'workout';
}

interface StackRoute {
  name: string;
  params?: object;
}

/**
 * Opens what a row shows, inside the current tab. `from` names this page for the back link there,
 * for example "group:<id>". A page already open further back is gone back to, never opened twice,
 * so nothing behind it can show something out of date.
 */
export function useLinks(from: string) {
  const router = useRouter();
  const pathname = usePathname();
  const navigation = useNavigation();

  const open = useCallback(
    (kind: Kind, id: string) => {
      const tab = tabOf(pathname);
      const page = pages[tab][kind];
      const state = navigation.getState() as
        { index: number; routes: StackRoute[] } | undefined;
      const routes = state?.routes ?? [];
      const open = routes.findIndex(
        (route) =>
          route.name === page.name &&
          (route.params as { id?: string } | undefined)?.id === id,
      );
      if (state !== undefined && open !== -1) {
        // It is this page itself, or one further back.
        if (open < state.index) {
          router.dismiss(state.index - open);
        }
        return;
      }

      const fromHome = pathname === '/';
      router.push(page.href({ id, from: fromHome ? 'home' : from }), {
        withAnchor: fromHome,
      });
    },
    [from, navigation, pathname, router],
  );

  return {
    exercise: (id: string) => {
      open('exercise', id);
    },
    routine: (id: string) => {
      open('routine', id);
    },
    workout: (id: string) => {
      open('workout', id);
    },
  };
}
