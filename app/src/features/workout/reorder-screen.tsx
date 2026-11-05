import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import type { components } from '@/api/schema';
import { BackLink } from '@/components/back-link';
import { DraggableList } from '@/components/draggable-list';
import { LoadFailure } from '@/components/load-failure';
import { ScreenHeading } from '@/components/screen-heading';
import { Skeleton } from '@/components/skeleton';
import { ExerciseTargetLine } from '@/features/routines/exercise-targets';
import { sameGroup } from '@/features/routines/formats';
import { formatClock } from '@/formats/formats';
import { useTheme } from '@/theme/theme-provider';

import { useElapsed } from './use-elapsed';
import { useReorderExercises } from './use-reorder-exercises';
import { useWorkout } from './use-workout';
import { checkedSets } from './workout-progress';

type Workout = components['schemas']['WorkoutDetailsResponse'];

/** Reorders a workout's exercises. Each drop saves, so there is no Save button. */
export function ReorderScreen({ id }: { id: string }) {
  const { colors, size } = useTheme();
  const router = useRouter();
  const workout = useWorkout(id);
  const [dragging, setDragging] = useState(false);

  function renderContent() {
    if (workout.data !== undefined) {
      return <Exercises workout={workout.data} onDragChange={setDragging} />;
    }

    if (workout.isError) {
      return (
        <LoadFailure
          message="Couldn't load this workout."
          onRetry={() => {
            void workout.refetch();
          }}
        />
      );
    }

    return <ReorderSkeleton />;
  }

  return (
    <ScrollView
      scrollEnabled={!dragging}
      style={{ backgroundColor: colors.bg }}
      contentContainerStyle={{
        paddingTop: size.topPaddingSubPage,
        paddingHorizontal: size.sidePadding,
        paddingBottom: size.gap.sectionMax,
      }}
    >
      <BackLink
        label="Logging"
        onPress={() => {
          router.back();
        }}
      />
      {renderContent()}
    </ScrollView>
  );
}

function Exercises({
  workout,
  onDragChange,
}: {
  workout: Workout;
  onDragChange: (dragging: boolean) => void;
}) {
  const { colors, space, text } = useTheme();
  const reorder = useReorderExercises(workout.id);
  const elapsed = useElapsed(workout.startedAtUtc);

  return (
    <View style={{ gap: space.lg, marginTop: 2 }}>
      <ScreenHeading
        label={
          elapsed === null
            ? workout.name
            : `${workout.name} · ${formatClock(elapsed)}`
        }
        title="Reorder exercises"
        subtitle="Drag the handle to move an exercise. Logged sets stay with it."
      />
      <DraggableList
        items={workout.exercises}
        keyOf={(exercise) => exercise.id}
        moveLabel={(exercise) => `Move ${exercise.name}`}
        onDragChange={onDragChange}
        onReorder={(exercises) => {
          reorder.mutate(exercises);
        }}
        joined={sameGroup}
        renderRow={(exercise) => (
          <>
            <View style={styles.exercise}>
              <Text
                numberOfLines={1}
                style={[text.listItemName, { color: colors.text }]}
              >
                {exercise.name}
              </Text>
              <ExerciseTargetLine exercise={exercise} />
            </View>
            <Text style={[text.meta, { marginRight: space.md }]}>
              {`${String(checkedSets(exercise))}/${String(exercise.sets.length)}`}
            </Text>
          </>
        )}
      />
    </View>
  );
}

function ReorderSkeleton() {
  const { space } = useTheme();

  return (
    <View
      accessible
      accessibilityLabel="Loading this workout"
      accessibilityLiveRegion="polite"
      style={{ gap: space.md, marginTop: 2 }}
    >
      <Skeleton width={200} height={10} />
      <Skeleton width={240} height={28} />
      {[0, 1, 2, 3].map((row) => (
        <Skeleton key={row} width={320} height={56} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  exercise: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
});
