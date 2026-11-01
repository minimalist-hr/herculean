import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type FlatListInstance,
} from 'react-native';

import type { components } from '@/api/schema';
import { Button } from '@/components/button';
import { Chip } from '@/components/chip';
import { HeaderIconButton } from '@/components/header-icon-button';
import { PlusIcon } from '@/components/icons';
import { dismissNotification } from '@/components/notifications';
import { ScreenHeading } from '@/components/screen-heading';
import { SearchField } from '@/components/search-field';
import { TextLink } from '@/components/text-link';
import { useCurrentUser } from '@/features/account/use-current-user';
import { useTheme } from '@/theme/theme-provider';

import { takeExerciseCreated } from './exercise-notice';
import { ExerciseRow } from './exercise-row';
import { ChipsSkeleton, ExercisesSkeleton } from './exercises-skeleton';
import { useDebouncedValue } from './use-debounced-value';
import { useExercises } from './use-exercises';
import { useGroups } from './use-groups';

type Exercise = components['schemas']['ExerciseListItemResponse'];

type ListItem =
  | { kind: 'message' }
  | { kind: 'section'; title: string }
  | { kind: 'row'; exercise: Exercise; first: boolean; last: boolean };

const searchWaitMs = 300;

export function ExercisesScreen() {
  const { colors, radius, size, space, text } = useTheme();
  const router = useRouter();
  const listRef = useRef<FlatListInstance>(null);
  const [searchText, setSearchText] = useState('');
  const [groupId, setGroupId] = useState<string>();
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
  const noExercises = !failed && !loading && list.length === 0 && noFilter;

  // New results start at the top. The list also never has to clamp its own scroll when it gets shorter.
  useEffect(() => {
    listRef.current?.scrollToOffset({ offset: 0, animated: false });
  }, [search, groupId]);

  // The list stays open behind create exercise, so it checks each time it comes back.
  // Clearing the filters makes sure the new exercise is in the list.
  useFocusEffect(
    useCallback(() => {
      if (takeExerciseCreated()) {
        setSearchText('');
        setGroupId(undefined);
        listRef.current?.scrollToOffset({ offset: 0, animated: false });
      }
    }, []),
  );

  function changeSearch(text: string) {
    dismissNotification();
    setSearchText(text);
  }

  function pickGroup(id: string | undefined) {
    dismissNotification();
    setGroupId(id);
  }

  function openCreateExercise() {
    router.push({
      pathname: '/create-exercise',
      params: { name: typedSearch, groupId: groupId ?? '' },
    });
  }

  function renderTitle() {
    return (
      <View
        style={[
          styles.title,
          {
            paddingTop: size.topPaddingTab,
            paddingHorizontal: size.sidePadding,
            paddingBottom: space.lg,
          },
        ]}
      >
        <ScreenHeading label="Your training" title="Exercises" />
        {/* The link's padding is its touch target, so its text lines up with the edge. */}
        <View style={{ marginRight: -space.sm }}>
          <TextLink
            label="Groups"
            onPress={() => {
              router.push('/exercises/groups');
            }}
          />
        </View>
      </View>
    );
  }

  function renderControls() {
    return (
      <View
        style={{
          gap: space.sm,
          paddingBottom: space.md,
        }}
      >
        <View
          style={[
            styles.searchRow,
            { gap: space.sm, paddingHorizontal: size.sidePadding },
          ]}
        >
          <View style={styles.search}>
            <SearchField
              label="Search exercises"
              value={searchText}
              onChangeText={changeSearch}
            />
          </View>
          <HeaderIconButton
            label="Create exercise"
            onPress={openCreateExercise}
          >
            <PlusIcon color={colors.text} size={20} />
          </HeaderIconButton>
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
          {groups.data === undefined ? (
            <ChipsSkeleton />
          ) : (
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
      </View>
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
        <View style={{ gap: space.lg }}>
          <View
            style={[
              styles.noExercises,
              {
                gap: space.xs,
                padding: space.xl,
                borderRadius: radius.card,
                borderColor: colors.border,
              },
            ]}
          >
            <Text style={[text.listItemName, { color: colors.text }]}>
              No exercises yet
            </Text>
            <Text style={[text.meta, styles.centered]}>
              Create an exercise to use it in routines and workouts.
            </Text>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Create exercise"
            onPress={openCreateExercise}
            style={[
              styles.dashedAction,
              {
                gap: space.sm,
                height: size.dashedAction,
                borderRadius: radius.card,
                borderColor: colors.border,
              },
            ]}
          >
            <PlusIcon color={colors.text} size={16} />
            <Text style={[text.secondaryButton, { color: colors.text }]}>
              Create exercise
            </Text>
          </Pressable>
        </View>
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
        <Text style={[text.meta, styles.centered, { marginBottom: space.sm }]}>
          {search === ''
            ? 'Create one to use it in routines and workouts.'
            : 'Check the spelling, or create it as a new exercise.'}
        </Text>
        <View style={styles.stretch}>
          <Button
            label="Create exercise"
            variant="secondary"
            onPress={openCreateExercise}
          />
        </View>
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
          <Text
            style={[
              text.eyebrow,
              {
                paddingTop: space.md,
                paddingBottom: space.xs,
                paddingHorizontal: size.sidePadding,
              },
            ]}
          >
            {item.title}
          </Text>
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
      {!noExercises && renderControls()}
      <FlatList
        ref={listRef}
        data={toItems(list)}
        extraData={[groups.data, loading, failed, units, search, groupId]}
        keyExtractor={keyOf}
        renderItem={({ item }) => renderItem(item)}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        contentContainerStyle={{ paddingBottom: space.xl }}
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
  title: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  searchRow: {
    flexDirection: 'row',
  },
  search: {
    flex: 1,
  },
  dashedAction: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderStyle: 'dashed',
  },
  noExercises: {
    alignItems: 'center',
    borderWidth: 1,
    borderStyle: 'dashed',
  },
  message: {
    alignItems: 'center',
  },
  centered: {
    textAlign: 'center',
  },
  stretch: {
    alignSelf: 'stretch',
  },
});
