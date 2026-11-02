import { useSyncExternalStore } from 'react';

interface NotificationAction {
  label: string;
  onPress: () => void;
}

export interface Notification {
  id: number;
  kind: 'success' | 'failure';
  message: string;
  action?: NotificationAction;
}

let notification: Notification | null = null;
let nextId = 1;
let bottomInset: number | null = null;
let openSheets = 0;

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

function show(
  kind: Notification['kind'],
  message: string,
  action?: NotificationAction,
) {
  notification = { id: nextId, kind, message, action };
  nextId += 1;
  changed();
}

/** Says something worked, with an action such as Undo if there is one. It replaces any notification showing, and outlives the screen that sent it. */
export function notifySuccess(message: string, action?: NotificationAction) {
  show('success', message, action);
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

/** Dismisses a failure, which says nothing once the sheet it belongs to has closed. */
export function dismissFailure() {
  if (notification?.kind === 'failure') {
    dismissNotification();
  }
}

/** Sets the height of what the bar must clear at the bottom of the screen. Null means the tab bar. */
export function setNotificationInset(height: number | null) {
  bottomInset = height;
  changed();
}

export function sheetOpened() {
  openSheets += 1;
  changed();
}

export function sheetClosed() {
  openSheets -= 1;
  changed();
}

/** Whether a sheet is open, which then shows failures itself. */
export function useSheetOpen() {
  return useSyncExternalStore(subscribe, () => openSheets > 0);
}

export function useNotification() {
  return useSyncExternalStore(subscribe, () => notification);
}

export function useNotificationInset() {
  return useSyncExternalStore(subscribe, () => bottomInset);
}
