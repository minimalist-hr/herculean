import { Stack, useRouter } from 'expo-router';

import { FormPage } from '@/components/form-page';
import { LoadFailure } from '@/components/load-failure';
import { notifySuccess } from '@/components/notifications';
import { usePageOptions } from '@/components/use-page-options';
import { DetailsSkeleton } from '@/features/exercises/exercises-skeleton';

import { savedMessage } from './saved-message';
import { RoutineDraftProvider } from './routine-draft';
import { RoutineEditor } from './routine-editor';
import { useRoutine } from './use-routine';
import { useUpdateRoutine } from './use-update-routine';

const title = 'Edit routine';

/** Loads the routine, then keeps it as the draft that the edit pages work on. */
export function EditRoutineDraft({ id }: { id: string }) {
  const pageOptions = usePageOptions();
  const routine = useRoutine(id);

  if (routine.data === undefined) {
    return (
      <FormPage back="Routine" title={title}>
        {routine.isLoadingError ? (
          <LoadFailure
            message="Couldn't load this routine."
            onRetry={() => {
              void routine.refetch();
            }}
          />
        ) : (
          <DetailsSkeleton label="Loading the routine" />
        )}
      </FormPage>
    );
  }

  return (
    <RoutineDraftProvider
      routineId={id}
      initialExercises={routine.data.exercises}
    >
      <Stack screenOptions={pageOptions} />
    </RoutineDraftProvider>
  );
}

export function EditRoutineScreen({ id }: { id: string }) {
  const router = useRouter();
  const routine = useRoutine(id);
  const updateRoutine = useUpdateRoutine(id);

  return (
    <RoutineEditor
      back={routine.data?.name ?? 'Routine'}
      title={title}
      subtitle="Changes apply to new workouts. Logged workouts stay as they are."
      initialName={routine.data?.name ?? ''}
      initialWeekdays={routine.data?.weekdays}
      saving={updateRoutine.isPending}
      onSave={async (name, weekdays, exercises) => {
        const saved = await updateRoutine.mutateAsync({
          name,
          weekdays,
          exercises,
        });
        notifySuccess(savedMessage(saved, 'saved'));
        router.back();
      }}
    />
  );
}
