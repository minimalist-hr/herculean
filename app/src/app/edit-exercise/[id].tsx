import { useLocalSearchParams, useRouter } from 'expo-router';

import { EditExerciseScreen } from '@/features/exercises/edit-exercise-screen';

export default function EditExerciseRoute() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  return (
    <EditExerciseScreen
      id={id}
      onSaved={() => {
        router.back();
      }}
      onCancel={() => {
        router.back();
      }}
    />
  );
}
