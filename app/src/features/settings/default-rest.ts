// The default rest time rules, the same as the API's. Setup and Settings both use them.

export const defaultRest = {
  /** A new account starts here. */
  startingSeconds: 180,
  minSeconds: 15,
  maxSeconds: 600,
  stepSeconds: 15,
  quickPicks: [60, 120, 180, 240, 300],
} as const;
