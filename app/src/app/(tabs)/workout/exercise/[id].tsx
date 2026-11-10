import { useLocalSearchParams } from 'expo-router';

import { ExerciseScreen } from '@/features/exercises/exercise-screen';

export default function WorkoutExerciseRoute() {
  const { id, from } = useLocalSearchParams<{ id: string; from?: string }>();

  return <ExerciseScreen id={id} from={from ?? 'logging'} />;
}
