import { createContext, use, useMemo, useState, type ReactNode } from 'react';

import type { components } from '@/api/schema';
import type { PickedExercise } from '@/features/exercises/exercise-picker';

type Workout = components['schemas']['WorkoutDetailsResponse'];
type WorkoutExercise = components['schemas']['WorkoutExerciseResponse'];

/** Matches the server's starting targets for an added exercise. */
const startingTargets = { sets: 3, repsFrom: 8, repsTo: 10 };

let nextLocalId = 0;

/** An ID for something made while editing. The server gives it a real one on save. */
export function localId() {
  nextLocalId += 1;

  return `local-${String(nextLocalId)}`;
}

/** A picked exercise as it starts in the workout: the starting targets, at 0 kg and the low end of the reps. */
export function addedExercise(picked: PickedExercise): WorkoutExercise {
  return {
    id: localId(),
    exerciseId: picked.id,
    name: picked.name,
    groupId: picked.groupId,
    groupName: picked.groupName,
    targetSets: startingTargets.sets,
    targetRepsFrom: startingTargets.repsFrom,
    targetRepsTo: startingTargets.repsTo,
    sets: Array.from({ length: startingTargets.sets }, (_, order) => ({
      id: localId(),
      order,
      weightKg: 0,
      reps: startingTargets.repsFrom,
      checked: true,
    })),
    lastTime: null,
  };
}

function useDraftState(workout: Workout) {
  const [exercises, setExercises] = useState(workout.exercises);
  const [picked, setPicked] = useState<PickedExercise[]>([]);
  const [createdIds, setCreatedIds] = useState<string[]>([]);

  return useMemo(
    () => ({
      workout,
      exercises,
      setExercises,
      picked,
      setPicked,
      createdIds,
      setCreatedIds,
    }),
    [createdIds, exercises, picked, workout],
  );
}

const EditWorkoutDraftContext = createContext<ReturnType<
  typeof useDraftState
> | null>(null);

/** Keeps a saved workout that is being edited, which the edit and picker pages work on. Nothing is sent until Save workout. */
export function EditWorkoutDraftProvider({
  workout,
  children,
}: {
  workout: Workout;
  children: ReactNode;
}) {
  const draft = useDraftState(workout);

  return (
    <EditWorkoutDraftContext.Provider value={draft}>
      {children}
    </EditWorkoutDraftContext.Provider>
  );
}

export function useEditWorkoutDraft() {
  const draft = use(EditWorkoutDraftContext);
  if (draft === null) {
    throw new Error('useEditWorkoutDraft needs an EditWorkoutDraftProvider.');
  }

  return draft;
}
