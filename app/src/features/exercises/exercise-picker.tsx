import { useRouter, type Href } from 'expo-router';
import { useState, type Dispatch, type SetStateAction } from 'react';
import { FlatList, ScrollView, StyleSheet, Text, View } from 'react-native';

import type { components } from '@/api/schema';
import { BackLink } from '@/components/back-link';
import { joinedCardStyle } from '@/components/joined-cards';
import { BottomActionBox } from '@/components/bottom-action-box';
import { Button } from '@/components/button';
import { Chip } from '@/components/chip';
import { CheckIcon, PlusIcon } from '@/components/icons';
import { LoadFailure } from '@/components/load-failure';
import { dismissNotification, notifyFailure } from '@/components/notifications';
import { ScreenHeading } from '@/components/screen-heading';
import { SearchField } from '@/components/search-field';
import { useLeaveGuard } from '@/components/use-leave-guard';
import { useCurrentUser } from '@/features/account/use-current-user';
import { SectionTitle } from '@/components/section-title';
import { useTheme } from '@/theme/theme-provider';

import { Tappable } from '@/components/tappable';

import { bestSetText } from './exercise-row';
import { ChipsSkeleton, ExercisesSkeleton } from './exercises-skeleton';
import { useDebouncedValue } from './use-debounced-value';
import { useExercises } from './use-exercises';
import { noGroupsMessage, useGroups } from './use-groups';

type Exercise = components['schemas']['ExerciseListItemResponse'];

export interface PickedExercise {
  id: string;
  name: string;
  groupId: string;
  groupName: string;
}

interface ExercisePickerProps {
  /** The screen the back link returns to. */
  back: string;
  /** What the page does, when it is more than adding. It also names the action. */
  swapping?: boolean;
  /** The group its chip starts on. */
  startGroupId?: string;
  subtitle: string;
  /** Says where a created exercise can be used, when there is nothing to pick. */
  nothingToAdd: string;
  /** Exercises already in what this adds to, which aren't offered. */
  excludedIds: string[];
  picked: PickedExercise[];
  setPicked: Dispatch<SetStateAction<PickedExercise[]>>;
  /** The exercises created while picking, newest last. */
  createdIds: string[];
  newExercisePage: (params: { name: string; groupId: string }) => Href;
  /** It opens inside a tab, so its actions sit on the tab bar. */
  aboveTabBar?: boolean;
  /** Whether what was picked is being saved. */
  waiting?: boolean;
  /** Takes what was picked. Calling leave closes the page, without asking about the picks. */
  onDone: (leave: () => void) => void;
}

interface Row {
  kind: 'row';
  exercise: Exercise;
  /** The row above in the same group, if any. */
  previous: Exercise | undefined;
  first: boolean;
  last: boolean;
}

type ListItem = Row | { kind: 'section'; title: string };

const searchWaitMs = 300;

/** Search, group chips and a list to pick exercises from, with New exercise after it. */
export function ExercisePicker({
  back,
  swapping = false,
  startGroupId,
  subtitle,
  nothingToAdd,
  excludedIds,
  picked,
  setPicked,
  createdIds,
  newExercisePage,
  aboveTabBar = false,
  waiting = false,
  onDone,
}: ExercisePickerProps) {
  const { colors, radius, size, space, text } = useTheme();
  const router = useRouter();
  const guard = useLeaveGuard(picked.length > 0);
  const [searchText, setSearchText] = useState('');
  const [groupId, setGroupId] = useState(startGroupId);
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
  const user = useCurrentUser();
  const units = user.data?.units ?? 'metric';
  const found = useExercises(search === '' ? undefined : search, groupId);
  const list = (found.data ?? []).filter(
    (exercise) => !excludedIds.includes(exercise.id),
  );

  function toggle(exercise: Exercise) {
    dismissNotification();
    const pick = {
      id: exercise.id,
      name: exercise.name,
      groupId: exercise.groupId,
      groupName: exercise.groupName,
    };
    setPicked((current) => {
      if (current.some((item) => item.id === exercise.id)) {
        return current.filter((item) => item.id !== exercise.id);
      }

      // A swap takes one, so a new pick replaces the last.
      return swapping ? [pick] : [...current, pick];
    });
  }

  function renderRow({ exercise, previous, first, last }: Row) {
    const selected = isPicked(exercise);
    const lineColor = (highlighted: boolean) =>
      highlighted ? colors.primaryText : colors.border;

    return (
      <View style={{ paddingHorizontal: size.sidePadding }}>
        <Tappable
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
              paddingHorizontal: space.lg,
              marginBottom: last ? space.xs : 0,
              ...joinedCardStyle({
                withPrevious: !first,
                withNext: !last,
                gap: 0,
                radius: radius.card,
              }),
              borderColor: lineColor(selected),
              // Each row's top line is the one above's bottom line, so it shows a pick above too.
              borderTopColor: lineColor(
                selected || (previous !== undefined && isPicked(previous)),
              ),
              backgroundColor: colors.card,
            },
          ]}
        >
          <View style={styles.rowText}>
            <Text style={[text.listItemName, { color: colors.text }]}>
              {exercise.name}
            </Text>
            <Text style={text.meta}>{bestSetText(exercise, units)}</Text>
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
        </Tappable>
      </View>
    );
  }

  const actionLabel = swapping
    ? 'Swap exercise'
    : picked.length > 1
      ? 'Add exercises'
      : 'Add exercise';
  const waitingLabel = swapping
    ? 'Swapping exercise'
    : picked.length > 1
      ? 'Adding exercises'
      : 'Adding exercise';

  function isPicked(exercise: Exercise) {
    return picked.some((item) => item.id === exercise.id);
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
          {search !== ''
            ? `No matches for “${search}”`
            : swapping
              ? 'No exercises to swap to'
              : 'No exercises to add'}
        </Text>
        <Text style={[text.meta, styles.centered]}>
          {search === ''
            ? nothingToAdd
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
            title={swapping ? 'Swap exercise' : 'Add exercise'}
            subtitle={subtitle}
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
                  newExercisePage({
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
            renderRow(item)
          ) : (
            <SectionTitle
              style={{
                paddingTop: space.md,
                paddingBottom: space.xs,
                paddingHorizontal: size.sidePadding,
              }}
            >
              {item.title}
            </SectionTitle>
          )
        }
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
      />

      <BottomActionBox aboveTabBar={aboveTabBar}>
        <Button
          label={actionLabel}
          waitingLabel={waitingLabel}
          waiting={waiting}
          muted={picked.length === 0}
          onPress={() => {
            if (picked.length === 0) {
              notifyFailure('Pick an exercise first.');
              return;
            }

            dismissNotification();
            onDone(() => {
              guard.leave(() => {
                router.back();
              });
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
    const previous = index > 0 ? exercises[index - 1] : undefined;
    const next =
      index < exercises.length - 1 ? exercises[index + 1] : undefined;
    const first = previous?.groupName !== exercise.groupName;
    if (first) {
      items.push({ kind: 'section', title: exercise.groupName });
    }
    items.push({
      kind: 'row',
      exercise,
      previous: first ? undefined : previous,
      first,
      last: next?.groupName !== exercise.groupName,
    });
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
