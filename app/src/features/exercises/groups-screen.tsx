import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import { usePageEnd } from '@/components/above-tab-bar';
import { BackLink } from '@/components/back-link';
import { NewButton, useNewButtonRoom } from '@/components/new-button';
import { EmptyCard } from '@/components/empty-card';
import { HeaderIconButton } from '@/components/header-icon-button';
import { ReorderIcon } from '@/components/icons';
import { LoadFailure } from '@/components/load-failure';
import { dismissNotification, notifyFailure } from '@/components/notifications';
import { ScreenHeading } from '@/components/screen-heading';
import { SearchField } from '@/components/search-field';
import { Skeleton } from '@/components/skeleton';
import {
  StickyControls,
  useStickyControls,
} from '@/components/sticky-controls';
import { useTheme } from '@/theme/theme-provider';

import { GroupsList } from './groups-list';
import { noGroupsMessage, useGroups } from './use-groups';

export function GroupsScreen() {
  const { cardLine, colors, opacity, radius, size, space } = useTheme();
  const pageEnd = usePageEnd();
  const newButtonRoom = useNewButtonRoom();
  const router = useRouter();
  const groups = useGroups();
  const sticky = useStickyControls();
  const [searchText, setSearchText] = useState('');
  const search = searchText.trim();
  const noGroups = groups.data?.length === 0;
  const reorderReason = reorderUnavailable(groups.data?.length);

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

      const shown =
        search === ''
          ? groups.data
          : groups.data.filter((group) =>
              group.name.toLowerCase().includes(search.toLowerCase()),
            );

      if (shown.length === 0) {
        return (
          <EmptyCard
            title={`No matches for “${search}”`}
            message="Check the spelling, or create it as a new group."
          />
        );
      }

      return (
        <GroupsList
          groups={shown}
          onOpen={(group) => {
            router.push({
              pathname: '/exercises/groups/[id]',
              params: { id: group.id },
            });
          }}
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
      <View
        accessible
        accessibilityLabel="Loading groups"
        accessibilityLiveRegion="polite"
        style={[
          styles.skeletonCard,
          {
            borderWidth: cardLine,
            borderRadius: radius.card,
            borderColor: colors.border,
            backgroundColor: colors.card,
          },
        ]}
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
                borderTopWidth: index === 0 ? 0 : 1,
                borderTopColor: colors.border,
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
      <ScrollView
        stickyHeaderIndices={[1]}
        onScroll={sticky.onScroll}
        scrollEventThrottle={16}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        contentContainerStyle={{ paddingBottom: pageEnd + newButtonRoom }}
      >
        <View
          onLayout={sticky.onHeadingLayout}
          style={{
            gap: space.xxxs,
            paddingTop: size.topPaddingSubPage,
            paddingHorizontal: size.sidePadding,
            paddingBottom: space.lg,
          }}
        >
          <BackLink
            label="Exercises"
            onPress={() => {
              router.back();
            }}
          />
          <ScreenHeading
            title="Groups"
            subtitle="The muscle groups your exercises belong to."
            action={
              <HeaderIconButton
                label={
                  reorderReason === null
                    ? 'Reorder groups'
                    : 'Reorder groups, not available yet'
                }
                onPress={() => {
                  if (reorderReason === null) {
                    dismissNotification();
                    router.push('/exercises/groups/reorder');
                  } else {
                    notifyFailure(reorderReason);
                  }
                }}
              >
                <View
                  style={{
                    opacity: reorderReason === null ? 1 : opacity.disabled,
                  }}
                >
                  <ReorderIcon
                    color={reorderReason === null ? colors.text : colors.muted}
                    size={20}
                  />
                </View>
              </HeaderIconButton>
            }
          />
        </View>
        <StickyControls lined={sticky.lined}>
          <View style={{ paddingHorizontal: size.sidePadding }}>
            <SearchField
              label="Search groups"
              value={searchText}
              mutedReason={noGroups ? noGroupsMessage : undefined}
              onChangeText={(value) => {
                dismissNotification();
                setSearchText(value);
              }}
            />
          </View>
        </StickyControls>
        <View style={{ paddingHorizontal: size.sidePadding }}>
          {renderList()}
        </View>
      </ScrollView>
      <NewButton
        label="New group"
        onPress={() => {
          // The list shows whole on the way back, so the new group is in it.
          setSearchText('');
          router.push({ pathname: '/group/new', params: { name: search } });
        }}
      />
    </View>
  );
}

/** Why the groups can't be reordered yet, or null when they can. */
function reorderUnavailable(count: number | undefined) {
  if (count === undefined) {
    return 'This page hasn’t loaded yet.';
  }
  if (count === 0) {
    return noGroupsMessage;
  }

  return count === 1 ? 'Create another group first.' : null;
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  skeletonCard: {
    overflow: 'hidden',
  },
  skeletonRow: {
    justifyContent: 'center',
  },
});
