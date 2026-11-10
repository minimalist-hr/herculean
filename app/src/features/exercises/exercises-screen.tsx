import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  FlatList,
  ScrollView,
  StyleSheet,
  View,
  type FlatListInstance,
} from 'react-native';

import type { components } from '@/api/schema';
import { EmptyCard } from '@/components/empty-card';
import { LoadFailure } from '@/components/load-failure';
import { NewButton, useNewButtonRoom } from '@/components/new-button';
import { Chip, ChipLink } from '@/components/chip';
import { dismissNotification, notifyFailure } from '@/components/notifications';
import { ScreenHeading } from '@/components/screen-heading';
import { SearchField } from '@/components/search-field';
import {
  StickyControls,
  useStickyControls,
} from '@/components/sticky-controls';
import { useUnits } from '@/features/account/use-units';
import { SectionTitle } from '@/components/section-title';
import { useTheme } from '@/theme/theme-provider';

import { ChipsFailure } from './chips-failure';
import { ExerciseRow } from './exercise-row';
import { ChipsSkeleton, ExercisesSkeleton } from './exercises-skeleton';
import { useDebouncedValue } from './use-debounced-value';
import { useExercises } from './use-exercises';
import { noGroupsMessage, useGroups } from './use-groups';
import { usePageEnd } from '@/components/above-tab-bar';

type Exercise = components['schemas']['ExerciseListItemResponse'];

type ListItem =
  | { kind: 'heading' }
  | { kind: 'controls' }
  | { kind: 'message' }
  | { kind: 'section'; title: string }
  | { kind: 'row'; exercise: Exercise; first: boolean; last: boolean };

const searchWaitMs = 300;

export function ExercisesScreen() {
  const { colors, size, space } = useTheme();
  const pageEnd = usePageEnd();
  const newButtonRoom = useNewButtonRoom();
  const router = useRouter();
  const listRef = useRef<FlatListInstance>(null);
  const sticky = useStickyControls();
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

  // New results start at the top, under the controls if the heading had scrolled away.
  const { resultsOffset } = sticky;
  useEffect(() => {
    listRef.current?.scrollToOffset({
      offset: resultsOffset(),
      animated: false,
    });
  }, [search, groupId, created, resultsOffset]);

  function changeSearch(text: string) {
    dismissNotification();
    setSearchText(text);
  }

  function pickGroup(id: string | undefined) {
    if (noExercises) {
      notifyFailure(nothingToFilter);
      return;
    }

    dismissNotification();
    setGroupId(id);
  }

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

  function renderTitle() {
    return (
      <View
        onLayout={sticky.onHeadingLayout}
        style={{
          paddingTop: size.topPaddingTab,
          paddingHorizontal: size.sidePadding,
          paddingBottom: space.lg,
        }}
      >
        <ScreenHeading
          title="Exercises"
          subtitle="Everything you train, by muscle group."
        />
      </View>
    );
  }

  function renderControls() {
    return (
      <StickyControls lined={sticky.lined}>
        <View style={{ paddingHorizontal: size.sidePadding }}>
          <SearchField
            label="Search exercises"
            value={searchText}
            onChangeText={changeSearch}
            mutedReason={noExercises ? nothingToFilter : undefined}
          />
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{
            gap: size.gap.chips,
            paddingHorizontal: size.sidePadding,
          }}
        >
          <ChipLink
            label="Groups"
            onPress={() => {
              router.push('/exercises/groups');
            }}
          />
          {groups.isPending && <ChipsSkeleton />}
          {groups.isLoadingError && (
            <ChipsFailure
              onRetry={() => {
                void groups.refetch();
              }}
            />
          )}
          {groups.data !== undefined && (
            <>
              <Chip
                label="All"
                selected={groupId === undefined}
                muted={noExercises}
                onPress={() => {
                  pickGroup(undefined);
                }}
              />
              {groups.data.map((group) => (
                <Chip
                  key={group.id}
                  label={group.name}
                  selected={groupId === group.id}
                  muted={noExercises}
                  onPress={() => {
                    pickGroup(group.id);
                  }}
                />
              ))}
            </>
          )}
        </ScrollView>
      </StickyControls>
    );
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

  function renderItem(item: ListItem) {
    switch (item.kind) {
      case 'heading':
        return renderTitle();
      case 'controls':
        return renderControls();
      case 'message':
        return (
          <View
            style={{
              paddingTop: space.md,
              paddingHorizontal: size.sidePadding,
            }}
          >
            {renderMessage()}
          </View>
        );
      case 'section':
        return (
          <SectionTitle
            style={{
              paddingTop: space.md,
              paddingBottom: space.xs,
              paddingHorizontal: size.sidePadding,
            }}
          >
            {item.title}
          </SectionTitle>
        );
      case 'row':
        return (
          <View style={{ paddingHorizontal: size.sidePadding }}>
            <ExerciseRow
              exercise={item.exercise}
              units={units}
              first={item.first}
              last={item.last}
              onPress={() => {
                router.push({
                  pathname: '/exercises/[id]',
                  params: { id: item.exercise.id },
                });
              }}
            />
          </View>
        );
    }
  }

  return (
    <View style={[styles.screen, { backgroundColor: colors.bg }]}>
      <FlatList
        ref={listRef}
        data={[{ kind: 'heading' }, { kind: 'controls' }, ...toItems(list)]}
        stickyHeaderIndices={[1]}
        onScroll={sticky.onScroll}
        scrollEventThrottle={16}
        extraData={[
          groups.data,
          loading,
          failed,
          units,
          search,
          searchText,
          groupId,
          sticky.lined,
        ]}
        keyExtractor={keyOf}
        renderItem={({ item }) => renderItem(item)}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        contentContainerStyle={{ paddingBottom: pageEnd + newButtonRoom }}
      />
      <NewButton
        label="New exercise"
        muted={noGroups}
        onPress={openNewExercise}
      />
    </View>
  );
}

/** The API sorts by group, so each group's exercises are already together. */
function toItems(exercises: readonly Exercise[]) {
  const items: ListItem[] = [];
  if (exercises.length === 0) {
    items.push({ kind: 'message' });
  }

  exercises.forEach((exercise, index) => {
    const first = exercises[index - 1]?.groupName !== exercise.groupName;
    const last = exercises[index + 1]?.groupName !== exercise.groupName;
    if (first) {
      items.push({ kind: 'section', title: exercise.groupName });
    }
    items.push({ kind: 'row', exercise, first, last });
  });

  return items;
}

function keyOf(item: ListItem) {
  switch (item.kind) {
    case 'section':
      return `section:${item.title}`;
    case 'row':
      return item.exercise.id;
    default:
      return item.kind;
  }
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
});
