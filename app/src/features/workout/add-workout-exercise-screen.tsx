import { ExercisePicker } from '@/features/exercises/exercise-picker';

import { useAddExercises } from './use-add-exercises';
import { useWorkout } from './use-workout';
import { useWorkoutPicks } from './workout-picks';

/** Picks exercises to add to a workout. */
export function AddWorkoutExerciseScreen({ id }: { id: string }) {
  const workout = useWorkout(id);
  const add = useAddExercises(id);
  const { picked, setPicked, createdIds } = useWorkoutPicks();

  return (
    <ExercisePicker
      back="Logging"
      subtitle="Pick the exercises to add to this workout."
      nothingToAdd="Create one to use it in this workout."
      excludedIds={(workout.data?.exercises ?? []).map(
        (exercise) => exercise.exerciseId,
      )}
      picked={picked}
      setPicked={setPicked}
      createdIds={createdIds}
      newExercisePage={(params) => ({
        pathname: '/workout/log/[id]/add/new-exercise',
        params: { id, ...params },
      })}
      waiting={add.isPending}
      onDone={(leave) => {
        add.mutate(
          picked.map((exercise) => exercise.id),
          { onSuccess: leave },
        );
      }}
    />
  );
}
