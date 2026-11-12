import { useRouter } from 'expo-router';

import type { components } from '@/api/schema';
import { FormPage } from '@/components/form-page';
import { LoadFailure } from '@/components/load-failure';
import { NotLoadedButton } from '@/components/not-loaded-button';
import { notifySuccess } from '@/components/notifications';

import { ExerciseFormPage, ExerciseFormSkeleton } from './exercise-form';
import { useExercise } from './use-exercise';
import { useUpdateExercise } from './use-update-exercise';
import { useGroups } from './use-groups';

const title = 'Edit exercise';
const subtitle = 'Changes show everywhere it’s used, including past workouts.';

export function EditExerciseScreen({ id }: { id: string }) {
  const exercise = useExercise(id);

  if (exercise.data !== undefined) {
    return <Form exercise={exercise.data} />;
  }

  return (
    <FormPage
      back="Exercise"
      title={title}
      subtitle={subtitle}
      action={<NotLoadedButton label="Save exercise" />}
    >
      {exercise.isLoadingError ? (
        <LoadFailure
          message="Couldn’t load this exercise."
          onRetry={() => {
            void exercise.refetch();
          }}
        />
      ) : (
        <ExerciseFormSkeleton />
      )}
    </FormPage>
  );
}

function Form({
  exercise,
}: {
  exercise: components['schemas']['ExerciseDetailsResponse'];
}) {
  const router = useRouter();
  const updateExercise = useUpdateExercise(exercise.id);
  const groups = useGroups();

  return (
    <ExerciseFormPage
      back={exercise.name}
      title={title}
      subtitle={subtitle}
      initialValues={{
        name: exercise.name,
        groupId: exercise.group.id,
        alsoWorksGroupIds: exercise.alsoWorksGroups.map((group) => group.id),
      }}
      groups={groups}
      saving={updateExercise.isPending}
      onSave={async (values) => {
        const saved = await updateExercise.mutateAsync(values);
        notifySuccess(`${saved.name} saved.`);
        router.back();
      }}
    />
  );
}
