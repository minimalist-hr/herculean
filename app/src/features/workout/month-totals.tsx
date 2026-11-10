import { StyleSheet, View } from 'react-native';

import type { components } from '@/api/schema';
import { StatTile } from '@/components/stat-tile';
import {
  counted,
  formatVolume,
  hoursAndMinutesText,
  noValue,
} from '@/formats/formats';
import { SectionTitle } from '@/components/section-title';
import { useUnits } from '@/features/account/use-units';
import { useTheme } from '@/theme/theme-provider';

type MonthSummary = components['schemas']['MonthSummaryResponse'];

/** The done, missed and skipped tiles. Nothing while it loads, and a dash if it failed: the labels still show. */
export function MonthCounts({
  summary,
  failed = false,
}: {
  summary?: MonthSummary;
  failed?: boolean;
}) {
  const { colors, space } = useTheme();
  const shown = (count?: number) => (failed ? noValue : count);

  return (
    <View style={[styles.row, { gap: space.sm }]}>
      <StatTile
        skeletonWidth={32}
        label="Done"
        labelColor={colors.success}
        value={shown(summary?.done)}
      />
      <StatTile
        skeletonWidth={32}
        label="Missed"
        labelColor={colors.danger}
        value={shown(summary?.missed)}
      />
      <StatTile
        skeletonWidth={32}
        label="Skipped"
        labelColor={colors.skipped}
        value={shown(summary?.skipped)}
      />
    </View>
  );
}

export function consistencyText(summary: MonthSummary) {
  return summary.consistencyPercent === null
    ? noValue
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
  const { space } = useTheme();
  const units = useUnits();
  const averageMinutes =
    summary !== undefined && summary.done > 0
      ? Math.round(summary.minutesTrained / summary.done)
      : null;

  return (
    <View style={{ gap: space.sm }}>
      <SectionTitle>{title}</SectionTitle>
      <View style={[styles.row, { gap: space.sm }]}>
        <StatTile
          total
          label="Time trained"
          value={summary && hoursAndMinutesText(summary.minutesTrained)}
          detail={
            averageMinutes === null
              ? 'No workouts yet'
              : `About ${String(averageMinutes)} min a workout`
          }
        />
        <StatTile
          total
          label="Sets"
          value={summary && String(summary.setsDone)}
          detail={
            summary &&
            (summary.setsPlanned === 0
              ? 'No planned sets yet'
              : `Of ${String(summary.setsPlanned)} planned`)
          }
        />
      </View>
      <View style={[styles.row, { gap: space.sm }]}>
        <StatTile
          total
          label="Volume"
          value={summary && formatVolume(summary.volumeKg, units)}
          detail="Weight × reps, all sets"
        />
        <StatTile
          total
          label="On plan"
          value={summary && consistencyText(summary)}
          detail={
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
});
