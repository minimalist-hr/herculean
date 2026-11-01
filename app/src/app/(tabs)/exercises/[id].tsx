import { useLocalSearchParams } from 'expo-router';

import { ExerciseScreen } from '@/features/exercises/exercise-screen';

export default function ExerciseRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();

  return <ExerciseScreen id={id} />;
}
