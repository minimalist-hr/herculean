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
const openSheets: string[] = [];

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

/** Dismisses an action such as Undo, which can do nothing once its form has closed. */
export function dismissAction() {
  if (notification?.action !== undefined) {
    dismissNotification();
  }
}

/** Dismisses a failure, which says nothing once the sheet or form it belongs to has closed. */
export function dismissFailure() {
  if (notification?.kind === 'failure') {
    dismissNotification();
  }
}

export function sheetOpened(id: string) {
  openSheets.push(id);
  changed();
}

export function sheetClosed(id: string) {
  openSheets.splice(openSheets.indexOf(id), 1);
  changed();
}

/** Whether a sheet is open, which then shows some notifications itself. */
export function useSheetOpen() {
  return useSyncExternalStore(subscribe, () => openSheets.length > 0);
}

/** Whether this is the sheet on top, the only one a notification can show above. */
export function useTopSheet(id: string) {
  return useSyncExternalStore(subscribe, () => openSheets.at(-1) === id);
}

export function useNotification() {
  return useSyncExternalStore(subscribe, () => notification);
}
