import { useRouter } from 'expo-router';

import { notifySuccess } from '@/components/notifications';

import { RoutineEditor } from './routine-editor';
import { useCreateRoutine } from './use-create-routine';

/** Starts from what the user was searching for, if anything. */
export function NewRoutineScreen({
  initialName = '',
}: {
  initialName?: string;
}) {
  const router = useRouter();
  const createRoutine = useCreateRoutine();

  return (
    <RoutineEditor
      back="Routines"
      title="New routine"
      subtitle="Not planned yet. Add it to days in the week plan after saving."
      initialName={initialName}
      saving={createRoutine.isPending}
      onSave={async (name, exercises) => {
        const routine = await createRoutine.mutateAsync({ name, exercises });
        notifySuccess(`${routine.name} created.`);
        router.back();
      }}
    />
  );
}
