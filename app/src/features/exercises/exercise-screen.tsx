import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import type { components } from '@/api/schema';
import { BackLink } from '@/components/back-link';
import { EmptyCard } from '@/components/empty-card';
import { HeaderIconButton } from '@/components/header-icon-button';
import { PencilIcon, TrashIcon } from '@/components/icons';
import { LoadFailure } from '@/components/load-failure';
import { notifyFailure } from '@/components/notifications';
import { joined } from '@/features/routines/formats';
import { useTheme } from '@/theme/theme-provider';

import { DeleteExerciseSheet } from './delete-exercise-sheet';
import { DetailsSkeleton } from './exercises-skeleton';
import { NoSessionsCard } from './no-sessions-card';
import { useExercise } from './use-exercise';

type Exercise = components['schemas']['ExerciseDetailsResponse'];

export function ExerciseScreen({ id }: { id: string }) {
  const { colors, size } = useTheme();
  const router = useRouter();
  const exercise = useExercise(id);

  function renderContent() {
    if (exercise.data !== undefined) {
      return <Details exercise={exercise.data} />;
    }

    if (exercise.isError) {
      return (
        <LoadFailure
          message="Couldn't load this exercise."
          onRetry={() => {
            void exercise.refetch();
          }}
        />
      );
    }

    return <DetailsSkeleton label="Loading the exercise" />;
  }

  return (
    <ScrollView
      style={{ backgroundColor: colors.bg }}
      contentContainerStyle={{
        paddingTop: size.topPaddingSubPage,
        paddingHorizontal: size.sidePadding,
        paddingBottom: size.gap.sectionMax,
      }}
    >
      <BackLink
        label="Exercises"
        onPress={() => {
          router.back();
        }}
      />
      {renderContent()}
    </ScrollView>
  );
}

function Details({ exercise }: { exercise: Exercise }) {
  const { colors, opacity, radius, size, space, text } = useTheme();
  const router = useRouter();
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const inUse = exercise.routines.length > 0;

  return (
    <View style={{ gap: size.gap.sectionMax, marginTop: 2 }}>
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

      <NoSessionsCard message="Finish a workout with this exercise and its sets, best set and progress show up here." />

      <View style={{ gap: space.sm }}>
        <Text style={text.eyebrow}>Used in</Text>
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

/** Names up to three routines. More would make the message too long to read. */
function inRoutinesMessage(routines: Exercise['routines']) {
  if (routines.length > 3) {
    return `It's in ${String(routines.length)} routines. Remove it from them first.`;
  }

  const names = joined(routines.map((routine) => routine.name));

  return routines.length === 1
    ? `It's in ${names}. Remove it from that routine first.`
    : `It's in ${names}. Remove it from those routines first.`;
}

function subtitleOf({ group, alsoWorksGroups }: Exercise) {
  return [
    group.name,
    ...alsoWorksGroups.map((alsoWorks) => alsoWorks.name.toLowerCase()),
  ].join(' · ');
}

const styles = StyleSheet.create({
  heading: {
    gap: 4,
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
});
