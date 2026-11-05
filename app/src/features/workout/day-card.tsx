import { useRouter, type Href } from 'expo-router';
import { useState, type ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import type { components } from '@/api/schema';
import { Button } from '@/components/button';
import { notifyFailure } from '@/components/notifications';
import { Sheet } from '@/components/sheet';
import { ProgressBar } from '@/components/progress-bar';
import { Skeleton } from '@/components/skeleton';
import { ExerciseTargets } from '@/features/routines/exercise-targets';
import { counted } from '@/features/routines/formats';
import { SectionTitle } from '@/components/section-title';
import { StatusLabel } from '@/components/status-label';
import { formatClock } from '@/formats/formats';
import { useTheme } from '@/theme/theme-provider';

import { dateFromText, dayNameOf, daysFrom, shortDate } from './dates';
import { useElapsed } from './use-elapsed';
import { useSkipWorkout } from './use-skip-workout';
import { useStartWorkout } from './use-start-workout';
import { useUndoSkip } from './use-undo-skip';
import { useWorkout } from './use-workout';
import { checkedSets, progressText, workoutProgress } from './workout-progress';

type Day = components['schemas']['DayResponse'];
type DayRoutine = components['schemas']['DayRoutineResponse'];

function otherRoutineComesLater() {
  notifyFailure('Picking another routine comes in a later update.');
}

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

function StartButton({ date, label }: { date: string; label: string }) {
  const start = useStartWorkout();

  return (
    <Button
      label={label}
      waitingLabel="Starting workout"
      waiting={start.isPending}
      onPress={() => {
        start.mutate(date);
      }}
    />
  );
}

function SkipButton({
  date,
  routineName,
}: {
  date: string;
  routineName: string;
}) {
  const skip = useSkipWorkout();
  const [confirming, setConfirming] = useState(false);

  return (
    <>
      <Button
        label="Skip workout"
        variant="secondary"
        onPress={() => {
          setConfirming(true);
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
          <Button
            key="other"
            label="Other routine"
            variant="secondary"
            onPress={otherRoutineComesLater}
          />,
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
function CompletedCard({ routine }: { routine: DayRoutine }) {
  const { colors } = useTheme();

  return (
    <Card>
      <CardHeading
        label="Done"
        labelColor={colors.success}
        title={routine.name}
        meta="You finished this workout."
      />
      <ExerciseTargets exercises={routine.exercises} background={colors.bg} />
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
      {daysAway >= -1 && <UpNext upNext={day.upNext} today={today} />}
      {daysAway <= 0 && (
        <Button
          label="Other routine"
          variant="secondary"
          onPress={otherRoutineComesLater}
        />
      )}
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
    return <CompletedCard routine={day.routine} />;
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

  return (
    <Card>
      <PlannedContent date={date} routine={day.routine} />
      {day.date === today && (
        <>
          <StartButton date={day.date} label="Start workout" />
          <Actions>
            {[
              <Button
                key="other"
                label="Other routine"
                variant="secondary"
                onPress={otherRoutineComesLater}
              />,
              <SkipButton
                key="skip"
                date={day.date}
                routineName={day.routine.name}
              />,
            ]}
          </Actions>
        </>
      )}
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
