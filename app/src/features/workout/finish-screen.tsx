import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { BackLink } from '@/components/back-link';
import { BottomActionBox } from '@/components/bottom-action-box';
import { Button } from '@/components/button';
import { AlertIcon } from '@/components/icons';
import { LoadFailure } from '@/components/load-failure';
import { ScreenHeading } from '@/components/screen-heading';
import { Sheet } from '@/components/sheet';
import { useCurrentUser } from '@/features/account/use-current-user';
import { useTheme } from '@/theme/theme-provider';

import { dateFromText, shortWeekdayDate } from './dates';
import { discardMessage, finishWarning } from './finish-text';
import { useDiscardWorkout, useSaveWorkout } from './use-finish-workout';
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
        <SummaryTiles summary={summary.data} units={units} />
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
});
