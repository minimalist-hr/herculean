import type { components } from '@/api/schema';

import { ExerciseFormSheet } from './exercise-form';
import { useCreateExercise } from './use-create-exercise';

interface CreateExerciseSheetProps {
  visible: boolean;
  /** What the user was searching for, if anything. */
  initialName: string;
  /** The group the user had picked, if any. */
  initialGroupId: string;
  onCreated: (exercise: components['schemas']['ExerciseResponse']) => void;
  onClose: () => void;
}

export function CreateExerciseSheet({
  visible,
  initialName,
  initialGroupId,
  onCreated,
  onClose,
}: CreateExerciseSheetProps) {
  const createExercise = useCreateExercise();

  return (
    <ExerciseFormSheet
      visible={visible}
      title="Create exercise"
      subtitle="It’s added to your exercise list and can be used in any workout."
      initialValues={{
        name: initialName,
        groupId: initialGroupId,
        alsoWorksGroupIds: [],
      }}
      saving={createExercise.isPending}
      onSave={async (values) => {
        onCreated(await createExercise.mutateAsync(values));
      }}
      onClose={onClose}
    />
  );
}
