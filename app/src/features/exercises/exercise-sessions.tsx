import type { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import type { components } from '@/api/schema';
import { ChevronRightIcon } from '@/components/icons';
import { LoadFailure } from '@/components/load-failure';
import { SectionTitle } from '@/components/section-title';
import { Skeleton } from '@/components/skeleton';
import { Tappable } from '@/components/tappable';
import { dateFromText } from '@/formats/dates';
import {
  formatLastTime,
  formatShortDate,
  monthName,
  weightUnitOf,
} from '@/formats/formats';
import { tokens } from '@/theme/tokens';
import { useTheme } from '@/theme/theme-provider';

import { NoSessionsCard } from './no-sessions-card';
import type { useExerciseSessions } from './use-exercise-sessions';

type Session = components['schemas']['ExerciseSessionResponse'];
type Units = components['schemas']['Units'];
type Sessions = ReturnType<typeof useExerciseSessions>;

/** Every session by month, a page at a time. The screen loads the next page near the end. */
export function ExerciseSessions({
  sessions,
  units,
  onOpen,
}: {
  sessions: Sessions;
  units: Units;
  /** Opens a session's workout. */
  onOpen: (workoutId: string) => void;
}) {
  const { space } = useTheme();

  function renderContent() {
    if (sessions.data === undefined) {
      return sessions.isLoadingError ? (
        <LoadFailure
          message="Couldn’t load the sessions."
          onRetry={() => {
            void sessions.refetch();
          }}
        />
      ) : (
        <SessionsSkeleton label="Loading the sessions" rows={3} />
      );
    }

    const pages = sessions.data.pages;
    if (pages[0].sessions.length === 0) {
      return (
        <NoSessionsCard message="Finish a workout with this exercise and its sessions show up here." />
      );
    }

    const counts = new Map(
      pages.flatMap((page) =>
        page.months.map((month) => [month.month, month.sessions] as const),
      ),
    );
    const months = new Map<string, Session[]>();
    for (const session of pages.flatMap((page) => page.sessions)) {
      const month = session.date.slice(0, 7);
      months.set(month, [...(months.get(month) ?? []), session]);
    }

    return (
      <>
        {[...months].map(([month, monthSessions]) => (
          <Month
            key={month}
            month={month}
            count={counts.get(month) ?? monthSessions.length}
            sessions={monthSessions}
            units={units}
            onOpen={onOpen}
          />
        ))}
        {sessions.isFetchingNextPage && (
          <SessionsSkeleton label="Loading more sessions" rows={2} />
        )}
        {sessions.isFetchNextPageError && (
          <LoadFailure
            message="Couldn’t load more sessions."
            onRetry={() => {
              void sessions.fetchNextPage();
            }}
          />
        )}
      </>
    );
  }

  return (
    <View style={{ gap: space.sm }}>
      <SectionTitle>All sessions</SectionTitle>
      <View style={{ gap: space.xl }}>{renderContent()}</View>
    </View>
  );
}

function Month({
  month,
  count,
  sessions,
  units,
  onOpen,
}: {
  month: string;
  count: number;
  sessions: Session[];
  units: Units;
  onOpen: (workoutId: string) => void;
}) {
  const { colors, space, text } = useTheme();

  return (
    <View style={{ gap: space.sm }}>
      <Text
        accessibilityRole="header"
        style={[text.listItemName, { color: colors.text }]}
      >
        {monthHeading(month)}
        <Text style={[text.body, { color: colors.muted }]}>
          {` · ${String(count)} ${count === 1 ? 'session' : 'sessions'}`}
        </Text>
      </Text>
      <Card>
        {sessions.map((session, index) => (
          <SessionRow
            key={session.workoutId}
            session={session}
            units={units}
            first={index === 0}
            onOpen={() => {
              onOpen(session.workoutId);
            }}
          />
        ))}
      </Card>
    </View>
  );
}

/** The box a month's rows sit in, like every list in the app. */
function Card({ children }: { children: ReactNode }) {
  const { colors, radius } = useTheme();

  return (
    <View
      style={[
        styles.card,
        {
          borderRadius: radius.card,
          borderColor: colors.border,
          backgroundColor: colors.card,
        },
      ]}
    >
      {children}
    </View>
  );
}

/** A row's spacing, and a line above every row but the first. */
function useRowStyle(first: boolean) {
  const { colors, space } = useTheme();

  return [
    styles.row,
    {
      gap: space.lg,
      paddingVertical: space.md,
      paddingHorizontal: space.lg,
      borderTopWidth: first ? 0 : 1,
      borderTopColor: colors.border,
    },
  ];
}

function SessionRow({
  session,
  units,
  first,
  onOpen,
}: {
  session: Session;
  units: Units;
  first: boolean;
  onOpen: () => void;
}) {
  const { colors, text } = useTheme();
  const rowStyle = useRowStyle(first);
  const weighted = session.sets.some((set) => set.weightKg > 0);

  return (
    <Tappable
      feedback="fill"
      accessibilityRole="button"
      accessibilityLabel={`${formatShortDate(session.date)}, ${session.workoutName}`}
      onPress={onOpen}
      style={rowStyle}
    >
      <View style={styles.when}>
        <Text style={[text.listItemName, { color: colors.text }]}>
          {formatShortDate(session.date)}
        </Text>
        <Text style={text.meta}>{session.workoutName}</Text>
      </View>
      <View style={styles.sets}>
        <Text style={[text.body, styles.setsText, { color: colors.text }]}>
          {session.sets
            .map((set) =>
              formatLastTime(set.weightKg, set.reps, units, set.partialsDone),
            )
            .join(' · ')}
        </Text>
        {weighted && (
          <Text style={[text.meta, styles.setsText]}>
            {`${weightUnitOf(units)} × reps`}
          </Text>
        )}
      </View>
      <ChevronRightIcon color={colors.muted} size={16} />
    </Tappable>
  );
}

function SkeletonRow({ first }: { first: boolean }) {
  const { space } = useTheme();
  const rowStyle = useRowStyle(first);

  return (
    <View style={rowStyle}>
      <View style={[styles.when, { gap: space.xs }]}>
        <Skeleton width={90} height={14} />
        <Skeleton width={110} height={10} />
      </View>
      <Skeleton width={120} height={14} />
      <View style={styles.chevronRoom} />
    </View>
  );
}

function SessionsSkeleton({ label, rows }: { label: string; rows: number }) {
  return (
    <View
      accessible
      accessibilityLabel={label}
      accessibilityLiveRegion="polite"
    >
      <Card>
        {Array.from({ length: rows }, (_, index) => (
          <SkeletonRow key={index} first={index === 0} />
        ))}
      </Card>
    </View>
  );
}

/** A month's name, with the year when it isn't this one. */
function monthHeading(month: string) {
  const first = dateFromText(`${month}-01`);
  const name = monthName(first);

  return first.getFullYear() === new Date().getFullYear()
    ? name
    : `${name} ${String(first.getFullYear())}`;
}

const styles = StyleSheet.create({
  // The skeleton keeps the chevron's room, so nothing moves when the rows load.
  chevronRoom: {
    width: 16,
  },
  card: {
    borderWidth: 1,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  when: {
    gap: tokens.space.xxxs,
  },
  sets: {
    flexShrink: 1,
    alignItems: 'flex-end',
  },
  setsText: {
    textAlign: 'right',
  },
});
