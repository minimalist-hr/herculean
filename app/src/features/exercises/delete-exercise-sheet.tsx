import { Button } from '@/components/button';
import { FormError } from '@/components/form-error';
import { Sheet } from '@/components/sheet';

import { useDeleteExercise } from './use-delete-exercise';

interface DeleteExerciseSheetProps {
  exercise: { id: string; name: string };
  visible: boolean;
  onClose: () => void;
  onDeleted: () => void;
}

export function DeleteExerciseSheet({
  exercise,
  visible,
  onClose,
  onDeleted,
}: DeleteExerciseSheetProps) {
  const deleteExercise = useDeleteExercise(exercise.id);

  function close() {
    deleteExercise.reset();
    onClose();
  }

  return (
    <Sheet
      visible={visible}
      title={`Delete ${exercise.name}?`}
      message="It's removed from your list. Workouts you already logged keep it."
      onClose={close}
    >
      {deleteExercise.isError && (
        <FormError message="Couldn't delete the exercise. Try again." />
      )}
      <Button
        label="Delete exercise"
        variant="danger"
        waitingLabel="Deleting exercise"
        waiting={deleteExercise.isPending}
        onPress={() => {
          deleteExercise.mutate(undefined, { onSuccess: onDeleted });
        }}
      />
      <Button
        label="Cancel"
        variant="secondary"
        dimmed={deleteExercise.isPending}
        onPress={close}
      />
    </Sheet>
  );
}
