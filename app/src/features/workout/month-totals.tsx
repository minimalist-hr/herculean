import { StyleSheet, Text, View } from 'react-native';

import type { components } from '@/api/schema';
import { Skeleton } from '@/components/skeleton';
import { counted } from '@/features/routines/formats';
import { useTheme } from '@/theme/theme-provider';

type MonthSummary = components['schemas']['MonthSummaryResponse'];

/** What a line of big text takes, so nothing moves when the values arrive. */
const bigStatHeight = 31;
const hintHeight = 16;

function timeText(minutes: number) {
  const hours = Math.floor(minutes / 60);

  return hours === 0
    ? `${String(minutes)} min`
    : `${String(hours)} h ${String(minutes % 60)} min`;
}

function SkeletonLine({
  width,
  height,
  lineHeight,
}: {
  width: number;
  height: number;
  lineHeight: number;
}) {
  return (
    <View style={[styles.skeletonLine, { height: lineHeight }]}>
      <Skeleton width={width} height={height} />
    </View>
  );
}

function CountTile({
  label,
  color,
  value,
}: {
  label: string;
  color: string;
  value?: number;
}) {
  const { colors, radius, space, text } = useTheme();

  return (
    <View
      style={[
        styles.tile,
        {
          gap: space.xs + 2,
          paddingVertical: space.md,
          paddingHorizontal: space.md + 2,
          borderRadius: radius.card,
          borderColor: colors.border,
          backgroundColor: colors.card,
        },
      ]}
    >
      <View style={[styles.countLabel, { gap: space.sm }]}>
        <View
          style={[
            styles.dot,
            { borderRadius: radius.check, backgroundColor: color },
          ]}
        />
        <Text style={[text.eyebrow, { color }]}>{label}</Text>
      </View>
      {value === undefined ? (
        <SkeletonLine width={32} height={24} lineHeight={bigStatHeight} />
      ) : (
        <Text style={[text.bigStat, { color: colors.text }]}>{value}</Text>
      )}
    </View>
  );
}

/** The done, missed and skipped tiles. Nothing while it loads: the labels still show. */
export function MonthCounts({ summary }: { summary?: MonthSummary }) {
  const { colors, space } = useTheme();

  return (
    <View style={[styles.row, { gap: space.sm }]}>
      <CountTile label="Done" color={colors.success} value={summary?.done} />
      <CountTile label="Missed" color={colors.danger} value={summary?.missed} />
      <CountTile
        label="Skipped"
        color={colors.skipped}
        value={summary?.skipped}
      />
    </View>
  );
}

function TotalTile({
  label,
  value,
  hint,
}: {
  label: string;
  value?: string;
  hint?: string;
}) {
  const { colors, radius, space, text } = useTheme();

  return (
    <View
      style={[
        styles.tile,
        {
          gap: space.xs + 2,
          padding: space.md + 2,
          borderRadius: radius.card,
          borderColor: colors.border,
          backgroundColor: colors.card,
        },
      ]}
    >
      <Text style={text.eyebrow}>{label}</Text>
      {value === undefined ? (
        <>
          <SkeletonLine width={90} height={24} lineHeight={bigStatHeight} />
          <SkeletonLine width={110} height={12} lineHeight={hintHeight} />
        </>
      ) : (
        <>
          <Text style={[text.bigStat, { color: colors.text }]}>{value}</Text>
          <Text style={text.meta}>{hint}</Text>
        </>
      )}
    </View>
  );
}

function consistencyText(summary: MonthSummary) {
  return summary.consistencyPercent === null
    ? '–'
    : `${String(summary.consistencyPercent)}%`;
}

/** The month's totals. Nothing while it loads: the labels still show. */
export function MonthTotals({
  title,
  summary,
}: {
  title: string;
  summary?: MonthSummary;
}) {
  const { space, text } = useTheme();
  const averageMinutes =
    summary !== undefined && summary.done > 0
      ? Math.round(summary.minutesTrained / summary.done)
      : null;

  return (
    <View style={{ gap: space.sm }}>
      <Text accessibilityRole="header" style={text.eyebrow}>
        {title}
      </Text>
      <View style={[styles.row, { gap: space.sm }]}>
        <TotalTile
          label="Time trained"
          value={summary && timeText(summary.minutesTrained)}
          hint={
            averageMinutes === null
              ? 'No workouts yet'
              : `About ${String(averageMinutes)} min a workout`
          }
        />
        <TotalTile
          label="Sets"
          value={summary && String(summary.setsDone)}
          hint={summary && `Of ${String(summary.setsPlanned)} planned`}
        />
      </View>
      <View style={[styles.row, { gap: space.sm }]}>
        <TotalTile
          label="Volume"
          value={summary && `${summary.volumeKg.toLocaleString('en-US')} kg`}
          hint="Weight × reps, all sets"
        />
        <TotalTile
          label="Consistency"
          value={summary && consistencyText(summary)}
          hint={
            summary &&
            (summary.plannedDays === 0
              ? 'No planned workouts yet'
              : `${String(summary.done)} of ${counted(summary.plannedDays, 'planned workout', 'planned workouts')}`)
          }
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
  },
  tile: {
    flex: 1,
    borderWidth: 1,
  },
  countLabel: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dot: {
    width: 8,
    height: 8,
  },
  skeletonLine: {
    justifyContent: 'center',
  },
});
