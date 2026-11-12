import { useRouter, type Href } from 'expo-router';
import { Text, View } from 'react-native';

import type { components } from '@/api/schema';
import { Button } from '@/components/button';
import { Card, CardHeading } from '@/components/card';
import { LoadFailure } from '@/components/load-failure';
import { ProgressBar } from '@/components/progress-bar';
import {
  Skeleton,
  SkeletonGroup,
  SkeletonLine,
  textLine,
} from '@/components/skeleton';
import { useUnits } from '@/features/account/use-units';
import {
  ExerciseBlocksSkeleton,
  ExerciseTargets,
} from '@/features/routines/exercise-targets';
import { dateFromText, daysFrom } from '@/formats/dates';
import { counted, dayNameOf, formatClock } from '@/formats/formats';
import { useTheme } from '@/theme/theme-provider';

import {
  Actions,
  DeleteButton,
  EmptyWorkoutButton,
  OtherRoutineButton,
  SkipButton,
  StartButton,
  UndoSkipButton,
} from './day-actions';
import { savedExercises, savedMeta } from './saved-workout';
import { useLinks } from '@/features/links/use-links';

import { UpNext } from './up-next';
import { useElapsed } from './use-elapsed';
import { useWorkout } from './use-workout';
import { useWorkoutSummary } from './use-workout-summary';
import { checkedSets, progressText, workoutProgress } from './workout-progress';

type Day = components['schemas']['DayResponse'];
type DayRoutine = components['schemas']['DayRoutineResponse'];

/** Opens a day's routine while it still exists. A deleted one's name stays plain, and so does an empty workout's. */
export function routineLink(
  routine: DayRoutine,
  links: { routine: (id: string) => void },
) {
  const { id } = routine;

  return routine.exists && id !== null
    ? () => {
        links.routine(id);
      }
    : undefined;
}

/** A routine's size in words, for example "4 exercises · 12 sets". */
export function routineMeta(routine: DayRoutine) {
  const sets = routine.exercises.reduce(
    (total, exercise) => total + exercise.targetSets,
    0,
  );

  return `${counted(routine.exercises.length, 'exercise', 'exercises')} · ${counted(sets, 'set', 'sets')}`;
}

function PlannedContent({
  date,
  routine,
}: {
  date: Date;
  routine: DayRoutine;
}) {
  const links = useLinks('day');
  const { colors } = useTheme();

  return (
    <>
      <CardHeading
        label={`Planned for ${dayNameOf(date).full}`}
        title={routine.name}
        onTitlePress={routineLink(routine, links)}
        meta={routineMeta(routine)}
      />
      <ExerciseTargets
        onOpen={links.exercise}
        exercises={routine.exercises}
        background={colors.bg}
      />
    </>
  );
}

function MissedCard({ date, routine }: { date: string; routine: DayRoutine }) {
  const links = useLinks('day');
  const { colors } = useTheme();

  return (
    <Card>
      <CardHeading
        label="Missed"
        labelColor={colors.danger}
        title={routine.name}
        onTitlePress={routineLink(routine, links)}
        meta="Planned, but nothing was logged."
      />
      <ExerciseTargets
        onOpen={links.exercise}
        exercises={routine.exercises}
        background={colors.bg}
      />
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
  const links = useLinks('day');
  const { colors } = useTheme();
  const isToday = day.date === today;

  return (
    <Card>
      <CardHeading
        label="Skipped"
        labelColor={colors.skipped}
        title={routine.name}
        onTitlePress={routineLink(routine, links)}
        meta={
          isToday ? 'You skipped today’s workout.' : 'You skipped this workout.'
        }
      />
      <ExerciseTargets
        onOpen={links.exercise}
        exercises={routine.exercises}
        background={colors.bg}
      />
      {isToday && <UpNext upNext={day.upNext} today={today} />}
      <UndoSkipButton workoutId={workoutId} />
    </Card>
  );
}

/** A workout in progress: how far it is, and that with the time so far as a line of text. */
export function useInProgress(workoutId: string) {
  const workout = useWorkout(workoutId).data;
  const elapsed = useElapsed(workout?.startedAtUtc);
  const progress = workoutProgress(workout?.exercises ?? []);
  const sets = progressText(progress);

  return {
    workout,
    progress,
    meta: elapsed === null ? sets : `${sets} · ${formatClock(elapsed)}`,
  };
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
  const links = useLinks('day');
  const { colors, text } = useTheme();
  const router = useRouter();
  const { workout, progress, meta } = useInProgress(workoutId);

  return (
    <Card>
      <CardHeading
        label="In progress"
        labelColor={colors.primaryText}
        title={routine.name}
        onTitlePress={routineLink(routine, links)}
        meta={meta}
      />
      <ProgressBar done={progress.done} total={progress.total} />
      <ExerciseTargets
        onOpen={links.exercise}
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

/** A finished day's card: what was done, and the way to view, edit or delete it. */
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
  const links = useLinks('day');
  const { colors, space } = useTheme();
  const router = useRouter();
  const units = useUnits();
  const workout = useWorkout(workoutId);
  const summary = useWorkoutSummary(workoutId);

  function renderExercises() {
    if (workout.data !== undefined) {
      return (
        <ExerciseTargets
          onOpen={links.exercise}
          exercises={savedExercises(workout.data, units)}
          background={colors.bg}
        />
      );
    }

    if (workout.isLoadingError) {
      return (
        <LoadFailure
          message="Couldn’t load this workout."
          onRetry={() => {
            void workout.refetch();
            void summary.refetch();
          }}
        />
      );
    }

    return (
      <View style={{ gap: space.sm }}>
        <Skeleton width="100%" height={56} />
        <Skeleton width="100%" height={56} />
      </View>
    );
  }

  return (
    <Card>
      <CardHeading
        label="Done"
        labelColor={colors.success}
        title={routine.name}
        onTitlePress={routineLink(routine, links)}
        meta={savedMeta(routine.exercises.length, summary.data)}
      />
      {renderExercises()}
      <Button
        label="View workout"
        onPress={() => {
          links.workout(workoutId);
        }}
      />
      <Actions>
        {[
          <Button
            key="edit"
            label="Edit"
            variant="secondary"
            onPress={() => {
              router.push({
                pathname: '/workout/edit/[id]',
                params: { id: workoutId },
              });
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

/** With no routines, a first one, or a workout with none. */
export function NoRoutinesCard({
  date,
  today,
}: {
  date: string;
  today: string;
}) {
  const router = useRouter();

  return (
    <Card>
      <CardHeading
        label="Get started"
        title="No routines yet"
        meta="Create a routine and pick the days you train."
      />
      <Button
        label="New routine"
        onPress={() => {
          router.push('/routine/new');
        }}
      />
      <EmptyWorkoutButton date={date} today={today} />
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
      <NoRoutinesCard date={day.date} today={today} />
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
  const { colors, size, space } = useTheme();

  return (
    <SkeletonGroup label="Loading this day">
      <Card>
        <View style={{ gap: space.xs }}>
          <SkeletonLine width={130} height={10} lineHeight={textLine.eyebrow} />
          <SkeletonLine
            width={190}
            height={20}
            lineHeight={textLine.cardTitle}
          />
          <SkeletonLine width={120} height={10} lineHeight={textLine.meta} />
        </View>
        <ExerciseBlocksSkeleton background={colors.bg} />
        <Skeleton width="100%" height={size.primaryButton} />
        <Actions>
          {[
            <Skeleton key="other" width="100%" height={size.secondaryButton} />,
            <Skeleton key="skip" width="100%" height={size.secondaryButton} />,
          ]}
        </Actions>
      </Card>
    </SkeletonGroup>
  );
}
