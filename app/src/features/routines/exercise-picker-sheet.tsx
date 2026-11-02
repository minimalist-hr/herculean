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
import { Button } from '@/components/button';
import { Chip } from '@/components/chip';
import { HeaderIconButton } from '@/components/header-icon-button';
import { CheckIcon, PlusIcon } from '@/components/icons';
import { LoadFailure } from '@/components/load-failure';
import { dismissNotification, notifyFailure } from '@/components/notifications';
import { SearchField } from '@/components/search-field';
import { Sheet } from '@/components/sheet';
import { CreateExerciseSheet } from '@/features/exercises/create-exercise-sheet';
import {
  ChipsSkeleton,
  ExercisesSkeleton,
} from '@/features/exercises/exercises-skeleton';
import { useDebouncedValue } from '@/features/exercises/use-debounced-value';
import { useExercises } from '@/features/exercises/use-exercises';
import { useGroups } from '@/features/exercises/use-groups';
import { useTheme } from '@/theme/theme-provider';

type Exercise = components['schemas']['ExerciseListItemResponse'];

type ListItem =
  { kind: 'section'; title: string } | { kind: 'row'; exercise: Exercise };

const searchWaitMs = 300;

export interface PickedExercise {
  id: string;
  name: string;
}

interface ExercisePickerSheetProps {
  visible: boolean;
  /** The exercises the routine has already, which aren't offered. */
  exclude: string[];
  onAdd: (exercises: PickedExercise[]) => void;
  onClose: () => void;
}

/** A full height sheet to pick exercises for a routine. */
export function ExercisePickerSheet({
  visible,
  exclude,
  onAdd,
  onClose,
}: ExercisePickerSheetProps) {
  const { colors, radius, size, space, text } = useTheme();
  const [searchText, setSearchText] = useState('');
  const [groupId, setGroupId] = useState<string>();
  const [picked, setPicked] = useState<PickedExercise[]>([]);
  const [created, setCreated] = useState<string[]>([]);
  const [creating, setCreating] = useState(false);
  const [createForm, setCreateForm] = useState<{
    key: number;
    name: string;
    groupId: string;
  }>();
  const typedSearch = searchText.trim();
  const debouncedSearch = useDebouncedValue(typedSearch, searchWaitMs);
  const search = typedSearch === '' ? '' : debouncedSearch;
  const groups = useGroups();
  const exercises = useExercises(search === '' ? undefined : search, groupId);
  const list = (exercises.data ?? []).filter(
    (exercise) => !exclude.includes(exercise.id),
  );

  function toggle(exercise: Exercise) {
    dismissNotification();
    setPicked((current) =>
      current.some((item) => item.id === exercise.id)
        ? current.filter((item) => item.id !== exercise.id)
        : [...current, { id: exercise.id, name: exercise.name }],
    );
  }

  function openCreate() {
    dismissNotification();
    setCreateForm((form) => ({
      key: (form?.key ?? 0) + 1,
      name: typedSearch,
      groupId: groupId ?? '',
    }));
    setCreating(true);
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
          {created.includes(exercise.id) && (
            <Text style={[text.chip, { color: colors.primaryText }]}>New</Text>
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
    if (exercises.isError) {
      return (
        <LoadFailure
          message="Couldn't load your exercises."
          onRetry={() => {
            void exercises.refetch();
          }}
        />
      );
    }

    if (exercises.isPending) {
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
        <Text style={[text.meta, styles.centered, { marginBottom: space.sm }]}>
          {search === ''
            ? 'Create one to use it in this routine.'
            : 'Check the spelling, or create it as a new exercise.'}
        </Text>
        <View style={styles.stretch}>
          <Button
            label="Create exercise"
            variant="secondary"
            onPress={openCreate}
          />
        </View>
      </View>
    );
  }

  return (
    <>
      <Sheet
        fill
        visible={visible}
        title="Add exercise"
        onClose={onClose}
        body={
          <View style={styles.body}>
            <View style={{ gap: space.sm, paddingBottom: space.md }}>
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
                    onChangeText={setSearchText}
                  />
                </View>
                <HeaderIconButton label="Create exercise" onPress={openCreate}>
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

            <FlatList
              style={styles.body}
              data={toItems(list)}
              extraData={[picked, created]}
              keyExtractor={(item) =>
                item.kind === 'row' ? item.exercise.id : `section:${item.title}`
              }
              ListEmptyComponent={renderEmpty()}
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
          </View>
        }
      >
        <Button
          label={picked.length > 1 ? 'Add exercises' : 'Add exercise'}
          muted={picked.length === 0}
          onPress={() => {
            if (picked.length === 0) {
              notifyFailure('Pick an exercise first.');
              return;
            }

            dismissNotification();
            onAdd(picked);
          }}
        />
        <Button label="Cancel" variant="secondary" onPress={onClose} />
      </Sheet>

      {createForm !== undefined && (
        <CreateExerciseSheet
          key={createForm.key}
          visible={creating}
          initialName={createForm.name}
          initialGroupId={createForm.groupId}
          onCreated={(exercise) => {
            setCreating(false);
            setSearchText('');
            setGroupId(undefined);
            setCreated((current) => [...current, exercise.id]);
            setPicked((current) => [
              ...current,
              { id: exercise.id, name: exercise.name },
            ]);
          }}
          onClose={() => {
            setCreating(false);
          }}
        />
      )}
    </>
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
  body: {
    flex: 1,
  },
  searchRow: {
    flexDirection: 'row',
  },
  search: {
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
  stretch: {
    alignSelf: 'stretch',
  },
});
