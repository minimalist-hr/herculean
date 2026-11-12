import { StyleSheet, Text, View } from 'react-native';

import type { components } from '@/api/schema';
import { EmptyCard } from '@/components/empty-card';
import { SectionTitle } from '@/components/section-title';
import { Skeleton } from '@/components/skeleton';
import { StatTile } from '@/components/stat-tile';
import {
  formatClock,
  formatSet,
  formatVolume,
  formatWeight,
  minutesText,
  noValue,
} from '@/formats/formats';
import { tokens } from '@/theme/tokens';
import { useTheme } from '@/theme/theme-provider';

import { recordReason } from './finish-text';

type Summary = components['schemas']['WorkoutSummaryResponse'];
type Units = components['schemas']['Units'];

/** The four tiles. Once saved, every set counts, so Sets is a single number. */
export function SummaryTiles({
  summary,
  units,
  saved = false,
  pastDay = false,
}: {
  summary?: Summary;
  units: Units;
  saved?: boolean;
  /** Finishing a past day: its duration is typed above and its records list below, so only Sets and Volume show. */
  pastDay?: boolean;
}) {
  const { space } = useTheme();

  function duration() {
    if (summary === undefined) {
      return undefined;
    }

    if (summary.durationSeconds === null) {
      return noValue;
    }

    return saved
      ? minutesText(summary.durationSeconds)
      : formatClock(summary.durationSeconds);
  }

  const sets = (
    <StatTile
      label="Sets"
      value={
        summary &&
        (saved
          ? String(summary.setsChecked)
          : `${String(summary.setsChecked)} of ${String(summary.setsTotal)}`)
      }
    />
  );
  const volume = (
    <StatTile
      label="Volume"
      value={summary && formatVolume(summary.volumeKg, units)}
    />
  );

  if (pastDay) {
    return (
      <View style={[styles.row, { gap: space.sm }]}>
        {sets}
        {volume}
      </View>
    );
  }

  return (
    <View style={{ gap: space.sm }}>
      <View style={[styles.row, { gap: space.sm }]}>
        <StatTile label="Duration" value={duration()} />
        {sets}
      </View>
      <View style={[styles.row, { gap: space.sm }]}>
        {volume}
        <StatTile
          label="Records"
          value={summary && String(summary.records.length)}
        />
      </View>
    </View>
  );
}

export function NewRecords({
  records,
  units,
}: {
  /** Undefined while they load: a row in the shape of one record. */
  records?: Summary['records'];
  units: Units;
}) {
  const { cardLine, colors, radius, space, text } = useTheme();

  return (
    <View style={{ gap: space.sm }}>
      <SectionTitle>New records</SectionTitle>
      {records?.length === 0 ? (
        <EmptyCard message="No new records this time." />
      ) : (
        <View
          style={[
            styles.records,
            {
              borderWidth: cardLine,
              borderRadius: radius.card,
              borderColor: colors.border,
              backgroundColor: colors.card,
            },
          ]}
        >
          {records === undefined && (
            <View
              style={[
                styles.recordText,
                { gap: space.xxxs, padding: space.lg },
              ]}
            >
              <Skeleton width={160} height={21} />
              <Skeleton width={120} height={17} />
            </View>
          )}
          {records?.map((record, index) => (
            <View
              key={record.name}
              style={[
                styles.record,
                {
                  gap: space.md,
                  padding: space.lg,
                  borderTopWidth: index === 0 ? 0 : 1,
                  borderTopColor: colors.border,
                },
              ]}
            >
              <View style={styles.recordText}>
                <Text style={[text.listItemName, { color: colors.text }]}>
                  {record.name}
                </Text>
                <Text style={text.meta}>
                  {recordReason(record, formatWeight(record.weightKg, units))}
                </Text>
              </View>
              <Text style={[text.listItemName, { color: colors.primaryText }]}>
                {formatSet(record.weightKg, record.reps, units)}
              </Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
  },
  records: {},
  record: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  recordText: {
    flex: 1,
    gap: tokens.space.xxxs,
  },
});
