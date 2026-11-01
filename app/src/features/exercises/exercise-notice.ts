interface ExerciseNotice {
  kind: 'created' | 'deleted';
  name: string;
}

let notice: ExerciseNotice | undefined;

/** Tells the exercise list what was just created. */
export function noteExerciseCreated(name: string) {
  notice = { kind: 'created', name };
}

/** Tells the exercise list what was just deleted. */
export function noteExerciseDeleted(name: string) {
  notice = { kind: 'deleted', name };
}

/** What just happened to an exercise. It only answers once. */
export function takeExerciseNotice() {
  const taken = notice;
  notice = undefined;

  return taken;
}
