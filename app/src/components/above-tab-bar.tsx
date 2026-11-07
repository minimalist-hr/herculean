import { useFocusEffect } from 'expo-router';
import {
  createContext,
  useCallback,
  useContext,
  useId,
  useSyncExternalStore,
} from 'react';

interface Layout {
  /** The tab bar's height. */
  tabBar: number;
  /** The focused page's action box on the tab bar, and which box it is. */
  actionBox: { owner: string; height: number } | null;
  /** The room a floating bar takes, so pages keep it at their end. */
  floatingRoom: number;
}

let layout: Layout = { tabBar: 0, actionBox: null, floatingRoom: 0 };
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
    next.floatingRoom === layout.floatingRoom &&
    next.actionBox?.owner === layout.actionBox?.owner &&
    next.actionBox?.height === layout.actionBox?.height
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

/** Says a page's action box sits on the tab bar while the page is in view, so a floating bar goes above it. */
export function ReportActionBox({ height }: { height: number }) {
  const owner = useId();

  useFocusEffect(
    useCallback(() => {
      update((current) => ({ ...current, actionBox: { owner, height } }));

      return () => {
        // Another page may have taken its place already.
        update((current) =>
          current.actionBox?.owner === owner
            ? { ...current, actionBox: null }
            : current,
        );
      };
    }, [height, owner]),
  );

  return null;
}

/** True for pages inside the tabs, where floating bars show. */
export const InTabsContext = createContext(false);

/** The room a tab page keeps at its end, so a floating bar never covers anything. None outside the tabs. */
export function useFloatingRoom() {
  const inTabs = useContext(InTabsContext);
  const { floatingRoom } = useAboveTabBar();

  return inTabs ? floatingRoom : 0;
}
