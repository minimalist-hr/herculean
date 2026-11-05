import { useLocalSearchParams } from 'expo-router';

import { AddWorkoutExerciseScreen } from '@/features/workout/add-workout-exercise-screen';
import { SwapWorkoutExerciseScreen } from '@/features/workout/swap-workout-exercise-screen';

/** Picks exercises for a workout: to add, or with `swap`, one to do instead of that exercise. */
export default function PickWorkoutExerciseRoute() {
  const { id, swap } = useLocalSearchParams<{ id: string; swap?: string }>();

  return swap === undefined ? (
    <AddWorkoutExerciseScreen id={id} />
  ) : (
    <SwapWorkoutExerciseScreen id={id} workoutExerciseId={swap} />
  );
}
