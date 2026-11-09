import { useRouter } from 'expo-router';

import { notifySuccess } from '@/components/notifications';
import type { Weekday } from '@/formats/formats';

import { savedMessage } from './saved-message';
import { RoutineEditor } from './routine-editor';
import { useCreateRoutine } from './use-create-routine';

/** Starts from what the user was searching for and the rest day they tapped, if any. */
export function NewRoutineScreen({
  initialName = '',
  initialWeekdays,
}: {
  initialName?: string;
  initialWeekdays?: Weekday[];
}) {
  const router = useRouter();
  const createRoutine = useCreateRoutine();

  return (
    <RoutineEditor
      back="Routines"
      title="New routine"
      subtitle="Pick its days now or later."
      initialName={initialName}
      initialWeekdays={initialWeekdays}
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
