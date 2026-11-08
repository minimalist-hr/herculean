import { ExercisePicker } from '@/features/exercises/exercise-picker';
import { NewExerciseToPickScreen } from '@/features/exercises/new-exercise-to-pick-screen';

import { addedExercise, useEditWorkoutDraft } from './edit-workout-draft';

/** Picks exercises to add to a saved workout being edited. They are saved with Save workout. */
export function AddToEditedWorkoutScreen() {
  const { workout, exercises, setExercises, picked, setPicked, createdIds } =
    useEditWorkoutDraft();

  return (
    <ExercisePicker
      back="Edit workout"
      subtitle="Pick the exercises to add to this workout."
      nothingToAdd="Create one to use it in this workout."
      excludedIds={exercises.map((exercise) => exercise.exerciseId)}
      picked={picked}
      setPicked={setPicked}
      createdIds={createdIds}
      newExercisePage={(params) => ({
        pathname: '/workout/edit/[id]/new-exercise',
        params: { id: workout.id, ...params },
      })}
      aboveTabBar
      onDone={(leave) => {
        setExercises((current) => [...current, ...picked.map(addedExercise)]);
        leave();
      }}
    />
  );
}

/** Creates an exercise from Add exercise, and comes back with it picked. */
export function NewExerciseForEditedWorkoutScreen() {
  const { setPicked, setCreatedIds } = useEditWorkoutDraft();

  return (
    <NewExerciseToPickScreen
      aboveTabBar
      setPicked={setPicked}
      setCreatedIds={setCreatedIds}
    />
  );
}
