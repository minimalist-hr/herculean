import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';

import { EmptyCard } from '@/components/empty-card';
import { LoadFailure } from '@/components/load-failure';
import { notifyFailure, notifySuccess } from '@/components/notifications';
import {
  ExerciseFormPage,
  type ExerciseErrorCodes,
} from '@/features/exercises/exercise-form';
import type { ExerciseValues } from '@/features/exercises/exercise-schema';
import { ExercisesSkeleton } from '@/features/exercises/exercises-skeleton';
import {
  GroupedExerciseList,
  type GroupedExercise,
} from '@/features/exercises/grouped-exercise-list';
import { noGroupsMessage } from '@/features/exercises/use-groups';

import {
  maxStarterExercises,
  useCreateStarterExercise,
  useStarterExercises,
  useStarterGroups,
  useUpdateStarterExercise,
  type StarterExercise,
  type StarterGroup,
} from './use-starter-content';

const groupsFailure = 'Couldn’t load starter groups.';

const starterCodes: ExerciseErrorCodes = {
  nameTaken: 'starter_exercise.name_taken',
  limitReached: 'starter_exercise.limit_reached',
};

/** The names of the other groups an exercise works, in the groups' order. */
export function alsoWorksNames(
  exercise: StarterExercise,
  groups: readonly StarterGroup[],
) {
  return groups
    .filter((group) => exercise.alsoWorksGroupIds.includes(group.id))
    .map((group) => group.name);
}

/** "Also Shoulders, Triceps" below a row's name, or nothing. */
export function alsoWorksDetail(
  exercise: StarterExercise,
  groups: readonly StarterGroup[],
) {
  const names = alsoWorksNames(exercise, groups);

  return names.length === 0 ? undefined : `Also ${names.join(', ')}`;
}

/** Each group's exercises together, in the groups' order. */
function toRows(
  exercises: readonly StarterExercise[],
  groups: readonly StarterGroup[],
): GroupedExercise[] {
  return groups.flatMap((group) =>
    exercises
      .filter((exercise) => exercise.groupId === group.id)
      .map((exercise) => ({
        id: exercise.id,
        name: exercise.name,
        detail: alsoWorksDetail(exercise, groups),
        groupName: group.name,
      })),
  );
}

/** The exercises every new account starts with, by group. */
export function StarterExercisesScreen() {
  const router = useRouter();
  const groups = useStarterGroups();
  const exercises = useStarterExercises();
  const [searchText, setSearchText] = useState('');
  const [groupId, setGroupId] = useState<string>();
  const search = searchText.trim().toLowerCase();

  // A row needs its group's name, so the list waits for both.
  const failed = exercises.isLoadingError || groups.isLoadingError;
  const all =
    exercises.data === undefined || groups.data === undefined
      ? undefined
      : toRows(exercises.data, groups.data);
  // Group names are unique, so a row's group name tells its group.
  const selectedGroup = groups.data?.find((group) => group.id === groupId);
  const shown = (all ?? []).filter(
    (row) =>
      row.name.toLowerCase().includes(search) &&
      (selectedGroup === undefined || row.groupName === selectedGroup.name),
  );
  const noGroups = groups.data?.length === 0;
  const noExercises = all?.length === 0;
  const full = (exercises.data?.length ?? 0) >= maxStarterExercises;

  function newMutedReason() {
    if (noGroups) {
      return noGroupsMessage;
    }

    return full ? 'At most 500 starter exercises.' : undefined;
  }

  function renderMessage() {
    if (failed) {
      return (
        <LoadFailure
          message="Couldn’t load starter exercises."
          onRetry={() => {
            void exercises.refetch();
            void groups.refetch();
          }}
        />
      );
    }

    if (all === undefined) {
      return <ExercisesSkeleton />;
    }

    if (noExercises) {
      return (
        <EmptyCard
          title="No starter exercises"
          message="New accounts start with none."
        />
      );
    }

    return (
      <EmptyCard
        title={
          search === ''
            ? `No starter exercises in ${selectedGroup?.name ?? 'this group'}`
            : `No matches for “${searchText.trim()}”`
        }
        message={
          search === ''
            ? 'Create one to give it to new accounts.'
            : 'Check the spelling, or create it as a new starter exercise.'
        }
      />
    );
  }

  const mutedReason = newMutedReason();

  return (
    <GroupedExerciseList
      title="Starter exercises"
      subtitle="What new accounts start with. Accounts already made keep theirs."
      back={{
        label: 'Settings',
        onPress: () => {
          router.back();
        },
      }}
      searchLabel="Search starter exercises"
      searchText={searchText}
      onSearchChange={setSearchText}
      filtersMutedReason={
        noExercises
          ? (newMutedReason() ?? 'Create a starter exercise first.')
          : undefined
      }
      groups={groups}
      groupsFailure={groupsFailure}
      groupId={groupId}
      onPickGroup={setGroupId}
      onOpenGroups={() => {
        router.push('/admin/settings/starter/groups');
      }}
      exercises={shown}
      message={renderMessage()}
      onOpen={(id) => {
        router.push({
          pathname: '/admin/settings/starter/[id]',
          params: { id },
        });
      }}
      resetKey={`${search}|${groupId ?? ''}`}
      newButton={{
        label: 'New starter exercise',
        muted: mutedReason !== undefined,
        onPress: () => {
          if (mutedReason !== undefined) {
            notifyFailure(mutedReason);
            return;
          }

          // It starts from what the list shows at that moment.
          router.push({
            pathname: '/admin/settings/starter/new',
            params: { name: searchText.trim(), groupId: groupId ?? '' },
          });
        },
      }}
    />
  );
}

function StarterExerciseForm({
  back,
  title,
  initialValues,
  saving,
  onSave,
}: Pick<
  React.ComponentProps<typeof ExerciseFormPage>,
  'back' | 'title' | 'initialValues' | 'saving'
> & {
  onSave: (values: ExerciseValues) => Promise<string>;
}) {
  const router = useRouter();
  const groups = useStarterGroups();

  return (
    <ExerciseFormPage
      back={back}
      title={title}
      initialValues={initialValues}
      groups={groups}
      groupsFailure={groupsFailure}
      codes={starterCodes}
      saving={saving}
      onSave={async (values) => {
        notifySuccess(await onSave(values));
        router.back();
      }}
    />
  );
}

export function NewStarterExerciseScreen() {
  const { name = '', groupId = '' } = useLocalSearchParams<{
    name?: string;
    groupId?: string;
  }>();
  const create = useCreateStarterExercise();

  return (
    <StarterExerciseForm
      back="Starter exercises"
      title="New starter exercise"
      initialValues={{ name, groupId, alsoWorksGroupIds: [] }}
      saving={create.isPending}
      onSave={async (values) => {
        await create.mutateAsync(values);

        return `${values.name.trim()} created.`;
      }}
    />
  );
}

export function EditStarterExerciseScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const exercises = useStarterExercises();
  const update = useUpdateStarterExercise(id);
  const exercise = exercises.data?.find((saved) => saved.id === id);

  // It opens from the list, so the exercise is already read; a missing one is gone.
  if (exercise === undefined) {
    return null;
  }

  return (
    <StarterExerciseForm
      back={exercise.name}
      title="Edit starter exercise"
      initialValues={{
        name: exercise.name,
        groupId: exercise.groupId,
        alsoWorksGroupIds: exercise.alsoWorksGroupIds,
      }}
      saving={update.isPending}
      onSave={async (values) => {
        await update.mutateAsync(values);

        return `${values.name.trim()} saved.`;
      }}
    />
  );
}
