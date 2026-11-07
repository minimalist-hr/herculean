import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  FlatList,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type FlatListInstance,
} from 'react-native';

import type { components } from '@/api/schema';
import { EmptyCard } from '@/components/empty-card';
import { BottomActionBox } from '@/components/bottom-action-box';
import { Button } from '@/components/button';
import { Chip, ChipLink } from '@/components/chip';
import { PlusIcon } from '@/components/icons';
import { dismissNotification, notifyFailure } from '@/components/notifications';
import { ScreenHeading } from '@/components/screen-heading';
import { SearchField } from '@/components/search-field';
import { TextLink } from '@/components/text-link';
import { useCurrentUser } from '@/features/account/use-current-user';
import { SectionTitle } from '@/components/section-title';
import { useTheme } from '@/theme/theme-provider';

import { ExerciseRow } from './exercise-row';
import { ChipsSkeleton, ExercisesSkeleton } from './exercises-skeleton';
import { useDebouncedValue } from './use-debounced-value';
import { useExercises } from './use-exercises';
import { noGroupsMessage, useGroups } from './use-groups';
import { useFloatingRoom } from '@/components/above-tab-bar';

type Exercise = components['schemas']['ExerciseListItemResponse'];

type ListItem =
  | { kind: 'message' }
  | { kind: 'section'; title: string }
  | { kind: 'row'; exercise: Exercise; first: boolean; last: boolean };

const searchWaitMs = 300;

export function ExercisesScreen() {
  const { colors, size, space, text } = useTheme();
  const floatingRoom = useFloatingRoom();
  const router = useRouter();
  const listRef = useRef<FlatListInstance>(null);
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
  const user = useCurrentUser();
  const units = user.data?.units ?? 'metric';

  const failed = groups.isError || exercises.isError;
  const loading = !failed && (groups.isPending || exercises.isPending);
  const list = failed ? [] : (exercises.data ?? []);
  const noFilter = search === '' && groupId === undefined;
  const noGroups = groups.data?.length === 0;
  const noExercises = !failed && !loading && list.length === 0 && noFilter;

  // New results start at the top. The list also never has to clamp its own scroll when it gets shorter.
  useEffect(() => {
    listRef.current?.scrollToOffset({ offset: 0, animated: false });
  }, [search, groupId, created]);

  function changeSearch(text: string) {
    dismissNotification();
    setSearchText(text);
  }

  function pickGroup(id: string | undefined) {
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
      <>
        {!noExercises && (
          <View style={{ paddingHorizontal: size.sidePadding }}>
            <SearchField
              label="Search exercises"
              value={searchText}
              onChangeText={changeSearch}
            />
          </View>
        )}

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
          {groups.data === undefined && <ChipsSkeleton />}
          {groups.data !== undefined && !noExercises && (
            <>
              <Chip
                label="All"
                selected={groupId === undefined}
                onPress={() => {
                  pickGroup(undefined);
                }}
              />
              {groups.data.map((group) => (
                <Chip
                  key={group.id}
                  label={group.name}
                  selected={groupId === group.id}
                  onPress={() => {
                    pickGroup(group.id);
                  }}
                />
              ))}
            </>
          )}
        </ScrollView>
      </>
    );
  }

  function renderMessage() {
    if (loading) {
      return <ExercisesSkeleton />;
    }

    if (failed) {
      return (
        <View style={[styles.message, { paddingTop: space.xl }]}>
          <Text
            accessibilityRole="alert"
            style={[text.body, { color: colors.muted }]}
          >
            Couldn&apos;t load your exercises.
          </Text>
          <TextLink
            label="Try again"
            onPress={() => {
              void groups.refetch();
              void exercises.refetch();
            }}
          />
        </View>
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
      <View
        style={[
          styles.message,
          { gap: space.xs, paddingTop: space.xl, paddingHorizontal: space.xl },
        ]}
      >
        <Text style={[text.statValue, styles.centered, { color: colors.text }]}>
          {search === ''
            ? `No exercises in ${selectedGroup?.name ?? 'this group'}`
            : `No matches for “${search}”`}
        </Text>
        <Text style={[text.meta, styles.centered]}>
          {search === ''
            ? 'Create one to use it in routines and workouts.'
            : 'Check the spelling, or create it as a new exercise.'}
        </Text>
      </View>
    );
  }

  function renderItem(item: ListItem) {
    switch (item.kind) {
      case 'message':
        return (
          <View
            style={{
              paddingTop: space.xs,
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
      {renderTitle()}
      <View style={{ gap: space.sm, paddingBottom: space.md }}>
        {renderControls()}
      </View>
      <FlatList
        ref={listRef}
        data={toItems(list)}
        extraData={[groups.data, loading, failed, units, search, groupId]}
        keyExtractor={keyOf}
        renderItem={({ item }) => renderItem(item)}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        contentContainerStyle={{ paddingBottom: space.xl + floatingRoom }}
      />
      <BottomActionBox aboveTabBar>
        <Button
          label="New exercise"
          variant="secondary"
          icon={PlusIcon}
          muted={noGroups}
          onPress={openNewExercise}
        />
      </BottomActionBox>
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
  message: {
    alignItems: 'center',
  },
  centered: {
    textAlign: 'center',
  },
});
