import { RoutineEditor } from './routine-editor';
import { useCreateRoutine } from './use-create-routine';

interface NewRoutineSheetProps {
  visible: boolean;
  onCreated: (name: string) => void;
  onClose: () => void;
}

export function NewRoutineSheet({
  visible,
  onCreated,
  onClose,
}: NewRoutineSheetProps) {
  const createRoutine = useCreateRoutine();

  return (
    <RoutineEditor
      visible={visible}
      title="New routine"
      subtitle="Not planned yet. Add it to days in the week plan after saving."
      initialName=""
      initialExercises={[]}
      saving={createRoutine.isPending}
      onSave={async (name, exercises) => {
        const routine = await createRoutine.mutateAsync({ name, exercises });
        onCreated(routine.name);
      }}
      onClose={onClose}
    />
  );
}
