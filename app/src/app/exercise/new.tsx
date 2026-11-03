import { useLocalSearchParams } from 'expo-router';

import { NewExerciseScreen } from '@/features/exercises/new-exercise-screen';

export default function NewExerciseRoute() {
  const { name, groupId } = useLocalSearchParams<{
    name?: string;
    groupId?: string;
  }>();

  return <NewExerciseScreen initialName={name} initialGroupId={groupId} />;
}
