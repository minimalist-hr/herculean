import { useLocalSearchParams } from 'expo-router';

import { ExerciseScreen } from '@/features/exercises/exercise-screen';

export default function ExerciseRoute() {
  const { id, back } = useLocalSearchParams<{ id: string; back?: string }>();

  return <ExerciseScreen id={id} back={back} />;
}
