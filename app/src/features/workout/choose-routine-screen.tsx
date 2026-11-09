import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ScrollView, Text, View } from 'react-native';

import type { components } from '@/api/schema';
import { BackLink } from '@/components/back-link';
import { Button } from '@/components/button';
import { EmptyCard } from '@/components/empty-card';
import { LoadFailure } from '@/components/load-failure';
import { ScreenHeading } from '@/components/screen-heading';
import { Sheet } from '@/components/sheet';
import {
  ExerciseTargets,
  ExerciseTargetsSkeleton,
} from '@/features/routines/exercise-targets';
import { counted, formatShortDate } from '@/formats/formats';
import {
  RoutineRow,
  RoutineRowSkeleton,
} from '@/features/routines/routine-row';
import { useRoutine } from '@/features/routines/use-routine';
import { useRoutines } from '@/features/routines/use-routines';
import { useTheme } from '@/theme/theme-provider';

import { dateText } from '@/formats/dates';
import { useDay } from './use-day';
import { useDayRefresh } from './use-day-refresh';
import { useStartWorkout } from './use-start-workout';
import { useFloatingRoom } from '@/components/above-tab-bar';

type Routine = components['schemas']['RoutineListItemResponse'];

function summaryOf(routine: Routine) {
  const done =
    routine.lastDoneOn === null
      ? 'not done yet'
      : `last done ${formatShortDate(routine.lastDoneOn)}`;

  return `${counted(routine.exerciseCount, 'exercise', 'exercises')} · ${done}`;
}

/** What can be picked: the routines in the week plan, with the day's own routine first even if it has left the plan. */
function routinesToPick(routines: Routine[], plannedId: string | undefined) {
  return routines
    .filter(
      (routine) => routine.weekdays.length > 0 || routine.id === plannedId,
    )
    .sort(
      (first, second) =>
        Number(second.id === plannedId) - Number(first.id === plannedId),
    );
}

function ConfirmSheet({
  routine,
  date,
  today,
  visible,
  onClose,
}: {
  routine: Routine;
  date: string;
  today: string;
  visible: boolean;
  onClose: () => void;
}) {
  const { colors } = useTheme();
  const details = useRoutine(routine.id);
  const start = useStartWorkout({ replace: true });
  const verb = date === today ? 'Start' : 'Log';

  function renderBody() {
    if (details.data !== undefined) {
      return (
        <ExerciseTargets
          exercises={details.data.exercises}
          background={colors.bg}
        />
      );
    }

    if (details.isLoadingError) {
      return (
        <LoadFailure
          message="Couldn't load this routine."
          onRetry={() => {
            void details.refetch();
          }}
        />
      );
    }

    return <ExerciseTargetsSkeleton />;
  }

  return (
    <Sheet
      visible={visible}
      title={`${verb} ${routine.name}?`}
      message={summaryOf(routine)}
      onClose={onClose}
      body={renderBody()}
    >
      <Button
        label={`${verb} workout`}
        waitingLabel="Starting workout"
        waiting={start.isPending}
        onPress={() => {
          start.mutate({ date, routineId: routine.id });
        }}
      />
    </Sheet>
  );
}

/** Picks another routine for one day. The week plan stays as it is. */
export function ChooseRoutineScreen({ date }: { date: string }) {
  const router = useRouter();
  const { colors, size, space, text } = useTheme();
  const floatingRoom = useFloatingRoom();
  const { now } = useDayRefresh();
  const routines = useRoutines();
  const day = useDay(date);
  const [picked, setPicked] = useState<Routine | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);

  const plannedId = day.data?.routine?.id;
  // The day only puts its planned routine first, so if it fails, the routines show in their usual order.
  const loaded =
    routines.data !== undefined &&
    (day.data !== undefined || day.isLoadingError);
  const shown = loaded ? routinesToPick(routines.data, plannedId) : [];
  const empty = loaded && shown.length === 0;

  function renderContent() {
    if (loaded) {
      if (empty) {
        return (
          <EmptyCard
            title="No routines in your week plan"
            message="Pick days for a routine to see it here."
          />
        );
      }

      return shown.map((routine) => {
        const planned = routine.id === plannedId;
        const summary = summaryOf(routine);

        return (
          <RoutineRow
            key={routine.id}
            name={routine.name}
            summary={summary}
            label={planned ? `${routine.name}, planned, ${summary}` : undefined}
            trailing={
              planned && (
                <Text style={[text.eyebrow, { color: colors.primaryText }]}>
                  Planned
                </Text>
              )
            }
            onPress={() => {
              setPicked(routine);
              setSheetOpen(true);
            }}
          />
        );
      });
    }

    if (routines.isLoadingError) {
      return (
        <LoadFailure
          message="Couldn't load your routines."
          onRetry={() => {
            void routines.refetch();
          }}
        />
      );
    }

    return (
      <View
        accessible
        accessibilityLabel="Loading your routines"
        accessibilityLiveRegion="polite"
        style={{ gap: space.sm }}
      >
        {[120, 160, 100].map((width) => (
          <RoutineRowSkeleton key={width} width={width} />
        ))}
      </View>
    );
  }

  return (
    <ScrollView
      style={{ backgroundColor: colors.bg }}
      contentContainerStyle={{
        gap: space.lg,
        paddingTop: size.topPaddingSubPage,
        paddingHorizontal: size.sidePadding,
        paddingBottom: space.xl + floatingRoom,
      }}
    >
      <View>
        <BackLink
          label="Workout"
          onPress={() => {
            router.back();
          }}
        />
        <ScreenHeading
          title="Choose a routine"
          subtitle={
            empty
              ? undefined
              : 'For this day only. Your schedule stays the same.'
          }
        />
      </View>
      <View style={{ gap: space.sm }}>{renderContent()}</View>
      {picked !== null && (
        <ConfirmSheet
          routine={picked}
          date={date}
          today={dateText(now)}
          visible={sheetOpen}
          onClose={() => {
            setSheetOpen(false);
          }}
        />
      )}
    </ScrollView>
  );
}
