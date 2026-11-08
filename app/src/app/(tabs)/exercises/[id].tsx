import { useLocalSearchParams } from 'expo-router';

import { ExerciseScreen } from '@/features/exercises/exercise-screen';

export default function ExerciseRoute() {
  const { id, from } = useLocalSearchParams<{ id: string; from?: string }>();

  return <ExerciseScreen id={id} openedFromHome={from === 'home'} />;
}
