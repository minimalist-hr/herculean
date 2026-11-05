import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import type { components } from '@/api/schema';
import { BackLink } from '@/components/back-link';
import { BottomActionBox } from '@/components/bottom-action-box';
import { Button } from '@/components/button';
import { AlertIcon } from '@/components/icons';
import { LoadFailure } from '@/components/load-failure';
import { ScreenHeading } from '@/components/screen-heading';
import { SectionTitle } from '@/components/section-title';
import { Sheet } from '@/components/sheet';
import { Skeleton } from '@/components/skeleton';
import { useCurrentUser } from '@/features/account/use-current-user';
import {
  formatClock,
  formatSet,
  formatVolume,
  formatWeight,
} from '@/formats/formats';
import { useTheme } from '@/theme/theme-provider';

import { dateFromText, shortWeekdayDate } from './dates';
import { discardMessage, finishWarning, recordReason } from './finish-text';
import { useDiscardWorkout, useSaveWorkout } from './use-finish-workout';
import { useWorkoutSummary } from './use-workout-summary';

type Summary = components['schemas']['WorkoutSummaryResponse'];
type Units = components['schemas']['Units'];

function Warning({ title, message }: { title: string; message: string }) {
  const { colors, radius, space, text } = useTheme();

  return (
    <View
      style={[
        styles.warning,
        {
          gap: space.md,
          padding: space.lg,
          borderRadius: radius.card,
          borderColor: colors.border,
          backgroundColor: colors.card,
        },
      ]}
    >
      <AlertIcon color={colors.warn} size={20} />
      <View style={[styles.warningText, { gap: space.xs }]}>
        <Text style={[text.listItemName, { color: colors.text }]}>{title}</Text>
        <Text style={text.meta}>{message}</Text>
      </View>
    </View>
  );
}

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

function Tiles({ summary, units }: { summary?: Summary; units: Units }) {
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
            `${String(summary.setsChecked)} / ${String(summary.setsTotal)}`
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

function NewRecords({
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

/** What a workout comes to, to save or discard it. */
export function FinishScreen({ id }: { id: string }) {
  const router = useRouter();
  const { colors, size, space } = useTheme();
  const user = useCurrentUser();
  const units = user.data?.units ?? 'metric';
  const summary = useWorkoutSummary(id);
  const save = useSaveWorkout(id);
  const discard = useDiscardWorkout(id);
  const [confirmingDiscard, setConfirmingDiscard] = useState(false);

  const warning = summary.data && finishWarning(summary.data);

  function renderContent() {
    if (summary.data === undefined && summary.isError) {
      return (
        <LoadFailure
          message="Couldn't load this workout."
          onRetry={() => {
            void summary.refetch();
          }}
        />
      );
    }

    return (
      <>
        {warning && <Warning title={warning.title} message={warning.message} />}
        <Tiles summary={summary.data} units={units} />
        {summary.data !== undefined && summary.data.records.length > 0 && (
          <NewRecords records={summary.data.records} units={units} />
        )}
      </>
    );
  }

  return (
    <View style={[styles.screen, { backgroundColor: colors.bg }]}>
      <ScrollView
        contentContainerStyle={{
          gap: space.lg,
          paddingTop: size.topPaddingSubPage,
          paddingHorizontal: size.sidePadding,
          paddingBottom: space.xl,
        }}
      >
        <View>
          <BackLink
            label="Logging"
            onPress={() => {
              router.back();
            }}
          />
          <ScreenHeading
            label={
              summary.data &&
              `${summary.data.name} · ${shortWeekdayDate(dateFromText(summary.data.date))}`
            }
            title="Finish workout"
          />
        </View>
        {renderContent()}
      </ScrollView>
      {summary.data !== undefined && (
        <BottomActionBox aboveTabBar>
          {summary.data.setsChecked > 0 && (
            <Button
              label="Save workout"
              waitingLabel="Saving workout"
              waiting={save.isPending}
              onPress={() => {
                save.mutate();
              }}
            />
          )}
          <Button
            label="Discard workout"
            variant="dangerOutline"
            dimmed={save.isPending}
            onPress={() => {
              setConfirmingDiscard(true);
            }}
          />
        </BottomActionBox>
      )}
      <Sheet
        visible={confirmingDiscard}
        title="Discard this workout?"
        message={discardMessage(summary.data?.setsChecked ?? 0)}
        onClose={() => {
          setConfirmingDiscard(false);
        }}
      >
        <Button
          label="Discard workout"
          variant="danger"
          waitingLabel="Discarding workout"
          waiting={discard.isPending}
          onPress={() => {
            discard.mutate();
          }}
        />
      </Sheet>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  warning: {
    flexDirection: 'row',
    borderWidth: 1,
  },
  warningText: {
    flex: 1,
  },
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
