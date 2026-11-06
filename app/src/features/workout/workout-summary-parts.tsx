import { StyleSheet, Text, View } from 'react-native';

import type { components } from '@/api/schema';
import { SectionTitle } from '@/components/section-title';
import { StatTile } from '@/components/stat-tile';
import {
  formatClock,
  formatSet,
  formatVolume,
  formatWeight,
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

    return summary.durationSeconds === null
      ? '—'
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
              : `${String(summary.setsChecked)} / ${String(summary.setsTotal)}`)
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
  records: Summary['records'];
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
        {records.map((record, index) => (
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
