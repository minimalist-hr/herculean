import { useRouter, type Href } from 'expo-router';
import { useState, type ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import type { components } from '@/api/schema';
import { Button } from '@/components/button';
import { LoadFailure } from '@/components/load-failure';
import { notifyFailure } from '@/components/notifications';
import { Sheet } from '@/components/sheet';
import { ProgressBar } from '@/components/progress-bar';
import { Skeleton } from '@/components/skeleton';
import { useCurrentUser } from '@/features/account/use-current-user';
import { ExerciseTargets } from '@/features/routines/exercise-targets';
import { counted } from '@/features/routines/formats';
import { SectionTitle } from '@/components/section-title';
import { StatusLabel } from '@/components/status-label';
import { formatClock } from '@/formats/formats';
import { useTheme } from '@/theme/theme-provider';

import { dateFromText, dayNameOf, daysFrom, shortDate } from './dates';
import { useElapsed } from './use-elapsed';
import { useFirstDay } from './use-first-day';
import { useSkipWorkout } from './use-skip-workout';
import { useDeleteWorkout } from './use-finish-workout';
import { useStartWorkout } from './use-start-workout';
import { useUndoSkip } from './use-undo-skip';
import { useWorkout } from './use-workout';
import { resumeFirst, useWorkoutInProgress } from './use-workout-in-progress';
import { useWorkoutSummary } from './use-workout-summary';
import { savedExercises, savedMeta } from './saved-workout';
import { checkedSets, progressText, workoutProgress } from './workout-progress';

type Day = components['schemas']['DayResponse'];
type DayRoutine = components['schemas']['DayRoutineResponse'];

function Card({ children }: { children: ReactNode }) {
  const { colors, radius, space } = useTheme();

  return (
    <View
      style={[
        styles.card,
        {
          gap: space.md,
          padding: space.lg,
          borderRadius: radius.card,
          borderColor: colors.border,
          backgroundColor: colors.card,
        },
      ]}
    >
      {children}
    </View>
  );
}

function CardHeading({
  label,
  labelColor,
  title,
  meta,
}: {
  label: string;
  /** A status color: the label then has a dot before it. */
  labelColor?: string;
  title: string;
  meta: string;
}) {
  const { colors, space, text } = useTheme();

  return (
    <View style={{ gap: space.xs }}>
      <StatusLabel label={label} color={labelColor} />
      <Text style={[text.cardTitle, { color: colors.text }]}>{title}</Text>
      <Text style={text.meta}>{meta}</Text>
    </View>
  );
}

function Actions({ children }: { children: ReactNode[] }) {
  const { space } = useTheme();

  return (
    <View style={[styles.buttons, { gap: space.sm }]}>
      {children.map((button, index) => (
        <View key={index} style={styles.button}>
          {button}
        </View>
      ))}
    </View>
  );
}

/** True while a workout is in progress, which keeps another from starting. */
function useAnotherInProgress() {
  return Boolean(useWorkoutInProgress().data);
}

const startNotYet = "A workout can't be started before its day.";

/** The first reason an action can't be used now, or null when it can. */
function firstReason(reasons: [boolean, string][]) {
  return reasons.find(([applies]) => applies)?.[1] ?? null;
}

function StartButton({
  date,
  label,
  notYet = false,
}: {
  date: string;
  label: string;
  /** The day hasn't come yet. */
  notYet?: boolean;
}) {
  const start = useStartWorkout();
  const reason = firstReason([
    [notYet, startNotYet],
    [useAnotherInProgress(), resumeFirst],
  ]);

  return (
    <Button
      label={label}
      waitingLabel="Starting workout"
      waiting={start.isPending}
      muted={reason !== null}
      onPress={() => {
        if (reason !== null) {
          notifyFailure(reason);
        } else {
          start.mutate({ date });
        }
      }}
    />
  );
}

function OtherRoutineButton({
  date,
  notYet = false,
}: {
  date: string;
  /** The day hasn't come yet. */
  notYet?: boolean;
}) {
  const router = useRouter();
  const firstDay = useFirstDay();
  const reason = firstReason([
    [notYet, startNotYet],
    [
      firstDay.data !== undefined && date < firstDay.data,
      "A workout can't be added before your first day.",
    ],
    [useAnotherInProgress(), resumeFirst],
  ]);

  return (
    <Button
      label="Other routine"
      variant="secondary"
      muted={reason !== null}
      onPress={() => {
        if (reason !== null) {
          notifyFailure(reason);
        } else {
          router.push({
            pathname: '/workout/choose/[date]',
            params: { date },
          });
        }
      }}
    />
  );
}

function SkipButton({
  date,
  routineName,
  notYet = false,
}: {
  date: string;
  routineName: string;
  /** The day hasn't come yet. */
  notYet?: boolean;
}) {
  const skip = useSkipWorkout();
  const [confirming, setConfirming] = useState(false);

  return (
    <>
      <Button
        label="Skip workout"
        variant="secondary"
        muted={notYet}
        onPress={() => {
          if (notYet) {
            notifyFailure("A workout can't be skipped before its day.");
          } else {
            setConfirming(true);
          }
        }}
      />
      <Sheet
        visible={confirming}
        title={`Skip ${routineName}?`}
        message="It shows as skipped, and you can undo it."
        onClose={() => {
          setConfirming(false);
        }}
      >
        <Button
          label="Skip workout"
          waitingLabel="Skipping workout"
          waiting={skip.isPending}
          onPress={() => {
            skip.mutate(date);
          }}
        />
      </Sheet>
    </>
  );
}

function DeleteButton({
  workoutId,
  name,
}: {
  workoutId: string;
  name: string;
}) {
  const remove = useDeleteWorkout(workoutId);
  const [confirming, setConfirming] = useState(false);

  return (
    <>
      <Button
        label="Delete"
        variant="dangerOutline"
        onPress={() => {
          setConfirming(true);
        }}
      />
      <Sheet
        visible={confirming}
        title={`Delete ${name}?`}
        message="Its sets come out of your history, best sets and month totals. You can undo this right after."
        onClose={() => {
          setConfirming(false);
        }}
      >
        <Button
          label="Delete workout"
          variant="danger"
          waitingLabel="Deleting workout"
          waiting={remove.isPending}
          onPress={() => {
            // On success the day shows its plan, so this card and its sheet go.
            remove.mutate();
          }}
        />
      </Sheet>
    </>
  );
}

function UndoSkipButton({ workoutId }: { workoutId: string }) {
  const undo = useUndoSkip();
  const [confirming, setConfirming] = useState(false);

  return (
    <>
      <Button
        label="Undo skip"
        variant="secondary"
        onPress={() => {
          setConfirming(true);
        }}
      />
      <Sheet
        visible={confirming}
        title="Undo this skip?"
        message="This day goes back to its plan."
        onClose={() => {
          setConfirming(false);
        }}
      >
        <Button
          label="Undo skip"
          waitingLabel="Undoing skip"
          waiting={undo.isPending}
          onPress={() => {
            undo.mutate(workoutId);
          }}
        />
      </Sheet>
    </>
  );
}

function PlannedContent({
  date,
  routine,
}: {
  date: Date;
  routine: DayRoutine;
}) {
  const { colors } = useTheme();
  const sets = routine.exercises.reduce(
    (total, exercise) => total + exercise.targetSets,
    0,
  );

  return (
    <>
      <CardHeading
        label={`Planned for ${dayNameOf(date).full}`}
        title={routine.name}
        meta={`${counted(routine.exercises.length, 'exercise', 'exercises')} · ${counted(sets, 'set', 'sets')}`}
      />
      <ExerciseTargets exercises={routine.exercises} background={colors.bg} />
    </>
  );
}

function MissedCard({ date, routine }: { date: string; routine: DayRoutine }) {
  const { colors } = useTheme();

  return (
    <Card>
      <CardHeading
        label="Missed"
        labelColor={colors.danger}
        title={routine.name}
        meta="Planned, but nothing was logged."
      />
      <ExerciseTargets exercises={routine.exercises} background={colors.bg} />
      <StartButton date={date} label="Log workout" />
      <Actions>
        {[
          <OtherRoutineButton key="other" date={date} />,
          <SkipButton key="skip" date={date} routineName={routine.name} />,
        ]}
      </Actions>
    </Card>
  );
}

function SkippedCard({
  day,
  routine,
  today,
  workoutId,
}: {
  day: Day;
  routine: DayRoutine;
  today: string;
  workoutId: string;
}) {
  const { colors } = useTheme();
  const isToday = day.date === today;

  return (
    <Card>
      <CardHeading
        label="Skipped"
        labelColor={colors.skipped}
        title={routine.name}
        meta={
          isToday ? 'You skipped today’s workout.' : 'You skipped this workout.'
        }
      />
      <ExerciseTargets exercises={routine.exercises} background={colors.bg} />
      {isToday && <UpNext upNext={day.upNext} today={today} />}
      <UndoSkipButton workoutId={workoutId} />
    </Card>
  );
}

function InProgressCard({
  day,
  routine,
  today,
  workoutId,
}: {
  day: Day;
  routine: DayRoutine;
  today: string;
  workoutId: string;
}) {
  const { colors, text } = useTheme();
  const router = useRouter();
  const workout = useWorkout(workoutId).data;
  const elapsed = useElapsed(workout?.startedAtUtc);
  const progress = workoutProgress(workout?.exercises ?? []);
  const sets = progressText(progress);

  return (
    <Card>
      <CardHeading
        label="In progress"
        labelColor={colors.primaryText}
        title={routine.name}
        meta={elapsed === null ? sets : `${sets} · ${formatClock(elapsed)}`}
      />
      <ProgressBar done={progress.done} total={progress.total} />
      <ExerciseTargets
        exercises={routine.exercises}
        background={colors.bg}
        trailing={(exerciseId) => {
          const exercise = workout?.exercises.find(
            (candidate) => candidate.exerciseId === exerciseId,
          );

          return (
            exercise && (
              <Text style={text.meta}>
                {`${String(checkedSets(exercise))}/${String(exercise.sets.length)}`}
              </Text>
            )
          );
        }}
      />
      {day.date === today && <UpNext upNext={day.upNext} today={today} />}
      <Button
        label="Resume workout"
        onPress={() => {
          router.push(`/workout/log/${workoutId}` as Href);
        }}
      />
    </Card>
  );
}

/** A finished day's card, until its full design comes with finishing a workout. */
function CompletedCard({
  day,
  routine,
  today,
  workoutId,
}: {
  day: Day;
  routine: DayRoutine;
  today: string;
  workoutId: string;
}) {
  const { colors, space } = useTheme();
  const router = useRouter();
  const user = useCurrentUser();
  const workout = useWorkout(workoutId);
  const summary = useWorkoutSummary(workoutId);

  function renderExercises() {
    if (workout.data !== undefined) {
      return (
        <ExerciseTargets
          exercises={savedExercises(workout.data, user.data?.units ?? 'metric')}
          background={colors.bg}
        />
      );
    }

    if (workout.isError) {
      return (
        <LoadFailure
          message="Couldn't load this workout."
          onRetry={() => {
            void workout.refetch();
            void summary.refetch();
          }}
        />
      );
    }

    return (
      <View style={{ gap: space.sm }}>
        <Skeleton width={260} height={56} />
        <Skeleton width={260} height={56} />
      </View>
    );
  }

  return (
    <Card>
      <CardHeading
        label="Done"
        labelColor={colors.success}
        title={routine.name}
        meta={savedMeta(routine.exercises.length, summary.data)}
      />
      {renderExercises()}
      <Button
        label="View workout"
        onPress={() => {
          router.push({
            pathname: '/workout/details/[id]',
            params: { id: workoutId },
          });
        }}
      />
      <Actions>
        {[
          <Button
            key="edit"
            label="Edit"
            variant="secondary"
            onPress={() => {
              notifyFailure('Editing a workout comes in a later update.');
            }}
          />,
          <DeleteButton
            key="delete"
            workoutId={workoutId}
            name={routine.name}
          />,
        ]}
      </Actions>
      {day.date === today && <UpNext upNext={day.upNext} today={today} />}
    </Card>
  );
}

function upNextWhen(date: string, today: string) {
  const days = daysFrom(today, date);
  if (days === 0) {
    return 'Today';
  }

  return days === 1 ? 'Tomorrow' : shortDate(dateFromText(date));
}

function UpNext({ upNext, today }: { upNext: Day['upNext']; today: string }) {
  const { colors, space, text } = useTheme();

  return (
    <View
      style={[
        styles.upNext,
        {
          gap: space.md,
          paddingTop: space.md,
          borderTopColor: colors.border,
        },
      ]}
    >
      <View style={{ gap: 2 }}>
        <SectionTitle>Up next</SectionTitle>
        <Text style={[text.listItemName, { color: colors.text }]}>
          {upNext.routineName ?? 'Rest'}
        </Text>
      </View>
      <Text style={text.meta}>{upNextWhen(upNext.date, today)}</Text>
    </View>
  );
}

function RestCard({
  date,
  day,
  today,
}: {
  date: Date;
  day: Day;
  today: string;
}) {
  const daysAway = daysFrom(today, day.date);

  return (
    <Card>
      <CardHeading
        label={daysAway === 0 ? 'Today' : dayNameOf(date).full}
        title="Rest day"
        meta="Nothing planned. Recovery is part of the program."
      />
      {daysAway >= 0 && <UpNext upNext={day.upNext} today={today} />}
      <OtherRoutineButton date={day.date} notYet={daysAway > 0} />
    </Card>
  );
}

function NoRoutinesCard() {
  const router = useRouter();

  return (
    <Card>
      <CardHeading
        label="Get started"
        title="No routines yet"
        meta="Create a routine and pick the days you train."
      />
      <Button
        label="Create routine"
        onPress={() => {
          router.push('/routine/new');
        }}
      />
    </Card>
  );
}

/** A day's card: what is planned, in progress, done, missed or skipped, a rest day, or the way to a first routine. */
export function DayCard({ day, today }: { day: Day; today: string }) {
  const date = dateFromText(day.date);

  if (day.routine === null) {
    return day.hasRoutines ? (
      <RestCard date={date} day={day} today={today} />
    ) : (
      <NoRoutinesCard />
    );
  }

  if (day.workoutId !== null && day.status === 'inProgress') {
    return (
      <InProgressCard
        day={day}
        routine={day.routine}
        today={today}
        workoutId={day.workoutId}
      />
    );
  }

  if (day.status === 'completed') {
    return day.workoutId === null ? null : (
      <CompletedCard
        day={day}
        routine={day.routine}
        today={today}
        workoutId={day.workoutId}
      />
    );
  }

  if (day.workoutId !== null) {
    return (
      <SkippedCard
        day={day}
        routine={day.routine}
        today={today}
        workoutId={day.workoutId}
      />
    );
  }

  if (day.status === 'missed') {
    return <MissedCard date={day.date} routine={day.routine} />;
  }

  // A planned day is today or later.
  const notYet = day.date > today;

  return (
    <Card>
      <PlannedContent date={date} routine={day.routine} />
      <StartButton date={day.date} label="Start workout" notYet={notYet} />
      <Actions>
        {[
          <OtherRoutineButton key="other" date={day.date} notYet={notYet} />,
          <SkipButton
            key="skip"
            date={day.date}
            routineName={day.routine.name}
            notYet={notYet}
          />,
        ]}
      </Actions>
    </Card>
  );
}

export function DayCardSkeleton() {
  const { space } = useTheme();

  return (
    <View
      accessible
      accessibilityLabel="Loading this day"
      accessibilityLiveRegion="polite"
    >
      <Card>
        <View style={{ gap: space.sm }}>
          <Skeleton width={110} height={10} />
          <Skeleton width={190} height={20} />
          <Skeleton width={240} height={10} />
        </View>
        <View style={{ gap: space.md }}>
          {[220, 150, 170, 190].map((width, index) => (
            <Skeleton key={index} width={width} height={14} />
          ))}
        </View>
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
  },
  buttons: {
    flexDirection: 'row',
  },
  button: {
    flex: 1,
  },
  upNext: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
  },
});
