import { StyleSheet, Text, View } from 'react-native';

import type { components } from '@/api/schema';
import { SkeletonLine, textLine } from '@/components/skeleton';
import {
  counted,
  formatVolume,
  hoursAndMinutesText,
  noValue,
} from '@/formats/formats';
import { SectionTitle } from '@/components/section-title';
import { useUnits } from '@/features/account/use-units';
import { StatusLabel } from '@/components/status-label';
import { useTheme } from '@/theme/theme-provider';

type MonthSummary = components['schemas']['MonthSummaryResponse'];

function CountTile({
  label,
  color,
  value,
}: {
  label: string;
  color: string;
  value?: number | string;
}) {
  const { colors, radius, size, space, text } = useTheme();

  return (
    <View
      style={[
        styles.tile,
        {
          gap: space.sm,
          paddingVertical: space.md,
          paddingHorizontal: size.statTilePadding,
          borderRadius: radius.card,
          borderColor: colors.border,
          backgroundColor: colors.card,
        },
      ]}
    >
      <StatusLabel label={label} color={color} />
      {value === undefined ? (
        <SkeletonLine width={32} height={24} lineHeight={textLine.bigStat} />
      ) : (
        <Text style={[text.bigStat, { color: colors.text }]}>{value}</Text>
      )}
    </View>
  );
}

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
      <CountTile
        label="Done"
        color={colors.success}
        value={shown(summary?.done)}
      />
      <CountTile
        label="Missed"
        color={colors.danger}
        value={shown(summary?.missed)}
      />
      <CountTile
        label="Skipped"
        color={colors.skipped}
        value={shown(summary?.skipped)}
      />
    </View>
  );
}

export function TotalTile({
  label,
  value,
  hint,
}: {
  label: string;
  value?: string;
  hint?: string;
}) {
  const { colors, radius, size, space, text } = useTheme();

  return (
    <View
      style={[
        styles.tile,
        {
          gap: space.sm,
          padding: size.statTilePadding,
          borderRadius: radius.card,
          borderColor: colors.border,
          backgroundColor: colors.card,
        },
      ]}
    >
      <Text style={text.eyebrow}>{label}</Text>
      {value === undefined ? (
        <>
          <SkeletonLine width={90} height={24} lineHeight={textLine.bigStat} />
          <SkeletonLine width={110} height={12} lineHeight={textLine.meta} />
        </>
      ) : (
        <>
          <Text
            numberOfLines={1}
            adjustsFontSizeToFit
            style={[text.bigStat, { color: colors.text }]}
          >
            {value}
          </Text>
          <Text style={text.meta}>{hint}</Text>
        </>
      )}
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
        <TotalTile
          label="Time trained"
          value={summary && hoursAndMinutesText(summary.minutesTrained)}
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
          value={summary && formatVolume(summary.volumeKg, units)}
          hint="Weight × reps, all sets"
        />
        <TotalTile
          label="On plan"
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
});
