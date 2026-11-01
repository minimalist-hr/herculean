import type { components } from '@/api/schema';

import { ExerciseForm } from './exercise-form';
import { useCreateExercise } from './use-create-exercise';

interface CreateExerciseScreenProps {
  /** What the user was searching for, if anything. */
  initialName: string;
  /** The group the user had picked, if any. */
  initialGroupId: string;
  onCreated: (exercise: components['schemas']['ExerciseResponse']) => void;
  onCancel: () => void;
}

export function CreateExerciseScreen({
  initialName,
  initialGroupId,
  onCreated,
  onCancel,
}: CreateExerciseScreenProps) {
  const createExercise = useCreateExercise();

  return (
    <ExerciseForm
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
      onCancel={onCancel}
    />
  );
}
