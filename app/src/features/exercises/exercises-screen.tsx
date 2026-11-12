import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';

import { EmptyCard } from '@/components/empty-card';
import { LoadFailure } from '@/components/load-failure';
import { notifyFailure } from '@/components/notifications';
import { useUnits } from '@/features/account/use-units';

import { bestSetText } from './exercise-row';
import { ExercisesSkeleton } from './exercises-skeleton';
import { GroupedExerciseList } from './grouped-exercise-list';
import { useDebouncedValue } from './use-debounced-value';
import { useExercises } from './use-exercises';
import { noGroupsMessage, useGroups } from './use-groups';

const searchWaitMs = 300;

export function ExercisesScreen() {
  const router = useRouter();
  const [searchText, setSearchText] = useState('');
  const [groupId, setGroupId] = useState<string>();
  // New exercise returns here with its id. Clearing the filters makes sure it is in the list.
  const { created } = useLocalSearchParams<{ created?: string }>();
  const [lastCreated, setLastCreated] = useState(created);
  if (created !== lastCreated) {
    setLastCreated(created);
    setSearchText('');
    setGroupId(undefined);
  }
  const typedSearch = searchText.trim();
  const debouncedSearch = useDebouncedValue(typedSearch, searchWaitMs);
  // Clearing the search shows the whole list right away.
  const search = typedSearch === '' ? '' : debouncedSearch;
  const groups = useGroups();
  const exercises = useExercises(search === '' ? undefined : search, groupId);
  const units = useUnits();

  const failed = exercises.isLoadingError;
  const loading = exercises.isPending;
  const list = failed ? [] : (exercises.data ?? []);
  const noFilter = search === '' && groupId === undefined;
  const noGroups = groups.data?.length === 0;
  const noExercises = !failed && !loading && list.length === 0 && noFilter;
  const nothingToFilter = noGroups
    ? noGroupsMessage
    : 'Create an exercise first.';

  function openNewExercise() {
    if (noGroups) {
      notifyFailure(noGroupsMessage);
      return;
    }

    // It starts from what the list shows at that moment.
    router.push({
      pathname: '/exercise/new',
      params: { name: typedSearch, groupId: groupId ?? '' },
    });
  }

  function renderMessage() {
    if (loading) {
      return <ExercisesSkeleton />;
    }

    if (failed) {
      return (
        <LoadFailure
          message="Couldn’t load your exercises."
          onRetry={() => {
            void exercises.refetch();
          }}
        />
      );
    }

    if (noFilter) {
      return (
        <EmptyCard
          title="No exercises yet"
          message="Create an exercise to use it in routines and workouts."
        />
      );
    }

    const selectedGroup = groups.data?.find((group) => group.id === groupId);

    return (
      <EmptyCard
        title={
          search === ''
            ? `No exercises in ${selectedGroup?.name ?? 'this group'}`
            : `No matches for “${search}”`
        }
        message={
          search === ''
            ? 'Create one to use it in routines and workouts.'
            : 'Check the spelling, or create it as a new exercise.'
        }
      />
    );
  }

  return (
    <GroupedExerciseList
      title="Exercises"
      subtitle="Everything you train, by muscle group."
      searchLabel="Search exercises"
      searchText={searchText}
      onSearchChange={setSearchText}
      filtersMutedReason={noExercises ? nothingToFilter : undefined}
      groups={groups}
      groupId={groupId}
      onPickGroup={setGroupId}
      onOpenGroups={() => {
        router.push('/exercises/groups');
      }}
      // The API sorts by group, so each group's exercises are already together.
      exercises={list.map((exercise) => ({
        id: exercise.id,
        name: exercise.name,
        detail: bestSetText(exercise, units),
        groupName: exercise.groupName,
      }))}
      message={renderMessage()}
      onOpen={(id) => {
        router.push({ pathname: '/exercises/[id]', params: { id } });
      }}
      resetKey={`${search}|${groupId ?? ''}|${created ?? ''}`}
      newButton={{
        label: 'New exercise',
        muted: noGroups,
        onPress: openNewExercise,
      }}
    />
  );
}
