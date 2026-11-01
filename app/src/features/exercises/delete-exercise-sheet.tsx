import { Button } from '@/components/button';
import { notifyFailure } from '@/components/notifications';
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

  return (
    <Sheet
      visible={visible}
      title={`Delete ${exercise.name}?`}
      message="It's removed from your list. Workouts you already logged keep it."
      onClose={onClose}
    >
      <Button
        label="Delete exercise"
        variant="danger"
        waitingLabel="Deleting exercise"
        waiting={deleteExercise.isPending}
        onPress={() => {
          deleteExercise.mutate(undefined, {
            onSuccess: onDeleted,
            // The bar can't show above a sheet, so the sheet makes way for it.
            onError: () => {
              onClose();
              notifyFailure("Couldn't delete the exercise. Try again.");
            },
          });
        }}
      />
      <Button
        label="Cancel"
        variant="secondary"
        dimmed={deleteExercise.isPending}
        onPress={onClose}
      />
    </Sheet>
  );
}
