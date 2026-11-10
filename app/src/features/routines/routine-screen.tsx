import { useRouter, type Href } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import type { components } from '@/api/schema';
import { BackLink } from '@/components/back-link';
import { Button } from '@/components/button';
import { HeaderIconButton } from '@/components/header-icon-button';
import { PencilIcon, TrashIcon } from '@/components/icons';
import { LoadFailure } from '@/components/load-failure';
import { Sheet } from '@/components/sheet';
import { Skeleton } from '@/components/skeleton';
import { SectionTitle } from '@/components/section-title';
import { tokens } from '@/theme/tokens';
import { useTheme } from '@/theme/theme-provider';

import { ExerciseTargets } from './exercise-targets';
import { counted, dayNames, joined } from '@/formats/formats';
import { useDeleteRoutine } from './use-delete-routine';
import { useRoutine } from './use-routine';
import { useFloatingRoom } from '@/components/above-tab-bar';

type Routine = components['schemas']['RoutineDetailsResponse'];

export function RoutineScreen({ id }: { id: string }) {
  const { colors, size } = useTheme();
  const floatingRoom = useFloatingRoom();
  const router = useRouter();
  const routine = useRoutine(id);

  function renderContent() {
    if (routine.data !== undefined) {
      return <Details routine={routine.data} />;
    }

    if (routine.isLoadingError) {
      return (
        <LoadFailure
          message="Couldn’t load this routine."
          onRetry={() => {
            void routine.refetch();
          }}
        />
      );
    }

    return <RoutineSkeleton />;
  }

  return (
    <ScrollView
      style={{ backgroundColor: colors.bg }}
      contentContainerStyle={{
        paddingTop: size.topPaddingSubPage,
        paddingHorizontal: size.sidePadding,
        paddingBottom: size.gap.sectionMax + floatingRoom,
      }}
    >
      <BackLink
        label="Routines"
        onPress={() => {
          router.back();
        }}
      />
      {renderContent()}
    </ScrollView>
  );
}

function Details({ routine }: { routine: Routine }) {
  const { colors, radius, size, space, text } = useTheme();
  const router = useRouter();
  const deleteRoutine = useDeleteRoutine();
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  return (
    <View style={{ gap: size.gap.sectionMax, marginTop: space.xxxs }}>
      <View style={styles.heading}>
        <View style={[styles.titleRow, { gap: space.sm }]}>
          <Text
            accessibilityRole="header"
            style={[text.pageTitle, styles.title, { color: colors.text }]}
          >
            {routine.name}
          </Text>
          <HeaderIconButton
            label="Edit routine"
            onPress={() => {
              router.push(`/routine/${routine.id}/edit` as Href);
            }}
          >
            <PencilIcon color={colors.text} size={20} />
          </HeaderIconButton>
          <HeaderIconButton
            label="Delete routine"
            onPress={() => {
              setConfirmingDelete(true);
            }}
          >
            <TrashIcon color={colors.dangerFill} size={20} />
          </HeaderIconButton>
        </View>
        <Text style={[text.body, { color: colors.muted }]}>
          {subtitleOf(routine)}
        </Text>
      </View>

      <View style={{ gap: space.sm }}>
        <SectionTitle>Days</SectionTitle>
        <View style={[styles.days, { gap: space.xs }]}>
          {(routine.weekdays.length === 0
            ? ['Not on any day yet']
            : routine.weekdays.map((day) => dayNames[day].short)
          ).map((day) => (
            <View
              key={day}
              style={[
                styles.day,
                {
                  height: size.chip,
                  paddingHorizontal: space.md,
                  borderRadius: radius.pill,
                  borderColor: colors.border,
                  backgroundColor: colors.card,
                },
              ]}
            >
              <Text style={[text.chip, { color: colors.text }]}>{day}</Text>
            </View>
          ))}
        </View>
      </View>

      <View style={{ gap: space.sm }}>
        <SectionTitle>Exercises</SectionTitle>
        <ExerciseTargets exercises={routine.exercises} />
      </View>

      <Sheet
        visible={confirmingDelete}
        title={`Delete ${routine.name}?`}
        message={deleteMessageOf(routine)}
        onClose={() => {
          setConfirmingDelete(false);
        }}
      >
        <Button
          label="Delete routine"
          variant="danger"
          waitingLabel="Deleting routine"
          waiting={deleteRoutine.isPending}
          onPress={() => {
            deleteRoutine.mutate(routine, {
              onSuccess: () => {
                router.back();
              },
            });
          }}
        />
      </Sheet>
    </View>
  );
}

function RoutineSkeleton() {
  const { colors, radius, size, space } = useTheme();

  return (
    <View
      accessible
      accessibilityLabel="Loading the routine"
      accessibilityLiveRegion="polite"
      style={{ gap: size.gap.sectionMax, marginTop: space.xxxs }}
    >
      <View style={styles.heading}>
        <View style={[styles.skeletonTitle, { height: size.headerIconButton }]}>
          <Skeleton width={220} height={32} />
        </View>
        <Skeleton width={240} height={14} />
      </View>
      <View style={{ gap: space.sm }}>
        <Skeleton width={70} height={10} />
        {[190, 150, 210].map((width) => (
          <View
            key={width}
            style={[
              styles.exercise,
              {
                gap: space.sm,
                minHeight: size.listRowMin,
                paddingHorizontal: space.lg,
                borderRadius: radius.card,
                borderColor: colors.border,
                backgroundColor: colors.card,
              },
            ]}
          >
            <Skeleton width={width} height={14} />
            <Skeleton width={70} height={10} />
          </View>
        ))}
      </View>
    </View>
  );
}

function subtitleOf(routine: Routine) {
  const setCount = routine.exercises.reduce(
    (sum, exercise) => sum + exercise.targetSets,
    0,
  );

  return [
    counted(routine.exercises.length, 'exercise', 'exercises'),
    counted(setCount, 'set', 'sets'),
  ].join(' · ');
}

function deleteMessageOf(routine: Routine) {
  const days = routine.weekdays.map((weekday) => dayNames[weekday].full);
  const logged = 'Workouts you already logged stay.';

  if (days.length === 0) {
    return `It isn’t in your week plan. ${logged}`;
  }

  return days.length === 1
    ? `${days[0]} becomes a rest day in the week plan. ${logged}`
    : `${joined(days)} become rest days in the week plan. ${logged}`;
}

const styles = StyleSheet.create({
  days: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  day: {
    justifyContent: 'center',
    borderWidth: 1,
  },
  heading: {
    gap: tokens.space.xxs,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  skeletonTitle: {
    justifyContent: 'center',
  },
  title: {
    flex: 1,
  },
  exercise: {
    justifyContent: 'center',
    gap: tokens.space.xxxs,
    borderWidth: 1,
  },
});
