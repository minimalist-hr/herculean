import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import { usePageEnd } from '@/components/above-tab-bar';
import { BackLink } from '@/components/back-link';
import {
  DraggableList,
  DraggableListSkeleton,
} from '@/components/draggable-list';
import { LoadFailure } from '@/components/load-failure';
import { ScreenHeading } from '@/components/screen-heading';
import { SkeletonGroup } from '@/components/skeleton';
import { useTheme } from '@/theme/theme-provider';

import { GroupSummary } from './groups-list';
import { useGroupOrder } from './use-group-order';
import { useGroups } from './use-groups';

/** Reorders the groups, which sorts the exercise list and the chips. Each drop saves, so there is no Save button. */
export function ReorderGroupsScreen() {
  const { colors, size, space } = useTheme();
  const pageEnd = usePageEnd();
  const router = useRouter();
  const groups = useGroups();
  const saveOrder = useGroupOrder();
  const [dragging, setDragging] = useState(false);

  function renderContent() {
    if (groups.data !== undefined) {
      return (
        <DraggableList
          items={groups.data}
          keyOf={(group) => group.id}
          moveLabel={(group) => `Move ${group.name}`}
          onDragChange={setDragging}
          onReorder={saveOrder}
          renderRow={(group) => (
            <View style={[styles.row, { paddingRight: space.md }]}>
              <GroupSummary group={group} />
            </View>
          )}
        />
      );
    }

    if (groups.isLoadingError) {
      return (
        <LoadFailure
          message="Couldn’t load your groups."
          onRetry={() => {
            void groups.refetch();
          }}
        />
      );
    }

    return (
      <SkeletonGroup label="Loading groups">
        <DraggableListSkeleton rows={6} />
      </SkeletonGroup>
    );
  }

  return (
    <ScrollView
      scrollEnabled={!dragging}
      style={{ backgroundColor: colors.bg }}
      contentContainerStyle={{
        gap: space.lg,
        paddingTop: size.topPaddingSubPage,
        paddingHorizontal: size.sidePadding,
        paddingBottom: pageEnd,
      }}
    >
      <View style={{ gap: space.xxxs }}>
        <BackLink
          label="Groups"
          onPress={() => {
            router.back();
          }}
        />
        <ScreenHeading
          title="Reorder groups"
          subtitle="Drag the handle to move a group. Your exercise list and chips follow this order."
        />
      </View>
      {renderContent()}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  // A row, so the summary takes the width and sits in the middle of the handle's height.
  row: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
});
