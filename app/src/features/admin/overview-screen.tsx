import { useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { type ReactNode } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { usePullToRefresh } from '@/components/pull-to-refresh';
import { usePageEnd } from '@/components/above-tab-bar';
import { Glow } from '@/components/glow';
import { ChevronRightIcon } from '@/components/icons';
import { ScreenHeading } from '@/components/screen-heading';
import { SkeletonLine, textLine } from '@/components/skeleton';
import { StatTile } from '@/components/stat-tile';
import { Tappable } from '@/components/tappable';
import { TextLink } from '@/components/text-link';
import { noValue } from '@/formats/formats';
import { useTheme } from '@/theme/theme-provider';

import { TrendLine } from './trend-line';
import { setUsersFilter } from './users-filter';
import {
  overviewKeys,
  useFeedbackStats,
  useTrainingStats,
  useUserStats,
} from './use-overview';

/** A query a tile shows: its data, whether it failed, and how to try again. */
interface TileQuery<T> {
  data?: T;
  isLoadingError: boolean;
  refetch: () => Promise<unknown>;
}

/** The admin's first page: how Herculean is doing. */
export function OverviewScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { colors, size, space } = useTheme();
  const pageEnd = usePageEnd();
  const users = useUserStats();
  const training = useTrainingStats();
  const feedback = useFeedbackStats();
  const refreshControl = usePullToRefresh(() =>
    queryClient.invalidateQueries({ queryKey: overviewKeys.all }),
  );

  const activeShare =
    users.data === undefined || training.data === undefined
      ? undefined
      : users.data.total === 0
        ? '0% of users'
        : `${String(Math.round((training.data.activeThisWeek / users.data.total) * 100))}% of users`;

  return (
    <ScrollView
      testID="overview-scroll"
      style={[styles.screen, { backgroundColor: colors.bg }]}
      contentContainerStyle={{
        gap: space.xl,
        paddingTop: size.topPaddingTab,
        paddingHorizontal: size.sidePadding,
        paddingBottom: pageEnd,
      }}
      refreshControl={refreshControl}
    >
      <ScreenHeading
        title="Overview"
        subtitle="How Herculean is doing this week."
      />
      <UsersHero query={users} />
      <View style={{ gap: space.md }}>
        <View style={[styles.row, { gap: space.md }]}>
          <Tile
            label="Active users"
            query={training}
            value={(data) => data.activeThisWeek}
            detail={() => activeShare}
            trend={(data) => data.activePerWeek}
          />
          <Tile
            label="Workouts"
            query={training}
            value={(data) => data.workoutsThisWeek}
            detail={(data) =>
              changeOnLastWeek(data.workoutsThisWeek - data.workoutsLastWeek)
            }
            trend={(data) => data.workoutsPerWeek}
          />
        </View>
        <View style={[styles.row, { gap: space.md }]}>
          <Tile
            label="To answer"
            query={feedback}
            value={(data) => data.waitingForReply}
            onPress={() => {
              router.navigate('/admin/feedback');
            }}
          />
          <Tile
            label="Deleting soon"
            query={users}
            value={(data) => data.deletingSoon}
            onPress={() => {
              setUsersFilter('deletingSoon');
              router.navigate('/admin/users');
            }}
          />
        </View>
      </View>
    </ScrollView>
  );
}

type UserStats = NonNullable<ReturnType<typeof useUserStats>['data']>;

/** The page's focus: how many people use Herculean, big, with a 4-week trend across the card. */
function UsersHero({ query }: { query: TileQuery<UserStats> }) {
  const { colors, radius, space, text } = useTheme();
  const { data, isLoadingError } = query;

  function renderNumber() {
    if (data !== undefined) {
      return (
        <Text style={[text.heroStat, { color: colors.text }]}>
          {String(data.total)}
        </Text>
      );
    }

    return isLoadingError ? (
      <Text style={[text.heroStat, { color: colors.text }]}>{noValue}</Text>
    ) : (
      <SkeletonLine width={120} height={44} lineHeight={textLine.heroStat} />
    );
  }

  function renderBelow() {
    if (isLoadingError) {
      // Its padding widens the touch area, so it starts in line with the label.
      return (
        <View style={{ marginLeft: -space.sm, alignItems: 'flex-start' }}>
          <TextLink
            label="Try again"
            accessibilityLabel="Couldn’t load users. Try again"
            onPress={() => {
              void query.refetch();
            }}
          />
        </View>
      );
    }

    return (
      <TrendLine
        values={data?.newPerWeek}
        loading={data === undefined}
        height={heroTrendHeight}
      />
    );
  }

  return (
    <View
      testID="users-hero"
      style={[
        styles.hero,
        {
          gap: space.sm,
          padding: space.lg,
          borderRadius: radius.card,
          borderColor: colors.border,
          backgroundColor: colors.card,
        },
      ]}
    >
      <Glow radiusX={0.8} radiusY={0.7} fadeAt={0.9} />
      <View style={[styles.heroTop, { gap: space.md }]}>
        <View style={{ gap: space.xs }}>
          <Text style={text.eyebrow}>Users</Text>
          {renderNumber()}
        </View>
        <View style={[styles.heroSide, { gap: space.xl }]}>
          <HeroFigure
            value={
              data === undefined ? undefined : `+${String(data.newThisWeek)}`
            }
            failed={isLoadingError}
            label="this week"
          />
          <HeroFigure
            value={
              data === undefined
                ? undefined
                : `+${String(data.newPerWeek.reduce((sum, count) => sum + count, 0))}`
            }
            failed={isLoadingError}
            label="in 4 weeks"
          />
        </View>
      </View>
      {renderBelow()}
    </View>
  );
}

const heroTrendHeight = 56;

/** A smaller number beside the hero's, with what it counts under it. */
function HeroFigure({
  value,
  failed,
  label,
}: {
  value?: string;
  failed: boolean;
  label: string;
}) {
  const { colors, text } = useTheme();

  return (
    <View style={styles.figure}>
      {value === undefined && !failed ? (
        <SkeletonLine width={40} height={16} lineHeight={textLine.statValue} />
      ) : (
        <Text style={[text.statValue, { color: colors.text }]}>
          {value ?? noValue}
        </Text>
      )}
      <Text style={text.meta}>{label}</Text>
    </View>
  );
}

/** "+12 on last week", "–3 on last week" or "Same as last week". */
export function changeOnLastWeek(change: number) {
  if (change === 0) {
    return 'Same as last week';
  }

  return change > 0
    ? `+${String(change)} on last week`
    : `–${String(-change)} on last week`;
}

/** A tile that loads and fails on its own: a dash and Try again in its place, while the others stay. */
function Tile<T>({
  label,
  query,
  value,
  detail,
  trend,
  onPress,
}: {
  label: string;
  query: TileQuery<T>;
  value: (data: T) => number;
  detail?: (data: T) => string | undefined;
  trend?: (data: T) => number[];
  onPress?: () => void;
}) {
  const { colors, space } = useTheme();
  const { data, isLoadingError } = query;

  function renderBelow(): ReactNode {
    if (isLoadingError) {
      // Its padding widens the touch area, so it starts in line with the label.
      return (
        <View style={{ marginLeft: -space.sm, alignItems: 'flex-start' }}>
          <TextLink
            label="Try again"
            accessibilityLabel={`Couldn’t load ${label.toLowerCase()}. Try again`}
            onPress={() => {
              void query.refetch();
            }}
          />
        </View>
      );
    }

    return trend === undefined ? null : (
      <TrendLine
        values={data === undefined ? undefined : trend(data)}
        loading={data === undefined}
      />
    );
  }

  const tile = (
    <StatTile
      label={label}
      value={
        isLoadingError ? noValue : data === undefined ? undefined : value(data)
      }
      detail={
        data === undefined || detail === undefined ? undefined : detail(data)
      }
    >
      {renderBelow()}
    </StatTile>
  );

  if (onPress === undefined || data === undefined) {
    return <View style={styles.tile}>{tile}</View>;
  }

  return (
    <Tappable
      accessibilityRole="button"
      accessibilityLabel={`${label}, ${String(value(data))}`}
      onPress={onPress}
      style={styles.tile}
    >
      {tile}
      <View style={[styles.chevron, { top: space.lg, right: space.lg }]}>
        <ChevronRightIcon color={colors.muted} size={16} />
      </View>
    </Tappable>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  row: {
    flexDirection: 'row',
  },
  tile: {
    flex: 1,
  },
  hero: {
    borderWidth: 1,
    overflow: 'hidden',
  },
  heroTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  heroSide: {
    flexDirection: 'row',
  },
  figure: {
    alignItems: 'flex-end',
  },
  chevron: {
    position: 'absolute',
  },
});
