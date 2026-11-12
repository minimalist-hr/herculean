import { useEffect, useRef, type ReactNode } from 'react';
import {
  FlatList,
  ScrollView,
  StyleSheet,
  View,
  type FlatListInstance,
} from 'react-native';

import { usePageEnd } from '@/components/above-tab-bar';
import { BackLink } from '@/components/back-link';
import { Chip, ChipLink } from '@/components/chip';
import { NewButton, useNewButtonRoom } from '@/components/new-button';
import { dismissNotification, notifyFailure } from '@/components/notifications';
import { ScreenHeading } from '@/components/screen-heading';
import { SearchField } from '@/components/search-field';
import { SectionTitle } from '@/components/section-title';
import {
  StickyControls,
  useStickyControls,
} from '@/components/sticky-controls';
import { useTheme } from '@/theme/theme-provider';

import { ChipsFailure } from './chips-failure';
import { ExerciseRow } from './exercise-row';
import { ChipsSkeleton } from './exercises-skeleton';

/** An exercise as a row of the list, in its group's card. */
export interface GroupedExercise {
  id: string;
  name: string;
  /** The line below the name, if any. */
  detail?: string;
  groupName: string;
}

interface GroupChips {
  data?: readonly { id: string; name: string }[];
  isPending: boolean;
  isLoadingError: boolean;
  refetch: () => unknown;
}

interface GroupedExerciseListProps {
  title: string;
  subtitle: string;
  /** A page opened from another has a back link; a tab's first page has none. */
  back?: { label: string; onPress: () => void };
  searchLabel: string;
  searchText: string;
  onSearchChange: (text: string) => void;
  /** Why search and the chips can't be used yet. They look muted and tapping a chip says why. */
  filtersMutedReason?: string;
  groups: GroupChips;
  groupsFailure?: string;
  groupId: string | undefined;
  onPickGroup: (id: string | undefined) => void;
  onOpenGroups: () => void;
  /** Each group's exercises together, in the order the cards show. */
  exercises: readonly GroupedExercise[];
  /** Shows in the list's place when there are no exercises to show. */
  message: ReactNode;
  onOpen: (id: string) => void;
  /** When it changes, the results start at the top again, such as after a new search. */
  resetKey: string;
  newButton: { label: string; muted: boolean; onPress: () => void };
}

type ListItem =
  | { kind: 'heading' }
  | { kind: 'controls' }
  | { kind: 'message' }
  | { kind: 'section'; title: string }
  | { kind: 'row'; exercise: GroupedExercise; first: boolean; last: boolean };

/** Search, group chips and the exercises by group, with New floating at the bottom right. */
export function GroupedExerciseList({
  title,
  subtitle,
  back,
  searchLabel,
  searchText,
  onSearchChange,
  filtersMutedReason,
  groups,
  groupsFailure,
  groupId,
  onPickGroup,
  onOpenGroups,
  exercises,
  message,
  onOpen,
  resetKey,
  newButton,
}: GroupedExerciseListProps) {
  const { colors, size, space } = useTheme();
  const pageEnd = usePageEnd();
  const newButtonRoom = useNewButtonRoom();
  const listRef = useRef<FlatListInstance>(null);
  const sticky = useStickyControls();
  const muted = filtersMutedReason !== undefined;

  // New results start at the top, under the controls if the heading had scrolled away.
  const { resultsOffset } = sticky;
  useEffect(() => {
    listRef.current?.scrollToOffset({
      offset: resultsOffset(),
      animated: false,
    });
  }, [resetKey, resultsOffset]);

  function pickGroup(id: string | undefined) {
    if (filtersMutedReason !== undefined) {
      notifyFailure(filtersMutedReason);
      return;
    }

    dismissNotification();
    onPickGroup(id);
  }

  function renderTitle() {
    return (
      <View
        onLayout={sticky.onHeadingLayout}
        style={{
          gap: space.xxxs,
          paddingTop:
            back === undefined ? size.topPaddingTab : size.topPaddingSubPage,
          paddingHorizontal: size.sidePadding,
          paddingBottom: space.lg,
        }}
      >
        {back !== undefined && (
          <BackLink label={back.label} onPress={back.onPress} />
        )}
        <ScreenHeading title={title} subtitle={subtitle} />
      </View>
    );
  }

  function renderControls() {
    return (
      <StickyControls lined={sticky.lined}>
        <View style={{ paddingHorizontal: size.sidePadding }}>
          <SearchField
            label={searchLabel}
            value={searchText}
            onChangeText={(text) => {
              dismissNotification();
              onSearchChange(text);
            }}
            mutedReason={filtersMutedReason}
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
          <ChipLink label="Groups" onPress={onOpenGroups} />
          {groups.isPending && <ChipsSkeleton />}
          {groups.isLoadingError && (
            <ChipsFailure
              message={groupsFailure}
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
                muted={muted}
                onPress={() => {
                  pickGroup(undefined);
                }}
              />
              {groups.data.map((group) => (
                <Chip
                  key={group.id}
                  label={group.name}
                  selected={groupId === group.id}
                  muted={muted}
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
            {message}
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
              name={item.exercise.name}
              detail={item.exercise.detail}
              first={item.first}
              last={item.last}
              onPress={() => {
                onOpen(item.exercise.id);
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
        data={[
          { kind: 'heading' },
          { kind: 'controls' },
          ...toItems(exercises),
        ]}
        stickyHeaderIndices={[1]}
        onScroll={sticky.onScroll}
        scrollEventThrottle={16}
        extraData={[groups.data, message, searchText, groupId, sticky.lined]}
        keyExtractor={keyOf}
        renderItem={({ item }) => renderItem(item)}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        contentContainerStyle={{ paddingBottom: pageEnd + newButtonRoom }}
      />
      <NewButton
        label={newButton.label}
        muted={newButton.muted}
        onPress={newButton.onPress}
      />
    </View>
  );
}

function toItems(exercises: readonly GroupedExercise[]) {
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
