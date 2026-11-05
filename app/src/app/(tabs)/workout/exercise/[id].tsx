import { useLocalSearchParams } from 'expo-router';

import { ExerciseScreen } from '@/features/exercises/exercise-screen';

export default function WorkoutExerciseRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();

  return <ExerciseScreen id={id} backLabel="Logging" />;
}
