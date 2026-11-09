import { StyleSheet, Text, View } from 'react-native';

import type { components } from '@/api/schema';
import { Button } from '@/components/button';
import { LoadFailure } from '@/components/load-failure';
import { Sheet } from '@/components/sheet';
import { Skeleton } from '@/components/skeleton';
import { useUnits } from '@/features/account/use-units';
import {
  ExerciseTargets,
  ExerciseTargetsSkeleton,
} from '@/features/routines/exercise-targets';
import {
  formatVolume,
  minutesText,
  noValue,
  shortWeekdayDate,
} from '@/formats/formats';
import { StatusLabel } from '@/components/status-label';
import { useTheme } from '@/theme/theme-provider';

import { dateFromText } from '@/formats/dates';
import { savedExercises } from './saved-workout';
import { useDay } from './use-day';
import { useWorkout } from './use-workout';
import { useWorkoutSummary } from './use-workout-summary';

type Day = components['schemas']['DayResponse'];

function SheetTile({ label, value }: { label: string; value?: string }) {
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
          backgroundColor: colors.raised,
        },
      ]}
    >
      <Text style={text.eyebrow}>{label}</Text>
      {value === undefined ? (
        <Skeleton width={60} height={18} />
      ) : (
        <Text style={[text.statValue, { color: colors.text }]}>{value}</Text>
      )}
    </View>
  );
}

function SavedWorkout({ day, workoutId }: { day: Day; workoutId: string }) {
  const { colors, space } = useTheme();
  const units = useUnits();
  const workout = useWorkout(workoutId);
  const summary = useWorkoutSummary(workoutId);
  const data = summary.data;

  function duration() {
    if (data === undefined) {
      return undefined;
    }

    return data.durationSeconds === null
      ? noValue
      : minutesText(data.durationSeconds);
  }

  return (
    <View style={{ gap: space.lg }}>
      <StatusLabel
        label={`Done · ${shortWeekdayDate(dateFromText(day.date))}`}
        color={colors.success}
      />
      {summary.isLoadingError ? (
        <LoadFailure
          message="Couldn’t load the summary."
          onRetry={() => {
            void summary.refetch();
          }}
        />
      ) : (
        <View style={[styles.tiles, { gap: space.sm }]}>
          <SheetTile label="Duration" value={duration()} />
          <SheetTile label="Sets" value={data && String(data.setsChecked)} />
          <SheetTile
            label="Volume"
            value={data && formatVolume(data.volumeKg, units)}
          />
        </View>
      )}
      {workout.isLoadingError && (
        <LoadFailure
          message="Couldn’t load the exercises."
          onRetry={() => {
            void workout.refetch();
          }}
        />
      )}
      {workout.isLoadingError ? null : workout.data === undefined ? (
        <ExerciseTargetsSkeleton />
      ) : (
        <ExerciseTargets
          exercises={savedExercises(workout.data, units)}
          background={colors.bg}
        />
      )}
    </View>
  );
}

function DayDetails({ day, today }: { day: Day; today: string }) {
  const { colors, space, text } = useTheme();
  const date = shortWeekdayDate(dateFromText(day.date));

  if (day.routine === null) {
    return (
      <View style={{ gap: space.sm }}>
        <StatusLabel label={date} />
        <Text style={text.meta}>
          Nothing planned. Recovery is part of the program.
        </Text>
      </View>
    );
  }

  if (day.status === 'completed' && day.workoutId !== null) {
    return <SavedWorkout day={day} workoutId={day.workoutId} />;
  }

  const status = {
    completed: { label: `Done · ${date}`, color: colors.success },
    inProgress: { label: `In progress · ${date}`, color: colors.primaryText },
    missed: { label: `Missed · ${date}`, color: colors.danger },
    planned: {
      label: `${day.date === today ? 'Today' : 'Planned'} · ${date}`,
      color: colors.muted,
    },
    rest: { label: date, color: undefined },
    skipped: { label: `Skipped · ${date}`, color: colors.skipped },
  }[day.status];

  return (
    <View style={{ gap: space.lg }}>
      <StatusLabel label={status.label} color={status.color} />
      <ExerciseTargets
        exercises={day.routine.exercises}
        background={colors.bg}
      />
    </View>
  );
}

/** A day's summary over the month. It stays filled in while it closes. */
export function DaySheet({
  date,
  visible,
  today,
  onClose,
  onOpenDay,
  onViewWorkout,
}: {
  date: string;
  visible: boolean;
  today: string;
  onClose: () => void;
  onOpenDay: () => void;
  onViewWorkout: (workoutId: string) => void;
}) {
  const { space } = useTheme();
  const day = useDay(date);
  const savedWorkoutId =
    day.data?.status === 'completed' ? day.data.workoutId : null;

  function title() {
    if (day.data === undefined) {
      return shortWeekdayDate(dateFromText(date));
    }

    return day.data.routine?.name ?? 'Rest day';
  }

  function renderBody() {
    if (day.data !== undefined) {
      return <DayDetails day={day.data} today={today} />;
    }

    if (day.isLoadingError) {
      return (
        <LoadFailure
          message="Couldn’t load this day."
          onRetry={() => {
            void day.refetch();
          }}
        />
      );
    }

    return (
      <View style={{ gap: space.lg }}>
        <Skeleton width={200} height={12} />
        <ExerciseTargetsSkeleton />
      </View>
    );
  }

  return (
    <Sheet
      visible={visible}
      title={title()}
      onClose={onClose}
      body={renderBody()}
    >
      {savedWorkoutId !== null && (
        <Button
          label="View workout"
          onPress={() => {
            onViewWorkout(savedWorkoutId);
          }}
        />
      )}
      <Button
        label="Open day"
        variant={savedWorkoutId === null ? 'primary' : 'secondary'}
        onPress={onOpenDay}
      />
    </Sheet>
  );
}

const styles = StyleSheet.create({
  tiles: {
    flexDirection: 'row',
  },
  tile: {
    flex: 1,
    borderWidth: 1,
  },
});
