import { StyleSheet, Text, View } from 'react-native';

import type { components } from '@/api/schema';
import { SectionTitle } from '@/components/section-title';
import { Skeleton } from '@/components/skeleton';
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

function Tile({ label, value }: { label: string; value?: string }) {
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
        <Skeleton width={90} height={24} />
      ) : (
        <Text style={[text.bigStat, { color: colors.text }]}>{value}</Text>
      )}
    </View>
  );
}

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
        <Tile label="Duration" value={duration()} />
        <Tile
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
        <Tile
          label="Volume"
          value={summary && formatVolume(summary.volumeKg, units)}
        />
        <Tile
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
  tile: {
    flex: 1,
    borderWidth: 1,
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
