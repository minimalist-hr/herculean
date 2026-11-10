import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  View,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';

import type { components } from '@/api/schema';
import { useBottomRoom } from '@/components/tab-bar';
import { BackLink } from '@/components/back-link';
import { EmptyCard } from '@/components/empty-card';
import { HeaderIconButton } from '@/components/header-icon-button';
import { useGoBack } from '@/features/home/use-go-back';
import { PencilIcon, TrashIcon } from '@/components/icons';
import { LoadFailure } from '@/components/load-failure';
import { notifyFailure } from '@/components/notifications';
import {
  formatSet,
  formatShortDate,
  formatSince,
  joined,
  noValue,
} from '@/formats/formats';
import { SectionTitle } from '@/components/section-title';
import { StatTile } from '@/components/stat-tile';
import { useUnits } from '@/features/account/use-units';
import { tokens } from '@/theme/tokens';
import { useTheme } from '@/theme/theme-provider';

import { DeleteExerciseSheet } from './delete-exercise-sheet';
import { DetailsSkeleton } from './exercises-skeleton';
import { ExerciseChart } from './exercise-chart';
import { ExerciseSessions } from './exercise-sessions';
import { useExercise } from './use-exercise';
import { useExerciseSessions } from './use-exercise-sessions';
import { useFloatingRoom } from '@/components/above-tab-bar';

type Exercise = components['schemas']['ExerciseDetailsResponse'];
type Units = components['schemas']['Units'];

/** How close to the end, in points, the next page of sessions starts loading. */
const loadMoreDistance = 600;

export function ExerciseScreen({
  id,
  backLabel = 'Exercises',
  openedFromHome = false,
}: {
  id: string;
  /** The screen its back link returns to. */
  backLabel?: string;
  openedFromHome?: boolean;
}) {
  const { colors, size } = useTheme();
  const floatingRoom = useFloatingRoom();
  const bottomRoom = useBottomRoom();
  const goBack = useGoBack(openedFromHome);
  const exercise = useExercise(id);
  const sessions = useExerciseSessions(id);

  function loadMoreNearTheEnd({
    nativeEvent: { layoutMeasurement, contentOffset, contentSize },
  }: NativeSyntheticEvent<NativeScrollEvent>) {
    const nearTheEnd =
      layoutMeasurement.height + contentOffset.y >=
      contentSize.height - loadMoreDistance;
    // After a failed page, only Try again loads it.
    if (
      nearTheEnd &&
      sessions.hasNextPage &&
      !sessions.isFetching &&
      !sessions.isFetchNextPageError
    ) {
      void sessions.fetchNextPage();
    }
  }

  function renderContent() {
    if (exercise.data !== undefined) {
      return <Details exercise={exercise.data} sessions={sessions} />;
    }

    if (exercise.isLoadingError) {
      return (
        <LoadFailure
          message="Couldn’t load this exercise."
          onRetry={() => {
            void exercise.refetch();
          }}
        />
      );
    }

    return <DetailsSkeleton label="Loading the exercise" tiles />;
  }

  return (
    <ScrollView
      onScroll={loadMoreNearTheEnd}
      scrollEventThrottle={100}
      style={{ backgroundColor: colors.bg }}
      contentContainerStyle={{
        paddingTop: size.topPaddingSubPage,
        paddingHorizontal: size.sidePadding,
        paddingBottom: size.gap.sectionMax + floatingRoom + bottomRoom,
      }}
    >
      <BackLink label={openedFromHome ? 'Home' : backLabel} onPress={goBack} />
      {renderContent()}
    </ScrollView>
  );
}

function Details({
  exercise,
  sessions,
}: {
  exercise: Exercise;
  sessions: ReturnType<typeof useExerciseSessions>;
}) {
  const { colors, opacity, radius, size, space, text } = useTheme();
  const router = useRouter();
  const units = useUnits();
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const inUse = exercise.routines.length > 0;

  return (
    <View style={{ gap: size.gap.sectionMax, marginTop: space.xxxs }}>
      <View style={styles.heading}>
        <View style={[styles.titleRow, { gap: space.sm }]}>
          <Text
            accessibilityRole="header"
            style={[text.pageTitle, styles.title, { color: colors.text }]}
          >
            {exercise.name}
          </Text>
          <HeaderIconButton
            label="Edit exercise"
            onPress={() => {
              router.push({
                pathname: '/exercise/[id]/edit',
                params: { id: exercise.id },
              });
            }}
          >
            <PencilIcon color={colors.text} size={20} />
          </HeaderIconButton>
          <HeaderIconButton
            label={
              inUse
                ? 'Delete exercise, not available while it is in a routine'
                : 'Delete exercise'
            }
            onPress={() => {
              if (inUse) {
                notifyFailure(inRoutinesMessage(exercise.routines));
              } else {
                setConfirmingDelete(true);
              }
            }}
          >
            <View style={{ opacity: inUse ? opacity.disabled : 1 }}>
              <TrashIcon
                color={inUse ? colors.muted : colors.dangerFill}
                size={20}
              />
            </View>
          </HeaderIconButton>
        </View>
        <Text style={[text.body, { color: colors.muted }]}>
          {subtitleOf(exercise)}
        </Text>
      </View>

      <Progress exercise={exercise} units={units} />

      <ExerciseChart
        exerciseId={exercise.id}
        done={exercise.timesDone > 0}
        units={units}
      />

      <View style={{ gap: space.sm }}>
        <SectionTitle>Used in</SectionTitle>
        {inUse ? (
          <View
            style={[
              styles.usedIn,
              {
                borderRadius: radius.card,
                borderColor: colors.border,
                backgroundColor: colors.card,
              },
            ]}
          >
            {exercise.routines.map((routine, index) => (
              <Text
                key={routine.id}
                style={[
                  text.listItemName,
                  {
                    paddingVertical: space.lg,
                    paddingHorizontal: space.lg,
                    borderTopWidth: index === 0 ? 0 : 1,
                    borderTopColor: colors.border,
                    color: colors.text,
                  },
                ]}
              >
                {routine.name}
              </Text>
            ))}
          </View>
        ) : (
          <EmptyCard
            title="Not in any routine yet"
            message="Add it when you create or edit a routine."
          />
        )}
      </View>

      <ExerciseSessions sessions={sessions} units={units} />

      <DeleteExerciseSheet
        exercise={exercise}
        visible={confirmingDelete}
        onClose={() => {
          setConfirmingDelete(false);
        }}
        onDeleted={() => {
          router.back();
        }}
      />
    </View>
  );
}

/** The best set and how often it was done, with a dash until it has been done. */
function Progress({ exercise, units }: { exercise: Exercise; units: Units }) {
  const { space } = useTheme();
  const { bestSet, timesDone, firstDoneOn } = exercise;

  return (
    <View style={[styles.tiles, { gap: space.sm }]}>
      <StatTile
        label="Best set"
        value={
          bestSet === null
            ? noValue
            : formatSet(bestSet.weightKg, bestSet.reps, units)
        }
        detail={
          bestSet === null ? 'Not done yet' : formatShortDate(bestSet.date)
        }
      />
      <StatTile
        label="Done"
        value={timesDone === 1 ? '1 time' : `${String(timesDone)} times`}
        detail={firstDoneOn === null ? undefined : formatSince(firstDoneOn)}
      />
    </View>
  );
}

/** Names up to three routines. More would make the message too long to read. */
function inRoutinesMessage(routines: Exercise['routines']) {
  if (routines.length > 3) {
    return `It’s in ${String(routines.length)} routines. Remove it from them first.`;
  }

  const names = joined(routines.map((routine) => routine.name));

  return routines.length === 1
    ? `It’s in ${names}. Remove it from that routine first.`
    : `It’s in ${names}. Remove it from those routines first.`;
}

function subtitleOf({ group, alsoWorksGroups }: Exercise) {
  return [
    group.name,
    ...alsoWorksGroups.map((alsoWorks) => alsoWorks.name),
  ].join(' · ');
}

const styles = StyleSheet.create({
  heading: {
    gap: tokens.space.xxs,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    flex: 1,
  },
  usedIn: {
    borderWidth: 1,
  },
  tiles: {
    flexDirection: 'row',
  },
});
