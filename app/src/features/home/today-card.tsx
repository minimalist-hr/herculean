import { useRouter } from 'expo-router';
import { dayNameOf } from '@/formats/formats';
import { View } from 'react-native';

import type { components } from '@/api/schema';
import { Button } from '@/components/button';
import { ProgressBar } from '@/components/progress-bar';
import {
  Skeleton,
  SkeletonGroup,
  SkeletonLine,
  textLine,
} from '@/components/skeleton';
import {
  NoRoutinesCard,
  routineLink,
  routineMeta,
  useInProgress,
} from '@/features/workout/day-card';
import { Card, CardHeading } from '@/components/card';
import { StartButton } from '@/features/workout/day-actions';
import { useLinks } from '@/features/links/use-links';
import { UpNext } from '@/features/workout/up-next';
import { savedMeta } from '@/features/workout/saved-workout';
import { useWorkoutSummary } from '@/features/workout/use-workout-summary';
import { dateFromText } from '@/formats/dates';
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
  const links = useLinks('home');
  const { colors } = useTheme();
  const router = useRouter();
  const { progress, meta } = useInProgress(workoutId);

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
      <Button
        label="Resume workout"
        onPress={() => {
          router.push(
            {
              pathname: '/workout/log/[id]',
              params: { id: workoutId, from: 'home' },
            },
            { withAnchor: true },
          );
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
  const links = useLinks('home');

  return (
    <Card>
      <CardHeading
        label="Done"
        labelColor={colors.success}
        title={routine.name}
        onTitlePress={routineLink(routine, links)}
        meta={savedMeta(routine.exercises.length, summary.data)}
      />
      <Button
        label="View workout"
        onPress={() => {
          links.workout(workoutId);
        }}
      />
      <UpNext upNext={day.upNext} today={day.date} />
    </Card>
  );
}

/** The size of a planned day's card, the one seen most. */
export function TodayCardSkeleton() {
  const { size, space } = useTheme();

  return (
    <SkeletonGroup label="Loading today">
      <Card>
        <View style={{ gap: space.xs }}>
          <SkeletonLine width={70} height={10} lineHeight={textLine.eyebrow} />
          <SkeletonLine
            width={190}
            height={20}
            lineHeight={textLine.cardTitle}
          />
          <SkeletonLine width={170} height={10} lineHeight={textLine.meta} />
        </View>
        <Skeleton width="100%" height={size.primaryButton} />
      </Card>
    </SkeletonGroup>
  );
}

/** Today in short: what to do now, or what comes next once it's done. */
export function TodayCard({ day }: { day: Day }) {
  const { colors } = useTheme();
  const links = useLinks('home');
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
      <NoRoutinesCard date={day.date} today={day.date} />
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
          onTitlePress={routineLink(routine, links)}
          meta="You skipped today’s workout."
        />
        <UpNext upNext={day.upNext} today={day.date} />
      </Card>
    );
  }

  const meta = routineMeta(routine);

  return (
    <Card>
      <CardHeading
        label={`Planned for ${dayNameOf(dateFromText(day.date)).full}`}
        title={routine.name}
        onTitlePress={routineLink(routine, links)}
        meta={meta}
      />
      <StartButton
        date={day.date}
        label="Start workout"
        confirmMessage={`${routine.name} · ${meta}`}
      />
    </Card>
  );
}
