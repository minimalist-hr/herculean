import { useRouter } from 'expo-router';

import type { components } from '@/api/schema';
import { notifySuccess } from '@/components/notifications';

import { ExerciseFormPage } from './exercise-form';
import { useCreateExercise } from './use-create-exercise';

interface NewExerciseScreenProps {
  /** The screen its back link returns to. */
  back?: string;
  /** What the user was searching for, if anything. */
  initialName?: string;
  /** The group the user had picked, if any. */
  initialGroupId?: string;
  /** Where saving leads, when that isn't the exercise list. */
  onCreated?: (exercise: components['schemas']['ExerciseResponse']) => void;
}

export function NewExerciseScreen({
  back = 'Exercises',
  initialName = '',
  initialGroupId = '',
  onCreated,
}: NewExerciseScreenProps) {
  const router = useRouter();
  const createExercise = useCreateExercise();

  return (
    <ExerciseFormPage
      back={back}
      title="New exercise"
      subtitle="It’s added to your exercise list and can be used in any workout."
      initialValues={{
        name: initialName,
        groupId: initialGroupId,
        alsoWorksGroupIds: [],
      }}
      saving={createExercise.isPending}
      onSave={async (values) => {
        const exercise = await createExercise.mutateAsync(values);
        notifySuccess(`${exercise.name} created.`);
        if (onCreated === undefined) {
          router.dismissTo({
            pathname: '/exercises',
            params: { created: exercise.id },
          });
        } else {
          onCreated(exercise);
        }
      }}
    />
  );
}
