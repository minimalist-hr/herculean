import { useLocalSearchParams } from 'expo-router';

import { NewExerciseToPickScreen } from '@/features/exercises/new-exercise-to-pick-screen';
import { useWorkoutPicks } from '@/features/workout/workout-picks';

export default function NewExerciseForWorkoutRoute() {
  const { setPicked, setCreatedIds } = useWorkoutPicks();
  const { swap } = useLocalSearchParams<{ swap?: string }>();

  return (
    <NewExerciseToPickScreen
      aboveTabBar
      swapping={swap !== undefined}
      setPicked={setPicked}
      setCreatedIds={setCreatedIds}
    />
  );
}
