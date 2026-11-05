import { Stack } from 'expo-router';

import { usePageOptions } from '@/components/use-page-options';
import { WorkoutPicksProvider } from '@/features/workout/workout-picks';

export default function AddWorkoutExerciseLayout() {
  const pageOptions = usePageOptions();

  return (
    <WorkoutPicksProvider>
      <Stack screenOptions={pageOptions} />
    </WorkoutPicksProvider>
  );
}
