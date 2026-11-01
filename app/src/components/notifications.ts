import { useSyncExternalStore } from 'react';

export interface Notification {
  id: number;
  kind: 'success' | 'failure';
  message: string;
}

let notification: Notification | null = null;
let nextId = 1;
let bottomInset: number | null = null;

const listeners = new Set<() => void>();

function changed() {
  listeners.forEach((listener) => {
    listener();
  });
}

function subscribe(listener: () => void) {
  listeners.add(listener);

  return () => {
    listeners.delete(listener);
  };
}

function show(kind: Notification['kind'], message: string) {
  notification = { id: nextId, kind, message };
  nextId += 1;
  changed();
}

/** Says something worked. It replaces any notification showing, and outlives the screen that sent it. */
export function notifySuccess(message: string) {
  show('success', message);
}

/** Says something failed that belongs to no field. It replaces any notification showing. */
export function notifyFailure(message: string) {
  show('failure', message);
}

export function dismissNotification() {
  if (notification !== null) {
    notification = null;
    changed();
  }
}

/** Sets the height of what the bar must clear at the bottom of the screen. Null means the tab bar. */
export function setNotificationInset(height: number | null) {
  bottomInset = height;
  changed();
}

export function useNotification() {
  return useSyncExternalStore(subscribe, () => notification);
}

export function useNotificationInset() {
  return useSyncExternalStore(subscribe, () => bottomInset);
}
