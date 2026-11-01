import { useRouter } from 'expo-router';
import { View } from 'react-native';

import type { components } from '@/api/schema';
import { BackLink } from '@/components/back-link';
import { useTheme } from '@/theme/theme-provider';

import { ExerciseForm } from './exercise-form';
import { ExerciseLoadFailure } from './exercise-load-failure';
import { ExerciseSkeleton } from './exercises-skeleton';
import { useExercise } from './use-exercise';
import { useUpdateExercise } from './use-update-exercise';

type Exercise = components['schemas']['ExerciseDetailsResponse'];

interface EditExerciseScreenProps {
  id: string;
  onSaved: (exercise: components['schemas']['ExerciseResponse']) => void;
  onCancel: () => void;
}

export function EditExerciseScreen({
  id,
  onSaved,
  onCancel,
}: EditExerciseScreenProps) {
  const { colors, size } = useTheme();
  const router = useRouter();
  const exercise = useExercise(id);

  if (exercise.data !== undefined) {
    return (
      <Form exercise={exercise.data} onSaved={onSaved} onCancel={onCancel} />
    );
  }

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: colors.bg,
        paddingTop: size.topPaddingSubPage,
        paddingHorizontal: size.sidePadding,
      }}
    >
      <BackLink
        label="Exercise"
        onPress={() => {
          router.back();
        }}
      />
      {exercise.isError ? (
        <ExerciseLoadFailure
          onRetry={() => {
            void exercise.refetch();
          }}
        />
      ) : (
        <ExerciseSkeleton />
      )}
    </View>
  );
}

function Form({
  exercise,
  onSaved,
  onCancel,
}: Omit<EditExerciseScreenProps, 'id'> & { exercise: Exercise }) {
  const updateExercise = useUpdateExercise(exercise.id);

  return (
    <ExerciseForm
      title="Edit exercise"
      subtitle="Changes show everywhere it’s used, including past workouts."
      initialValues={{
        name: exercise.name,
        groupId: exercise.group.id,
        alsoWorksGroupIds: exercise.alsoWorksGroups.map((group) => group.id),
      }}
      saving={updateExercise.isPending}
      onSave={async (values) => {
        onSaved(await updateExercise.mutateAsync(values));
      }}
      onCancel={onCancel}
    />
  );
}
