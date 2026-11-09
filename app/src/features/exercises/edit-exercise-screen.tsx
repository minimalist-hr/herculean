import { useRouter } from 'expo-router';

import type { components } from '@/api/schema';
import { FormPage } from '@/components/form-page';
import { LoadFailure } from '@/components/load-failure';
import { notifySuccess } from '@/components/notifications';

import { ExerciseFormPage } from './exercise-form';
import { DetailsSkeleton } from './exercises-skeleton';
import { useExercise } from './use-exercise';
import { useUpdateExercise } from './use-update-exercise';

const title = 'Edit exercise';

export function EditExerciseScreen({ id }: { id: string }) {
  const exercise = useExercise(id);

  if (exercise.data !== undefined) {
    return <Form exercise={exercise.data} />;
  }

  return (
    <FormPage back="Exercise" title={title}>
      {exercise.isLoadingError ? (
        <LoadFailure
          message="Couldn't load this exercise."
          onRetry={() => {
            void exercise.refetch();
          }}
        />
      ) : (
        <DetailsSkeleton label="Loading the exercise" />
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

  return (
    <ExerciseFormPage
      back={exercise.name}
      title={title}
      subtitle="Changes show everywhere it’s used, including past workouts."
      initialValues={{
        name: exercise.name,
        groupId: exercise.group.id,
        alsoWorksGroupIds: exercise.alsoWorksGroups.map((group) => group.id),
      }}
      saving={updateExercise.isPending}
      onSave={async (values) => {
        const saved = await updateExercise.mutateAsync(values);
        notifySuccess(`${saved.name} saved.`);
        router.back();
      }}
    />
  );
}
