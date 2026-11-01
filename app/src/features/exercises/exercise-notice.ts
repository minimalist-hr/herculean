let created = false;

/** Tells the exercise list an exercise was just created, so it clears its filters. */
export function noteExerciseCreated() {
  created = true;
}

/** Whether an exercise was just created. It only answers once. */
export function takeExerciseCreated() {
  const taken = created;
  created = false;

  return taken;
}
