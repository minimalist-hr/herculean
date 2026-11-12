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
  // A success ends what a sheet was for, so the sheet slides down first. A failure shows over the sheet, which stays.
  afterSheetsClose(() => {
    show('success', message, action);
  });
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

/** For a field's text: typing again clears the notification. */
export function clearingNotification(onChange: (value: string) => void) {
  return (value: string) => {
    dismissNotification();
    onChange(value);
  };
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

const sinkingSheets = new Set<string>();
// Counts the times every open sheet was asked to go down, so a sheet can tell it was asked since it opened.
let sinkRequests = 0;
let waiting: (() => void)[] = [];
let fallback: ReturnType<typeof setTimeout> | undefined;
// Nothing waits longer than this, even for a sheet that is never closed.
const longestWaitMs = 1000;

function sheetsSettled() {
  return openSheets.length === 0 && sinkingSheets.size === 0;
}

function runWaiting() {
  clearTimeout(fallback);
  fallback = undefined;
  const next = waiting;
  waiting = [];
  next.forEach((run) => {
    run();
  });
}

/**
 * Does something once every sheet has slid down, such as leaving the page or saying what happened after a sheet's action.
 * The sheet closes first and goes down smoothly, instead of vanishing with its page. Without a sheet, it happens at once.
 */
export function afterSheetsClose(run: () => void) {
  if (sheetsSettled()) {
    run();
    return;
  }

  waiting.push(run);
  fallback ??= setTimeout(runWaiting, longestWaitMs);
  if (openSheets.length > 0) {
    sinkRequests += 1;
    changed();
  }
}

/** How many times open sheets were asked to go down. A sheet open since an earlier count goes down by itself. */
export function useSinkRequests() {
  return useSyncExternalStore(subscribe, () => sinkRequests);
}

/** Waits until every sheet has slid down, for a flow that then leaves the page, such as signing out. */
export function untilSheetsClose() {
  return new Promise<void>((resolve) => {
    afterSheetsClose(resolve);
  });
}

/** Forgets every sheet and what waits for them, for a fresh start such as the next test. */
export function forgetSheets() {
  openSheets.length = 0;
  sinkingSheets.clear();
  waiting = [];
  clearTimeout(fallback);
  fallback = undefined;
}

/** A sheet has started going down. */
export function sheetSinking(id: string) {
  sinkingSheets.add(id);
}

/** A sheet is down, or gone with its page. */
export function sheetDown(id: string) {
  sinkingSheets.delete(id);
  if (sheetsSettled()) {
    runWaiting();
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
