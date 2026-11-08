import { useRouter } from 'expo-router';
import type { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import type { components } from '@/api/schema';
import { OpenOutIcon } from '@/components/icons';
import { LoadFailure } from '@/components/load-failure';
import { SectionTitle } from '@/components/section-title';
import { SkeletonGroup, SkeletonLine, textLine } from '@/components/skeleton';
import { Tappable } from '@/components/tappable';
import { TextLink } from '@/components/text-link';
import { useCurrentUser } from '@/features/account/use-current-user';
import { counted } from '@/features/routines/formats';
import {
  addMonths,
  dateFromText,
  dateText,
  monthText,
  shortDate,
  weekOf,
} from '@/features/workout/dates';
import { Card } from '@/features/workout/day-card';
import {
  consistencyText,
  noValue,
  TotalTile,
} from '@/features/workout/month-totals';
import { useDay } from '@/features/workout/use-day';
import { useDays } from '@/features/workout/use-days';
import { useMonthSummary } from '@/features/workout/use-month-summary';
import { WeekStrip } from '@/features/workout/week-strip';
import {
  formatCompactVolume,
  formatSet,
  formatShortDate,
} from '@/formats/formats';
import { useTheme } from '@/theme/theme-provider';

import { TodayCard, TodayCardSkeleton } from './today-card';
import { useRecentRecords, useStreak } from './use-home';

type MonthSummary = components['schemas']['MonthSummaryResponse'];

function Section({
  title,
  trailing,
  children,
}: {
  title: string;
  trailing?: ReactNode;
  children: ReactNode;
}) {
  const { space } = useTheme();

  return (
    <View style={{ gap: space.sm }}>
      <View style={[styles.heading, { gap: space.md }]}>
        <SectionTitle>{title}</SectionTitle>
        {trailing}
      </View>
      {children}
    </View>
  );
}

/** About the height of a text link's 13 px uppercase label. */
const linkTextHeight = 18;

/** A link in a section's heading. It keeps its full touch area, but lines up with the edge and takes only its text's height. */
function SectionLink({
  label,
  onPress,
}: {
  label: string;
  onPress: () => void;
}) {
  const { size, space } = useTheme();

  return (
    <View
      style={{
        marginRight: -space.sm,
        marginVertical: -(size.touchTargetMin - linkTextHeight) / 2,
      }}
    >
      <TextLink label={label} onPress={onPress} />
    </View>
  );
}

export function TodaySection({ today }: { today: string }) {
  const router = useRouter();
  const day = useDay(today);

  function renderContent() {
    if (day.data !== undefined) {
      return <TodayCard day={day.data} />;
    }

    return day.isError ? (
      <LoadFailure
        message="Couldn't load today."
        onRetry={() => {
          void day.refetch();
        }}
      />
    ) : (
      <TodayCardSkeleton />
    );
  }

  return (
    <Section
      title={`Today · ${shortDate(dateFromText(today))}`}
      trailing={
        <SectionLink
          label="Open day"
          onPress={() => {
            router.navigate('/workout');
          }}
        />
      }
    >
      {renderContent()}
    </Section>
  );
}

export function WeekSection({ now }: { now: Date }) {
  const { text } = useTheme();
  const router = useRouter();
  const today = dateText(now);
  const week = weekOf(now);
  const days = useDays(dateText(week[0]), dateText(week[6]));
  const planned = days.data?.filter((day) => day.status !== 'rest');
  const done = planned?.filter((day) => day.status === 'completed');

  return (
    <Section
      title="This week"
      trailing={
        planned !== undefined &&
        done !== undefined && (
          <Text style={text.meta}>
            {`${String(done.length)} of ${String(planned.length)} done`}
          </Text>
        )
      }
    >
      {days.isError ? (
        <LoadFailure
          message="Couldn't load this week."
          onRetry={() => {
            void days.refetch();
          }}
        />
      ) : (
        <WeekStrip
          week={week}
          today={today}
          selected={today}
          days={days.data}
          onSelect={(date) => {
            if (date === today) {
              router.navigate('/workout');
            } else {
              router.push({
                pathname: '/workout/day/[date]',
                params: { date, from: 'home' },
              });
            }
          }}
        />
      )}
    </Section>
  );
}

/** How a number moved since last month, for example "+2". */
function change(current: number | null, previous: number | null, unit = '') {
  if (current === null || previous === null) {
    return noValue;
  }

  const difference = current - previous;
  if (difference === 0) {
    return 'Same';
  }

  return `${difference > 0 ? '+' : '−'}${String(Math.abs(difference))}${unit}`;
}

/** How the workouts done moved since last month. A month with nothing planned or done has nothing to compare. */
function workoutsChange(current: MonthSummary, previous?: MonthSummary) {
  if (
    previous === undefined ||
    (previous.done === 0 && previous.plannedDays === 0)
  ) {
    return noValue;
  }

  return change(current.done, previous.done);
}

/** How the share done of the plan moved since last month, in percentage points. */
function onPlanChange(current: MonthSummary, previous?: MonthSummary) {
  const before = previous?.consistencyPercent ?? null;
  const now = current.consistencyPercent;
  const onePoint =
    before !== null && now !== null && Math.abs(now - before) === 1;

  return change(now, before, onePoint ? ' pt' : ' pts');
}

/** How volume moved since last month, in percent. */
function volumeChange(current: MonthSummary, previous?: MonthSummary) {
  if (previous === undefined || previous.volumeKg === 0) {
    return noValue;
  }

  return change(
    Math.round((100 * current.volumeKg) / previous.volumeKg) - 100,
    0,
    '%',
  );
}

export function MonthSection({ now }: { now: Date }) {
  const { space, text } = useTheme();
  const router = useRouter();
  const units = useCurrentUser().data?.units ?? 'metric';
  const month = monthText(now);
  const current = useMonthSummary(month);
  const previous = useMonthSummary(addMonths(month, -1)).data;
  const summary = current.data;

  return (
    <Section
      title="This month"
      trailing={
        <SectionLink
          label="Open month"
          onPress={() => {
            router.push({
              pathname: '/workout/month',
              params: { from: 'home' },
            });
          }}
        />
      }
    >
      {current.isError ? (
        <LoadFailure
          message="Couldn't load this month."
          onRetry={() => {
            void current.refetch();
          }}
        />
      ) : (
        <View
          accessible={summary === undefined}
          accessibilityLabel={
            summary === undefined ? 'Loading this month' : undefined
          }
          style={{ gap: space.xs }}
        >
          <View style={[styles.row, { gap: space.sm }]}>
            <TotalTile
              label="Workouts"
              value={summary && String(summary.done)}
              hint={summary && workoutsChange(summary, previous)}
            />
            <TotalTile
              label="On plan"
              value={summary && consistencyText(summary)}
              hint={summary && onPlanChange(summary, previous)}
            />
            <TotalTile
              label="Volume"
              value={summary && formatCompactVolume(summary.volumeKg, units)}
              hint={summary && volumeChange(summary, previous)}
            />
          </View>
          <Text style={text.meta}>Compared with last month</Text>
        </View>
      )}
    </Section>
  );
}

export function StreakSection() {
  const { colors, space, text } = useTheme();
  const streak = useStreak();

  function renderContent() {
    if (streak.isError) {
      return (
        <LoadFailure
          message="Couldn't load your streak."
          onRetry={() => {
            void streak.refetch();
          }}
        />
      );
    }

    if (streak.data === undefined) {
      return (
        <SkeletonGroup label="Loading your streak">
          <Card>
            <View style={{ gap: space.xs }}>
              <SkeletonLine
                width={160}
                height={20}
                lineHeight={textLine.cardTitle}
              />
              <SkeletonLine
                width={240}
                height={10}
                lineHeight={textLine.meta}
              />
            </View>
          </Card>
        </SkeletonGroup>
      );
    }

    const { weeks, best } = streak.data;

    return (
      <Card>
        <View style={{ gap: space.xs }}>
          <View style={[styles.heading, { gap: space.md }]}>
            <Text style={[text.cardTitle, { color: colors.text }]}>
              {weeks === 0
                ? 'No streak yet'
                : `${counted(weeks, 'week', 'weeks')} on plan`}
            </Text>
            {best > 0 && (
              <Text style={text.meta}>
                {`Best ${counted(best, 'week', 'weeks')}`}
              </Text>
            )}
          </View>
          <Text style={text.meta}>
            {weeks === 0
              ? 'Finish a week with no planned day missed to start one.'
              : 'Weeks in a row with no planned day missed.'}
          </Text>
        </View>
      </Card>
    );
  }

  return <Section title="Streak">{renderContent()}</Section>;
}

export function RecordsSection() {
  const { colors, size, space, text } = useTheme();
  const router = useRouter();
  const records = useRecentRecords();
  const units = useCurrentUser().data?.units ?? 'metric';

  function renderContent() {
    if (records.isError) {
      return (
        <LoadFailure
          message="Couldn't load your records."
          onRetry={() => {
            void records.refetch();
          }}
        />
      );
    }

    if (records.data === undefined) {
      return (
        <SkeletonGroup label="Loading your records">
          <Card>
            {[180, 150, 170].map((width) => (
              <View
                key={width}
                style={{
                  gap: space.xs,
                  minHeight: size.touchTargetMin,
                  justifyContent: 'center',
                }}
              >
                <SkeletonLine
                  width={width}
                  height={14}
                  lineHeight={textLine.listItemName}
                />
                <SkeletonLine
                  width={190}
                  height={10}
                  lineHeight={textLine.meta}
                />
              </View>
            ))}
          </Card>
        </SkeletonGroup>
      );
    }

    if (records.data.length === 0) {
      return (
        <Card>
          <View style={{ gap: space.xs }}>
            <Text style={[text.cardTitle, { color: colors.text }]}>
              No records yet
            </Text>
            <Text style={text.meta}>
              Beat your heaviest weight on an exercise and it shows here.
            </Text>
          </View>
        </Card>
      );
    }

    return (
      <Card>
        {records.data.map((record) => (
          <Tappable
            key={record.exerciseId}
            accessibilityRole="button"
            accessibilityLabel={`${record.exerciseName}, ${formatSet(record.weightKg, record.reps, units)}`}
            onPress={() => {
              router.push({
                pathname: '/exercises/[id]',
                params: { id: record.exerciseId, from: 'home' },
              });
            }}
            style={{
              gap: space.xs,
              minHeight: size.touchTargetMin,
              justifyContent: 'center',
            }}
          >
            <View style={[styles.recordName, { gap: space.xs }]}>
              <Text
                numberOfLines={1}
                style={[
                  text.listItemName,
                  styles.nameText,
                  { color: colors.text },
                ]}
              >
                {record.exerciseName}
              </Text>
              <View style={styles.icon}>
                <OpenOutIcon color={colors.muted} size={14} />
              </View>
            </View>
            <Text style={text.meta}>
              {`${formatSet(record.weightKg, record.reps, units)} · ${formatShortDate(record.date)}`}
            </Text>
          </Tappable>
        ))}
      </Card>
    );
  }

  return <Section title="Recent records">{renderContent()}</Section>;
}

const styles = StyleSheet.create({
  heading: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  row: {
    flexDirection: 'row',
  },
  recordName: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  nameText: {
    flexShrink: 1,
  },
  icon: {
    flexShrink: 0,
  },
});
