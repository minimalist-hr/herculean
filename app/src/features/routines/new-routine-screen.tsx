import { useRouter } from 'expo-router';

import { notifySuccess } from '@/components/notifications';

import { savedMessage } from './saved-message';
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
      subtitle="Pick its days now or later."
      initialName={initialName}
      saving={createRoutine.isPending}
      onSave={async (name, weekdays, exercises) => {
        const routine = await createRoutine.mutateAsync({
          name,
          weekdays,
          exercises,
        });
        notifySuccess(savedMessage(routine, 'created'));
        router.back();
      }}
    />
  );
}
