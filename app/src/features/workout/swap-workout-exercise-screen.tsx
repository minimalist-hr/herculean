import { ExercisePicker } from '@/features/exercises/exercise-picker';

import { useSwapExercise } from './use-swap-exercise';
import { useWorkout } from './use-workout';
import { useWorkoutPicks } from './workout-picks';

/** Picks one exercise to do instead of another, starting from the same group. */
export function SwapWorkoutExerciseScreen({
  id,
  workoutExerciseId,
}: {
  id: string;
  workoutExerciseId: string;
}) {
  const workout = useWorkout(id);
  const swap = useSwapExercise(id);
  const { picked, setPicked, createdIds } = useWorkoutPicks();
  const exercises = workout.data?.exercises ?? [];
  const exercise = exercises.find((item) => item.id === workoutExerciseId);

  // Logging opens this with the workout already loaded.
  if (exercise === undefined) {
    return null;
  }

  return (
    <ExercisePicker
      back="Logging"
      swapping
      startGroupId={exercise.groupId}
      subtitle={`Pick an exercise to do instead of ${exercise.name}.`}
      nothingToAdd="Try another group, or create a new exercise."
      excludedIds={exercises.map((item) => item.exerciseId)}
      picked={picked}
      setPicked={setPicked}
      createdIds={createdIds}
      newExercisePage={(params) => ({
        pathname: '/workout/log/[id]/add/new-exercise',
        params: { id, swap: workoutExerciseId, ...params },
      })}
      aboveTabBar
      waiting={swap.isPending}
      onDone={(leave) => {
        const [pick] = picked;
        swap.mutate(
          { exercise, newExerciseId: pick.id, newName: pick.name },
          { onSuccess: leave },
        );
      }}
    />
  );
}
