import { StyleSheet, Text, View } from 'react-native';

import type { components } from '@/api/schema';
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
import { useTheme } from '@/theme/theme-provider';

import { recordReason } from './finish-text';

type Summary = components['schemas']['WorkoutSummaryResponse'];
type Units = components['schemas']['Units'];

/** The four tiles. Once saved, every set counts, so Sets is a single number. */
export function SummaryTiles({
  summary,
  units,
  saved = false,
}: {
  summary?: Summary;
  units: Units;
  saved?: boolean;
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

  return (
    <View style={{ gap: space.sm }}>
      <View style={[styles.row, { gap: space.sm }]}>
        <StatTile label="Duration" value={duration()} />
        <StatTile
          label="Sets"
          value={
            summary &&
            (saved
              ? String(summary.setsChecked)
              : `${String(summary.setsChecked)} of ${String(summary.setsTotal)}`)
          }
        />
      </View>
      <View style={[styles.row, { gap: space.sm }]}>
        <StatTile
          label="Volume"
          value={summary && formatVolume(summary.volumeKg, units)}
        />
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
  const { colors, radius, space, text } = useTheme();

  return (
    <View style={{ gap: space.sm }}>
      <SectionTitle>New records</SectionTitle>
      <View
        style={[
          styles.records,
          {
            borderRadius: radius.card,
            borderColor: colors.border,
            backgroundColor: colors.card,
          },
        ]}
      >
        {records === undefined && (
          <View style={[styles.recordText, { gap: 2, padding: space.lg }]}>
            <Skeleton width={160} height={21} />
            <Skeleton width={120} height={17} />
          </View>
        )}
        {records?.length === 0 && (
          <Text style={[text.body, { color: colors.muted, padding: space.lg }]}>
            No new records this time.
          </Text>
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
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
  },
  records: {
    borderWidth: 1,
  },
  record: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  recordText: {
    flex: 1,
    gap: 2,
  },
});
