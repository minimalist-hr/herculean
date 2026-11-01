let createdName: string | undefined;

/** Tells the exercise list what was just created. */
export function noteExerciseCreated(name: string) {
  createdName = name;
}

/** The name of the exercise just created. It only answers once. */
export function takeExerciseCreated() {
  const name = createdName;
  createdName = undefined;

  return name;
}
