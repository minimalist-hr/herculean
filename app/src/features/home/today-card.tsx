import { useRouter, type Href } from 'expo-router';

import type { components } from '@/api/schema';
import { Button } from '@/components/button';
import { ProgressBar } from '@/components/progress-bar';
import { counted } from '@/features/routines/formats';
import {
  Card,
  CardHeading,
  NoRoutinesCard,
  StartButton,
  UpNext,
} from '@/features/workout/day-card';
import { savedMeta } from '@/features/workout/saved-workout';
import { useWorkout } from '@/features/workout/use-workout';
import { useWorkoutSummary } from '@/features/workout/use-workout-summary';
import {
  progressText,
  workoutProgress,
} from '@/features/workout/workout-progress';
import { useTheme } from '@/theme/theme-provider';

type Day = components['schemas']['DayResponse'];
type DayRoutine = components['schemas']['DayRoutineResponse'];

function InProgress({
  routine,
  workoutId,
}: {
  routine: DayRoutine;
  workoutId: string;
}) {
  const { colors } = useTheme();
  const router = useRouter();
  const workout = useWorkout(workoutId).data;
  const progress = workoutProgress(workout?.exercises ?? []);

  return (
    <Card>
      <CardHeading
        label="In progress"
        labelColor={colors.primaryText}
        title={routine.name}
        meta={progressText(progress)}
      />
      <ProgressBar done={progress.done} total={progress.total} />
      <Button
        label="Resume workout"
        onPress={() => {
          router.push(`/workout/log/${workoutId}` as Href);
        }}
      />
    </Card>
  );
}

function Completed({
  day,
  routine,
  workoutId,
}: {
  day: Day;
  routine: DayRoutine;
  workoutId: string;
}) {
  const { colors } = useTheme();
  const summary = useWorkoutSummary(workoutId);

  return (
    <Card>
      <CardHeading
        label="Done"
        labelColor={colors.success}
        title={routine.name}
        meta={savedMeta(routine.exercises.length, summary.data)}
      />
      <UpNext upNext={day.upNext} today={day.date} />
    </Card>
  );
}

/** Today in short: what to do now, or what comes next once it's done. */
export function TodayCard({ day }: { day: Day }) {
  const { colors } = useTheme();
  const { routine, workoutId } = day;

  if (routine === null) {
    return day.hasRoutines ? (
      <Card>
        <CardHeading
          label="Today"
          title="Rest day"
          meta="Nothing planned. Recovery is part of the program."
        />
        <UpNext upNext={day.upNext} today={day.date} />
      </Card>
    ) : (
      <NoRoutinesCard />
    );
  }

  if (workoutId !== null && day.status === 'inProgress') {
    return <InProgress routine={routine} workoutId={workoutId} />;
  }

  if (workoutId !== null && day.status === 'completed') {
    return <Completed day={day} routine={routine} workoutId={workoutId} />;
  }

  if (workoutId !== null) {
    return (
      <Card>
        <CardHeading
          label="Skipped"
          labelColor={colors.skipped}
          title={routine.name}
          meta="You skipped today’s workout."
        />
        <UpNext upNext={day.upNext} today={day.date} />
      </Card>
    );
  }

  const sets = routine.exercises.reduce(
    (total, exercise) => total + exercise.targetSets,
    0,
  );

  const meta = `${counted(routine.exercises.length, 'exercise', 'exercises')} · ${counted(sets, 'set', 'sets')}`;

  return (
    <Card>
      <CardHeading label="Planned" title={routine.name} meta={meta} />
      <StartButton
        date={day.date}
        label="Start workout"
        confirmMessage={`${routine.name} · ${meta}`}
      />
    </Card>
  );
}
