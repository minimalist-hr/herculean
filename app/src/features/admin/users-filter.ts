import { useSyncExternalStore } from 'react';

import type { UsersFilter } from './use-users';

/**
 * Which chip Users shows. It lives outside the page, so Overview's Deleting soon tile can set it:
 * a param doesn't reach a tab's first page once the tab has its own stack.
 */
let filter: UsersFilter = 'all';
const listeners = new Set<() => void>();

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function setUsersFilter(next: UsersFilter) {
  filter = next;
  listeners.forEach((listener) => {
    listener();
  });
}

export function useUsersFilter() {
  return useSyncExternalStore(subscribe, () => filter);
}
