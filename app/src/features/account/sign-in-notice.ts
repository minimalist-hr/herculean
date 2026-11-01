let passwordChanged = false;

/** Tells sign in to say the password changed. It is kept here because a route can't carry it through launch, when a link opened the app from closed. */
export function notePasswordChanged() {
  passwordChanged = true;
}

/** Whether the password just changed. It only answers yes once. */
export function takePasswordChanged() {
  const changed = passwordChanged;
  passwordChanged = false;

  return changed;
}
