import { useLocalSearchParams } from 'expo-router';

import { EditExerciseScreen } from '@/features/exercises/edit-exercise-screen';

export default function EditExerciseRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();

  return <EditExerciseScreen id={id} />;
}
