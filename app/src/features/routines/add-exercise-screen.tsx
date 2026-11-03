import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import type { components } from '@/api/schema';
import { BackLink } from '@/components/back-link';
import { BottomActionBox } from '@/components/bottom-action-box';
import { Button } from '@/components/button';
import { Chip } from '@/components/chip';
import { CheckIcon, PlusIcon } from '@/components/icons';
import { LoadFailure } from '@/components/load-failure';
import { dismissNotification, notifyFailure } from '@/components/notifications';
import { ScreenHeading } from '@/components/screen-heading';
import { SearchField } from '@/components/search-field';
import { useLeaveGuard } from '@/components/use-leave-guard';
import {
  ChipsSkeleton,
  ExercisesSkeleton,
} from '@/features/exercises/exercises-skeleton';
import { useDebouncedValue } from '@/features/exercises/use-debounced-value';
import { useExercises } from '@/features/exercises/use-exercises';
import { noGroupsMessage, useGroups } from '@/features/exercises/use-groups';
import { useTheme } from '@/theme/theme-provider';

import { startingTargets, useRoutineDraft } from './routine-draft';

type Exercise = components['schemas']['ExerciseListItemResponse'];

type ListItem =
  { kind: 'section'; title: string } | { kind: 'row'; exercise: Exercise };

const searchWaitMs = 300;

/** Picks exercises for a routine. */
export function AddExerciseScreen({ back }: { back: string }) {
  const { colors, radius, size, space, text } = useTheme();
  const router = useRouter();
  const { pages, exercises, setExercises, picked, setPicked, createdIds } =
    useRoutineDraft();
  const guard = useLeaveGuard(picked.length > 0);
  const [searchText, setSearchText] = useState('');
  const [groupId, setGroupId] = useState<string>();
  // A new exercise comes back picked. Clearing the filters makes sure it is in the list.
  const [lastCreated, setLastCreated] = useState(createdIds.at(-1));
  if (createdIds.at(-1) !== lastCreated) {
    setLastCreated(createdIds.at(-1));
    setSearchText('');
    setGroupId(undefined);
  }
  const typedSearch = searchText.trim();
  const debouncedSearch = useDebouncedValue(typedSearch, searchWaitMs);
  const search = typedSearch === '' ? '' : debouncedSearch;
  const groups = useGroups();
  const found = useExercises(search === '' ? undefined : search, groupId);
  const list = (found.data ?? []).filter(
    (exercise) => !exercises.some((item) => item.exerciseId === exercise.id),
  );

  function toggle(exercise: Exercise) {
    dismissNotification();
    setPicked((current) =>
      current.some((item) => item.id === exercise.id)
        ? current.filter((item) => item.id !== exercise.id)
        : [...current, { id: exercise.id, name: exercise.name }],
    );
  }

  function renderRow(exercise: Exercise) {
    const selected = picked.some((item) => item.id === exercise.id);

    return (
      <View style={{ paddingHorizontal: size.sidePadding }}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={exercise.name}
          accessibilityState={{ selected }}
          onPress={() => {
            toggle(exercise);
          }}
          style={[
            styles.row,
            {
              gap: space.md,
              minHeight: size.listRowMin,
              paddingVertical: space.sm,
              paddingHorizontal: space.md,
              marginBottom: space.xs,
              borderRadius: radius.card,
              borderColor: selected ? colors.primaryText : colors.border,
              backgroundColor: colors.card,
            },
          ]}
        >
          <View style={styles.rowText}>
            <Text style={[text.listItemName, { color: colors.text }]}>
              {exercise.name}
            </Text>
            <Text style={text.meta}>{exercise.groupName}</Text>
          </View>
          {createdIds.includes(exercise.id) && (
            <Text style={[text.eyebrow, { color: colors.primaryText }]}>
              New
            </Text>
          )}
          <View
            style={[
              styles.check,
              {
                borderRadius: radius.check,
                borderColor: selected ? colors.primary : colors.border,
                backgroundColor: selected ? colors.primary : 'transparent',
              },
            ]}
          >
            {selected && <CheckIcon color={colors.onPrimary} size={16} />}
          </View>
        </Pressable>
      </View>
    );
  }

  function renderEmpty() {
    if (found.isError) {
      return (
        <LoadFailure
          message="Couldn't load your exercises."
          onRetry={() => {
            void found.refetch();
          }}
        />
      );
    }

    if (found.isPending) {
      return (
        <View style={{ paddingHorizontal: size.sidePadding }}>
          <ExercisesSkeleton />
        </View>
      );
    }

    return (
      <View
        style={[
          styles.message,
          {
            gap: space.xs,
            paddingTop: space.xl,
            paddingHorizontal: size.sidePadding + space.xl,
          },
        ]}
      >
        <Text style={[text.statValue, styles.centered, { color: colors.text }]}>
          {search === '' ? 'No exercises to add' : `No matches for “${search}”`}
        </Text>
        <Text style={[text.meta, styles.centered]}>
          {search === ''
            ? 'Create one to use it in this routine.'
            : 'Check the spelling, or create it as a new exercise.'}
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.screen, { backgroundColor: colors.bg }]}>
      <View
        style={{
          gap: space.lg,
          paddingTop: size.topPaddingSubPage,
          paddingBottom: space.md,
        }}
      >
        <View style={{ gap: 2, paddingHorizontal: size.sidePadding }}>
          <BackLink
            label={back}
            onPress={() => {
              router.back();
            }}
          />
          <ScreenHeading
            title="Add exercise"
            subtitle="Pick the exercises to add to this routine."
          />
        </View>
        <View style={{ gap: space.sm }}>
          <View style={{ paddingHorizontal: size.sidePadding }}>
            <SearchField
              label="Search exercises"
              value={searchText}
              onChangeText={setSearchText}
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
            {groups.data === undefined ? (
              <ChipsSkeleton />
            ) : (
              <>
                <Chip
                  label="All"
                  selected={groupId === undefined}
                  onPress={() => {
                    setGroupId(undefined);
                  }}
                />
                {groups.data.map((group) => (
                  <Chip
                    key={group.id}
                    label={group.name}
                    selected={groupId === group.id}
                    onPress={() => {
                      setGroupId(group.id);
                    }}
                  />
                ))}
              </>
            )}
          </ScrollView>
        </View>
      </View>

      <FlatList
        style={styles.screen}
        data={toItems(list)}
        extraData={[picked, createdIds]}
        keyExtractor={(item) =>
          item.kind === 'row' ? item.exercise.id : `section:${item.title}`
        }
        ListEmptyComponent={renderEmpty()}
        ListFooterComponent={
          // A line and a gap, so it doesn't read as adding to the group above it.
          <View
            style={{
              marginTop: space.xl,
              marginBottom: space.xl,
              marginHorizontal: size.sidePadding,
              paddingTop: space.xl,
              borderTopWidth: 1,
              borderTopColor: colors.border,
            }}
          >
            <Button
              label="New exercise"
              variant="secondary"
              icon={PlusIcon}
              muted={groups.data?.length === 0}
              onPress={() => {
                if (groups.data?.length === 0) {
                  notifyFailure(noGroupsMessage);
                  return;
                }

                dismissNotification();
                router.push(
                  pages.newExercise({
                    name: typedSearch,
                    groupId: groupId ?? '',
                  }),
                );
              }}
            />
          </View>
        }
        renderItem={({ item }) =>
          item.kind === 'row' ? (
            renderRow(item.exercise)
          ) : (
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
          )
        }
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
      />

      <BottomActionBox>
        <Button
          label={picked.length > 1 ? 'Add exercises' : 'Add exercise'}
          muted={picked.length === 0}
          onPress={() => {
            if (picked.length === 0) {
              notifyFailure('Pick an exercise first.');
              return;
            }

            dismissNotification();
            setExercises((current) => [
              ...current,
              ...picked.map((exercise) => ({
                exerciseId: exercise.id,
                name: exercise.name,
                ...startingTargets,
              })),
            ]);
            guard.leave(() => {
              router.back();
            });
          }}
        />
      </BottomActionBox>
      {guard.sheet}
    </View>
  );
}

/** The API sorts by group, so each group's exercises are already together. */
function toItems(exercises: readonly Exercise[]) {
  const items: ListItem[] = [];
  exercises.forEach((exercise, index) => {
    if (exercises[index - 1]?.groupName !== exercise.groupName) {
      items.push({ kind: 'section', title: exercise.groupName });
    }
    items.push({ kind: 'row', exercise });
  });

  return items;
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
  },
  rowText: {
    flex: 1,
    gap: 2,
  },
  check: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  message: {
    alignItems: 'center',
  },
  centered: {
    textAlign: 'center',
  },
});
