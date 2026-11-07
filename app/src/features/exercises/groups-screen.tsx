import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { EmptyCard } from '@/components/empty-card';
import { BackLink } from '@/components/back-link';
import { BottomActionBox } from '@/components/bottom-action-box';
import { Button } from '@/components/button';
import { PlusIcon } from '@/components/icons';
import { LoadFailure } from '@/components/load-failure';
import { dismissNotification } from '@/components/notifications';
import { ScreenHeading } from '@/components/screen-heading';
import { SearchField } from '@/components/search-field';
import { Skeleton } from '@/components/skeleton';
import { useTheme } from '@/theme/theme-provider';

import { GroupsList } from './groups-list';
import { useGroupOrder } from './use-group-order';
import { useGroups } from './use-groups';
import { useFloatingRoom } from '@/components/above-tab-bar';

export function GroupsScreen() {
  const { colors, radius, size, space, text } = useTheme();
  const floatingRoom = useFloatingRoom();
  const router = useRouter();
  const groups = useGroups();
  const saveOrder = useGroupOrder();
  const [dragging, setDragging] = useState(false);
  const [searchText, setSearchText] = useState('');
  const search = searchText.trim();
  const searching = search !== '';
  const noGroups = groups.data?.length === 0;

  function renderList() {
    if (groups.data !== undefined) {
      if (noGroups) {
        return (
          <EmptyCard
            title="No groups yet"
            message="Create a group to sort your exercises into."
          />
        );
      }

      const shown = searching
        ? groups.data.filter((group) =>
            group.name.toLowerCase().includes(search.toLowerCase()),
          )
        : groups.data;

      if (shown.length === 0) {
        return (
          <View style={[styles.message, { gap: space.xs, padding: space.xl }]}>
            <Text
              style={[text.statValue, styles.centered, { color: colors.text }]}
            >
              {`No matches for “${search}”`}
            </Text>
            <Text style={[text.meta, styles.centered]}>
              Check the spelling, or create it as a new group.
            </Text>
          </View>
        );
      }

      return (
        <View style={{ gap: space.md }}>
          <GroupsList
            groups={shown}
            locked={searching}
            onDragChange={setDragging}
            onReorder={saveOrder}
            onOpen={(group) => {
              router.push({
                pathname: '/exercises/groups/[id]',
                params: { id: group.id },
              });
            }}
          />
          {!searching && (
            <Text style={[text.body, { color: colors.muted }]}>
              Sort your exercise list. Drag to change the order of the chips.
            </Text>
          )}
        </View>
      );
    }

    if (groups.isError) {
      return (
        <LoadFailure
          message="Couldn't load your groups."
          onRetry={() => {
            void groups.refetch();
          }}
        />
      );
    }

    return (
      <View
        accessible
        accessibilityLabel="Loading groups"
        accessibilityLiveRegion="polite"
        style={{ gap: space.sm }}
      >
        {[80, 70, 100, 70, 80, 60].map((width, index) => (
          <View
            key={index}
            style={[
              styles.skeletonRow,
              {
                gap: space.sm,
                height: size.optionRowMin,
                paddingHorizontal: space.lg,
                borderRadius: radius.card,
                borderColor: colors.border,
                backgroundColor: colors.card,
              },
            ]}
          >
            <Skeleton width={width} height={14} />
            <Skeleton width={90} height={10} />
          </View>
        ))}
      </View>
    );
  }

  return (
    <View style={[styles.screen, { backgroundColor: colors.bg }]}>
      <View
        style={{
          gap: space.lg,
          paddingTop: size.topPaddingSubPage,
          paddingHorizontal: size.sidePadding,
          paddingBottom: space.md,
        }}
      >
        <View style={{ gap: 2 }}>
          <BackLink
            label="Exercises"
            onPress={() => {
              router.back();
            }}
          />
          <ScreenHeading
            title="Groups"
            subtitle="The muscle groups your exercises belong to."
          />
        </View>
        {!noGroups && (
          <SearchField
            label="Search groups"
            value={searchText}
            onChangeText={(value) => {
              dismissNotification();
              setSearchText(value);
            }}
          />
        )}
      </View>
      <ScrollView
        scrollEnabled={!dragging}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        contentContainerStyle={{
          paddingHorizontal: size.sidePadding,
          paddingBottom: space.xl + floatingRoom,
        }}
      >
        {renderList()}
      </ScrollView>
      <BottomActionBox aboveTabBar>
        <Button
          label="New group"
          variant="secondary"
          icon={PlusIcon}
          onPress={() => {
            // The list shows whole on the way back, so the new group is in it.
            setSearchText('');
            router.push({ pathname: '/group/new', params: { name: search } });
          }}
        />
      </BottomActionBox>
    </View>
  );
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
  skeletonRow: {
    justifyContent: 'center',
    borderWidth: 1,
  },
});
