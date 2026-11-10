import { useLocalSearchParams, useRouter } from 'expo-router';
import type { Dispatch, SetStateAction } from 'react';

import type { PickedExercise } from './exercise-picker';
import { NewExerciseScreen } from './new-exercise-screen';
import { useGroups } from './use-groups';

/** Creates an exercise from a picker, and comes back with it picked. */
export function NewExerciseToPickScreen({
  setPicked,
  setCreatedIds,
  swapping = false,
}: {
  /** The picker takes one, so this replaces what was picked. */
  swapping?: boolean;
  setPicked: Dispatch<SetStateAction<PickedExercise[]>>;
  setCreatedIds: Dispatch<SetStateAction<string[]>>;
}) {
  const router = useRouter();
  const groups = useGroups();
  const { name, groupId } = useLocalSearchParams<{
    name?: string;
    groupId?: string;
  }>();

  return (
    <NewExerciseScreen
      back={swapping ? 'Swap exercise' : 'Add exercise'}
      initialName={name}
      initialGroupId={groupId}
      onCreated={(exercise) => {
        setPicked((current) => [
          ...(swapping ? [] : current),
          {
            id: exercise.id,
            name: exercise.name,
            groupId: exercise.groupId,
            groupName:
              groups.data?.find((group) => group.id === exercise.groupId)
                ?.name ?? '',
          },
        ]);
        setCreatedIds((current) => [...current, exercise.id]);
        router.back();
      }}
    />
  );
}
