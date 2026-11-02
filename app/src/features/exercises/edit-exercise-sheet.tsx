import type { components } from '@/api/schema';

import { ExerciseFormSheet } from './exercise-form';
import { useUpdateExercise } from './use-update-exercise';

interface EditExerciseSheetProps {
  visible: boolean;
  exercise: components['schemas']['ExerciseDetailsResponse'];
  onSaved: (exercise: components['schemas']['ExerciseResponse']) => void;
  onClose: () => void;
}

export function EditExerciseSheet({
  visible,
  exercise,
  onSaved,
  onClose,
}: EditExerciseSheetProps) {
  const updateExercise = useUpdateExercise(exercise.id);

  return (
    <ExerciseFormSheet
      visible={visible}
      title="Edit exercise"
      subtitle="Changes show everywhere it’s used, including past workouts."
      initialValues={{
        name: exercise.name,
        groupId: exercise.group.id,
        alsoWorksGroupIds: exercise.alsoWorksGroups.map((group) => group.id),
      }}
      saving={updateExercise.isPending}
      onSave={async (values) => {
        onSaved(await updateExercise.mutateAsync(values));
      }}
      onClose={onClose}
    />
  );
}
