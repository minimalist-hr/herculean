import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  View,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';

import { usePageEnd } from '@/components/above-tab-bar';
import { Chip } from '@/components/chip';
import { EmptyCard } from '@/components/empty-card';
import { ListCard } from '@/components/list-card';
import { LoadFailure } from '@/components/load-failure';
import { dismissNotification, notifyFailure } from '@/components/notifications';
import { usePullToRefresh } from '@/components/pull-to-refresh';
import { ScreenHeading } from '@/components/screen-heading';
import { SearchField } from '@/components/search-field';
import {
  StickyControls,
  useStickyControls,
} from '@/components/sticky-controls';
import { useDebouncedValue } from '@/features/exercises/use-debounced-value';
import { useMinuteClock } from '@/features/feedback/thread';
import { useTheme } from '@/theme/theme-provider';

import { UserListSkeleton, UserRow } from './user-rows';
import { setUsersFilter, useUsersFilter } from './users-filter';
import { useUsers, type UsersFilter } from './use-users';

const searchWaitMs = 300;
const loadMoreDistance = 400;
const noUsersYet = 'No users yet.';

/** The Users tab's first page: everyone using Herculean, with search and Deleting soon. */
export function UsersScreen() {
  const router = useRouter();
  const pageEnd = usePageEnd();
  const { colors, size, space } = useTheme();
  const sticky = useStickyControls();
  const now = useMinuteClock();
  // Overview's Deleting soon tile sets it too.
  const filter = useUsersFilter();
  const [searchText, setSearchText] = useState('');
  const typedSearch = searchText.trim();
  const debouncedSearch = useDebouncedValue(typedSearch, searchWaitMs);
  // Clearing the search shows the whole list right away.
  const search = typedSearch === '' ? '' : debouncedSearch;
  const users = useUsers(filter, search);
  const refreshControl = usePullToRefresh(() => users.refetch());
  const list = users.data?.pages.flatMap((page) => page.users) ?? [];
  const noUsers =
    users.data !== undefined &&
    list.length === 0 &&
    filter === 'all' &&
    search === '';

  function onScroll(event: NativeSyntheticEvent<NativeScrollEvent>) {
    sticky.onScroll(event);
    const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent;
    const nearTheEnd =
      layoutMeasurement.height + contentOffset.y >=
      contentSize.height - loadMoreDistance;
    // After a failed page, only Try again loads it.
    if (
      nearTheEnd &&
      users.hasNextPage &&
      !users.isFetching &&
      !users.isFetchNextPageError
    ) {
      void users.fetchNextPage();
    }
  }

  function pick(next: UsersFilter) {
    if (noUsers) {
      notifyFailure(noUsersYet);
      return;
    }

    dismissNotification();
    setUsersFilter(next);
  }

  function renderList() {
    if (users.data !== undefined) {
      if (list.length === 0) {
        return renderEmpty();
      }

      return (
        <>
          <ListCard>
            {list.map((user, index) => (
              <UserRow
                key={user.id}
                user={user}
                now={now}
                first={index === 0}
                onPress={() => {
                  router.push({
                    pathname: '/admin/users/[id]',
                    params: { id: user.id },
                  });
                }}
              />
            ))}
          </ListCard>
          {users.isFetchingNextPage && (
            <UserListSkeleton label="Loading more users" rows={2} />
          )}
          {users.isFetchNextPageError && (
            <LoadFailure
              message="Couldn’t load more users."
              onRetry={() => {
                void users.fetchNextPage();
              }}
            />
          )}
        </>
      );
    }

    if (users.isLoadingError) {
      return (
        <LoadFailure
          message="Couldn’t load users."
          onRetry={() => {
            void users.refetch();
          }}
        />
      );
    }

    return <UserListSkeleton label="Loading users" />;
  }

  function renderEmpty() {
    if (search !== '') {
      return (
        <EmptyCard
          title="No users match"
          message="Try another name or email."
        />
      );
    }

    return filter === 'deletingSoon' ? (
      <EmptyCard
        title="No accounts deleting soon"
        message="Accounts waiting for deletion show here."
      />
    ) : (
      <EmptyCard title="No users yet" message="New users show here." />
    );
  }

  return (
    <ScrollView
      testID="users-scroll"
      style={[styles.screen, { backgroundColor: colors.bg }]}
      stickyHeaderIndices={[1]}
      onScroll={onScroll}
      scrollEventThrottle={16}
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="on-drag"
      contentContainerStyle={{ paddingBottom: pageEnd }}
      refreshControl={refreshControl}
    >
      <View
        onLayout={sticky.onHeadingLayout}
        style={{
          paddingTop: size.topPaddingTab,
          paddingHorizontal: size.sidePadding,
          paddingBottom: space.lg,
        }}
      >
        <ScreenHeading title="Users" subtitle="Everyone using Herculean." />
      </View>
      <StickyControls lined={sticky.lined}>
        <View style={{ paddingHorizontal: size.sidePadding }}>
          <SearchField
            label="Search users"
            value={searchText}
            onChangeText={(text) => {
              dismissNotification();
              setSearchText(text);
            }}
            mutedReason={noUsers ? noUsersYet : undefined}
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
          <Chip
            label="All"
            selected={filter === 'all'}
            muted={noUsers}
            onPress={() => {
              pick('all');
            }}
          />
          <Chip
            label="Deleting soon"
            selected={filter === 'deletingSoon'}
            muted={noUsers}
            onPress={() => {
              pick('deletingSoon');
            }}
          />
        </ScrollView>
      </StickyControls>
      <View
        style={{
          gap: space.md,
          paddingTop: space.md,
          paddingHorizontal: size.sidePadding,
        }}
      >
        {renderList()}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
});
