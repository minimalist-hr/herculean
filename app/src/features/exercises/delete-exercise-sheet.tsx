import { afterSheetsClose } from '@/components/notifications';
import { Button } from '@/components/button';
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
  const deleteExercise = useDeleteExercise();

  return (
    <Sheet
      visible={visible}
      title={`Delete ${exercise.name}?`}
      message="It’s removed from your list. Workouts you already logged keep it."
      onClose={onClose}
    >
      <Button
        label="Delete exercise"
        variant="danger"
        waitingLabel="Deleting exercise"
        waiting={deleteExercise.isPending}
        onPress={() => {
          deleteExercise.mutate(exercise, {
            onSuccess: () => {
              afterSheetsClose(onDeleted);
            },
          });
        }}
      />
    </Sheet>
  );
}
