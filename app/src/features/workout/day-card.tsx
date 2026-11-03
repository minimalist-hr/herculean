import { useRouter } from 'expo-router';
import type { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import type { components } from '@/api/schema';
import { Button } from '@/components/button';
import { notifyFailure } from '@/components/notifications';
import { Skeleton } from '@/components/skeleton';
import { ExerciseTargets } from '@/features/routines/exercise-targets';
import { counted } from '@/features/routines/formats';
import { useTheme } from '@/theme/theme-provider';

type Day = components['schemas']['DayResponse'];
type DayRoutine = components['schemas']['DayRoutineResponse'];

function comesInLogging() {
  notifyFailure('Logging comes in a later update.');
}

function skipComesLater() {
  notifyFailure('Skipping comes in a later update.');
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
  title,
  meta,
}: {
  label: string;
  title: string;
  meta: string;
}) {
  const { colors, space, text } = useTheme();

  return (
    <View style={{ gap: space.xs }}>
      <Text style={text.eyebrow}>{label}</Text>
      <Text style={[text.cardTitle, { color: colors.text }]}>{title}</Text>
      <Text style={text.meta}>{meta}</Text>
    </View>
  );
}

function PlannedCard({
  dayName,
  routine,
}: {
  dayName: string;
  routine: DayRoutine;
}) {
  const { colors, space } = useTheme();
  const sets = routine.exercises.reduce(
    (total, exercise) => total + exercise.targetSets,
    0,
  );

  return (
    <Card>
      <CardHeading
        label={`Scheduled for ${dayName}`}
        title={routine.name}
        meta={`${counted(routine.exercises.length, 'exercise', 'exercises')} · ${counted(sets, 'set', 'sets')}`}
      />
      <ExerciseTargets exercises={routine.exercises} background={colors.bg} />
      <Button label="Start workout" onPress={comesInLogging} />
      <View style={[styles.buttons, { gap: space.sm }]}>
        <View style={styles.button}>
          <Button
            label="Other routine"
            variant="secondary"
            onPress={comesInLogging}
          />
        </View>
        <View style={styles.button}>
          <Button
            label="Skip workout"
            variant="secondary"
            onPress={skipComesLater}
          />
        </View>
      </View>
    </Card>
  );
}

function RestCard({ upNext }: { upNext: Day['upNext'] }) {
  const { colors, space, text } = useTheme();

  return (
    <Card>
      <CardHeading
        label="Today"
        title="Rest day"
        meta="Nothing planned. Recovery is part of the program."
      />
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
          <Text style={text.eyebrow}>Up next</Text>
          <Text style={[text.listItemName, { color: colors.text }]}>
            {upNext.routineName ?? 'Rest'}
          </Text>
        </View>
        <Text style={text.meta}>Tomorrow</Text>
      </View>
      <Button
        label="Other routine"
        variant="secondary"
        onPress={comesInLogging}
      />
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

/** Today's card: what is planned, a rest day, or the way to a first routine. */
export function DayCard({ day, dayName }: { day: Day; dayName: string }) {
  if (!day.hasRoutines) {
    return <NoRoutinesCard />;
  }

  return day.routine === null ? (
    <RestCard upNext={day.upNext} />
  ) : (
    <PlannedCard dayName={dayName} routine={day.routine} />
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
