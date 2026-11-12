import { usePathname } from 'expo-router';
import { createContext, useContext, useSyncExternalStore } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTheme } from '@/theme/theme-provider';

import { hidesTabBar } from './tab-bar';

interface Layout {
  /** The tab bar's height. */
  tabBar: number;
  /** The room a floating bar takes, so pages keep it at their end. */
  floatingRoom: number;
}

let layout: Layout = { tabBar: 0, floatingRoom: 0 };
const listeners = new Set<() => void>();

function subscribe(listener: () => void) {
  listeners.add(listener);

  return () => {
    listeners.delete(listener);
  };
}

function update(change: (current: Layout) => Layout) {
  const next = change(layout);
  if (
    next.tabBar === layout.tabBar &&
    next.floatingRoom === layout.floatingRoom
  ) {
    return;
  }
  layout = next;
  listeners.forEach((listener) => {
    listener();
  });
}

/** What sits on the tab bar now. */
export function useAboveTabBar() {
  return useSyncExternalStore(subscribe, () => layout);
}

export function setTabBarHeight(height: number) {
  update((current) => ({ ...current, tabBar: height }));
}

export function setFloatingRoom(room: number) {
  update((current) => ({ ...current, floatingRoom: room }));
}

/** True for pages inside the tabs, where floating bars show. */
export const InTabsContext = createContext(false);

/**
 * The space a page keeps after its content: 12 px above a floating bar when one shows,
 * 24 px otherwise, and below that the tab bar, which floats over the page, or on a page
 * without it, the phone's own buttons.
 * A page with its own bar, like the rest bar, passes the room that bar takes.
 */
export function usePageEnd(ownBar = 0) {
  const inTabs = useContext(InTabsContext);
  const { tabBar, floatingRoom } = useAboveTabBar();
  const pathname = usePathname();
  const insets = useSafeAreaInsets();
  const { space } = useTheme();

  if (!inTabs) {
    return space.xl;
  }

  const withoutTabs = hidesTabBar(pathname);
  const bar = ownBar > 0 ? ownBar : withoutTabs ? 0 : floatingRoom;
  const below = withoutTabs ? insets.bottom : tabBar;

  return below + (bar > 0 ? bar + space.md : space.xl);
}
