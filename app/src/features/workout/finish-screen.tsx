import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { BackLink } from '@/components/back-link';
import { BottomActionBox } from '@/components/bottom-action-box';
import { Button } from '@/components/button';
import { AlertIcon } from '@/components/icons';
import { LoadFailure } from '@/components/load-failure';
import { NotLoadedButton } from '@/components/not-loaded-button';
import { notifyFailure } from '@/components/notifications';
import { blankLine, ScreenHeading } from '@/components/screen-heading';
import { Sheet } from '@/components/sheet';
import { useUnits } from '@/features/account/use-units';
import { useTheme } from '@/theme/theme-provider';

import { dateFromText } from '@/formats/dates';
import { shortWeekdayDate } from '@/formats/formats';
import { discardMessage, finishCounts, finishWarning } from './finish-text';
import { useDiscardWorkout, useSaveWorkout } from './use-finish-workout';
import { useWorkout } from './use-workout';
import { useWorkoutSummary } from './use-workout-summary';
import { NewRecords, SummaryTiles } from './workout-summary-parts';

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

/** What a workout comes to, to save or discard it. */
export function FinishScreen({ id }: { id: string }) {
  const router = useRouter();
  const { colors, size, space } = useTheme();
  const units = useUnits();
  const summary = useWorkoutSummary(id);
  const save = useSaveWorkout(id);
  const discard = useDiscardWorkout(id, summary.data?.name ?? 'Workout');
  const [confirmingDiscard, setConfirmingDiscard] = useState(false);

  // Logging already holds the workout, so the warning shows at once, before the summary.
  const workout = useWorkout(id).data;
  const counts = summary.data ?? (workout && finishCounts(workout.exercises));
  const warning = counts && finishWarning(counts);
  const named = summary.data ?? workout;

  function headingLabel() {
    if (named !== undefined) {
      return `${named.name} · ${shortWeekdayDate(dateFromText(named.date))}`;
    }

    // A blank line keeps the room after a failure, so the page doesn't move.
    return summary.isLoadingError ? blankLine : null;
  }

  function renderContent() {
    if (summary.data === undefined && summary.isLoadingError) {
      return (
        <LoadFailure
          message="Couldn’t load this workout."
          onRetry={() => {
            void summary.refetch();
          }}
        />
      );
    }

    return (
      <>
        {warning && <Warning title={warning.title} message={warning.message} />}
        <SummaryTiles summary={summary.data} units={units} />
        <NewRecords records={summary.data?.records} units={units} />
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
          <ScreenHeading label={headingLabel()} title="Finish workout" />
        </View>
        {renderContent()}
      </ScrollView>
      <BottomActionBox aboveTabBar>
        {summary.data === undefined ? (
          <>
            <NotLoadedButton label="Save workout" />
            <NotLoadedButton label="Discard workout" variant="dangerOutline" />
          </>
        ) : (
          <>
            <Button
              label="Save workout"
              waitingLabel="Saving workout"
              waiting={save.isPending}
              muted={summary.data.setsChecked === 0}
              onPress={() => {
                if (summary.data.setsChecked === 0) {
                  notifyFailure(
                    'Check off a set to save, or discard the workout.',
                  );
                } else {
                  save.mutate();
                }
              }}
            />
            <Button
              label="Discard workout"
              variant="dangerOutline"
              dimmed={save.isPending}
              onPress={() => {
                setConfirmingDiscard(true);
              }}
            />
          </>
        )}
      </BottomActionBox>
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
});
