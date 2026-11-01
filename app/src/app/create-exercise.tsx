import { useLocalSearchParams, useRouter } from 'expo-router';

import { CreateExerciseScreen } from '@/features/exercises/create-exercise-screen';
import { noteExerciseCreated } from '@/features/exercises/exercise-notice';

export default function CreateExerciseRoute() {
  const router = useRouter();
  const { name, groupId } = useLocalSearchParams<{
    name?: string;
    groupId?: string;
  }>();

  return (
    <CreateExerciseScreen
      initialName={name ?? ''}
      initialGroupId={groupId ?? ''}
      onCreated={(exercise) => {
        noteExerciseCreated(exercise.name);
        router.back();
      }}
      onCancel={() => {
        router.back();
      }}
    />
  );
}
