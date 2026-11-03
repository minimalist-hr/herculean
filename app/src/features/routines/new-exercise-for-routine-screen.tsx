import { useLocalSearchParams, useRouter } from 'expo-router';

import { NewExerciseScreen } from '@/features/exercises/new-exercise-screen';

import { useRoutineDraft } from './routine-draft';

/** Creates an exercise from Add exercise, and comes back with it picked. */
export function NewExerciseForRoutineScreen() {
  const router = useRouter();
  const { setPicked, setCreatedIds } = useRoutineDraft();
  const { name, groupId } = useLocalSearchParams<{
    name?: string;
    groupId?: string;
  }>();

  return (
    <NewExerciseScreen
      back="Add exercise"
      initialName={name}
      initialGroupId={groupId}
      onCreated={(exercise) => {
        setPicked((current) => [
          ...current,
          { id: exercise.id, name: exercise.name },
        ]);
        setCreatedIds((current) => [...current, exercise.id]);
        router.back();
      }}
    />
  );
}
